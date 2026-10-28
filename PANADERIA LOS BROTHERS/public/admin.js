(async function verificarSesionAdmin() {
    try {
        const respuesta = await fetch("/api/admin/sesion", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respuesta.ok) {
            window.location.replace("/login.html");
            return;
        }

        const datos = await respuesta.json();

        if (!datos.ok || !datos.usuario) {
            window.location.replace("/login.html");
            return;
        }

        sessionStorage.setItem(
            "losBrothersUsuario",
            JSON.stringify(datos.usuario)
        );

        iniciarPanelAdmin();

    } catch (error) {
        console.error("Error al verificar la sesión:", error);
        window.location.replace("/login.html");
    }
})();

async function iniciarPanelAdmin() {
const ordersContainer=document.getElementById("ordersContainer");
const totalOrders=document.getElementById("totalOrders");
const pendingOrders=document.getElementById("pendingOrders");
const preparingOrders=document.getElementById("preparingOrders");
const totalSales=document.getElementById("totalSales");
const statusFilter=document.getElementById("statusFilter");
const refreshButton=document.getElementById("refreshButton");
const logoutButton=document.getElementById("logoutButton");

const productsAdminContainer=document.getElementById("productsAdminContainer");
const addProductButton=document.getElementById("addProductButton");
const productModal=document.getElementById("productModal");
const closeProductModal=document.getElementById("closeProductModal");
const cancelProductButton=document.getElementById("cancelProductButton");
const productForm=document.getElementById("productForm");
const productModalTitle=document.getElementById("productModalTitle");
const productMessage=document.getElementById("productMessage");
const productSearch=document.getElementById("productSearch");
const productCategoryFilter=document.getElementById("productCategoryFilter");
const productStatusFilter=document.getElementById("productStatusFilter");
const productImagePreview=document.getElementById("productImagePreview");
const previewName=document.getElementById("previewName");

const sidebarItems=document.querySelectorAll(".sidebar-item");
const adminSections=document.querySelectorAll(".admin-section");
const pageTitle=document.getElementById("pageTitle");
const menuToggle=document.getElementById("menuToggle");
const adminSidebar=document.getElementById("adminSidebar");

const titles={
employeesSection: "Empleados",
dashboardSection:"Dashboard",
ordersSection:"Pedidos",
productsSection:"Productos",
settingsSection:"Configuración"
};

let pedidos=[];
let productos=[];

function formatoPrecio(valor){
return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(valor)||0);
}

function escaparHTML(texto){
const div=document.createElement("div");
div.textContent=texto??"";
return div.innerHTML;
}

function obtenerImagen(imagen){
if(!imagen)return"assets/Logo.jpeg";
if(imagen.startsWith("assets/"))return imagen;
return"assets/"+imagen;
}


/* ======================================
   MENÚ ADMINISTRATIVO
====================================== */

function cambiarSeccion(sectionId){

adminSections.forEach(section=>{
section.classList.remove("active-section");
});

sidebarItems.forEach(item=>{
item.classList.remove("active");
});

const section=document.getElementById(sectionId);
const button=document.querySelector(`.sidebar-item[data-section="${sectionId}"]`);

if(section){
section.classList.add("active-section");
}

if(button){
button.classList.add("active");
}

if(pageTitle){
pageTitle.textContent=titles[sectionId]||"Panel";
}

if(window.innerWidth<=900&&adminSidebar){
adminSidebar.classList.remove("mobile-open");
}

window.scrollTo({
top:0,
behavior:"smooth"
});

}

sidebarItems.forEach(item=>{

item.addEventListener("click",()=>{

const sectionId=item.dataset.section;

cambiarSeccion(sectionId);

});

});


if(menuToggle){

menuToggle.addEventListener("click",()=>{

adminSidebar.classList.toggle("mobile-open");

});

}


document.addEventListener("click",event=>{

if(window.innerWidth>900)return;

if(!adminSidebar||!menuToggle)return;

if(
adminSidebar.classList.contains("mobile-open")&&
!adminSidebar.contains(event.target)&&
!menuToggle.contains(event.target)
){

adminSidebar.classList.remove("mobile-open");

}

});


/* ======================================
   PEDIDOS
====================================== */

