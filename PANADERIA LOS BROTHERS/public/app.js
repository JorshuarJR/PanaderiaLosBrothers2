const productsGrid =
    document.getElementById("productsGrid");

const searchInput =
    document.getElementById("searchInput");

const categoryButtons =
    document.querySelectorAll(".category");

const openCart =
    document.getElementById("openCart");

const closeCart =
    document.getElementById("closeCart");

const cartOverlay =
    document.getElementById("cartOverlay");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const cartCount =
    document.getElementById("cartCount");

const checkoutButton =
    document.getElementById("checkoutButton");

const orderOverlay =
    document.getElementById("orderOverlay");

const closeOrder =
    document.getElementById("closeOrder");

const orderForm =
    document.getElementById("orderForm");

const customerName =
    document.getElementById("customerName");

const customerPhone =
    document.getElementById("customerPhone");

const customerAddress =
    document.getElementById("customerAddress");

const orderNotes =
    document.getElementById("orderNotes");

const orderSummaryItems =
    document.getElementById("orderSummaryItems");

const orderSummaryTotal =
    document.getElementById("orderSummaryTotal");


let products = [];

let cart = [];

let selectedCategory = "Todos";


/* ==========================================
   USUARIO
========================================== */

function obtenerUsuarioActual() {

    try {

        const usuario =
            sessionStorage.getItem(
                "losBrothersUser"
            );


        if (!usuario) {
            return null;
        }


        const datos =
            JSON.parse(usuario);


        if (!datos || !datos.id) {
            return null;
        }


        return datos;

    } catch (error) {

        console.error(
            "Error obteniendo usuario:",
            error
        );

        return null;

    }

}


function cerrarSesionCliente() {

    sessionStorage.removeItem(
        "losBrothersUser"
    );


    mostrarNotificacion(
        "Sesión cerrada correctamente 👋"
    );


    setTimeout(() => {

        actualizarBarraUsuario();

    }, 500);

}


function actualizarBarraUsuario() {

    const usuario =
        obtenerUsuarioActual();


    const barra =
        document.getElementById(
            "losBrothersAccountBar"
        );


    if (!barra) {
        crearBarraUsuario();
        return;
    }


    const contenido =
        barra.querySelector(
            ".lb-account-content"
        );


    if (!contenido) {
        return;
    }


    if (usuario) {

        const nombre =
            escaparHTML(
                usuario.nombre
            );


        contenido.innerHTML = `

            <div class="lb-user-info">

                <div class="lb-user-avatar">
                    ${nombre.charAt(0).toUpperCase()}
                </div>

                <div>

                    <small>
                        Hola 👋
                    </small>

                    <strong>
                        ${nombre}
                    </strong>

                </div>

            </div>


            <div class="lb-account-actions">

                <button
                    type="button"
                    id="lbAccountButton"
                    class="lb-account-button"
                >
                    👤 Mi cuenta
                </button>

                <button
                    type="button"
                    id="lbOrdersButton"
                    class="lb-orders-button"
                >
                    📦 Mis pedidos
                </button>

                <button
                    type="button"
                    id="lbLogoutButton"
                    class="lb-logout-button"
                >
                    Salir
                </button>

            </div>

        `;


        document
            .getElementById("lbAccountButton")
            ?.addEventListener(
                "click",
                abrirCuenta
            );


        document
            .getElementById("lbOrdersButton")
            ?.addEventListener(
                "click",
                abrirMisPedidos
            );


        document
            .getElementById("lbLogoutButton")
            ?.addEventListener(
                "click",
                cerrarSesionCliente
            );


    } else {

        contenido.innerHTML = `

            <div class="lb-guest-info">

                <span>
                    👋
                </span>

                <div>

                    <small>
                        Bienvenido
                    </small>

                    <strong>
                        Inicia sesión para pedir
                    </strong>

                </div>

            </div>


            <div class="lb-account-actions">

                <a
                    href="/client-login.html"
                    class="lb-login-button"
                >
                    🔐 Iniciar sesión
                </a>

                <a
                    href="/register.html"
                    class="lb-register-button"
                >
                    ✨ Crear cuenta
                </a>

            </div>

        `;

    }

}


/* ==========================================
   BARRA DE CUENTA
========================================== */

function crearBarraUsuario() {

    if (
        document.getElementById(
            "losBrothersAccountBar"
        )
    ) {
        actualizarBarraUsuario();
        return;
    }


    const barra =
        document.createElement("div");


    barra.id =
        "losBrothersAccountBar";


    barra.innerHTML = `

        <div class="lb-account-inner">

            <div class="lb-account-content"></div>

        </div>

    `;


    const navbar =
        document.querySelector(
            ".navbar"
        );


    if (navbar) {

        navbar.insertAdjacentElement(
            "afterend",
            barra
        );

    } else {

        document.body.prepend(barra);

    }


    actualizarBarraUsuario();

}


/* ==========================================
   MODAL MI CUENTA
========================================== */

