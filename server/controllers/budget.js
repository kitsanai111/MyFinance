const prisma = require('../config/prisma');
const { createActivityLog } = require('../middlewares/logger');

// 1. สร้างงบประมาณใหม่ (Create)
exports.createBudget = async (req, res) => {
    try {
        const { amount, categoryId, name } = req.body; // ✅ รับ name
        const userId = req.user.id;

        const newBudget = await prisma.budget.create({
            data: {
                name: name, // ✅ บันทึกชื่อ
                amount: Number(amount),
                userId: userId,
                categoryId: Number(categoryId)
            }
        });

        await createActivityLog(
            userId,
            "CREATE_BUDGET",
            `ตั้งงบประมาณใหม่: ${name} จำนวน ฿${Number(amount).toLocaleString()}`,
            req
        );
        res.json({ message: "ตั้งงบประมาณสำเร็จ", data: newBudget });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. ดึงข้อมูลและคำนวณยอดใช้จริง (Read + Calculate Spent)
exports.getBudgets = async (req, res) => {
    try {
        const userId = req.user.id;


        const budgets = await prisma.budget.findMany({
            where: { userId },
            include: { category: true }
        });

        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0, 23, 59, 59);

        const budgetWithSpent = await Promise.all(budgets.map(async (b) => {

            // 🔴 เปลี่ยนจาก prisma.expense -> prisma.entry
            const aggregate = await prisma.entry.aggregate({
                _sum: { amount: true },
                where: {
                    userId,
                    categoryId: b.categoryId,
                    type: 'expense', // ✅ สำคัญ: ต้องระบุว่าเป็นรายจ่ายเท่านั้น
                    date: {
                        gte: firstDay,
                        lte: lastDay
                    }
                }
            });

            const spent = Number(aggregate._sum.amount) || 0;

            return { ...b, spent };
        }));

        res.json(budgetWithSpent);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. แก้ไขงบประมาณ (Update)
exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, name } = req.body;
        const userId = req.user.id; // ✅ ต้องมีตัวนี้ด้วย

        // 🚩 1. ดึงข้อมูลเก่าเก็บไว้ก่อน ไม่งั้นบรรทัดที่ 97 จะหา oldBudget ไม่เจอ
        const oldBudget = await prisma.budget.findUnique({
            where: { id: Number(id) },
        });

        // 🛡️ เช็คกันพลาดถ้าหาไม่เจอ
        if (!oldBudget) return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });

        // 2. สั่งอัปเดตจริงใน Database
        const updatedBudget = await prisma.budget.update({
            where: { id: Number(id) },
            data: {
                amount: Number(amount),
                name: name
            }
        });

        // ✅ 3. บันทึก Log (ตอนนี้จะมีทั้ง userId และ oldBudget ให้ใช้แล้ว)
        await createActivityLog(
            userId,
            "UPDATE_BUDGET",
            `แก้ไขงบประมาณ ${oldBudget.name}: จาก ฿${oldBudget.amount.toLocaleString()} เป็น ฿${Number(amount).toLocaleString()}`,
            req
        );

        res.json({ message: "แก้ไขงบประมาณสำเร็จ", data: updatedBudget });
    } catch (err) {
        console.log("Update Budget Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. ลบงบประมาณ (Delete)
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 🚩 ดึงข้อมูลก่อนลบ
        const targetBudget = await prisma.budget.findUnique({
            where: { id: Number(id) }
        });

        if (!targetBudget) return res.status(404).json({ message: "Budget not found" });

        await prisma.budget.delete({ where: { id: Number(id) } });

        // ✅ 4. บันทึก Log เมื่อลบงบประมาณ
        await createActivityLog(
            userId,
            "DELETE_BUDGET",
            `ลบงบประมาณ: ${targetBudget.name} (วงเงินเดิม ฿${targetBudget.amount.toLocaleString()})`,
            req
        );

        res.json({ message: "ลบงบประมาณสำเร็จ" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};