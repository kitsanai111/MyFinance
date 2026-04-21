const prisma = require('../config/prisma');

// ✅ 1. คำนวณภาษี (คงเดิม)
const calculateTaxStep = (netIncome) => {
    if (netIncome <= 150000) return 0;
    if (netIncome <= 300000) return (netIncome - 150000) * 0.05;
    if (netIncome <= 500000) return 7500 + (netIncome - 300000) * 0.10;
    if (netIncome <= 750000) return 27500 + (netIncome - 500000) * 0.15;
    if (netIncome <= 1000000) return 65000 + (netIncome - 750000) * 0.20;
    if (netIncome <= 2000000) return 115000 + (netIncome - 1000000) * 0.25;
    if (netIncome <= 5000000) return 365000 + (netIncome - 2000000) * 0.30;
    return 1265000 + (netIncome - 5000000) * 0.35;
};

// ✅ แก้ไขฟังก์ชัน getDeductionSummary ใน Backend
// ✅ ฟังก์ชัน getDeductionSummary (เวอร์ชันรองรับเพดาน 500,000)
exports.getDeductionSummary = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const taxYear = 2026;

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

        // 1. คำนวณยอดเงินของแต่ละรายการ
        const resultInvestments = allFundTypes.map(type => {
            const userInv = profile?.investments?.find(inv => inv.fundTypeId === type.id);
            const rawValueFromDB = userInv ? Number(userInv.amount) : 0;
            const actualMoney = type.isCount ? (rawValueFromDB * type.taxLimit) : rawValueFromDB;

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

        // 2. แยกคำนวณยอดกลุ่มเกษียณเพื่อคุมเพดาน 500,000
        const retirementCodes = ['RMF','SSF', 'PVD', 'GPF', 'NSF', 'PENSION_INS'];

        let remainingCap = 500000;

        // 🔥 sort ก่อน
        const sortedInvestments = [...resultInvestments];

        const finalInvestments = sortedInvestments.map(inv => {
            if (retirementCodes.includes(inv.fundType.code.toUpperCase())) {
                const allowed = Math.min(inv.usedAmount, remainingCap);
                remainingCap -= allowed;

                return { ...inv, finalAmount: allowed };
            }

            return { ...inv, finalAmount: inv.usedAmount };
        });

        let generalDeduction = 0; // ส่วนตัวพื้นฐาน
        let retirementSum = 0;

        finalInvestments.forEach(inv => {
            if (retirementCodes.includes(inv.fundType.code.toUpperCase())) {
                retirementSum += inv.finalAmount;
            }
        });

        // รวมทั้งหมด (หลัง cap แล้ว)
        const totalDeduction = finalInvestments.reduce(
            (sum, i) => sum + i.finalAmount,
            0
        );

        // เอาไว้โชว์เฉยๆ
        const cappedRetirement = Math.min(retirementSum, 500000);

        // 3. คำนวณภาษี
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

        const profile = await prisma.deductionProfile.upsert({
            where: { userId_taxYear: { userId, taxYear: 2026 } },
            update: {},
            create: { userId, taxYear: 2026 }
        });

        // ล้างไพ่แล้วลงใหม่ (ห้ามหาย ห้ามซ้ำ)
        await prisma.userInvestment.deleteMany({ where: { profileId: profile.id } });

        if (investments && Array.isArray(investments)) {
            // ✅ ไฟล์ controllers/deductionController.js (ฟังก์ชัน updateDeduction)
            const data = investments
                .filter(i => Number(i.amount) > 0)
                .map(i => ({
                    profileId: profile.id,
                    fundTypeId: parseInt(i.fundTypeId),
                    amount: parseFloat(i.amount) // เซฟค่าตรงๆ (ถ้าคนส่ง 2 ก็เซฟ 2)
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