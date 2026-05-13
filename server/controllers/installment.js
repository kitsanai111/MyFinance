const prisma = require('../config/prisma');
const { createActivityLog } = require('../middlewares/logger')

const getThaiDateTime = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    const now = new Date();
    if (dateInput) {
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }
    return new Date(d.getTime() + (7 * 60 * 60 * 1000));
};

exports.createInstallment = async (req, res) => {
    try {
        const { name, totalPrice, monthlyAmount, totalTerms, startDate, categoryId } = req.body;
        const userId = req.user.id;

        const newItem = await prisma.installment.create({
            data: {
                name,
                totalPrice: Number(totalPrice),
                monthlyAmount: Number(monthlyAmount),
                totalTerms: Number(totalTerms),
                startDate: new Date(startDate),
                categoryId: categoryId ? Number(categoryId) : 34, 
                currentTerm: 0,
                userId
            }
        });

        await createActivityLog(
            userId,
            "CREATE_INSTALLMENT",
            `เพิ่มรายการผ่อนใหม่: ${name} ยอดรวม ฿${Number(totalPrice).toLocaleString()} (${totalTerms} งวด)`,
            req
        );

        res.json({ message: "เพิ่มรายการผ่อนชำระสำเร็จ", data: newItem });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getInstallments = async (req, res) => {
    try {
        const userId = req.user.id;
        const installments = await prisma.installment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        const result = installments.map(item => {
            let paidThisMonth = false;
            const today = new Date();

            if (item.lastPaidDate) {
                const lastPaid = new Date(item.lastPaidDate);
                if (lastPaid.getMonth() === today.getMonth() && lastPaid.getFullYear() === today.getFullYear()) {
                    paidThisMonth = true;
                }
            }

            return {
                ...item,
                paidThisMonth
            };
        });

        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.togglePaid = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const item = await prisma.installment.findUnique({ where: { id: Number(id) } });
        if (!item) return res.status(404).json({ message: "ไม่พบรายการ" });

        if (item.currentTerm >= item.totalTerms) {
            return res.status(400).json({ message: "รายการนี้ผ่อนชำระครบแล้ว" });
        }

        const nextTerm = item.currentTerm + 1;
        const amountPaid = Number(item.monthlyAmount); 

        const updated = await prisma.installment.update({
            where: { id: Number(id) },
            data: {
                currentTerm: nextTerm,
                lastPaidDate: new Date(),
                status: nextTerm >= item.totalTerms ? "COMPLETED" : "ACTIVE"
            }
        });

        await prisma.entry.create({
            data: {
                amount: amountPaid,
                type: "expense",
                note: `ผ่อน: ${item.name} (งวดที่ ${nextTerm}/${item.totalTerms})`,
                date: getThaiDateTime(new Date()),
                user: { connect: { id: parseInt(userId) } },
                category: { connect: { id: parseInt(item.categoryId || 34) } }
            }
        });

        await createActivityLog(
            userId,
            "PAY_INSTALLMENT",
            `จ่ายค่างวด: ${item.name} งวดที่ ${nextTerm}/${item.totalTerms} จำนวน ฿${amountPaid.toLocaleString()}`,
            req
        );

        res.json({ message: "ชำระงวดเรียบร้อย", data: updated });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteInstallment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const target = await prisma.installment.findUnique({
            where: { id: Number(id) }
        });

        if (!target) return res.status(404).json({ message: "ไม่พบรายการที่ต้องการลบ" });

        await prisma.installment.delete({
            where: { id: Number(id) }
        });

        await createActivityLog(
            userId,
            "DELETE_INSTALLMENT",
            `ลบรายการผ่อน: ${target.name} (คงเหลือ ${target.totalTerms - target.currentTerm} งวด)`,
            req
        );

        res.json({ message: "ลบรายการสำเร็จ" });
    } catch (err) {
        console.log("Delete Installment Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateInstallment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, totalPrice, totalTerms, monthlyAmount } = req.body;
        const userId = req.user.id;

        const item = await prisma.installment.findUnique({
            where: { id: Number(id) }
        });

        if (!item) return res.status(404).json({ message: "ไม่พบรายการที่ต้องการแก้ไข" });

        const updated = await prisma.installment.update({
            where: { id: Number(id) },
            data: {
                name,
                totalPrice: Number(totalPrice),
                totalTerms: Number(totalTerms),
                monthlyAmount: monthlyAmount ? Number(monthlyAmount) : Number(totalPrice) / Number(totalTerms)
            }
        });

        await createActivityLog(
            userId,
            "UPDATE_INSTALLMENT",
            `แก้ไขข้อมูลรายการผ่อน: ${item.name} เป็น ${name} (ยอดรวมใหม่ ฿${Number(totalPrice).toLocaleString()})`,
            req
        );

        res.json({ message: "แก้ไขรายการผ่อนชำระสำเร็จ", data: updated });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error: ไม่สามารถแก้ไขข้อมูลได้" });
    }
};