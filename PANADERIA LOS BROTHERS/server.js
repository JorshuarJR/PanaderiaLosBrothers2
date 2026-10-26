
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { promisify } = require("util");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const scrypt = promisify(crypto.scrypt);

app.disable("x-powered-by");
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// MYSQL AIVEN / RENDER
// ==========================================

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || "root";
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "";
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || "defaultdb";
const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

const caPath = path.join(__dirname, "certificados", "aiven-ca.pem");

const dbConfig = {
    host: dbHost || "localhost",
    user: dbUser,
    password: dbPassword,
    database: dbName,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (fs.existsSync(caPath)) {
    dbConfig.ssl = {
        ca: fs.readFileSync(caPath, "utf8"),
        rejectUnauthorized: true
    };
} else if (process.env.DB_SSL_REQUIRED === "true") {
    throw new Error("Falta el certificado certificado/aiven-ca.pem.");
}

const db = mysql.createPool(dbConfig);

console.log("MYSQL:", {
    host: dbHost || "localhost",
    port: dbPort,
    database: dbName,
    sslCertificateFound: fs.existsSync(caPath)
});

// ==========================================
// UTILIDADES
// ==========================================

function texto(value, max = 500) {
    return String(value ?? "").trim().slice(0, max);
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function cookieValue(req, name) {
    const header = req.headers.cookie || "";
    const item = header.split(";").map(x => x.trim())
        .find(x => x.startsWith(name + "="));
    return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function configurarCookie(res, token) {
    const secure = process.env.NODE_ENV === "production";
    res.cookie("lb_admin_session", token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 8 * 60 * 60 * 1000
    });
}

function borrarCookie(res) {
    res.clearCookie("lb_admin_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    });
}

async function crearHashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const key = await scrypt(password, salt, 64);
    return `${salt}:${key.toString("hex")}`;
}

async function comprobarPassword(password, passwordHash) {
    try {
        const partes = String(passwordHash || "").split(":");
        if (partes.length !== 2) return false;

        const salt = partes[0];
        const hashGuardado = Buffer.from(partes[1], "hex");
        const hashCalculado = Buffer.from(
            await scrypt(password, salt, 64)
        );

        return hashGuardado.length === hashCalculado.length &&
            crypto.timingSafeEqual(hashGuardado, hashCalculado);
    } catch {
        return false;
    }
}

function errorServidor(res, mensaje, error) {
    console.error(mensaje, error?.code || "", error?.message || "");
    return res.status(500).json({ error: mensaje });
}

// ==========================================
// TABLAS AUXILIARES
// No elimina ni reinserta productos o pedidos.
// ==========================================

async function prepararTablasAuxiliares() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS sesiones_admin (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            token_hash CHAR(64) NOT NULL UNIQUE,
            usuario VARCHAR(100) NOT NULL,
            rol VARCHAR(40) NOT NULL DEFAULT 'administrador',
            permisos JSON NULL,
            expira_en DATETIME NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_sesion_expira (expira_en)
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS empleados_admin (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            usuario VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            rol VARCHAR(40) NOT NULL DEFAULT 'empleado',
            permisos JSON NULL,
            activo TINYINT(1) NOT NULL DEFAULT 1,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS pedidos_archivados (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            pedido_id BIGINT NOT NULL UNIQUE,
            archivado_por VARCHAR(100) NOT NULL,
            archivado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_archivo_fecha (archivado_en)
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS configuracion_negocio (
            clave VARCHAR(100) NOT NULL PRIMARY KEY,
            valor TEXT NULL,
            actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    const valoresIniciales = [
        ["nombre", "Panadería Los Brothers"],
        ["latitud", "4.5938390997448115"],
        ["longitud", "-74.19596552380926"],
        ["direccion", "Los Brothers, Soacha, Cundinamarca"],
        ["telefono", "3114419889"],
        ["horario", "Domingo a domingo, 7:00 AM a 10:00 PM"]
    ];

    for (const [clave, valor] of valoresIniciales) {
        await db.query(
            `INSERT IGNORE INTO configuracion_negocio (clave, valor)
             VALUES (?, ?)`,
            [clave, valor]
        );
    }

    console.log("Tablas auxiliares verificadas.");
}

// ==========================================
// SESIONES Y PERMISOS ADMINISTRATIVOS
// ==========================================

const permisosConocidos = [
    "dashboard.ver",
    "pedidos.ver",
    "pedidos.cambiar_estado",
    "pedidos.archivar",
    "pedidos.restaurar",
    "pedidos.eliminar",
    "productos.ver",
    "productos.crear",
    "productos.editar",
    "productos.estado",
    "empleados.ver",
    "empleados.gestionar",
    "configuracion.ver",
    "configuracion.editar"
];

function permisosDelUsuario(usuario) {
    if (usuario.rol === "administrador") {
        return permisosConocidos;
    }

    let permisos = usuario.permisos || [];
    if (typeof permisos === "string") {
        try {
            permisos = JSON.parse(permisos);
        } catch {
            permisos = [];
        }
    }

    return Array.isArray(permisos)
        ? permisos.filter(p => permisosConocidos.includes(p))
        : [];
}

async function crearSesion(usuario, res) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expira = new Date(Date.now() + 8 * 60 * 60 * 1000);

    const permisos = permisosDelUsuario(usuario);

    await db.query(
        `INSERT INTO sesiones_admin
         (token_hash, usuario, rol, permisos, expira_en)
         VALUES (?, ?, ?, ?, ?)`,
        [
            tokenHash,
            usuario.usuario,
            usuario.rol,
            JSON.stringify(permisos),
            expira
        ]
    );

    configurarCookie(res, token);
}

async function autenticacionAdmin(req, res, next) {
    try {
        const token = cookieValue(req, "lb_admin_session");

        if (!token) {
            return res.status(401).json({
                error: "Inicia sesión para continuar."
            });
        }

        const [filas] = await db.query(
            `SELECT id, usuario, rol, permisos, expira_en
             FROM sesiones_admin
             WHERE token_hash = ? AND expira_en > NOW()
             LIMIT 1`,
            [hashToken(token)]
        );

        if (!filas.length) {
            borrarCookie(res);
            return res.status(401).json({
                error: "La sesión expiró. Inicia sesión nuevamente."
            });
        }

        const sesion = filas[0];
        let permisos = sesion.permisos || [];

        if (typeof permisos === "string") {
            try {
                permisos = JSON.parse(permisos);
            } catch {
                permisos = [];
            }
        }

        req.admin = {
            usuario: sesion.usuario,
            rol: sesion.rol,
            permisos: sesion.rol === "administrador"
                ? permisosConocidos
                : (Array.isArray(permisos) ? permisos : [])
        };

        next();
    } catch (error) {
        return errorServidor(res, "No se pudo verificar la sesión.", error);
    }
}

function requierePermiso(permiso) {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ error: "Sesión requerida." });
        }

        if (
            req.admin.rol !== "administrador" &&
            !req.admin.permisos.includes(permiso)
        ) {
            return res.status(403).json({
                error: "No tienes permiso para realizar esta acción."
            });
        }

        next();
    };
}

