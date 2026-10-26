const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { promisify } = require("util");

require("dotenv").config();

const app = express();

// Railway proporciona PORT automáticamente
const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(
    path.join(__dirname, "public")
));


// ==========================================
// CONEXIÓN MYSQL
// ==========================================

const db = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
    user: process.env.DB_USER || process.env.MYSQLUSER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || "los_brothers",
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),

    ssl: {
        ca: fs.readFileSync(
            path.join(__dirname, "certificados", "aiven-ca.pem"),
            "utf8"
        ),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// ==========================================
// UTILIDADES
// ==========================================

const scrypt = promisify(crypto.scrypt);


async function crearHashPassword(password) {

    const salt = crypto.randomBytes(16).toString("hex");

    const derivedKey = await scrypt(
        password,
        salt,
        64
    );

    return `${salt}:${derivedKey.toString("hex")}`;

}


async function comprobarPassword(password, passwordHash) {

    try {

        const partes = String(passwordHash).split(":");

        if (partes.length !== 2) {
            return false;
        }

        const salt = partes[0];

        const hashOriginal = partes[1];

        const derivedKey = await scrypt(
            password,
            salt,
            64
        );

        const hashNuevo = derivedKey.toString("hex");

        return crypto.timingSafeEqual(
            Buffer.from(hashOriginal, "hex"),
            Buffer.from(hashNuevo, "hex")
        );

    } catch (error) {

        return false;

    }

}


// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", async (req, res) => {

    try {

        const [resultado] = await db.query(
            "SELECT 1 AS conectado"
        );

        res.json({

            ok: true,

            database: resultado[0].conectado === 1,

            mensaje: "Servidor y base de datos funcionando correctamente."

        });

    } catch (error) {

        console.error(
            "Error en health check:",
            error.message
        );

        res.status(500).json({

            ok: false,

            database: false,

            error: "No se pudo conectar con la base de datos."

        });

    }

});


// ==========================================
// REGISTRO DE USUARIOS
// ==========================================