async function cargarPedidos(){

try{

ordersContainer.innerHTML=`
<div class="loading">
<div>🥐</div>
<p>Cargando pedidos...</p>
</div>
`;

const respuesta=await fetch("/api/pedidos");

if(!respuesta.ok){
throw new Error("No se pudieron obtener los pedidos.");
}

pedidos=await respuesta.json();

actualizarEstadisticas();
mostrarPedidos();

}catch(error){

console.error(error);

ordersContainer.innerHTML=`
<div class="loading">
<div>⚠️</div>
<p>No se pudieron cargar los pedidos.</p>
</div>
`;

}

}


function actualizarEstadisticas(){

totalOrders.textContent=pedidos.length;

pendingOrders.textContent=
pedidos.filter(pedido=>pedido.estado==="Pendiente").length;

preparingOrders.textContent=
pedidos.filter(pedido=>pedido.estado==="En preparación").length;

const ventas=
pedidos
.filter(pedido=>pedido.estado!=="Cancelado")
.reduce(
(total,pedido)=>total+Number(pedido.total||0),
0
);

totalSales.textContent=formatoPrecio(ventas);

crearDashboard();

}


function crearDashboard(){

let dashboard=document.getElementById("salesDashboard");

if(!dashboard){

dashboard=document.createElement("section");

dashboard.id="salesDashboard";
dashboard.className="sales-dashboard";

const referencia=document.querySelector(".admin-stats");

if(referencia){

referencia.parentNode.insertBefore(
dashboard,
referencia
);

}else{

document.body.prepend(dashboard);

}

}

const ahora=new Date();

const inicioDia=
new Date(
ahora.getFullYear(),
ahora.getMonth(),
ahora.getDate()
);

const inicioMes=
new Date(
ahora.getFullYear(),
ahora.getMonth(),
1
);

const pedidosValidos=
pedidos.filter(
pedido=>pedido.estado!=="Cancelado"
);

const pedidosHoy=
pedidosValidos.filter(pedido=>{

const fecha=new Date(pedido.fecha);

return !isNaN(fecha)&&fecha>=inicioDia;

});

const pedidosMes=
pedidosValidos.filter(pedido=>{

const fecha=new Date(pedido.fecha);

return !isNaN(fecha)&&fecha>=inicioMes;

});

const ventasHoy=
pedidosHoy.reduce(
(total,pedido)=>total+Number(pedido.total||0),
0
);

const ventasMes=
pedidosMes.reduce(
(total,pedido)=>total+Number(pedido.total||0),
0
);

const entregados=
pedidos.filter(
pedido=>pedido.estado==="Entregado"
).length;

const promedio=
pedidosMes.length?
ventasMes/pedidosMes.length:
0;

const productosVendidos={};

pedidosValidos.forEach(pedido=>{

let lista=[];

try{

lista=
Array.isArray(pedido.productos)
?pedido.productos
:JSON.parse(pedido.productos||"[]");

}catch{

lista=[];

}

lista.forEach(producto=>{

const nombre=
producto.nombre||"Producto";

const cantidad=
Number(producto.cantidad)||1;

productosVendidos[nombre]=
(productosVendidos[nombre]||0)+cantidad;

});

});

let productoMasVendido="Sin ventas";
let cantidadMayor=0;

Object.entries(productosVendidos).forEach(
([nombre,cantidad])=>{

if(cantidad>cantidadMayor){

cantidadMayor=cantidad;
productoMasVendido=nombre;

}

});


dashboard.innerHTML=`

<div class="sales-dashboard-header">

<div>

<span class="dashboard-label">
📊 DASHBOARD
</span>

<h2>
Resumen de ventas
</h2>

<p>
Información actualizada con los pedidos registrados.
</p>

</div>

<div class="dashboard-date">
${ahora.toLocaleDateString(
"es-CO",
{
day:"numeric",
month:"long",
year:"numeric"
}
)}
</div>

</div>


<div class="dashboard-grid">


<div class="dashboard-card">

<div class="dashboard-icon">
💰
</div>

<div>

<span>
Ventas de hoy
</span>

<strong>
${formatoPrecio(ventasHoy)}
</strong>

<small>
${pedidosHoy.length}
pedido${pedidosHoy.length===1?"":"s"}
</small>

</div>

</div>


<div class="dashboard-card">

<div class="dashboard-icon">
📅
</div>

<div>

<span>
Ventas del mes
</span>

<strong>
${formatoPrecio(ventasMes)}
</strong>

<small>
${pedidosMes.length}
pedido${pedidosMes.length===1?"":"s"}
</small>

</div>

</div>


<div class="dashboard-card">

<div class="dashboard-icon">
📦
</div>

<div>

<span>
Pedidos entregados
</span>

<strong>
${entregados}
</strong>

<small>
Pedidos completados
</small>

</div>

</div>


<div class="dashboard-card">

<div class="dashboard-icon">
🧾
</div>

<div>

<span>
Total de pedidos
</span>

<strong>
${pedidos.length}
</strong>

<small>
Incluye todos los estados
</small>

</div>

</div>


<div class="dashboard-card">

<div class="dashboard-icon">
🥐
</div>

<div>

<span>
Más vendido
</span>

<strong class="dashboard-product">
${escaparHTML(productoMasVendido)}
</strong>

<small>
${cantidadMayor}
unidad${cantidadMayor===1?"":"es"}
vendida${cantidadMayor===1?"":"s"}
</small>

</div>

</div>


<div class="dashboard-card">

<div class="dashboard-icon">
💵
</div>

<div>

<span>
Promedio por pedido
</span>

<strong>
${formatoPrecio(promedio)}
</strong>

<small>
Calculado sobre ventas del mes
</small>

</div>

</div>


</div>
`;

}