function soloAdministrador(req, res, next) {
    if (req.admin?.rol !== "administrador") {
        return res.status(403).json({
            error: "Esta acción está reservada al administrador principal."
        });
    }
    next();
}

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.json({
            ok: true,
            database: true,
            mensaje: "Servidor y base de datos funcionando."
        });
    } catch (error) {
        return errorServidor(
            res,
            "No se pudo conectar con la base de datos.",
            error
        );
    }
});

// ==========================================
// REGISTRO DE CLIENTES
// ==========================================

app.post("/api/usuarios/registro", async (req, res) => {
    try {
        const nombre = texto(req.body.nombre, 100);
        const apellido = texto(req.body.apellido, 100);
        const correo = texto(req.body.correo, 190).toLowerCase();
        const telefono = texto(req.body.telefono, 40);
        const password = String(req.body.password || "");

        if (!nombre || !apellido || !correo || !password) {
            return res.status(400).json({
                error: "Completa todos los campos obligatorios."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "La contraseña debe tener mínimo 8 caracteres."
            });
        }

        const passwordHash = await crearHashPassword(password);

        const [resultado] = await db.query(
            `INSERT INTO usuarios
             (nombre, apellido, correo, telefono, password_hash)
             VALUES (?, ?, ?, ?, ?)`,
            [nombre, apellido, correo, telefono, passwordHash]
        );

        res.status(201).json({
            ok: true,
            usuario: {
                id: resultado.insertId,
                nombre,
                apellido,
                correo,
                telefono
            },
            mensaje: "Cuenta creada correctamente."
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Ya existe una cuenta con ese correo."
            });
        }
        return errorServidor(res, "No fue posible crear la cuenta.", error);
    }
});

