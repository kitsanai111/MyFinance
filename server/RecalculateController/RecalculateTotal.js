const prisma = require("../config/prisma");

// 🚩 ฟังก์ชันภายในสำหรับคำนวณภาษี (ช่วยให้เรียกใช้ซ้ำได้ใน Loop)
const calculateTaxInternal = (netIncome) => {
    if (netIncome <= 150000) return 0;
    if (netIncome <= 300000) return (netIncome - 150000) * 0.05;
    if (netIncome <= 500000) return 7500 + (netIncome - 300000) * 0.10;
    if (netIncome <= 750000) return 27500 + (netIncome - 500000) * 0.15;
    if (netIncome <= 1000000) return 65000 + (netIncome - 750000) * 0.20;
    if (netIncome <= 2000000) return 115000 + (netIncome - 1000000) * 0.25;
    if (netIncome <= 5000000) return 365000 + (netIncome - 2000000) * 0.30;
    return 1265000 + (netIncome - 5000000) * 0.35;
};

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

        // 🟢 ส่วนที่เพิ่มใหม่: คำนวณภาษีเบื้องต้น (หักค่าใช้จ่ายเหมา 50% ไม่เกิน 1 แสน)
        // หมายเหตุ: ตรงนี้เป็นการคำนวณแบบ "หยาบ" เพื่อโชว์ใน Dashboard
        const taxableIncome = Math.max(0, incomeTotal - Math.min(incomeTotal * 0.5, 100000) - 60000);
        const estimatedTax = calculateTaxInternal(taxableIncome);

        await prisma.entry.update({
            where: { id: entry.id },
            data: {
                income_total: Number(incomeTotal.toFixed(2)),
                expense_total: Number(expenseTotal.toFixed(2)),
                tax: Number(estimatedTax.toFixed(2)) // ✅ บันทึกยอดภาษีสะสมลงไปด้วย
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