function obtenerPedidosFiltrados(){

const filtro=statusFilter.value;

if(filtro==="Todos"){
return pedidos;
}

return pedidos.filter(
pedido=>pedido.estado===filtro
);

}


function obtenerProductosPedido(pedido){

try{

if(Array.isArray(pedido.productos)){
return pedido.productos;
}

return JSON.parse(
pedido.productos||"[]"
);

}catch{

return[];

}

}


/* ======================================
   COMPROBANTE
====================================== */

function imprimirComprobante(id){

const pedido=
pedidos.find(
item=>String(item.id)===String(id)
);

if(!pedido){

alert("No se encontró el pedido.");

return;

}

const productosPedido=
obtenerProductosPedido(pedido);

const fecha=
pedido.fecha
?new Date(pedido.fecha).toLocaleString("es-CO")
:"Fecha no disponible";

const productosHTML=
productosPedido.map(producto=>{

const cantidad=
Number(producto.cantidad)||1;

const precio=
Number(producto.precio)||0;

const subtotal=
cantidad*precio;

return`

<div class="receipt-product">

<div class="receipt-product-name">

<strong>
${escaparHTML(producto.nombre||"Producto")}
</strong>

<span>
${cantidad} x ${formatoPrecio(precio)}
</span>

</div>

<strong>
${formatoPrecio(subtotal)}
</strong>

</div>

`;

}).join("");

const ventana=
window.open(
"",
"_blank",
"width=480,height=800"
);

if(!ventana){

alert(
"El navegador bloqueó la ventana. Permite ventanas emergentes para imprimir el comprobante."
);

return;

}

ventana.document.write(`

<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width,initial-scale=1.0">

<title>
Comprobante Pedido #${pedido.id}
</title>

<style>

*{
box-sizing:border-box
}

body{
margin:0;
padding:30px;
background:#f4f4f4;
font-family:Arial,Helvetica,sans-serif;
color:#30231d
}

.receipt{
width:100%;
max-width:430px;
margin:auto;
background:white;
padding:28px;
border-radius:16px;
box-shadow:0 10px 35px rgba(0,0,0,.12)
}

.brand{
text-align:center;
border-bottom:1px dashed #cfc3ba;
padding-bottom:18px;
margin-bottom:18px
}

.brand-icon{
font-size:42px;
margin-bottom:5px
}

.brand h1{
margin:0;
font-size:26px;
color:#3a241b
}

.brand p{
margin:5px 0 0;
color:#76685f;
font-size:13px
}

.order-number{
text-align:center;
margin-bottom:20px
}

.order-number strong{
display:block;
font-size:22px;
margin-bottom:5px
}

.order-number span{
color:#76685f;
font-size:13px
}

.section{
border-top:1px solid #eadfd4;
padding-top:15px;
margin-top:15px
}

.section h2{
margin:0 0 10px;
font-size:14px;
text-transform:uppercase;
letter-spacing:.08em;
color:#97502e
}

.customer-line{
display:flex;
justify-content:space-between;
gap:15px;
padding:4px 0;
font-size:14px
}

.customer-line span{
color:#76685f
}

.customer-line strong{
text-align:right
}

.receipt-product{
display:flex;
justify-content:space-between;
gap:15px;
padding:10px 0;
border-bottom:1px solid #f0e8e2
}

.receipt-product-name{
display:flex;
flex-direction:column;
gap:4px
}

.receipt-product-name span{
color:#76685f;
font-size:12px
}

.total{
display:flex;
justify-content:space-between;
align-items:center;
margin-top:18px;
padding-top:18px;
border-top:2px solid #3a241b
}

.total span{
font-size:18px;
font-weight:bold
}

.total strong{
font-size:22px;
color:#97502e
}

.footer{
text-align:center;
border-top:1px dashed #cfc3ba;
margin-top:25px;
padding-top:18px;
color:#76685f;
font-size:12px
}

.footer strong{
display:block;
margin-top:5px;
color:#3a241b;
letter-spacing:.08em
}

.print-button{
display:block;
width:100%;
border:0;
background:#3a241b;
color:white;
padding:13px;
border-radius:10px;
font-weight:bold;
margin-top:20px;
cursor:pointer
}

@media print{

body{
background:white;
padding:0
}

.receipt{
box-shadow:none;
max-width:none;
border-radius:0
}

.print-button{
display:none
}

}

</style>

</head>

<body>

<div class="receipt">

<div class="brand">

<div class="brand-icon">
🥐
</div>

<h1>
Los Brothers
</h1>

<p>
Panadería
</p>

</div>


<div class="order-number">

<strong>
Pedido #${pedido.id}
</strong>

<span>
${fecha}
</span>

</div>


<div class="section">

<h2>
Cliente
</h2>

<div class="customer-line">
<span>Nombre</span>
<strong>
${escaparHTML(pedido.nombre||"No registrado")}
</strong>
</div>

<div class="customer-line">
<span>Teléfono</span>
<strong>
${escaparHTML(pedido.telefono||"No registrado")}
</strong>
</div>

<div class="customer-line">
<span>Entrega</span>
<strong>
${escaparHTML(pedido.entrega||"No especificada")}
</strong>
</div>

${pedido.direccion?`

<div class="customer-line">

<span>
Dirección
</span>

<strong>
${escaparHTML(pedido.direccion)}
</strong>

</div>

`:""}

<div class="customer-line">

<span>
Pago
</span>

<strong>
${escaparHTML(pedido.metodo_pago||"No especificado")}
</strong>

</div>

</div>


<div class="section">

<h2>
Productos
</h2>

${productosHTML||"<p>No hay productos registrados.</p>"}

<div class="total">

<span>
Total
</span>

<strong>
${formatoPrecio(pedido.total)}
</strong>

</div>

</div>


${pedido.notas?`

<div class="section">

<h2>
Notas
</h2>

<p>
${escaparHTML(pedido.notas)}
</p>

</div>

`:""}


<div class="footer">

Gracias por comprar en Los Brothers 🥐

<strong>
NEXORA
</strong>

</div>


<button
class="print-button"
onclick="window.print()"
>
🖨️ Imprimir comprobante
</button>

</div>

</body>

</html>

`);

ventana.document.close();

}