// ==========================================
// LOGIN DE CLIENTES
// ==========================================

app.post("/api/usuarios/login", async (req, res) => {
    try {
        const correo = texto(req.body.correo, 190).toLowerCase();
        const password = String(req.body.password || "");

        if (!correo || !password) {
            return res.status(400).json({
                error: "Ingresa correo y contraseña."
            });
        }

        const [usuarios] = await db.query(
            `SELECT id, nombre, apellido, correo, telefono, password_hash
             FROM usuarios WHERE correo = ? LIMIT 1`,
            [correo]
        );

        if (
            !usuarios.length ||
            !await comprobarPassword(password, usuarios[0].password_hash)
        ) {
            return res.status(401).json({
                error: "Correo o contraseña incorrectos."
            });
        }

        const usuario = usuarios[0];
        delete usuario.password_hash;

        res.json({ ok: true, usuario });
    } catch (error) {
        return errorServidor(res, "No fue posible iniciar sesión.", error);
    }
});

// ==========================================
// LOGIN ADMINISTRATIVO Y EMPLEADOS
// ==========================================

app.post("/api/login", async (req, res) => {
    try {
        const usuario = texto(req.body.usuario, 100);
        const password = String(req.body.password || "");

        if (!usuario || !password) {
            return res.status(400).json({
                error: "Ingresa usuario y contraseña."
            });
        }

        const adminUser = process.env.ADMIN_USER;
        const adminPassword = process.env.ADMIN_PASSWORD;
        let identidad = null;

        if (
            adminUser &&
            adminPassword &&
            usuario === adminUser &&
            password === adminPassword
        ) {
            identidad = {
                usuario: adminUser,
                rol: "administrador",
                permisos: permisosConocidos
            };
        } else {
            const [empleados] = await db.query(
                `SELECT id, nombre, usuario, password_hash, rol, permisos, activo
                 FROM empleados_admin WHERE usuario = ? LIMIT 1`,
                [usuario]
            );

            if (
                empleados.length &&
                empleados[0].activo === 1 &&
                await comprobarPassword(password, empleados[0].password_hash)
            ) {
                const empleado = empleados[0];
                identidad = {
                    usuario: empleado.usuario,
                    nombre: empleado.nombre,
                    rol: empleado.rol,
                    permisos: empleado.permisos
                };
            }
        }

        if (!identidad) {
            return res.status(401).json({
                error: "Usuario o contraseña incorrectos."
            });
        }

        // Evita acumular sesiones anteriores durante un nuevo login.
        const tokenAnterior = cookieValue(req, "lb_admin_session");
        if (tokenAnterior) {
            await db.query(
                "DELETE FROM sesiones_admin WHERE token_hash = ?",
                [hashToken(tokenAnterior)]
            );
        }

        await crearSesion(identidad, res);

        res.json({
            ok: true,
            usuario: {
                usuario: identidad.usuario,
                nombre: identidad.nombre || identidad.usuario,
                rol: identidad.rol,
                permisos: permisosDelUsuario(identidad)
            },
            mensaje: "Inicio de sesión correcto."
        });
    } catch (error) {
        return errorServidor(res, "No fue posible iniciar sesión.", error);
    }
});

app.get("/api/admin/sesion", autenticacionAdmin, (req, res) => {
    res.json({ ok: true, usuario: req.admin });
});

