const { Op } = require("sequelize");
const Expense = require("../models/expense.model");

function getISOWeekDateRange(yearInt, weekInt) {
    if (
        isNaN(yearInt) ||
        isNaN(weekInt) ||
        weekInt < 1 ||
        weekInt > 53 ||
        yearInt < 1970 ||
        yearInt > 3000
    ) {
        return null;
    }

    const jan4 = new Date(Date.UTC(yearInt, 0, 4));
    const jan4DayOfWeek = jan4.getUTCDay();
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (jan4DayOfWeek - 1));

    const mondayOfTargetWeek = new Date(mondayOfWeek1);
    mondayOfTargetWeek.setUTCDate(
        mondayOfWeek1.getUTCDate() + (weekInt - 1) * 7
    );

    const sundayOfTargetWeek = new Date(mondayOfTargetWeek);
    sundayOfTargetWeek.setUTCDate(mondayOfTargetWeek.getUTCDate() + 6);

    const toYMD = (d) => {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    return {
        startDate: toYMD(mondayOfTargetWeek),
        endDate: toYMD(sundayOfTargetWeek),
    };
}

exports.createExpense = async (req, res, next) => {
    try {
        const { quantity, category, created_at, userId } = req.body;

        if (!quantity || !category || !created_at || !userId) {
            return res.status(400).json({
                message: "400. Bad Request. Something is missing or faulty",
            });
        }

        const newExpense = await Expense.create({
            quantity,
            category,
            created_at,
            userId,
        });

        return res.status(201).json(newExpense);
    } catch (err) {
        next(err);
    }
};

exports.getAllExpenses = async (req, res, next) => {
    try {
        const { category, year, month, week } = req.query;
        console.log("year: ", year);
        console.log("month: ", month);
        console.log("week: ", week);
        let whereClause = {};

        if (category !== undefined) {
            const categoryInt = parseInt(category, 10);

            if (isNaN(categoryInt)) {
                return res.status(400).json({
                    message:
                        "400. Bad request. Something is missing or faulty. 'cateogory' must be an integer",
                });
            }
            whereClause.category = categoryInt;
        }

        const hasYear = year !== undefined;
        const hasMonth = month !== undefined;
        const hasWeek = week !== undefined;

        if (hasYear && !hasMonth && !hasWeek) {
            const yearInt = parseInt(year, 10);
            if (isNaN(yearInt) || yearInt < 1970 || yearInt > 3000) {
                return res.status(400).json({
                    message:
                        "400. BadRequest.Something is missing or faulty. 'year' must be a valid 4-digit number.",
                });
            }
            whereClause.created_at = {
                [Op.gte]: `${yearInt}-01-01`,
                [Op.lte]: `${yearInt}-12-31`,
            };
        } else if (hasMonth) {
            const yearInt = parseInt(year, 10);
            const monthInt = parseInt(month, 10);

            if (
                isNaN(yearInt) ||
                isNaN(monthInt) ||
                monthInt < 1 ||
                monthInt > 12 ||
                yearInt < 1970 ||
                yearInt > 3000
            ) {
                return res.status(400).json({
                    message:
                        "400. BadRequest.Something is missing or faulty. 'month' must be 1–12 and 'year' a valid 4-digit number.",
                });
            }
            const lastDay = new Date(
                Date.UTC(yearInt, monthInt, 0)
            ).getUTCDate();
            const mm = String(monthInt).padStart(2, "0");
            whereClause.created_at = {
                [Op.gte]: `${yearInt}-${mm}-01`,
                [Op.lte]: `${yearInt}-${mm}-${String(lastDay).padStart(
                    2,
                    "0"
                )}`,
            };
        } else if (hasWeek) {
            if (!hasYear) {
                return res.status(400).json({
                    message:
                        "400. BadRequest.Something is missing or faulty. 'week' filter requires 'year' parameter.",
                });
            }
            const yearInt = parseInt(year, 10);
            const weekInt = parseInt(week, 10);

            const weekRange = getISOWeekDateRange(yearInt, weekInt);
            console.log("Start: ", weekRange.startDate);
            console.log("End: ", weekRange.endDate);
            if (!weekRange) {
                return res.status(400).json({
                    message:
                        "400. BadRequest.Something is missing or faulty. 'week' must be an integer 1–53 and 'year' a valid 4-digit number.",
                });
            }
            whereClause.created_at = {
                [Op.gte]: weekRange.startDate,
                [Op.lte]: weekRange.endDate,
            };
        }

        const expenses = await Expense.findAll({
            where: whereClause,
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json(expenses);
    } catch (err) {
        next(err);
    }
};

exports.updateExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity, category, created_at } = req.body;

        const expense = await Expense.findByPk(id);
        if (!expense) {
            return res
                .status(404)
                .json({ message: "404. Not found. Expense not found" });
        }

        if (quantity !== undefined && quantity > 0) {
            expense.quantity = quantity;
        }
        if (category !== undefined && 10 >= category >= 1) {
            expense.category = category;
        }
        if (created_at !== undefined) {
            expense.created_at = created_at;
        }

        await expense.save();
        return res.status(200).json(expense);
    } catch (err) {
        next(err);
    }
};

exports.deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedCount = await Expense.destroy({ where: { id } });

        if (!deletedCount) {
            return res
                .status(404)
                .json({ message: "404. Not found. Expense not found" });
        }
        return res.status(200).json({ message: "200. Deletion sucessful" });
    } catch (err) {
        next(err);
    }
};