/* ======================================
   MOSTRAR PEDIDOS
====================================== */

function mostrarPedidos(){

const lista=
obtenerPedidosFiltrados();

if(lista.length===0){

ordersContainer.innerHTML=`

<div class="loading">

<div>
📭
</div>

<p>
No hay pedidos para mostrar.
</p>

</div>

`;

return;

}

ordersContainer.innerHTML=
lista.map(pedido=>{

const productosPedido=
obtenerProductosPedido(pedido);

const productosHTML=
productosPedido.map(producto=>`

<div class="order-product">

<span>
${producto.cantidad||1}x
${escaparHTML(producto.nombre||"Producto")}
</span>

<strong>
${formatoPrecio(
(producto.precio||0)*
(producto.cantidad||1)
)}
</strong>

</div>

`).join("");

const fecha=
pedido.fecha
?new Date(pedido.fecha).toLocaleString("es-CO")
:"Fecha no disponible";

return`

<article class="order-card">

<div class="order-card-header">

<div>

<span class="order-id">
Pedido #${pedido.id}
</span>

<span class="order-date">
${fecha}
</span>

</div>

<span class="status">
${escaparHTML(pedido.estado||"Pendiente")}
</span>

</div>


<div class="order-card-body">


<div class="customer-section">

<h3>
👤 Cliente
</h3>

<p>
<strong>
${escaparHTML(pedido.nombre)}
</strong>
</p>

<p>
📱 ${escaparHTML(pedido.telefono)}
</p>

<p>
🚚 ${escaparHTML(pedido.entrega)}
</p>

${pedido.direccion?`

<p>
📍 ${escaparHTML(pedido.direccion)}
</p>

`:""}

<p>
💳 ${escaparHTML(pedido.metodo_pago)}
</p>

${pedido.notas?`

<p>
📝 ${escaparHTML(pedido.notas)}
</p>

`:""}

</div>


<div class="products-section">

<h3>
📦 Productos
</h3>

${productosHTML||"<p>No hay productos registrados.</p>"}

<div class="order-total">

<span>
Total
</span>

<strong>
${formatoPrecio(pedido.total)}
</strong>

</div>

</div>

</div>


<div class="order-card-footer">

<div class="order-actions">

<label>
Estado del pedido
</label>

<select
class="order-status-select"
data-id="${pedido.id}"
>

<option
value="Pendiente"
${pedido.estado==="Pendiente"?"selected":""}
>
Pendiente
</option>

<option
value="En preparación"
${pedido.estado==="En preparación"?"selected":""}
>
En preparación
</option>

<option
value="En camino"
${pedido.estado==="En camino"?"selected":""}
>
En camino
</option>

<option
value="Entregado"
${pedido.estado==="Entregado"?"selected":""}
>
Entregado
</option>

<option
value="Cancelado"
${pedido.estado==="Cancelado"?"selected":""}
>
Cancelado
</option>

</select>


<button
class="print-order-button"
data-print="${pedido.id}"
type="button"
>
🧾 Imprimir comprobante
</button>

</div>

</div>

</article>

`;

}).join("");


document.querySelectorAll(".order-status-select")
.forEach(select=>{

select.addEventListener(
"change",
cambiarEstado
);

});


document.querySelectorAll(".print-order-button")
.forEach(button=>{

button.addEventListener(
"click",
()=>imprimirComprobante(
button.dataset.print
)
);

});

}