app.post("/api/admin/logout", autenticacionAdmin, async (req, res) => {
    try {
        const token = cookieValue(req, "lb_admin_session");
        if (token) {
            await db.query(
                "DELETE FROM sesiones_admin WHERE token_hash = ?",
                [hashToken(token)]
            );
        }

        borrarCookie(res);
        res.json({ ok: true, mensaje: "Sesión cerrada." });
    } catch (error) {
        return errorServidor(res, "No se pudo cerrar la sesión.", error);
    }
});

// ==========================================
// PRODUCTOS PÚBLICOS
// ==========================================

app.get("/api/productos", async (req, res) => {
    try {
        const [productos] = await db.query(
            `SELECT id, nombre, categoria, descripcion, precio, imagen,
                    activo, creado_en
             FROM productos WHERE activo = 1 ORDER BY id ASC`
        );
        res.json(productos);
    } catch (error) {
        return errorServidor(res, "No fue posible obtener los productos.", error);
    }
});

// ==========================================
// PRODUCTOS ADMINISTRATIVOS
// ==========================================

app.get(
    "/api/productos/admin",
    autenticacionAdmin,
    requierePermiso("productos.ver"),
    async (req, res) => {
        try {
            const [productos] = await db.query(
                `SELECT id, nombre, categoria, descripcion, precio, imagen,
                        activo, creado_en
                 FROM productos ORDER BY id ASC`
            );
            res.json(productos);
        } catch (error) {
            return errorServidor(
                res,
                "No fue posible obtener los productos.",
                error
            );
        }
    }
);

