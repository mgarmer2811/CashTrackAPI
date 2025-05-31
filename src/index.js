require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 5050;

async function start() {
    try {
        await sequelize.authenticate();
        console.log("Connected to supabase");

        await sequelize.sync({ alter: true });
        console.log("Models synchronized succesfully");

        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start the server\n", err);
        process.exit(1);
    }
}

start();