app.post(
    "/api/usuarios/registro",
    async (req, res) => {

        try {

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            const apellido =
                String(
                    req.body.apellido || ""
                ).trim();

            const correo =
                String(
                    req.body.correo || ""
                ).trim().toLowerCase();

            const telefono =
                String(
                    req.body.telefono || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );


            if (
                !nombre ||
                !apellido ||
                !correo ||
                !password
            ) {

                return res.status(400).json({

                    error:
                        "Completa todos los campos obligatorios."

                });

            }


            if (password.length < 6) {

                return res.status(400).json({

                    error:
                        "La contraseña debe tener mínimo 6 caracteres."

                });

            }


            const [existentes] =
                await db.query(

                    `
                    SELECT id
                    FROM usuarios
                    WHERE correo = ?
                    LIMIT 1
                    `,

                    [correo]

                );


            if (existentes.length > 0) {

                return res.status(409).json({

                    error:
                        "Ya existe una cuenta con ese correo."

                });

            }


            const passwordHash =
                await crearHashPassword(
                    password
                );


            const [resultado] =
                await db.query(

                    `
                    INSERT INTO usuarios
                    (
                        nombre,
                        apellido,
                        correo,
                        telefono,
                        password_hash
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,

                    [
                        nombre,
                        apellido,
                        correo,
                        telefono,
                        passwordHash
                    ]

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

                mensaje:
                    "Cuenta creada correctamente."

            });


        } catch (error) {

            console.error(
                "Error registrando usuario:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible crear la cuenta."

            });

        }

    }
);


// ==========================================
// LOGIN DE CLIENTES
// ==========================================

app.post(
    "/api/usuarios/login",
    async (req, res) => {

        try {

            const correo =
                String(
                    req.body.correo || ""
                ).trim().toLowerCase();

            const password =
                String(
                    req.body.password || ""
                );


            if (!correo || !password) {

                return res.status(400).json({

                    error:
                        "Ingresa correo y contraseña."

                });

            }


            const [usuarios] =
                await db.query(

                    `
                    SELECT
                        id,
                        nombre,
                        apellido,
                        correo,
                        telefono,
                        password_hash
                    FROM usuarios
                    WHERE correo = ?
                    LIMIT 1
                    `,

                    [correo]

                );


            if (usuarios.length === 0) {

                return res.status(401).json({

                    error:
                        "Correo o contraseña incorrectos."

                });

            }


            const usuario =
                usuarios[0];


            const passwordCorrecta =
                await comprobarPassword(
                    password,
                    usuario.password_hash
                );


            if (!passwordCorrecta) {

                return res.status(401).json({

                    error:
                        "Correo o contraseña incorrectos."

                });

            }


            delete usuario.password_hash;


            res.json({

                ok: true,

                usuario,

                mensaje:
                    "Inicio de sesión correcto."

            });


        } catch (error) {

            console.error(
                "Error en login:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible iniciar sesión."

            });

        }

    }
);


// ==========================================
// LOGIN ADMINISTRADOR
// ==========================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const usuario =
                String(
                    req.body.usuario || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );


            const adminUser = process.env.ADMIN_USER;

            const adminPassword = process.env.ADMIN_PASSWORD;

            if (!adminUser || !adminPassword) {
                console.error("Faltan ADMIN_USER y ADMIN_PASSWORD en las variables de entorno.");
                return res.status(503).json({ error: "El acceso de administrador no está configurado en el servidor." });
            }


            if (
                usuario !== adminUser ||
                password !== adminPassword
            ) {

                return res.status(401).json({

                    error:
                        "Usuario o contraseña incorrectos."

                });

            }


            res.json({

                ok: true,

                mensaje:
                    "Inicio de sesión administrativo correcto."

            });


        } catch (error) {

            console.error(
                "Error login admin:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible iniciar sesión."

            });

        }

    }
);


// ==========================================
// PRODUCTOS - CLIENTE
// ==========================================

app.get(
    "/api/productos",
    async (req, res) => {

        try {

            const [productos] =
                await db.query(

                    `
                    SELECT
                        id,
                        nombre,
                        categoria,
                        descripcion,
                        precio,
                        imagen,
                        activo,
                        creado_en
                    FROM productos
                    WHERE activo = 1
                    ORDER BY id ASC
                    `

                );


            res.json(productos);


        } catch (error) {

            console.error(
                "Error obteniendo productos:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible obtener los productos."

            });

        }

    }
);


// ==========================================
// PRODUCTOS - ADMIN
// ==========================================

app.get(
    "/api/productos/admin",
    async (req, res) => {

        try {

            const [productos] =
                await db.query(

                    `
                    SELECT
                        id,
                        nombre,
                        categoria,
                        descripcion,
                        precio,
                        imagen,
                        activo,
                        creado_en
                    FROM productos
                    ORDER BY id ASC
                    `

                );


            res.json(productos);


        } catch (error) {

            console.error(
                "Error obteniendo productos admin:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible obtener los productos."

            });

        }

    }
);


// ==========================================
// CREAR PRODUCTO
// ==========================================

app.post(
    "/api/productos",
    async (req, res) => {

        try {

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            const categoria =
                String(
                    req.body.categoria || ""
                ).trim();

            const descripcion =
                String(
                    req.body.descripcion || ""
                ).trim();

            const precio =
                Number(req.body.precio);

            const imagen =
                String(
                    req.body.imagen || ""
                ).trim();


            if (
                !nombre ||
                !categoria ||
                !precio
            ) {

                return res.status(400).json({

                    error:
                        "Nombre, categoría y precio son obligatorios."

                });

            }


            const [resultado] =
                await db.query(

                    `
                    INSERT INTO productos
                    (
                        nombre,
                        categoria,
                        descripcion,
                        precio,
                        imagen,
                        activo
                    )
                    VALUES (?, ?, ?, ?, ?, 1)
                    `,

                    [
                        nombre,
                        categoria,
                        descripcion,
                        precio,
                        imagen
                    ]

                );


            res.status(201).json({

                ok: true,

                id: resultado.insertId,

                mensaje:
                    "Producto creado correctamente."

            });


        } catch (error) {

            console.error(
                "Error creando producto:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible crear el producto."

            });

        }

    }
);


// ==========================================
// EDITAR PRODUCTO
// ==========================================

app.put(
    "/api/productos/:id",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            const categoria =
                String(
                    req.body.categoria || ""
                ).trim();

            const descripcion =
                String(
                    req.body.descripcion || ""
                ).trim();

            const precio =
                Number(req.body.precio);

            const imagen =
                String(
                    req.body.imagen || ""
                ).trim();


            if (
                !id ||
                !nombre ||
                !categoria ||
                !precio
            ) {

                return res.status(400).json({

                    error:
                        "Faltan datos obligatorios."

                });

            }


            const [resultado] =
                await db.query(

                    `
                    UPDATE productos
                    SET
                        nombre = ?,
                        categoria = ?,
                        descripcion = ?,
                        precio = ?,
                        imagen = ?
                    WHERE id = ?
                    `,

                    [
                        nombre,
                        categoria,
                        descripcion,
                        precio,
                        imagen,
                        id
                    ]

                );


            if (
                resultado.affectedRows === 0
            ) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado."

                });

            }


            res.json({

                ok: true,

                mensaje:
                    "Producto actualizado correctamente."

            });


        } catch (error) {

            console.error(
                "Error actualizando producto:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible actualizar el producto."

            });

        }

    }
);


// ==========================================
// ACTIVAR / DESACTIVAR PRODUCTO
// ==========================================

app.patch(
    "/api/productos/:id/estado",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const activo =
                Number(req.body.activo);


            if (
                !id ||
                ![0, 1].includes(activo)
            ) {

                return res.status(400).json({

                    error:
                        "Estado de producto inválido."

                });

            }


            const [resultado] =
                await db.query(

                    `
                    UPDATE productos
                    SET activo = ?
                    WHERE id = ?
                    `,

                    [
                        activo,
                        id
                    ]

                );


            if (
                resultado.affectedRows === 0
            ) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado."

                });

            }


            res.json({

                ok: true,

                activo,

                mensaje:
                    "Estado del producto actualizado."

            });


        } catch (error) {

            console.error(
                "Error cambiando estado producto:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible cambiar el estado."

            });

        }

    }
);


// ==================================================
// CREAR PEDIDO
// ==================================================

app.post(
    "/api/pedidos",
    async (req, res) => {

        try {

            const usuario_id =
                Number(req.body.usuario_id);

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            const telefono =
                String(
                    req.body.telefono || ""
                ).trim();

            const direccion =
                String(
                    req.body.direccion || ""
                ).trim();

            const entrega =
                String(
                    req.body.entrega ||
                    req.body.tipo_entrega ||
                    ""
                ).trim();

            const metodo_pago =
                String(
                    req.body.metodo_pago || ""
                ).trim();

            const productos =
                req.body.productos;

            const total =
                Number(req.body.total);

            const notas =
                String(
                    req.body.notas || ""
                ).trim();


            // ------------------------------------------
            // VALIDACIÓN
            // ------------------------------------------

            if (
                !usuario_id ||
                !nombre ||
                !telefono ||
                !entrega ||
                !metodo_pago ||
                !Array.isArray(productos) ||
                productos.length === 0 ||
                !total
            ) {

                return res.status(400).json({

                    error:
                        "Faltan datos obligatorios del pedido."

                });

            }


            // ------------------------------------------
            // VERIFICAR USUARIO
            // ------------------------------------------

            const [usuarios] =
                await db.query(

                    `
                    SELECT
                        id,
                        nombre,
                        apellido,
                        correo,
                        telefono
                    FROM usuarios
                    WHERE id = ?
                    LIMIT 1
                    `,

                    [usuario_id]

                );


            if (
                usuarios.length === 0
            ) {

                return res.status(401).json({

                    error:
                        "La cuenta del usuario no existe."

                });

            }


            // ------------------------------------------
            // GUARDAR PEDIDO
            // ------------------------------------------

            const [resultado] =
                await db.query(

                    `
                    INSERT INTO pedidos
                    (
                        usuario_id,
                        nombre,
                        telefono,
                        direccion,
                        entrega,
                        metodo_pago,
                        productos,
                        total,
                        notas,
                        estado
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,

                    [

                        usuario_id,

                        nombre,

                        telefono,

                        direccion,

                        entrega,

                        metodo_pago,

                        JSON.stringify(productos),

                        total,

                        notas,

                        "Pendiente"

                    ]

                );


            console.log(
                `🥐 Nuevo pedido registrado: #${resultado.insertId}`
            );


            res.status(201).json({

                ok: true,

                pedido_id:
                    resultado.insertId,

                id:
                    resultado.insertId,

                mensaje:
                    "Pedido creado correctamente 🥐"

            });


        } catch (error) {

            console.error(
                "Error creando pedido:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible guardar el pedido."

            });

        }

    }
);