app.post(
    "/api/productos",
    autenticacionAdmin,
    requierePermiso("productos.crear"),
    async (req, res) => {
        try {
            const nombre = texto(req.body.nombre, 180);
            const categoria = texto(req.body.categoria, 100);
            const descripcion = texto(req.body.descripcion, 2000);
            const precio = Number(req.body.precio);
            const imagen = texto(req.body.imagen, 1000);

            if (
                !nombre || !categoria ||
                !Number.isFinite(precio) || precio <= 0
            ) {
                return res.status(400).json({
                    error: "Nombre, categoría y precio válido son obligatorios."
                });
            }

            const [resultado] = await db.query(
                `INSERT INTO productos
                 (nombre, categoria, descripcion, precio, imagen, activo)
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [nombre, categoria, descripcion, precio, imagen]
            );

            res.status(201).json({
                ok: true,
                id: resultado.insertId,
                mensaje: "Producto creado correctamente."
            });
        } catch (error) {
            return errorServidor(res, "No fue posible crear el producto.", error);
        }
    }
);

app.put(
    "/api/productos/:id",
    autenticacionAdmin,
    requierePermiso("productos.editar"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            const nombre = texto(req.body.nombre, 180);
            const categoria = texto(req.body.categoria, 100);
            const descripcion = texto(req.body.descripcion, 2000);
            const precio = Number(req.body.precio);
            const imagen = texto(req.body.imagen, 1000);

            if (
                !Number.isInteger(id) || id <= 0 ||
                !nombre || !categoria ||
                !Number.isFinite(precio) || precio <= 0
            ) {
                return res.status(400).json({
                    error: "Los datos del producto son inválidos."
                });
            }

            const [resultado] = await db.query(
                `UPDATE productos
                 SET nombre = ?, categoria = ?, descripcion = ?,
                     precio = ?, imagen = ?
                 WHERE id = ?`,
                [nombre, categoria, descripcion, precio, imagen, id]
            );

            if (!resultado.affectedRows) {
                const [existe] = await db.query(
                    "SELECT id FROM productos WHERE id = ?",
                    [id]
                );
                if (!existe.length) {
                    return res.status(404).json({
                        error: "Producto no encontrado."
                    });
                }
            }

            res.json({ ok: true, mensaje: "Producto actualizado." });
        } catch (error) {
            return errorServidor(
                res,
                "No fue posible actualizar el producto.",
                error
            );
        }
    }
);

app.patch(
    "/api/productos/:id/estado",
    autenticacionAdmin,
    requierePermiso("productos.estado"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            const activo = Number(req.body.activo);

            if (
                !Number.isInteger(id) || id <= 0 ||
                ![0, 1].includes(activo)
            ) {
                return res.status(400).json({
                    error: "Datos de estado inválidos."
                });
            }

            const [resultado] = await db.query(
                "UPDATE productos SET activo = ? WHERE id = ?",
                [activo, id]
            );

            if (!resultado.affectedRows) {
                const [existe] = await db.query(
                    "SELECT id FROM productos WHERE id = ?",
                    [id]
                );
                if (!existe.length) {
                    return res.status(404).json({
                        error: "Producto no encontrado."
                    });
                }
            }

            res.json({ ok: true, activo });
        } catch (error) {
            return errorServidor(
                res,
                "No fue posible cambiar el estado del producto.",
                error
            );
        }
    }
);

// ==========================================
// CREAR PEDIDO PÚBLICO
// ==========================================

app.post("/api/pedidos", async (req, res) => {
    try {
        const usuario_id = Number(req.body.usuario_id);
        const nombre = texto(req.body.nombre, 150);
        const telefono = texto(req.body.telefono, 40);
        const direccion = texto(req.body.direccion, 500);
        const entrega = texto(req.body.entrega || req.body.tipo_entrega, 100);
        const metodo_pago = texto(req.body.metodo_pago, 100);
        const productos = req.body.productos;
        const notas = texto(req.body.notas, 2000);

        if (
            !Number.isInteger(usuario_id) || usuario_id <= 0 ||
            !nombre || !telefono || !entrega || !metodo_pago ||
            !Array.isArray(productos) ||
            productos.length === 0 || productos.length > 100
        ) {
            return res.status(400).json({
                error: "Faltan datos obligatorios del pedido."
            });
        }

        // No confiar en el total enviado por el navegador.
        // Se recalcula usando los precios actuales de MySQL.
        const ids = productos.map(p => Number(p.id));
        if (ids.some(id => !Number.isInteger(id) || id <= 0)) {
            return res.status(400).json({
                error: "Hay productos inválidos en el pedido."
            });
        }

        const [usuarios] = await db.query(
            "SELECT id FROM usuarios WHERE id = ? LIMIT 1",
            [usuario_id]
        );

        if (!usuarios.length) {
            return res.status(401).json({
                error: "La cuenta del usuario no existe."
            });
        }

        const cantidades = new Map();
        for (const producto of productos) {
            const id = Number(producto.id);
            const cantidad = Number(producto.cantidad || producto.qty || 1);

            if (
                !Number.isInteger(cantidad) ||
                cantidad < 1 || cantidad > 100
            ) {
                return res.status(400).json({
                    error: "La cantidad de un producto es inválida."
                });
            }

            cantidades.set(id, (cantidades.get(id) || 0) + cantidad);
        }

        const idsUnicos = [...cantidades.keys()];
        const placeholders = idsUnicos.map(() => "?").join(",");

        const [productosBD] = await db.query(
            `SELECT id, nombre, precio
             FROM productos
             WHERE activo = 1 AND id IN (${placeholders})`,
            idsUnicos
        );

        if (productosBD.length !== idsUnicos.length) {
            return res.status(400).json({
                error: "Uno o más productos ya no están disponibles."
            });
        }

        let totalCalculado = 0;
        const detalle = productosBD.map(p => {
            const cantidad = cantidades.get(Number(p.id));
            const precio = Number(p.precio);
            totalCalculado += precio * cantidad;

            return {
                id: p.id,
                nombre: p.nombre,
                precio,
                cantidad,
                subtotal: precio * cantidad
            };
        });

        // Si el proyecto cobra domicilio, ese valor debe añadirse
        // aquí según las reglas reales del negocio.
        if (!Number.isFinite(totalCalculado) || totalCalculado <= 0) {
            return res.status(400).json({
                error: "No se pudo calcular el total del pedido."
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO pedidos
             (usuario_id, nombre, telefono, direccion, entrega,
              metodo_pago, productos, total, notas, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuario_id, nombre, telefono, direccion, entrega,
                metodo_pago, JSON.stringify(detalle), totalCalculado,
                notas, "Pendiente"
            ]
        );

        console.log(`Nuevo pedido registrado: #${resultado.insertId}`);

        res.status(201).json({
            ok: true,
            pedido_id: resultado.insertId,
            id: resultado.insertId,
            total: totalCalculado,
            mensaje: "Pedido creado correctamente."
        });
    } catch (error) {
        return errorServidor(res, "No fue posible guardar el pedido.", error);
    }
});

// ==========================================
// PEDIDOS ADMINISTRATIVOS
// ==========================================

app.get(
    "/api/pedidos",
    autenticacionAdmin,
    requierePermiso("pedidos.ver"),
    async (req, res) => {
        try {
            const incluirArchivados = req.query.archivados === "true";

            const [pedidos] = await db.query(
                `SELECT p.id, p.usuario_id, p.nombre, p.telefono,
                        p.direccion, p.entrega, p.metodo_pago,
                        p.productos, p.total, p.notas, p.estado, p.fecha
                 FROM pedidos p
                 ${incluirArchivados
                    ? "INNER JOIN pedidos_archivados a ON a.pedido_id = p.id"
                    : "LEFT JOIN pedidos_archivados a ON a.pedido_id = p.id"}
                 ${incluirArchivados ? "" : "WHERE a.pedido_id IS NULL"}
                 ORDER BY p.fecha DESC, p.id DESC`
            );

            res.json(pedidos);
        } catch (error) {
            return errorServidor(res, "No fue posible obtener los pedidos.", error);
        }
    }
);

app.patch(
    "/api/pedidos/:id/estado",
    autenticacionAdmin,
    requierePermiso("pedidos.cambiar_estado"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            const estado = texto(req.body.estado, 50);
            const permitidos = [
                "Pendiente",
                "En preparación",
                "En camino",
                "Entregado",
                "Cancelado"
            ];

            if (!Number.isInteger(id) || id <= 0 ||
                !permitidos.includes(estado)) {
                return res.status(400).json({
                    error: "ID o estado de pedido inválido."
                });
            }

            const [resultado] = await db.query(
                "UPDATE pedidos SET estado = ? WHERE id = ?",
                [estado, id]
            );

            if (!resultado.affectedRows) {
                const [existe] = await db.query(
                    "SELECT id FROM pedidos WHERE id = ?",
                    [id]
                );
                if (!existe.length) {
                    return res.status(404).json({
                        error: "Pedido no encontrado."
                    });
                }
            }

            res.json({ ok: true, id, estado });
        } catch (error) {
            return errorServidor(
                res,
                "No fue posible actualizar el pedido.",
                error
            );
        }
    }
);