function abrirCuenta() {

    const usuario =
        obtenerUsuarioActual();


    if (!usuario) {

        window.location.href =
            "/client-login.html";

        return;

    }


    cerrarModalUsuario();


    const modal =
        document.createElement("div");


    modal.id =
        "lbAccountModal";


    modal.className =
        "lb-user-modal-overlay";


    modal.innerHTML = `

        <div class="lb-user-modal">

            <button
                class="lb-modal-close"
                id="lbCloseAccount"
            >
                ×
            </button>


            <div class="lb-modal-icon">
                👤
            </div>


            <span class="lb-modal-eyebrow">
                MI CUENTA
            </span>


            <h2>
                ${escaparHTML(usuario.nombre)}
                ${escaparHTML(usuario.apellido || "")}
            </h2>


            <p class="lb-modal-welcome">
                Tu información de cliente
            </p>


            <div class="lb-profile-info">

                <div class="lb-profile-row">

                    <span>
                        👤 Nombre
                    </span>

                    <strong>
                        ${escaparHTML(usuario.nombre)}
                        ${escaparHTML(usuario.apellido || "")}
                    </strong>

                </div>


                <div class="lb-profile-row">

                    <span>
                        ✉️ Correo
                    </span>

                    <strong>
                        ${escaparHTML(usuario.correo)}
                    </strong>

                </div>


                <div class="lb-profile-row">

                    <span>
                        📱 Teléfono
                    </span>

                    <strong>
                        ${
                            escaparHTML(
                                usuario.telefono ||
                                "No registrado"
                            )
                        }
                    </strong>

                </div>

            </div>


            <div class="lb-modal-buttons">

                <button
                    type="button"
                    id="lbModalOrders"
                    class="lb-modal-primary"
                >
                    📦 Ver mis pedidos
                </button>


                <button
                    type="button"
                    id="lbModalLogout"
                    class="lb-modal-secondary"
                >
                    Cerrar sesión
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    document
        .getElementById(
            "lbCloseAccount"
        )
        ?.addEventListener(
            "click",
            cerrarModalUsuario
        );


    document
        .getElementById(
            "lbModalOrders"
        )
        ?.addEventListener(
            "click",
            () => {

                cerrarModalUsuario();
                abrirMisPedidos();

            }
        );


    document
        .getElementById(
            "lbModalLogout"
        )
        ?.addEventListener(
            "click",
            () => {

                cerrarModalUsuario();
                cerrarSesionCliente();

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                cerrarModalUsuario();
            }

        }
    );

}


function cerrarModalUsuario() {

    const modal =
        document.getElementById(
            "lbAccountModal"
        );


    if (modal) {
        modal.remove();
    }

}


/* ==========================================
   MIS PEDIDOS
========================================== */

async function abrirMisPedidos() {

    const usuario =
        obtenerUsuarioActual();


    if (!usuario) {

        window.location.href =
            "/client-login.html";

        return;

    }


    cerrarModalUsuario();


    const modal =
        document.createElement("div");


    modal.id =
        "lbOrdersModal";


    modal.className =
        "lb-user-modal-overlay";


    modal.innerHTML = `

        <div class="lb-user-modal lb-orders-modal">

            <button
                class="lb-modal-close"
                id="lbCloseOrders"
            >
                ×
            </button>


            <div class="lb-modal-icon">
                📦
            </div>


            <span class="lb-modal-eyebrow">
                HISTORIAL
            </span>


            <h2>
                Mis pedidos
            </h2>


            <p class="lb-modal-welcome">
                Aquí encontrarás tus pedidos realizados en Los Brothers.
            </p>


            <div
                id="lbOrdersContent"
                class="lb-orders-content"
            >

                <div class="lb-loading-orders">
                    🥐 Cargando tus pedidos...
                </div>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    document
        .getElementById(
            "lbCloseOrders"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                modal.remove();
            }

        }
    );


    try {

        const response =
            await fetch(
                `/api/usuarios/${usuario.id}/pedidos`
            );


        const pedidos =
            await response.json();


        if (!response.ok) {
            throw new Error(
                pedidos.error ||
                "No se pudieron cargar los pedidos."
            );
        }


        renderMisPedidos(
            pedidos
        );


    } catch (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );


        const contenido =
            document.getElementById(
                "lbOrdersContent"
            );


        if (contenido) {

            contenido.innerHTML = `

                <div class="lb-empty-orders">

                    <div>
                        😕
                    </div>

                    <h3>
                        No pudimos cargar tus pedidos
                    </h3>

                    <p>
                        Intenta nuevamente.
                    </p>

                </div>

            `;

        }

    }

}


