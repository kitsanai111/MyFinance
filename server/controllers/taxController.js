const prisma = require('../config/prisma');
const { calculateTaxStep } = require('../Functions/taxCalculator');

exports.confirmTax = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const taxYear = 2026;

        // 🔥 เรียก logic เดิม (ห้ามเขียนใหม่)
        const allFundTypes = await prisma.fundType.findMany();

        const incomeAggr = await prisma.entry.aggregate({
            where: { userId, type: "income" },
            _sum: { amount: true }
        });

        const totalIncome = Number(incomeAggr._sum.amount) || 0;

        const profile = await prisma.deductionProfile.findUnique({
            where: { userId_taxYear: { userId, taxYear } },
            include: { investments: { include: { fundType: true } } }
        });

        // ✅ copy logic จาก deductionController (ต้องเหมือนกัน 100%)
        const retirementCodes = ['RMF','SSF', 'PVD', 'GPF', 'NSF', 'PENSION_INS'];

        const resultInvestments = allFundTypes.map(type => {
            const userInv = profile?.investments?.find(inv => inv.fundTypeId === type.id);
            const raw = userInv ? Number(userInv.amount) : 0;

            const actual = type.isCount ? raw * type.taxLimit : raw;

            let maxLimit = type.taxLimit;
            if (type.incomeLimitRate > 0) {
                const byIncome = totalIncome * (type.incomeLimitRate / 100);
                maxLimit = type.taxLimit > 0 ? Math.min(byIncome, type.taxLimit) : byIncome;
            }

            const used = Math.min(actual, maxLimit);

            return {
                ...type,
                usedAmount: used
            };
        });

        let remainingCap = 500000;

        const finalInvestments = resultInvestments.map(inv => {
            if (retirementCodes.includes(inv.code.toUpperCase())) {
                const allow = Math.min(inv.usedAmount, remainingCap);
                remainingCap -= allow;
                return allow;
            }
            return inv.usedAmount;
        });

        const totalDeduction = finalInvestments.reduce((a, b) => a + b, 0);

        const expense = Math.min(totalIncome * 0.5, 100000);
        const netIncome = Math.max(0, totalIncome - expense - totalDeduction);
        const tax = calculateTaxStep(netIncome);

        // ✅ save
        const savedTax = await prisma.tax.upsert({
            where: {
                userId_year: {
                    userId,
                    year: taxYear
                }
            },
            update: {
                netIncome,
                tax
            },
            create: {
                userId,
                year: taxYear,
                netIncome,
                tax
            }
        });

        res.json({ message: "ยืนยันภาษีเรียบร้อย", data: savedTax });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};