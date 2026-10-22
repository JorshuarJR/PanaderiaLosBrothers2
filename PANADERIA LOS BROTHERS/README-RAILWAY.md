# Panadería Los Brothers — despliegue en Railway

## Incluye
- Sitio web en `public/`.
- API Node.js/Express en `server.js`.
- Compatibilidad con variables `DB_*` y con variables estándar `MYSQL*` de Railway.
- Esquema SQL con `usuarios`, `productos` y `pedidos` vinculados.
- `.env.example` sin contraseñas reales.

## Paso 1 — GitHub
1. Descomprime este ZIP.
2. No subas ningún archivo `.env` real. El `.gitignore` excluye `.env` y `node_modules`.
3. Crea un repositorio privado en GitHub y sube el contenido de la carpeta `PANADERIA LOS BROTHERS` (incluidos `package.json`, `package-lock.json`, `server.js`, `public/` y `schema.sql`).

## Paso 2 — Railway
1. Entra en https://railway.com/ e inicia sesión.
2. Crea un proyecto nuevo con Deploy from GitHub Repo y elige el repositorio.
3. Añade un servicio de base de datos MySQL desde el catálogo de Railway.
4. En el servicio de la aplicación, en Variables, agrega `ADMIN_USER` y `ADMIN_PASSWORD` con credenciales nuevas y fuertes.
5. Si Railway no inyecta automáticamente variables `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` en el servicio de la app, crea `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` usando los valores de conexión del servicio MySQL. No escribas valores de ejemplo; copia los reales desde Railway.
6. No pongas `PORT`: Railway la asigna automáticamente. El servidor usa `process.env.PORT`.
7. El comando de inicio está definido como `npm start`.

## Paso 3 — Base de datos
1. Abre el servicio MySQL y copia los datos de conexión privados.
2. Conéctate usando un cliente MySQL compatible o la herramienta disponible en tu cuenta.
3. Selecciona la base de datos creada para este proyecto.
4. Ejecuta `schema.sql` UNA sola vez en una base nueva. Si ya tienes tablas o pedidos, no lo importes a ciegas: primero haz una copia y revisa la estructura.

## Paso 4 — Publicar enlace
1. En Railway abre el servicio de la aplicación.
2. En Settings / Networking (o Public Networking), genera un dominio público.
3. Espera a que el despliegue quede exitoso y abre el dominio.
4. Comprueba `https://TU-DOMINIO/api/health`. Debe responder con `ok: true` y `database: true`.

## Paso 5 — Prueba
1. Registra una cuenta de cliente.
2. Inicia sesión, agrega productos y envía un pedido de prueba.
3. Entra al panel de administrador con `ADMIN_USER` y `ADMIN_PASSWORD`.
4. Comprueba que el pedido aparece y cambia su estado.
5. Si falla, abre Deployments > View Logs y revisa el error. No compartas públicamente contraseñas ni variables secretas.

## Importante
- Esta entrega corrige el desajuste del esquema SQL (el servidor usa `usuarios` y `pedidos.usuario_id`) y permite las variables de conexión estándar de Railway. Aun así, prueba el despliegue y los pedidos en tu instancia antes de darlo por terminado.
- Cambia cualquier contraseña real que estuviera dentro del `.env` anterior. Ese archivo no está incluido en este ZIP.
- Los pedidos de prueba son datos reales en la base; elimina solo los de prueba si estás seguro de cuáles son.