function renderMisPedidos(pedidos) {

    const contenido =
        document.getElementById(
            "lbOrdersContent"
        );


    if (!contenido) {
        return;
    }


    if (!Array.isArray(pedidos) || !pedidos.length) {

        contenido.innerHTML = `

            <div class="lb-empty-orders">

                <div>
                    🛒
                </div>

                <h3>
                    Todavía no tienes pedidos
                </h3>

                <p>
                    Cuando hagas tu primer pedido,
                    aparecerá aquí.
                </p>


                <button
                    type="button"
                    class="lb-go-products"
                    onclick="
                        document.getElementById('lbOrdersModal')?.remove();
                        document.getElementById('productos')?.scrollIntoView({behavior:'smooth'});
                    "
                >
                    Ver productos
                </button>

            </div>

        `;

        return;

    }


    contenido.innerHTML =
        pedidos.map(
            pedido => {

                let productosPedido = [];

                try {

                    productosPedido =
                        typeof pedido.productos === "string"
                            ? JSON.parse(
                                pedido.productos
                            )
                            : (
                                pedido.productos ||
                                []
                            );

                } catch (error) {

                    productosPedido = [];

                }


                const estado =
                    escaparHTML(
                        pedido.estado ||
                        "Pendiente"
                    );


                const fecha =
                    formatearFecha(
                        pedido.fecha
                    );


                const total =
                    formatoPrecio(
                        pedido.total
                    );


                const claseEstado =
                    obtenerClaseEstado(
                        pedido.estado
                    );


                return `

                    <article class="lb-order-card">

                        <div class="lb-order-top">

                            <div>

                                <span>
                                    PEDIDO #${pedido.id}
                                </span>

                                <strong>
                                    ${fecha}
                                </strong>

                            </div>


                            <span
                                class="lb-order-status ${claseEstado}"
                            >
                                ${estado}
                            </span>

                        </div>


                        <div class="lb-order-products">

                            ${
                                productosPedido
                                    .map(
                                        producto => `
                                            <div class="lb-order-product">

                                                <span>
                                                    ${escaparHTML(
                                                        producto.nombre ||
                                                        "Producto"
                                                    )}
                                                </span>

                                                <strong>
                                                    ×${Number(
                                                        producto.cantidad
                                                    ) || 1}
                                                </strong>

                                            </div>
                                        `
                                    )
                                    .join("")
                            }

                        </div>


                        <div class="lb-order-bottom">

                            <span>
                                ${
                                    escaparHTML(
                                        pedido.metodo_pago ||
                                        "Pago"
                                    )
                                }
                            </span>

                            <strong>
                                ${total}
                            </strong>

                        </div>

                    </article>

                `;

            }
        ).join("");

}


