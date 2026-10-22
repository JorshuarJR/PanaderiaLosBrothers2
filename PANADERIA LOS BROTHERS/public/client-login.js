const clientLoginForm =
    document.getElementById("clientLoginForm");

const clientLoginButton =
    document.getElementById("clientLoginButton");

const clientLoginMessage =
    document.getElementById("clientLoginMessage");

const showPassword =
    document.getElementById("showPassword");

const clientPassword =
    document.getElementById("clientPassword");


// ======================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ======================================

if (showPassword && clientPassword) {

    showPassword.addEventListener("click", () => {

        if (clientPassword.type === "password") {

            clientPassword.type = "text";

            showPassword.textContent = "🙈";

        } else {

            clientPassword.type = "password";

            showPassword.textContent = "👁️";

        }

    });

}


// ======================================
// INICIO DE SESIÓN DEL CLIENTE
// ======================================

clientLoginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const correo =
            document
                .getElementById("clientCorreo")
                .value
                .trim()
                .toLowerCase();


        const password =
            clientPassword.value;


        clientLoginMessage.textContent = "";

        clientLoginMessage.className =
            "client-login-message";


        // ==================================
        // VALIDAR CAMPOS
        // ==================================

        if (!correo || !password) {

            clientLoginMessage.textContent =
                "Ingresa tu correo y contraseña.";

            clientLoginMessage.classList.add("error");

            return;

        }


        // ==================================
        // BOTÓN CARGANDO
        // ==================================

        clientLoginButton.disabled = true;

        clientLoginButton.textContent =
            "Iniciando sesión...";


        try {


            // ==================================
            // ENVIAR AL SERVIDOR
            // ==================================

            const response =
                await fetch(
                    "/api/usuarios/login",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            correo: correo,

                            password: password

                        })

                    }
                );


            const data =
                await response.json();


            // ==================================
            // ERROR
            // ==================================

            if (!response.ok) {

                clientLoginMessage.textContent =
                    data.message ||
                    "Correo o contraseña incorrectos.";

                clientLoginMessage.classList.add(
                    "error"
                );


                clientLoginButton.disabled = false;

                clientLoginButton.textContent =
                    "Iniciar sesión";

                return;

            }


            // ==================================
            // GUARDAR USUARIO
            // ==================================

            sessionStorage.setItem(
                "losBrothersUser",
                JSON.stringify(data.usuario)
            );


            // ==================================
            // MENSAJE DE ÉXITO
            // ==================================

            clientLoginMessage.textContent =
                `¡Bienvenido, ${data.usuario.nombre}! 🥐`;

            clientLoginMessage.classList.add(
                "success"
            );


            // ==================================
            // IR A LA TIENDA
            // ==================================

            setTimeout(() => {

                window.location.href = "/";

            }, 900);


        } catch (error) {

            console.error(
                "Error de inicio de sesión:",
                error
            );


            clientLoginMessage.textContent =
                "No se pudo conectar con el servidor.";

            clientLoginMessage.classList.add(
                "error"
            );


            clientLoginButton.disabled = false;

            clientLoginButton.textContent =
                "Iniciar sesión";

        }

    }
);