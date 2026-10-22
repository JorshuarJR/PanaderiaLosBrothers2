const registerForm =
    document.getElementById("registerForm");

const registerButton =
    document.getElementById("registerButton");

const registerMessage =
    document.getElementById("registerMessage");

const successMessage =
    document.getElementById("successMessage");


registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        console.log("🥐 FORMULARIO DE REGISTRO ENVIADO");


        const nombre =
            document
                .getElementById("nombre")
                .value
                .trim();

        const apellido =
            document
                .getElementById("apellido")
                .value
                .trim();

        const correo =
            document
                .getElementById("correo")
                .value
                .trim()
                .toLowerCase();

        const telefono =
            document
                .getElementById("telefono")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;

        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        registerMessage.textContent = "";

        registerMessage.className =
            "login-message";


        // ==================================
        // VALIDACIONES
        // ==================================

        if (
            !nombre ||
            !apellido ||
            !correo ||
            !password
        ) {

            registerMessage.textContent =
                "Completa todos los campos obligatorios.";

            registerMessage.classList.add(
                "error"
            );

            return;

        }


        if (password.length < 6) {

            registerMessage.textContent =
                "La contraseña debe tener mínimo 6 caracteres.";

            registerMessage.classList.add(
                "error"
            );

            return;

        }


        if (password !== confirmPassword) {

            registerMessage.textContent =
                "Las contraseñas no coinciden.";

            registerMessage.classList.add(
                "error"
            );

            return;

        }


        // ==================================
        // BOTÓN
        // ==================================

        registerButton.disabled = true;

        registerButton.textContent =
            "Creando cuenta...";


        try {


            console.log(
                "📤 Enviando datos al servidor..."
            );


            const response =
                await fetch(
                    "/api/usuarios/registro",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            nombre,
                            apellido,
                            correo,
                            telefono,
                            password

                        })

                    }
                );


            console.log(
                "📥 Respuesta del servidor:",
                response.status
            );


            const data =
                await response.json();


            console.log(
                "📦 Datos recibidos:",
                data
            );


            // ==================================
            // ERROR
            // ==================================

            if (!response.ok) {

                registerMessage.textContent =
                    data.message ||
                    "No se pudo crear la cuenta.";

                registerMessage.classList.add(
                    "error"
                );

                registerButton.disabled = false;

                registerButton.textContent =
                    "Crear mi cuenta";

                return;

            }


            // ==================================
            // ÉXITO
            // ==================================

            successMessage.classList.add(
                "show"
            );


            registerMessage.textContent =
                "Cuenta creada correctamente 🥐";

            registerMessage.classList.add(
                "success"
            );


            registerForm.reset();

            registerButton.disabled = true;


            console.log(
                "✅ CUENTA CREADA:",
                data
            );


            setTimeout(() => {

                window.location.href =
                    "/client-login.html";

            }, 1800);


        } catch (error) {

            console.error(
                "❌ ERROR:",
                error
            );


            registerMessage.textContent =
                "No se pudo conectar con el servidor.";

            registerMessage.classList.add(
                "error"
            );


            registerButton.disabled = false;

            registerButton.textContent =
                "Crear mi cuenta";

        }

    }
);