const prisma = require("../config/prisma");

async function RecalculateTotal(userId) {
    const entries = await prisma.entry.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { date: "asc" }
    });

    let runningTotal = 0;

    for (const entry of entries) {
        if (entry.type === "income") {
            runningTotal += entry.amount;
        } else if (entry.type === "expense") {
            runningTotal -= entry.amount;
        }

        await prisma.entry.update({
            where: { id: entry.id },
            data: { total: Number(runningTotal.toFixed(2)) }
        });
    }
}

async function Recalculate_income_expese_Total(userId) {
    const entries = await prisma.entry.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { date: "asc" }
    });

    let incomeTotal = 0;
    let expenseTotal = 0;

    for (const entry of entries) {
        if (entry.type === "income") {
            incomeTotal += entry.amount;
        } else if (entry.type === "expense") {
            expenseTotal += entry.amount;
        }

        await prisma.entry.update({
            where: { id: entry.id },
            data: {
                income_total: Number(incomeTotal.toFixed(2)),
                expense_total: Number(expenseTotal.toFixed(2)),
            }
        });
    }

    return {
        incomeTotal,
        expenseTotal,
        netTotal: incomeTotal - expenseTotal
    };
}

module.exports = {
    RecalculateTotal,
    Recalculate_income_expese_Total
};