/* ======================================
   CAMBIAR ESTADO
====================================== */

async function cambiarEstado(event){

const select=event.target;

const id=select.dataset.id;
const estado=select.value;

try{

select.disabled=true;

const respuesta=
await fetch(
`/api/pedidos/${id}/estado`,
{
method:"PATCH",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({estado})
}
);

const datos=await respuesta.json();

if(!respuesta.ok){
throw new Error(
datos.error||"No se pudo actualizar."
);
}

const pedido=
pedidos.find(
item=>String(item.id)===String(id)
);

if(pedido){
pedido.estado=estado;
}

actualizarEstadisticas();
mostrarPedidos();

}catch(error){

console.error(error);

alert(
"No se pudo actualizar el estado."
);

cargarPedidos();

}

}


/* ======================================
   PRODUCTOS
====================================== */

async function cargarProductos(){

try{

productsAdminContainer.innerHTML=`

<div class="loading">

<div>
🥐
</div>

<p>
Cargando productos...
</p>

</div>

`;

const respuesta=
await fetch("/api/productos/admin");

if(!respuesta.ok){
throw new Error(
"No se pudieron obtener los productos."
);
}

productos=await respuesta.json();

llenarFiltroCategorias();
mostrarProductos();

}catch(error){

console.error(error);

productsAdminContainer.innerHTML=`

<div class="loading">

<div>
⚠️
</div>

<p>
No se pudieron cargar los productos.
</p>

</div>

`;

}

}


function llenarFiltroCategorias(){

const categorias=
[
...new Set(
productos
.map(producto=>producto.categoria)
.filter(Boolean)
)
].sort();

productCategoryFilter.innerHTML=`
<option value="Todos">
Todas las categorías
</option>
`;

categorias.forEach(categoria=>{

productCategoryFilter.innerHTML+=`

<option value="${escaparHTML(categoria)}">
${escaparHTML(categoria)}
</option>

`;

});

}