// ==================================================
// OBTENER TODOS LOS PEDIDOS - ADMIN
// ==================================================
// ESTA ERA LA RUTA QUE FALTABA
// ==================================================

app.get(
    "/api/pedidos",
    async (req, res) => {

        try {

            const [pedidos] =
                await db.query(

                    `
                    SELECT
                        id,
                        usuario_id,
                        nombre,
                        telefono,
                        direccion,
                        entrega,
                        metodo_pago,
                        productos,
                        total,
                        notas,
                        estado,
                        fecha
                    FROM pedidos
                    ORDER BY fecha DESC, id DESC
                    `

                );


            res.json(pedidos);


        } catch (error) {

            console.error(
                "Error obteniendo pedidos:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible obtener los pedidos."

            });

        }

    }
);


// ==================================================
// OBTENER PEDIDOS DE UN USUARIO
// ==================================================

app.get(
    "/api/usuarios/:id/pedidos",
    async (req, res) => {

        try {

            const usuario_id =
                Number(req.params.id);


            if (!usuario_id) {

                return res.status(400).json({

                    error:
                        "ID de usuario inválido."

                });

            }


            const [pedidos] =
                await db.query(

                    `
                    SELECT
                        id,
                        usuario_id,
                        nombre,
                        telefono,
                        direccion,
                        entrega,
                        metodo_pago,
                        productos,
                        total,
                        notas,
                        estado,
                        fecha
                    FROM pedidos
                    WHERE usuario_id = ?
                    ORDER BY fecha DESC, id DESC
                    `,

                    [usuario_id]

                );


            res.json(pedidos);


        } catch (error) {

            console.error(
                "Error obteniendo pedidos usuario:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible obtener el historial."

            });

        }

    }
);