function formatearFecha(fecha) {

    if (!fecha) {
        return "Fecha no disponible";
    }


    const fechaObjeto =
        new Date(fecha);


    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {
        return String(fecha);
    }


    return fechaObjeto.toLocaleString(
        "es-CO",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function obtenerClaseEstado(estado) {

    const valor =
        String(
            estado || ""
        ).toLowerCase();


    if (
        valor.includes("entregado")
    ) {
        return "estado-entregado";
    }


    if (
        valor.includes("camino")
    ) {
        return "estado-camino";
    }


    if (
        valor.includes("preparación") ||
        valor.includes("preparacion")
    ) {
        return "estado-preparacion";
    }


    if (
        valor.includes("cancelado")
    ) {
        return "estado-cancelado";
    }


    return "estado-pendiente";

}


/* ==========================================
   ESTILOS DINÁMICOS
========================================== */

function crearEstilosCuenta() {

    if (
        document.getElementById(
            "losBrothersAccountStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "losBrothersAccountStyles";


    style.textContent = `

        #losBrothersAccountBar {

            width: 100%;

            background:
                linear-gradient(
                    135deg,
                    #fff8ef,
                    #fff
                );

            border-bottom:
                1px solid #eee2d5;

            padding: 10px 20px;

            position: relative;

            z-index: 20;

        }


        .lb-account-inner {

            max-width: 1180px;

            margin: 0 auto;

        }


        .lb-account-content {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 20px;

        }


        .lb-user-info,
        .lb-guest-info {

            display: flex;

            align-items: center;

            gap: 12px;

        }


        .lb-user-avatar {

            width: 42px;

            height: 42px;

            border-radius: 50%;

            display: flex;

            align-items: center;

            justify-content: center;

            background:
                linear-gradient(
                    135deg,
                    #8b5e3c,
                    #c88b5a
                );

            color: white;

            font-weight: 800;

            font-size: 17px;

        }


        .lb-user-info small,
        .lb-guest-info small {

            display: block;

            color: #8c8177;

            font-size: 11px;

            margin-bottom: 2px;

        }


        .lb-user-info strong,
        .lb-guest-info strong {

            display: block;

            color: #30271f;

            font-size: 14px;

        }


        .lb-guest-info > span {

            font-size: 28px;

        }


        .lb-account-actions {

            display: flex;

            align-items: center;

            gap: 8px;

            flex-wrap: wrap;

        }


        .lb-account-actions button,
        .lb-account-actions a {

            border: none;

            text-decoration: none;

            cursor: pointer;

            border-radius: 12px;

            padding: 9px 14px;

            font-family: inherit;

            font-weight: 700;

            font-size: 12px;

            transition: .2s ease;

        }


        .lb-account-button {

            background: #30271f;

            color: white;

        }


        .lb-orders-button {

            background: #f4e7d8;

            color: #5d422f;

        }


        .lb-logout-button {

            background: #f7f2ed;

            color: #7a6656;

        }


        .lb-login-button {

            background: #30271f;

            color: white;

        }


        .lb-register-button {

            background: #f0dfca;

            color: #5d422f;

        }


        .lb-account-actions button:hover,
        .lb-account-actions a:hover {

            transform: translateY(-1px);

            opacity: .9;

        }


        .lb-user-modal-overlay {

            position: fixed;

            inset: 0;

            background: rgba(28, 21, 16, .58);

            backdrop-filter: blur(5px);

            z-index: 9999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

        }


        .lb-user-modal {

            width: min(500px, 100%);

            max-height: 90vh;

            overflow-y: auto;

            background: #fff;

            border-radius: 24px;

            padding: 32px;

            position: relative;

            box-shadow:
                0 25px 70px
                rgba(0,0,0,.22);

            animation:
                lbModalIn .22s ease;

        }


        @keyframes lbModalIn {

            from {
                opacity: 0;
                transform: translateY(15px) scale(.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

        }


        .lb-modal-close {

            position: absolute;

            right: 18px;

            top: 15px;

            border: none;

            background: #f6f2ee;

            width: 38px;

            height: 38px;

            border-radius: 50%;

            font-size: 25px;

            cursor: pointer;

            color: #4a3b30;

        }


        .lb-modal-icon {

            width: 60px;

            height: 60px;

            border-radius: 18px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #f7e8d7;

            font-size: 28px;

            margin-bottom: 18px;

        }


        .lb-modal-eyebrow {

            font-size: 11px;

            font-weight: 800;

            letter-spacing: 1.5px;

            color: #a06d45;

        }


        .lb-user-modal h2 {

            margin:
                5px 0 5px;

            color: #2d241e;

        }


        .lb-modal-welcome {

            color: #82766c;

            margin:
                0 0 22px;

            line-height: 1.5;

        }


        .lb-profile-info {

            border:
                1px solid #eee5dd;

            border-radius: 17px;

            overflow: hidden;

            margin-bottom: 20px;

        }


        .lb-profile-row {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            padding: 15px;

            border-bottom:
                1px solid #eee5dd;

        }


        .lb-profile-row:last-child {

            border-bottom: none;

        }


        .lb-profile-row span {

            color: #85776b;

            font-size: 13px;

        }


        .lb-profile-row strong {

            color: #30271f;

            text-align: right;

            font-size: 13px;

            word-break: break-word;

        }


        .lb-modal-buttons {

            display: grid;

            gap: 10px;

        }


        .lb-modal-buttons button {

            border: none;

            border-radius: 13px;

            padding: 13px;

            cursor: pointer;

            font-family: inherit;

            font-weight: 800;

        }


        .lb-modal-primary {

            background: #30271f;

            color: white;

        }


        .lb-modal-secondary {

            background: #f2ece6;

            color: #59493c;

        }


        .lb-orders-modal {

            width: min(650px, 100%);

        }


        .lb-orders-content {

            display: grid;

            gap: 12px;

        }


        .lb-loading-orders,
        .lb-empty-orders {

            text-align: center;

            padding: 35px 15px;

            color: #81756c;

        }


        .lb-empty-orders > div {

            font-size: 42px;

            margin-bottom: 8px;

        }


        .lb-empty-orders h3 {

            color: #332920;

            margin: 5px 0;

        }


        .lb-empty-orders p {

            margin: 5px 0 18px;

        }


        .lb-go-products {

            border: none;

            background: #30271f;

            color: white;

            padding: 11px 18px;

            border-radius: 12px;

            cursor: pointer;

            font-weight: 700;

        }


        .lb-order-card {

            border:
                1px solid #eee5dd;

            border-radius: 17px;

            padding: 16px;

            background: #fffdfb;

        }


        .lb-order-top {

            display: flex;

            justify-content: space-between;

            align-items: flex-start;

            gap: 10px;

            padding-bottom: 12px;

            border-bottom:
                1px solid #eee5dd;

        }


        .lb-order-top div span {

            display: block;

            color: #a06d45;

            font-size: 10px;

            font-weight: 800;

            letter-spacing: 1px;

        }


        .lb-order-top div strong {

            display: block;

            color: #332920;

            margin-top: 4px;

            font-size: 12px;

        }


        .lb-order-status {

            padding: 6px 9px;

            border-radius: 20px;

            font-size: 10px;

            font-weight: 800;

        }


        .estado-pendiente {

            background: #fff1d6;

            color: #9a691b;

        }


        .estado-preparacion {

            background: #e9f0ff;

            color: #4567a5;

        }


        .estado-camino {

            background: #eee7ff;

            color: #694ca3;

        }


        .estado-entregado {

            background: #e4f6e9;

            color: #39834c;

        }


        .estado-cancelado {

            background: #fde7e7;

            color: #a64a4a;

        }


        .lb-order-products {

            padding: 10px 0;

        }


        .lb-order-product {

            display: flex;

            justify-content: space-between;

            gap: 15px;

            padding: 5px 0;

            color: #65584d;

            font-size: 13px;

        }


        .lb-order-product strong {

            color: #332920;

        }


        .lb-order-bottom {

            border-top:
                1px solid #eee5dd;

            padding-top: 12px;

            display: flex;

            justify-content: space-between;

            color: #85776c;

            font-size: 12px;

        }


        .lb-order-bottom strong {

            color: #30271f;

            font-size: 16px;

        }


        @media (max-width: 700px) {

            #losBrothersAccountBar {

                padding:
                    10px 14px;

            }


            .lb-account-content {

                align-items: flex-start;

                flex-direction: column;

            }


            .lb-account-actions {

                width: 100%;

            }


            .lb-account-actions button,
            .lb-account-actions a {

                flex: 1;

                text-align: center;

            }


            .lb-user-modal {

                padding: 25px 18px;

                border-radius: 20px;

            }


            .lb-profile-row {

                align-items: flex-start;

                flex-direction: column;

                gap: 5px;

            }


            .lb-profile-row strong {

                text-align: left;

            }

        }

    `;


    document.head.appendChild(style);

}


/* ==========================================
   PRECIOS
========================================== */

function formatoPrecio(valor) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(
        Number(valor) || 0
    );

}


/* ==========================================
   SEGURIDAD HTML
========================================== */

function escaparHTML(texto) {

    return String(
        texto ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==========================================
   PRODUCTOS
========================================== */

async function cargarProductos() {

    try {

        const respuesta =
            await fetch(
                "/api/productos"
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los productos."
            );

        }


        products =
            await respuesta.json();


        products =
            products

                .filter(
                    producto =>
                        Number(
                            producto.activo
                        ) !== 0
                )

                .map(
                    producto => ({

                        ...producto,

                        precio:
                            Number(
                                producto.precio
                            ) || 0,

                        imagen:
                            normalizarImagen(
                                producto.imagen
                            )

                    })
                );


        renderProducts();


    } catch (error) {

        console.error(error);


        if (productsGrid) {

            productsGrid.innerHTML = `

                <div class="empty-products">

                    <div>
                        😕
                    </div>

                    <h3>
                        No pudimos cargar los productos
                    </h3>

                    <p>
                        Verifica que el servidor esté funcionando.
                    </p>

                </div>

            `;

        }

    }

}


function normalizarImagen(imagen) {

    if (!imagen) {
        return "";
    }


    if (
        imagen.startsWith("http://") ||
        imagen.startsWith("https://")
    ) {
        return imagen;
    }


    if (
        imagen.startsWith("/")
    ) {
        return imagen;
    }


    return "/assets/" + imagen;

}


function renderProducts() {

    if (!productsGrid) {
        return;
    }


    const texto =
        (
            searchInput?.value ||
            ""
        )
            .toLowerCase()
            .trim();


    const filtrados =
        products.filter(
            producto => {

                const coincideCategoria =
                    selectedCategory === "Todos" ||
                    producto.categoria ===
                        selectedCategory;


                const nombre =
                    String(
                        producto.nombre || ""
                    ).toLowerCase();


                const descripcion =
                    String(
                        producto.descripcion || ""
                    ).toLowerCase();


                const coincideBusqueda =
                    !texto ||
                    nombre.includes(texto) ||
                    descripcion.includes(texto);


                return (
                    coincideCategoria &&
                    coincideBusqueda
                );

            }
        );


    if (!filtrados.length) {

        productsGrid.innerHTML = `

            <div class="empty-products">

                <div class="empty-products-icon">
                    🔎
                </div>

                <h3>
                    No encontramos productos
                </h3>

                <p>
                    Prueba con otra búsqueda o categoría.
                </p>

            </div>

        `;

        return;

    }


    productsGrid.innerHTML =
        filtrados
            .map(
                producto => {

                    const cantidadEnCarrito =
                        obtenerCantidad(
                            producto.id
                        );


                    return `

                        <article class="product-card">

                            <div class="product-image-wrapper">

                                ${
                                    producto.imagen
                                        ?
                                        `
                                            <img
                                                src="${escaparHTML(producto.imagen)}"
                                                alt="${escaparHTML(producto.nombre)}"
                                                class="product-image"
                                                onerror="
                                                    this.style.display='none';
                                                    this.nextElementSibling.style.display='flex';
                                                "
                                            >
                                        `
                                        :
                                        ""
                                }


                                <div
                                    class="product-image-fallback"
                                    style="
                                        ${
                                            producto.imagen
                                                ?
                                                "display:none;"
                                                :
                                                ""
                                        }
                                    "
                                >
                                    🥐
                                </div>


                                ${
                                    cantidadEnCarrito > 0
                                        ?
                                        `
                                            <div class="product-cart-badge">
                                                🛒 ${cantidadEnCarrito}
                                            </div>
                                        `
                                        :
                                        ""
                                }

                            </div>


                            <div class="product-info">

                                <span class="product-category">
                                    ${escaparHTML(
                                        producto.categoria ||
                                        "Producto"
                                    )}
                                </span>


                                <h3>
                                    ${escaparHTML(
                                        producto.nombre
                                    )}
                                </h3>


                                <p>
                                    ${escaparHTML(
                                        producto.descripcion ||
                                        "Delicioso producto de Los Brothers."
                                    )}
                                </p>


                                <div class="product-bottom">

                                    <strong>
                                        ${formatoPrecio(
                                            producto.precio
                                        )}
                                    </strong>


                                    <button
                                        class="add-product-button"
                                        onclick="
                                            agregarAlCarrito(${producto.id})
                                        "
                                    >

                                        <span>
                                            +
                                        </span>

                                        Agregar

                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* ==========================================
   CARRITO
========================================== */

function obtenerCantidad(id) {

    const producto =
        cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    return producto
        ? producto.cantidad
        : 0;

}


function agregarAlCarrito(id) {

    const producto =
        products.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!producto) {
        return;
    }


    const existente =
        cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (existente) {

        existente.cantidad++;

    } else {

        cart.push({

            id:
                producto.id,

            nombre:
                producto.nombre,

            precio:
                Number(producto.precio),

            imagen:
                producto.imagen,

            cantidad:
                1

        });

    }


    guardarCarrito();

    renderCart();

    renderProducts();


    mostrarNotificacion(
        `${producto.nombre} agregado al carrito 🛒`
    );

}


function cambiarCantidad(
    id,
    cambio
) {

    const producto =
        cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!producto) {
        return;
    }


    producto.cantidad += cambio;


    if (
        producto.cantidad <= 0
    ) {

        cart =
            cart.filter(
                item =>
                    Number(item.id) !==
                    Number(id)
            );

    }


    guardarCarrito();

    renderCart();

    renderProducts();

}


function eliminarDelCarrito(id) {

    const producto =
        cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!producto) {
        return;
    }


    cart =
        cart.filter(
            item =>
                Number(item.id) !==
                Number(id)
        );


    guardarCarrito();

    renderCart();

    renderProducts();


    mostrarNotificacion(
        "Producto eliminado del carrito"
    );

}


function vaciarCarrito() {

    if (!cart.length) {
        return;
    }


    cart = [];


    guardarCarrito();

    renderCart();

    renderProducts();


    mostrarNotificacion(
        "Carrito vaciado"
    );

}


function calcularTotal() {

    return cart.reduce(
        (
            total,
            producto
        ) => {

            return total +
                (
                    Number(
                        producto.precio
                    ) || 0
                ) *
                producto.cantidad;

        },
        0
    );

}


function calcularCantidadTotal() {

    return cart.reduce(
        (
            total,
            producto
        ) => {

            return total +
                producto.cantidad;

        },
        0
    );

}


function renderCart() {

    if (!cartItems) {
        return;
    }


    const cantidadTotal =
        calcularCantidadTotal();


    const total =
        calcularTotal();


    if (cartCount) {

        cartCount.textContent =
            cantidadTotal;


        cartCount.classList.toggle(
            "cart-count-active",
            cantidadTotal > 0
        );

    }


    if (!cart.length) {

        cartItems.innerHTML = `

            <div class="cart-empty">

                <div class="cart-empty-icon">
                    🛒
                </div>

                <h3>
                    Tu carrito está vacío
                </h3>

                <p>
                    Agrega algo delicioso de Los Brothers y aparecerá aquí.
                </p>


                <button
                    class="cart-empty-button"
                    onclick="cerrarCarrito()"
                >
                    Ver productos
                </button>

            </div>

        `;


        if (cartTotal) {

            cartTotal.textContent =
                formatoPrecio(0);

        }


        if (checkoutButton) {

            checkoutButton.disabled =
                true;

            checkoutButton.classList.add(
                "disabled"
            );

        }


        return;

    }


    cartItems.innerHTML = `

        <div class="cart-products-list">

            ${
                cart
                    .map(
                        producto => {

                            const subtotal =
                                producto.precio *
                                producto.cantidad;


                            return `

                                <div class="cart-product">

                                    <div class="cart-product-image">

                                        ${
                                            producto.imagen
                                                ?
                                                `
                                                    <img
                                                        src="${escaparHTML(producto.imagen)}"
                                                        alt="${escaparHTML(producto.nombre)}"
                                                        onerror="
                                                            this.style.display='none';
                                                        "
                                                    >
                                                `
                                                :
                                                `
                                                    <span>
                                                        🥐
                                                    </span>
                                                `
                                        }

                                    </div>


                                    <div class="cart-product-info">

                                        <h4>
                                            ${escaparHTML(
                                                producto.nombre
                                            )}
                                        </h4>


                                        <span class="cart-product-price">
                                            ${formatoPrecio(
                                                producto.precio
                                            )}
                                            c/u
                                        </span>


                                        <div class="cart-product-controls">

                                            <button
                                                onclick="
                                                    cambiarCantidad(
                                                        ${producto.id},
                                                        -1
                                                    )
                                                "
                                            >
                                                −
                                            </button>


                                            <strong>
                                                ${producto.cantidad}
                                            </strong>


                                            <button
                                                onclick="
                                                    cambiarCantidad(
                                                        ${producto.id},
                                                        1
                                                    )
                                                "
                                            >
                                                +
                                            </button>

                                        </div>

                                    </div>


                                    <div class="cart-product-right">

                                        <strong class="cart-product-subtotal">
                                            ${formatoPrecio(
                                                subtotal
                                            )}
                                        </strong>


                                        <button
                                            class="cart-remove-button"
                                            onclick="
                                                eliminarDelCarrito(
                                                    ${producto.id}
                                                )
                                            "
                                            title="Eliminar producto"
                                        >
                                            🗑️
                                        </button>

                                    </div>

                                </div>

                            `;

                        }
                    )
                    .join("")
            }

        </div>


        <button
            class="clear-cart-button"
            onclick="vaciarCarrito()"
        >
            🗑️ Vaciar carrito
        </button>

    `;


    if (cartTotal) {

        cartTotal.textContent =
            formatoPrecio(total);

    }


    if (checkoutButton) {

        checkoutButton.disabled =
            false;

        checkoutButton.classList.remove(
            "disabled"
        );

    }

}


/* ==========================================
   CARRITO ABRIR / CERRAR
========================================== */

function abrirCarrito() {

    if (!cartOverlay) {
        return;
    }


    cartOverlay.classList.add(
        "active"
    );


    document.body.classList.add(
        "no-scroll"
    );


    renderCart();

}


function cerrarCarrito() {

    if (!cartOverlay) {
        return;
    }


    cartOverlay.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "no-scroll"
    );

}


/* ==========================================
   PEDIDO
========================================== */

function abrirPedido() {

    if (!cart.length) {

        mostrarNotificacion(
            "Agrega productos antes de continuar"
        );

        return;

    }


    const usuario =
        obtenerUsuarioActual();


    if (!usuario) {

        mostrarNotificacion(
            "Debes iniciar sesión para realizar un pedido 🔐"
        );


        setTimeout(() => {

            window.location.href =
                "/client-login.html";

        }, 900);


        return;

    }


    cerrarCarrito();


    if (orderOverlay) {

        orderOverlay.classList.add(
            "active"
        );

        document.body.classList.add(
            "no-scroll"
        );

    }


    cargarDatosUsuarioEnPedido();

    renderOrderSummary();

}


/* ==========================================
   DATOS DEL USUARIO EN PEDIDO
========================================== */

function cargarDatosUsuarioEnPedido() {

    const usuario =
        obtenerUsuarioActual();


    if (!usuario) {
        return;
    }


    if (
        customerName &&
        !customerName.value
    ) {

        customerName.value =
            `${usuario.nombre} ${usuario.apellido || ""}`.trim();

    }


    if (
        customerPhone &&
        !customerPhone.value &&
        usuario.telefono
    ) {

        customerPhone.value =
            usuario.telefono;

    }

}


/* ==========================================
   CERRAR PEDIDO
========================================== */

function cerrarPedido() {

    if (orderOverlay) {

        orderOverlay.classList.remove(
            "active"
        );

    }


    document.body.classList.remove(
        "no-scroll"
    );

}


/* ==========================================
   RESUMEN
========================================== */

function renderOrderSummary() {

    if (
        !orderSummaryItems ||
        !orderSummaryTotal
    ) {
        return;
    }


    orderSummaryItems.innerHTML =
        cart
            .map(
                producto => {

                    const subtotal =
                        producto.precio *
                        producto.cantidad;


                    return `

                        <div class="order-summary-item">

                            <div>

                                <strong>
                                    ${escaparHTML(
                                        producto.nombre
                                    )}
                                </strong>

                                <span>
                                    ${producto.cantidad}
                                    x
                                    ${formatoPrecio(
                                        producto.precio
                                    )}
                                </span>

                            </div>


                            <strong>
                                ${formatoPrecio(
                                    subtotal
                                )}
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");


    orderSummaryTotal.textContent =
        formatoPrecio(
            calcularTotal()
        );

}


/* ==========================================
   GUARDAR / CARGAR CARRITO
========================================== */

function guardarCarrito() {

    localStorage.setItem(
        "losBrothersCart",
        JSON.stringify(cart)
    );

}


function cargarCarrito() {

    try {

        const guardado =
            localStorage.getItem(
                "losBrothersCart"
            );


        if (guardado) {

            const carritoGuardado =
                JSON.parse(
                    guardado
                );


            if (
                Array.isArray(
                    carritoGuardado
                )
            ) {

                cart =
                    carritoGuardado;

            }

        }

    } catch (error) {

        console.error(
            "Error cargando carrito:",
            error
        );


        cart = [];

    }


    renderCart();

}


/* ==========================================
   ENVIAR PEDIDO
========================================== */

async function enviarPedido(event) {

    event.preventDefault();


    if (!cart.length) {

        mostrarNotificacion(
            "El carrito está vacío"
        );

        return;

    }


    const usuarioActual =
        obtenerUsuarioActual();


    if (!usuarioActual) {

        mostrarNotificacion(
            "Debes iniciar sesión para realizar el pedido 🔐"
        );


        setTimeout(() => {

            window.location.href =
                "/client-login.html";

        }, 900);


        return;

    }


    const boton =
        orderForm?.querySelector(
            'button[type="submit"]'
        );


    if (boton) {

        boton.disabled =
            true;

        boton.textContent =
            "Enviando pedido...";

    }


    const deliveryType =
        document.querySelector(
            'input[name="deliveryType"]:checked'
        )?.value ||
        "domicilio";


    const paymentMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value ||
        "Efectivo";


    const nombre =
        customerName?.value.trim() ||
        `${usuarioActual.nombre} ${usuarioActual.apellido || ""}`.trim();


    const telefono =
        customerPhone?.value.trim() ||
        usuarioActual.telefono ||
        "";


    const direccion =
        customerAddress?.value.trim() ||
        "";


    if (!nombre) {

        mostrarNotificacion(
            "Necesitamos tu nombre."
        );


        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                "Confirmar pedido 🥐";

        }

        return;

    }


    if (!telefono) {

        mostrarNotificacion(
            "Necesitamos tu número de teléfono."
        );


        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                "Confirmar pedido 🥐";

        }

        return;

    }


    if (
        deliveryType === "domicilio" &&
        !direccion
    ) {

        mostrarNotificacion(
            "Ingresa tu dirección de entrega."
        );


        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                "Confirmar pedido 🥐";

        }

        return;

    }


    const pedido = {

        usuario_id:
            Number(
                usuarioActual.id
            ),

        nombre:
            nombre,

        telefono:
            telefono,

        entrega:
            deliveryType,

        tipo_entrega:
            deliveryType,

        direccion:
            direccion,

        metodo_pago:
            paymentMethod,

        notas:
            orderNotes?.value.trim() ||
            "",

        productos:
            cart.map(
                producto => ({

                    id:
                        producto.id,

                    nombre:
                        producto.nombre,

                    precio:
                        producto.precio,

                    cantidad:
                        producto.cantidad,

                    subtotal:
                        producto.precio *
                        producto.cantidad

                })
            ),

        total:
            calcularTotal()

    };


    try {

        const respuesta =
            await fetch(
                "/api/pedidos",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            pedido
                        )

                }
            );


        const data =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "No fue posible guardar el pedido."
            );

        }


        cart = [];


        guardarCarrito();

        renderCart();

        renderProducts();


        if (orderForm) {
            orderForm.reset();
        }


        cerrarPedido();


        mostrarNotificacion(
            `¡Pedido #${data.pedido_id} realizado correctamente! 🥐🎉`
        );


    } catch (error) {

        console.error(
            "Error enviando pedido:",
            error
        );


        mostrarNotificacion(
            error.message ||
            "No fue posible enviar el pedido."
        );


    } finally {

        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                "Confirmar pedido 🥐";

        }

    }

}