function obtenerProductosFiltrados(){

const busqueda=
productSearch.value
.trim()
.toLowerCase();

const categoria=
productCategoryFilter.value;

const estado=
productStatusFilter.value;

return productos.filter(producto=>{

const nombre=
String(producto.nombre||"")
.toLowerCase();

const descripcion=
String(producto.descripcion||"")
.toLowerCase();

const coincideBusqueda=
!busqueda||
nombre.includes(busqueda)||
descripcion.includes(busqueda);

const coincideCategoria=
categoria==="Todos"||
producto.categoria===categoria;

const activo=
Number(producto.activo)===1;

const coincideEstado=
estado==="Todos"||
(estado==="Activos"&&activo)||
(estado==="Inactivos"&&!activo);

return(
coincideBusqueda&&
coincideCategoria&&
coincideEstado
);

});

}


function mostrarProductos(){

const lista=
obtenerProductosFiltrados();

if(lista.length===0){

productsAdminContainer.innerHTML=`

<div class="loading">

<div>
📦
</div>

<p>
No hay productos para mostrar.
</p>

</div>

`;

return;

}

productsAdminContainer.innerHTML=
lista.map(producto=>{

const activo=
Number(producto.activo)===1;

return`

<article
class="admin-product-card ${activo?"":"inactive"}"
>

<img
class="admin-product-image"
src="${obtenerImagen(producto.imagen)}"
alt="${escaparHTML(producto.nombre)}"
onerror="this.src='assets/Logo.jpeg'"
>


<div class="admin-product-info">

<div class="admin-product-top">

<div>

<div class="admin-product-name">
${escaparHTML(producto.nombre)}
</div>

<div class="admin-product-category">
${escaparHTML(producto.categoria)}
</div>

</div>


<span
class="product-status ${activo?"active":"inactive"}"
>

${activo?"Activo":"Inactivo"}

</span>

</div>


<p class="admin-product-description">

${escaparHTML(
producto.descripcion||
"Sin descripción."
)}

</p>


<div class="admin-product-price">

${formatoPrecio(producto.precio)}

</div>


<div class="admin-product-actions">

<button
class="product-action-button edit"
data-edit="${producto.id}"
>
✏️ Editar
</button>


<button
class="product-action-button toggle"
data-toggle="${producto.id}"
>

${activo
?"🔴 Desactivar"
:"🟢 Activar"}

</button>

</div>

</div>

</article>

`;

}).join("");


document.querySelectorAll("[data-edit]")
.forEach(button=>{

button.addEventListener(
"click",
()=>abrirEditarProducto(
button.dataset.edit
)
);

});


document.querySelectorAll("[data-toggle]")
.forEach(button=>{

button.addEventListener(
"click",
()=>cambiarActivoProducto(
button.dataset.toggle
)
);

});

}


/* ======================================
   MODAL PRODUCTOS
====================================== */

function abrirAgregarProducto(){

productForm.reset();

document.getElementById(
"productId"
).value="";

productModalTitle.textContent=
"Agregar producto";

productMessage.textContent="";

productImagePreview.src=
"assets/Logo.jpeg";

previewName.textContent=
"Producto";

productModal.classList.add("active");

}


function abrirEditarProducto(id){

const producto=
productos.find(
item=>String(item.id)===String(id)
);

if(!producto)return;

document.getElementById(
"productId"
).value=producto.id;

document.getElementById(
"productName"
).value=producto.nombre||"";

document.getElementById(
"productPrice"
).value=producto.precio||"";

document.getElementById(
"productCategory"
).value=producto.categoria||"";

document.getElementById(
"productImage"
).value=producto.imagen||"";

document.getElementById(
"productDescription"
).value=producto.descripcion||"";

productModalTitle.textContent=
"Editar producto";

productMessage.textContent="";

actualizarPreview();

productModal.classList.add("active");

}


function cerrarProductoModal(){

productModal.classList.remove("active");

}


async function guardarProducto(event){

event.preventDefault();

const id=
document.getElementById(
"productId"
).value;

const datos={

nombre:
document.getElementById(
"productName"
).value.trim(),

precio:
document.getElementById(
"productPrice"
).value,

categoria:
document.getElementById(
"productCategory"
).value.trim(),

imagen:
document.getElementById(
"productImage"
).value.trim(),

descripcion:
document.getElementById(
"productDescription"
).value.trim()

};

if(
!datos.nombre||
!datos.categoria||
!datos.precio
){

productMessage.textContent=
"⚠️ Completa los campos obligatorios.";

productMessage.style.color=
"#b83a32";

return;

}

productMessage.textContent=
"Guardando producto...";

productMessage.style.color=
"#76685f";

try{

const url=
id
?`/api/productos/${id}`
:"/api/productos";

const method=
id
?"PUT"
:"POST";

const respuesta=
await fetch(
url,
{
method,
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(datos)
}
);

const resultado=
await respuesta.json();

if(!respuesta.ok){

throw new Error(
resultado.error||
"No se pudo guardar el producto."
);

}

productMessage.textContent=
"✅ Producto guardado correctamente.";

productMessage.style.color=
"#3d7a4d";

await cargarProductos();

setTimeout(
cerrarProductoModal,
600
);

}catch(error){

console.error(error);

productMessage.textContent=
"❌ "+error.message;

productMessage.style.color=
"#b83a32";

}

}


