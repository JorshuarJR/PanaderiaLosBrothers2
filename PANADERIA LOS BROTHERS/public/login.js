const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (!loginForm) {
    console.error("No se encontró el formulario de login.");
} else {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const usuario = document
            .getElementById("username")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;

        loginMessage.textContent = "Verificando acceso...";
        loginMessage.style.color = "#76685f";

        try {

            const respuesta = await fetch("/api/login", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    usuario: usuario,
                    password: password
                })
            });

            const datos = await respuesta.json();

            console.log("Respuesta del servidor:", datos);

            if (respuesta.ok && datos.ok) {

                loginMessage.textContent =
                    "✅ Acceso correcto. Entrando...";

                loginMessage.style.color = "#3d7a4d";

                sessionStorage.setItem(
                    "losBrothersAdmin",
                    "true"
                );

                setTimeout(function () {

                    window.location.href = "/admin.html";

                }, 500);

            } else {

                loginMessage.textContent =
                    datos.error ||
                    "❌ Usuario o contraseña incorrectos.";

                loginMessage.style.color = "#b83a32";
            }

        } catch (error) {

            console.error("Error en el login:", error);

            loginMessage.textContent =
                "❌ No se pudo conectar con el servidor.";

            loginMessage.style.color = "#b83a32";
        }

    });

}