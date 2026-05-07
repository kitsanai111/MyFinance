const prisma = require('../config/prisma');
const { createActivityLog } = require('../middlewares/logger');

// 1. สร้างงบประมาณใหม่ (Create) - (ส่วนนี้ของคุณโอเคแล้ว ผมปรับให้กระชับขึ้น)
exports.createBudget = async (req, res) => {
    try {
        console.log("📥 [Budget] Request Body:", req.body);
        const { amount, limit, categoryId, category, name, month, year } = req.body;
        const userId = req.user.id;

        const finalName = name || "งบประมาณใหม่";
        const finalAmount = amount || limit;
        const finalCategoryId = categoryId || category;

        if (!finalAmount || !finalCategoryId) {
            return res.status(400).json({ message: "กรุณาระบุจำนวนเงินและหมวดหมู่" });
        }

        const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
        const targetYear = year ? Number(year) : new Date().getFullYear();

        const newBudget = await prisma.budget.create({
            data: {
                name: finalName.toString().trim(),
                amount: parseFloat(finalAmount),
                targetMonth,
                targetYear,
                user: { connect: { id: userId } },
                category: { connect: { id: parseInt(finalCategoryId) } }
            }
        });

        await createActivityLog(userId, "CREATE_BUDGET", `ตั้งงบใหม่: ${finalName}`, req);
        res.json({ message: "ตั้งงบประมาณสำเร็จ", data: newBudget });
    } catch (err) {
        console.error("🔥 Error:", err.message);
        res.status(400).json({ message: "ไม่สามารถสร้างงบประมาณได้", error: err.message });
    }
};

// 2. ดึงข้อมูล (Read) - (คงเดิม)
exports.getBudgets = async (req, res) => {
    try {
        const userId = req.user.id;
        const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

        const budgets = await prisma.budget.findMany({
            where: { userId, targetMonth: month, targetYear: year },
            include: { category: true }
        });

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0, 23, 59, 59);

        const budgetWithSpent = await Promise.all(budgets.map(async (b) => {
            const aggregate = await prisma.entry.aggregate({
                _sum: { amount: true },
                where: {
                    userId,
                    categoryId: b.categoryId,
                    type: 'expense',
                    date: { gte: firstDay, lte: lastDay }
                }
            });
            const spent = Number(aggregate._sum.amount) || 0;
            return { ...b, spent };
        }));

        res.json(budgetWithSpent);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. แก้ไขงบประมาณ (Update) - ✅ แก้ไข findFirst และความปลอดภัย
exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, name } = req.body;
        const userId = req.user.id;

        // 🚩 แก้จาก findUnique เป็น findFirst เพื่อเช็คความเป็นเจ้าของได้
        const oldBudget = await prisma.budget.findFirst({
            where: { 
                id: Number(id),
                userId: userId // ✅ ต้องเป็นของ User คนกนี้เท่านั้น
            },
        });

        if (!oldBudget) return res.status(404).json({ message: "ไม่พบข้อมูลหรือไม่มีสิทธิ์แก้ไข" });

        const updatedBudget = await prisma.budget.update({
            where: { id: Number(id) },
            data: {
                amount: amount ? Number(amount) : oldBudget.amount,
                name: name ? name.trim() : oldBudget.name
            }
        });

        await createActivityLog(
            userId,
            "UPDATE_BUDGET",
            `แก้ไขงบประมาณ ${oldBudget.name}: จาก ฿${Number(oldBudget.amount).toLocaleString()} เป็น ฿${Number(updatedBudget.amount).toLocaleString()}`,
            req
        );

        res.json({ message: "แก้ไขงบประมาณสำเร็จ", data: updatedBudget });
    } catch (err) {
        console.log("Update Budget Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. ลบงบประมาณ (Delete) - ✅ แก้ไข findFirst
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 🚩 เช็คก่อนว่ามีอยู่จริงและเป็นเจ้าของไหม
        const targetBudget = await prisma.budget.findFirst({
            where: { 
                id: Number(id),
                userId: userId 
            }
        });

        if (!targetBudget) return res.status(404).json({ message: "ไม่พบข้อมูลหรือไม่มีสิทธิ์ลบ" });

        await prisma.budget.delete({ 
            where: { id: Number(id) } 
        });

        await createActivityLog(
            userId,
            "DELETE_BUDGET",
            `ลบงบประมาณ: ${targetBudget.name}`,
            req
        );

        res.json({ message: "ลบงบประมาณสำเร็จ" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};