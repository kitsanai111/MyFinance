const prisma = require('../config/prisma');
const { calculateTaxStep } = require('../Functions/taxCalculator');


exports.getDeductionSummary = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const taxYear = new Date().getFullYear();

        const allFundTypes = await prisma.fundType.findMany();
        const incomeAggr = await prisma.entry.aggregate({
            where: {
                userId,
                type: "income",
                date: {
                    gte: new Date(`${taxYear}-01-01`),
                    lte: new Date(`${taxYear}-12-31`)
                }
            },
            _sum: { amount: true }
        });
        const totalIncome = Number(incomeAggr._sum.amount) || 0;

        const profile = await prisma.deductionProfile.findUnique({
            where: { userId_taxYear: { userId, taxYear } },
            include: { investments: { include: { fundType: true } } }
        });

        // คำนวณยอดเงินของแต่ละรายการ
        const resultInvestments = allFundTypes.map(type => {
            const userInv = profile?.investments?.find(inv => inv.fundTypeId === type.id);
            const rawValueFromDB = userInv ? Number(userInv.amount) : 0;

            if (!userInv) {
                return { actualMoney: 0, usedAmount: 0, rawAmount: 0, finalAmount: 0, fundType: type, fundTypeId: type.id };
            }
            const actualMoney = type.isFixed && !type.isCount
                ? Number(type.taxLimit)
                : type.isCount
                    ? rawValueFromDB * Number(type.taxLimit)
                    : rawValueFromDB;

            let maxLimit = type.taxLimit;
            if (type.incomeLimitRate > 0) {
                const limitByIncome = totalIncome * (type.incomeLimitRate / 100);
                maxLimit = type.taxLimit > 0 ? Math.min(limitByIncome, type.taxLimit) : limitByIncome;
            }
            const usedAmount = Math.min(actualMoney, maxLimit);
            return {
                fundTypeId: type.id,
                amount: actualMoney,
                usedAmount: usedAmount,
                rawAmount: rawValueFromDB,
                maxLimit: maxLimit,
                gap: Math.max(0, maxLimit - usedAmount),
                fundType: type
            };
        });

        const retirementCodes = ['RMF', 'SSF', 'PVD', 'GPF', 'NSF', 'PENSION_INS'];

        let remainingCap = 500000;

        const sortedInvestments = [...resultInvestments];

        const finalInvestments = sortedInvestments.map(inv => {
            if (inv.fundType?.code && retirementCodes.includes(inv.fundType.code.toUpperCase())) {
                const allowed = Math.min(inv.usedAmount, remainingCap);
                remainingCap -= allowed;
                return { ...inv, finalAmount: allowed };
            }
            return { ...inv, finalAmount: inv.usedAmount };
        });

        let generalDeduction = 0;
        let retirementSum = 0;

        finalInvestments.forEach(inv => {
            if (retirementCodes.includes(inv.fundType.code.toUpperCase())) {
                retirementSum += inv.finalAmount;
            }
        });

        const totalDeduction = finalInvestments.reduce(
            (sum, i) => sum + i.finalAmount,
            0
        );
        const cappedRetirement = Math.min(retirementSum, 500000);

        //คำนวณภาษี
        const expense = Math.min(totalIncome * 0.5, 100000);
        const netIncome = Math.max(0, totalIncome - expense - totalDeduction);
        const tax = calculateTaxStep(netIncome);

        res.json({
            totalIncome,
            totalDeduction,
            netIncome,
            tax,
            profile,
            investments: finalInvestments,
            retirementDetails: {
                actual: retirementSum,
                capped: cappedRetirement,
                isOverLimit: retirementSum > 500000
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateDeduction = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const { investments } = req.body;
        const taxYear = new Date().getFullYear();

        const profile = await prisma.deductionProfile.upsert({
            where: { userId_taxYear: { userId, taxYear } },
            update: {},
            create: { userId, taxYear }
        });

        await prisma.userInvestment.deleteMany({ where: { profileId: profile.id } });

        if (investments && Array.isArray(investments)) {
            const data = investments
                .filter(i => Number(i.amount) > 0)
                .map(i => ({
                    profileId: profile.id,
                    fundTypeId: parseInt(i.fundTypeId),
                    amount: parseFloat(i.amount)
                }));

            if (data.length > 0) {
                await prisma.userInvestment.createMany({ data });
            }
        }
        res.json({ message: "บันทึกเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};