// ==========================================
// ARCHIVAR / RESTAURAR / ELIMINAR PEDIDOS
// ==========================================

app.post(
    "/api/pedidos/:id/archivar",
    autenticacionAdmin,
    requierePermiso("pedidos.archivar"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido." });
            }

            const [pedidos] = await db.query(
                "SELECT id FROM pedidos WHERE id = ?",
                [id]
            );

            if (!pedidos.length) {
                return res.status(404).json({ error: "Pedido no encontrado." });
            }

            await db.query(
                `INSERT IGNORE INTO pedidos_archivados
                 (pedido_id, archivado_por) VALUES (?, ?)`,
                [id, req.admin.usuario]
            );

            res.json({ ok: true, mensaje: "Pedido archivado." });
        } catch (error) {
            return errorServidor(res, "No fue posible archivar el pedido.", error);
        }
    }
);

app.post(
    "/api/pedidos/:id/restaurar",
    autenticacionAdmin,
    requierePermiso("pedidos.restaurar"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido." });
            }

            const [resultado] = await db.query(
                "DELETE FROM pedidos_archivados WHERE pedido_id = ?",
                [id]
            );

            if (!resultado.affectedRows) {
                return res.status(404).json({
                    error: "El pedido no estaba archivado."
                });
            }

            res.json({ ok: true, mensaje: "Pedido restaurado." });
        } catch (error) {
            return errorServidor(res, "No fue posible restaurar el pedido.", error);
        }
    }
);

