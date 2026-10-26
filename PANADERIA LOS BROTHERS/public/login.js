
"use strict";

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

function mostrarMensaje(mensaje, color = "#76685f") {
    if (!loginMessage) return;
    loginMessage.textContent = mensaje;
    loginMessage.style.color = color;
}

if (!loginForm) {
    console.error("No se encontró el formulario de inicio de sesión.");
} else {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const campoUsuario = document.getElementById("username");
        const campoPassword = document.getElementById("password");

        if (!campoUsuario || !campoPassword) {
            mostrarMensaje("No se encontraron los campos de acceso.", "#b83a32");
            return;
        }

        const usuario = campoUsuario.value.trim();
        const password = campoPassword.value;

        if (!usuario || !password) {
            mostrarMensaje("Escribe tu usuario y contraseña.", "#b83a32");
            return;
        }

        const botonEnviar = loginForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (botonEnviar) botonEnviar.disabled = true;

        mostrarMensaje("Verificando acceso...", "#76685f");

        try {
            const respuesta = await fetch("/api/login", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ usuario, password })
            });

            const datos = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok || !datos.ok) {
                mostrarMensaje(
                    datos.error || "Usuario o contraseña incorrectos.",
                    "#b83a32"
                );
                return;
            }

            // El servidor administra la sesión mediante una cookie HttpOnly.
            // No guardar contraseñas ni tokens de sesión en sessionStorage.
            sessionStorage.removeItem("losBrothersAdmin");
            sessionStorage.setItem(
                "losBrothersUsuario",
                JSON.stringify(datos.usuario || {})
            );

            mostrarMensaje("¡Acceso correcto! Entrando al panel...", "#3d7a4d");

            window.location.assign("/admin.html");
        } catch (error) {
            console.error("Error al iniciar sesión:", error);

            mostrarMensaje(
                "No se pudo conectar con el servidor. Intenta nuevamente.",
                "#b83a32"
            );
        } finally {
            if (botonEnviar) botonEnviar.disabled = false;
        }
    });
}