// ==================================================
// CAMBIAR ESTADO DEL PEDIDO - ADMIN
// ==================================================
// ESTA ERA LA OTRA RUTA QUE FALTABA
// ==================================================

app.patch(
    "/api/pedidos/:id/estado",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const estado =
                String(
                    req.body.estado || ""
                ).trim();


            const estadosPermitidos = [

                "Pendiente",

                "En preparación",

                "En camino",

                "Entregado",

                "Cancelado"

            ];


            if (!id) {

                return res.status(400).json({

                    error:
                        "ID de pedido inválido."

                });

            }


            if (
                !estadosPermitidos.includes(
                    estado
                )
            ) {

                return res.status(400).json({

                    error:
                        "Estado de pedido inválido."

                });

            }


            const [resultado] =
                await db.query(

                    `
                    UPDATE pedidos
                    SET estado = ?
                    WHERE id = ?
                    `,

                    [
                        estado,
                        id
                    ]

                );


            if (
                resultado.affectedRows === 0
            ) {

                return res.status(404).json({

                    error:
                        "Pedido no encontrado."

                });

            }


            console.log(
                `📦 Pedido #${id} → ${estado}`
            );


            res.json({

                ok: true,

                id,

                estado,

                mensaje:
                    "Estado del pedido actualizado."

            });


        } catch (error) {

            console.error(
                "Error actualizando pedido:",
                error.message
            );

            res.status(500).json({

                error:
                    "No fue posible actualizar el estado."

            });

        }

    }
);


// ==================================================
// SERVIDOR
// ==================================================

app.listen(
    PORT,
    () => {

        console.log("");
        console.log("🥐 ================================");
        console.log("🥐      LOS BROTHERS");
        console.log("🥐 ================================");
        console.log("");
        console.log("🚀 Servidor iniciado");
        console.log(
            `🌐 Puerto: ${PORT}`
        );
        console.log("");
        console.log("🗄️ MySQL configurado");
        console.log("");
        console.log("👨‍💻 Desarrollado por NEXORA");
        console.log("");

    }
);