app.delete(
    "/api/pedidos/:id",
    autenticacionAdmin,
    requierePermiso("pedidos.eliminar"),
    async (req, res, next) => {
        if (req.admin.rol !== "administrador") {
            return res.status(403).json({
                error: "Solo el administrador principal puede eliminar pedidos permanentemente."
            });
        }
        next();
    },
    async (req, res) => {
        const connection = await db.getConnection();
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido." });
            }

            await connection.beginTransaction();
            const [pedidos] = await connection.query(
                "SELECT id FROM pedidos WHERE id = ? FOR UPDATE",
                [id]
            );

            if (!pedidos.length) {
                await connection.rollback();
                return res.status(404).json({ error: "Pedido no encontrado." });
            }

            await connection.query(
                "DELETE FROM pedidos_archivados WHERE pedido_id = ?",
                [id]
            );
            await connection.query("DELETE FROM pedidos WHERE id = ?", [id]);
            await connection.commit();

            res.json({
                ok: true,
                mensaje: "Pedido eliminado permanentemente."
            });
        } catch (error) {
            await connection.rollback();
            return errorServidor(res, "No fue posible eliminar el pedido.", error);
        } finally {
            connection.release();
        }
    }
);

// ==========================================
// HISTORIAL DE PEDIDOS DEL CLIENTE
// Mantiene la ruta anterior por compatibilidad.
// ==========================================

app.get("/api/usuarios/:id/pedidos", async (req, res) => {
    try {
        const usuario_id = Number(req.params.id);

        if (!Number.isInteger(usuario_id) || usuario_id <= 0) {
            return res.status(400).json({ error: "ID inválido." });
        }

        // Esta ruta conserva el formato de la versión anterior.
        // Más adelante conviene vincularla a una sesión autenticada
        // de cliente para verificar que consulta su propio historial.
        const [pedidos] = await db.query(
            `SELECT id, usuario_id, nombre, telefono, direccion,
                    entrega, metodo_pago, productos, total, notas,
                    estado, fecha
             FROM pedidos
             WHERE usuario_id = ?
             ORDER BY fecha DESC, id DESC`,
            [usuario_id]
        );

        res.json(pedidos);
    } catch (error) {
        return errorServidor(res, "No fue posible obtener el historial.", error);
    }
});

// ==========================================
// EMPLEADOS: LISTAR Y CREAR
// ==========================================

app.get(
    "/api/admin/empleados",
    autenticacionAdmin,
    requierePermiso("empleados.ver"),
    async (req, res) => {
        try {
            const [empleados] = await db.query(
                `SELECT id, nombre, usuario, rol, permisos, activo, creado_en
                 FROM empleados_admin ORDER BY id DESC`
            );
            res.json(empleados);
        } catch (error) {
            return errorServidor(res, "No fue posible obtener los empleados.", error);
        }
    }
);