async function cambiarActivoProducto(id){

const producto=
productos.find(
item=>String(item.id)===String(id)
);

if(!producto)return;

const activo=
Number(producto.activo)===1;

const accion=
activo
?"desactivar"
:"activar";

const confirmar=
confirm(
`¿Seguro que quieres ${accion} "${producto.nombre}"?`
);

if(!confirmar)return;

try{

const respuesta=
await fetch(
`/api/productos/${id}/estado`,
{
method:"PATCH",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
activo:activo?0:1
})
}
);

const resultado=
await respuesta.json();

if(!respuesta.ok){

throw new Error(
resultado.error||
"No se pudo cambiar el estado."
);

}

await cargarProductos();

}catch(error){

console.error(error);

alert(
"No se pudo cambiar el estado del producto."
);

}

}


function actualizarPreview(){

const nombre=
document.getElementById(
"productName"
).value.trim();

const imagen=
document.getElementById(
"productImage"
).value.trim();

previewName.textContent=
nombre||"Producto";

productImagePreview.src=
obtenerImagen(imagen);

}


/* ======================================
   EVENTOS
====================================== */

addProductButton.addEventListener(
"click",
abrirAgregarProducto
);

closeProductModal.addEventListener(
"click",
cerrarProductoModal
);

cancelProductButton.addEventListener(
"click",
cerrarProductoModal
);


productModal.addEventListener(
"click",
event=>{

if(event.target===productModal){
cerrarProductoModal();
}

}
);


productForm.addEventListener(
"submit",
guardarProducto
);


productSearch.addEventListener(
"input",
mostrarProductos
);

productCategoryFilter.addEventListener(
"change",
mostrarProductos
);

productStatusFilter.addEventListener(
"change",
mostrarProductos
);


document.getElementById(
"productName"
).addEventListener(
"input",
actualizarPreview
);


document.getElementById(
"productImage"
).addEventListener(
"input",
actualizarPreview
);


statusFilter.addEventListener(
"change",
mostrarPedidos
);


refreshButton.addEventListener(
"click",
async()=>{


await Promise.all([
    cargarPedidos(),
    cargarProductos(),
    cargarEmpleados()
]);


}
);


logoutButton.addEventListener(
"click",
()=>{

sessionStorage.removeItem(
"losBrothersAdmin"
);

window.location.href=
"/login.html";

}
);


/* ======================================
   GESTIÓN DE EMPLEADOS
====================================== */

async function cargarEmpleados() {
    const tabla = document.getElementById("employeesTableBody");
    const mensaje = document.getElementById("employeesMessage");

    if (!tabla || !mensaje) return;

    mensaje.textContent = "Cargando empleados...";
    tabla.innerHTML = "";

    try {
        const respuesta = await fetch("/api/admin/empleados", {
            credentials: "same-origin"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || "No fue posible cargar los empleados.");
        }

        if (!Array.isArray(datos) || datos.length === 0) {
            mensaje.textContent = "Todavía no hay empleados registrados.";
            return;
        }

        mensaje.textContent = `Empleados registrados: ${datos.length}`;

        datos.forEach(empleado => {
            const fila = document.createElement("tr");

            [
                empleado.nombre,
                empleado.usuario,
                empleado.rol,
                Number(empleado.activo) === 1 ? "Activo" : "Inactivo"
            ].forEach(valor => {
                const celda = document.createElement("td");
                celda.textContent = valor ?? "";
                fila.appendChild(celda);
            });

            tabla.appendChild(fila);
        });
    } catch (error) {
        mensaje.textContent = error.message;
    }
}


/* ======================================
   INICIO
====================================== */

cambiarSeccion(
"dashboardSection"
);


Promise.all([
    cargarPedidos(),
    cargarProductos(),
    cargarEmpleados()
]);
}