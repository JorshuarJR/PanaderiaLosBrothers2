
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
        console.error("❌ ERROR REAL DE MYSQL:");
        console.error("Mensaje:", error?.message || "(sin mensaje)");
        console.error("Código:", error?.code || "(sin código)");
        console.error("Errno:", error?.errno || "(sin errno)");
        console.error("SQL State:", error?.sqlState || "(sin SQL State)");
        console.error("Detalles:", error);

        res.status(500).json({
            ok: false,
            database: false,
            error: "No se pudo conectar con la base de datos."
        });
    }
});