/* ==========================================
   NOTIFICACIONES
========================================== */

function mostrarNotificacion(
    mensaje
) {

    const anterior =
        document.querySelector(
            ".store-notification"
        );


    if (anterior) {
        anterior.remove();
    }


    const notificacion =
        document.createElement("div");


    notificacion.className =
        "store-notification";


    notificacion.textContent =
        mensaje;


    document.body.appendChild(
        notificacion
    );


    setTimeout(() => {

        notificacion.classList.add(
            "show"
        );

    }, 10);


    setTimeout(() => {

        notificacion.classList.remove(
            "show"
        );


        setTimeout(() => {

            notificacion.remove();

        }, 300);

    }, 2200);

}


/* ==========================================
   CATEGORÍAS
========================================== */

categoryButtons.forEach(
    boton => {

        boton.addEventListener(
            "click",
            () => {

                categoryButtons.forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                boton.classList.add(
                    "active"
                );


                selectedCategory =
                    boton.textContent
                        .trim();


                renderProducts();

            }
        );

    }
);


/* ==========================================
   BÚSQUEDA
========================================== */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderProducts
    );

}


/* ==========================================
   EVENTOS DEL CARRITO
========================================== */

if (openCart) {

    openCart.addEventListener(
        "click",
        abrirCarrito
    );

}