app.post(
    "/api/admin/empleados",
    autenticacionAdmin,
    requierePermiso("empleados.gestionar"),
    async (req, res) => {
        try {
            const nombre = texto(req.body.nombre, 120);
            const usuario = texto(req.body.usuario, 100);
            const password = String(req.body.password || "");
            const rol = texto(req.body.rol || "empleado", 40);
            const permisos = req.body.permisos;

            if (!nombre || !usuario || password.length < 8) {
                return res.status(400).json({
                    error: "Nombre, usuario y contraseña de mínimo 8 caracteres son obligatorios."
                });
            }

            if (!["jefe", "empleado", "cajero", "domiciliario"].includes(rol)) {
                return res.status(400).json({ error: "Rol no permitido." });
            }

            if (!Array.isArray(permisos) ||
                permisos.some(p => !permisosConocidos.includes(p))) {
                return res.status(400).json({
                    error: "La lista de permisos no es válida."
                });
            }

            const hash = await crearHashPassword(password);
            const [resultado] = await db.query(
                `INSERT INTO empleados_admin
                 (nombre, usuario, password_hash, rol, permisos, activo)
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [nombre, usuario, hash, rol, JSON.stringify(permisos)]
            );

            res.status(201).json({
                ok: true,
                id: resultado.insertId,
                mensaje: "Empleado creado correctamente."
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    error: "Ese nombre de usuario ya existe."
                });
            }
            return errorServidor(res, "No fue posible crear el empleado.", error);
        }
    }
);

app.patch(
    "/api/admin/empleados/:id",
    autenticacionAdmin,
    requierePermiso("empleados.gestionar"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            const activo = Number(req.body.activo);

            if (!Number.isInteger(id) || id <= 0 ||
                ![0, 1].includes(activo)) {
                return res.status(400).json({ error: "Datos inválidos." });
            }

            const [resultado] = await db.query(
                "UPDATE empleados_admin SET activo = ? WHERE id = ?",
                [activo, id]
            );

            if (!resultado.affectedRows) {
                return res.status(404).json({ error: "Empleado no encontrado." });
            }

            // Al desactivar a un empleado, invalidar sus sesiones.
            if (activo === 0) {
                const [empleados] = await db.query(
                    "SELECT usuario FROM empleados_admin WHERE id = ?",
                    [id]
                );
                if (empleados.length) {
                    await db.query(
                        "DELETE FROM sesiones_admin WHERE usuario = ?",
                        [empleados[0].usuario]
                    );
                }
            }

            res.json({ ok: true, mensaje: "Empleado actualizado." });
        } catch (error) {
            return errorServidor(res, "No fue posible actualizar el empleado.", error);
        }
    }
);

// ==========================================
// CONFIGURACIÓN DEL NEGOCIO
// ==========================================

app.get(
    "/api/admin/configuracion",
    autenticacionAdmin,
    requierePermiso("configuracion.ver"),
    async (req, res) => {
        try {
            const [filas] = await db.query(
                "SELECT clave, valor FROM configuracion_negocio"
            );

            const configuracion = {};
            for (const fila of filas) {
                configuracion[fila.clave] = fila.valor;
            }

            res.json(configuracion);
        } catch (error) {
            return errorServidor(
                res,
                "No fue posible obtener la configuración.",
                error
            );
        }
    }
);

app.put(
    "/api/admin/configuracion",
    autenticacionAdmin,
    requierePermiso("configuracion.editar"),
    async (req, res) => {
        try {
            const permitidas = [
                "nombre", "latitud", "longitud",
                "direccion", "telefono", "horario"
            ];

            for (const clave of permitidas) {
                if (req.body[clave] === undefined) continue;

                const valor = texto(req.body[clave], 500);

                if (clave === "latitud" || clave === "longitud") {
                    if (!valor || !Number.isFinite(Number(valor))) {
                        return res.status(400).json({
                            error: `El valor de ${clave} no es válido.`
                        });
                    }

                    const numero = Number(valor);
                    if (
                        (clave === "latitud" && (numero < -90 || numero > 90)) ||
                        (clave === "longitud" && (numero < -180 || numero > 180))
                    ) {
                        return res.status(400).json({
                            error: `El valor de ${clave} está fuera de rango.`
                        });
                    }
                }

                await db.query(
                    `INSERT INTO configuracion_negocio (clave, valor)
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
                    [clave, valor]
                );
            }

            res.json({ ok: true, mensaje: "Configuración guardada." });
        } catch (error) {
            return errorServidor(
                res,
                "No fue posible guardar la configuración.",
                error
            );
        }
    }
);

// ==========================================
// ERRORES Y ARRANQUE
// ==========================================

app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada." });
});

async function iniciarServidor() {
    try {
        await db.query("SELECT 1");
        await prepararTablasAuxiliares();

        app.listen(PORT, () => {
            console.log("================================");
            console.log("LOS BROTHERS - NEXORA");
            console.log(`Servidor iniciado en puerto ${PORT}`);
            console.log("MySQL conectado correctamente");
            console.log("================================");
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error.code || "", error.message);
        process.exit(1);
    }
}

iniciarServidor();
