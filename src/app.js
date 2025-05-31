const express = require("express");
const expenseRoutes = require("./routes/expense.routes");

const app = express();

app.use(express.json());
app.use("/api/expenses", expenseRoutes);

app.get("/", (req, res) => {
    res.json({ message: "The API is running" });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "500. Internal server error" });
});

module.exports = app;