if (closeCart) {

    closeCart.addEventListener(
        "click",
        cerrarCarrito
    );

}


if (cartOverlay) {

    cartOverlay.addEventListener(
        "click",
        cerrarCarrito
    );

}


if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        abrirPedido
    );

}


/* ==========================================
   EVENTOS DEL PEDIDO
========================================== */

if (closeOrder) {

    closeOrder.addEventListener(
        "click",
        cerrarPedido
    );

}


if (orderOverlay) {

    orderOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                orderOverlay
            ) {

                cerrarPedido();

            }

        }
    );

}


if (orderForm) {

    orderForm.addEventListener(
        "submit",
        enviarPedido
    );

}


/* ==========================================
   ENTREGA
========================================== */

const deliveryInputs =
    document.querySelectorAll(
        'input[name="deliveryType"]'
    );


const addressGroup =
    document.getElementById(
        "addressGroup"
    );


function actualizarDireccion() {

    const tipo =
        document.querySelector(
            'input[name="deliveryType"]:checked'
        )?.value;


    if (!addressGroup) {
        return;
    }


    if (tipo === "recoger") {

        addressGroup.style.display =
            "none";


        if (customerAddress) {

            customerAddress.value =
                "";

            customerAddress.removeAttribute(
                "required"
            );

        }

    } else {

        addressGroup.style.display =
            "";


        if (customerAddress) {

            customerAddress.setAttribute(
                "required",
                "required"
            );

        }

    }

}


deliveryInputs.forEach(
    input => {

        input.addEventListener(
            "change",
            actualizarDireccion
        );

    }
);


actualizarDireccion();


/* ==========================================
   ESCAPE
========================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarCarrito();

            cerrarPedido();

            cerrarModalUsuario();

            document
                .getElementById(
                    "lbOrdersModal"
                )
                ?.remove();

        }

    }
);


/* ==========================================
   INICIALIZACIÓN
========================================== */

crearEstilosCuenta();

crearBarraUsuario();

cargarCarrito();

cargarProductos();


/* ==========================================
   FUNCIONES GLOBALES
========================================== */

window.agregarAlCarrito =
    agregarAlCarrito;

window.cambiarCantidad =
    cambiarCantidad;

window.eliminarDelCarrito =
    eliminarDelCarrito;

window.vaciarCarrito =
    vaciarCarrito;

window.cerrarCarrito =
    cerrarCarrito;

window.abrirPedido =
    abrirPedido;

window.cerrarPedido =
    cerrarPedido;

window.abrirMisPedidos =
    abrirMisPedidos;

window.abrirCuenta =
    abrirCuenta;