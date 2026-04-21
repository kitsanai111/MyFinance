const prisma = require("../config/prisma")
// นำเข้า Logic คำนวณที่คุณส่งมา
const { RecalculateTotal, Recalculate_income_expese_Total } = require('../RecalculateController/RecalculateTotal')
const { createActivityLog } = require('../middlewares/logger');

const getThaiDateTime = (dateInput) => {
    // 1. สร้าง Date จากวันที่ input (ถ้ามี) หรือเวลาปัจจุบัน
    const d = dateInput ? new Date(dateInput) : new Date();
    const now = new Date(); // สร้างตัวแปรเวลาปัจจุบัน (วินาทีที่กดบันทึก)

    // 2. ถ้ามีการระบุวันที่ (dateInput) ให้เอาเวลาปัจจุบันไป "แปะ" ใส่
    // เพื่อให้มันไม่เป็น 00:00:00
    if (dateInput) {
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }

    // 3. บวก 7 ชั่วโมงเพื่อปรับเป็นเวลาไทย (+7)
    return new Date(d.getTime() + (7 * 60 * 60 * 1000));
};

// ================== GET TOTAL (แก้ปัญหา 404) ==================
exports.getTotal = async (req, res) => {
    try {
        const userId = req.user.id;

        // ใช้การรวมยอด (Aggregate) แบบรวดเร็วสำหรับหน้า Dashboard
        const income = await prisma.entry.aggregate({
            _sum: { amount: true },
            where: { userId: parseInt(userId), type: "income" }
        });

        const expense = await prisma.entry.aggregate({
            _sum: { amount: true },
            where: { userId: parseInt(userId), type: "expense" }
        });

        const totalIncome = Number(income._sum.amount) || 0;
        const totalExpense = Number(expense._sum.amount) || 0;
        const total = Number((totalIncome - totalExpense).toFixed(2));

        const now = new Date();
        const date = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        res.json({ total, date, time });

    } catch (err) {
        console.error("Get Total Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// ================== INCOME ==================
exports.createIncome = async (req, res) => {
    try {
        const { amount, userId, source, categoryId, date } = req.body;
        if (!amount || !userId || !source || !categoryId) return res.status(400).json({ message: "Missing fields" });

        const finalDate = getThaiDateTime(date);

        const income = await prisma.entry.create({
            data: {
                amount: parseFloat(amount),
                type: "income",
                source,
                date: finalDate,
                category: categoryId ? { connect: { id: parseInt(categoryId) } } : undefined,
                user: { connect: { id: parseInt(userId) } }
            }
        });
        await createActivityLog(
            userId,
            "ADD_INCOME",
            `เพิ่มรายได้: ${source} จำนวน ฿${parseFloat(amount).toLocaleString()}`,
            req
        );

        // ✅ เรียกใช้ Logic คำนวณยอดใหม่
        await RecalculateTotal(userId);
        await Recalculate_income_expese_Total(userId);

        res.status(201).json({ message: "Success", income });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error" });
    }
}

exports.updateIncome = async (req, res) => {
    try {
        const { amount, userId, source, categoryId, date } = req.body
        const id = parseInt(req.params.id)
        const oldEntry = await prisma.entry.findUnique({ where: { id } });
        await prisma.entry.update({
            where: { id },
            data: {
                amount: parseFloat(amount),
                source,
                date: date ? new Date(date) : undefined,
                category: categoryId ? { connect: { id: parseInt(categoryId) } } : undefined,
                user: { connect: { id: parseInt(userId) } }
            }
        })

        // ✅ 3. บันทึก Log เมื่อแก้ไขรายได้
        await createActivityLog(
            userId,
            "UPDATE_INCOME",
            `แก้ไขรายได้: จาก "${oldEntry.source}" ฿${oldEntry.amount} เป็น "${source}" ฿${amount}`,
            req
        );

        await RecalculateTotal(userId)
        await Recalculate_income_expese_Total(userId)
        res.send("Update Success")
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Error" })
    }
}

exports.listIncome = async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 100
        const userId = req.user.id
        const income = await prisma.entry.findMany({
            where: { type: "income", userId },
            take: count,
            orderBy: { date: "desc" },
            include: { category: true }
        })

        res.json(income)
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Error" })
    }
}

// ================== EXPENSE ==================
exports.createExpense = async (req, res) => {
    try {
        const { amount, userId, categoryId, date, note } = req.body
        const finalDate = getThaiDateTime(date);
        const expense = await prisma.entry.create({
            data: {
                type: "expense",
                amount: parseFloat(amount),
                note,
                date: finalDate,
                category: categoryId ? { connect: { id: parseInt(categoryId) } } : undefined,
                user: { connect: { id: parseInt(userId) } }
            }
        })

        await createActivityLog(
            userId,
            "ADD_EXPENSE",
            `เพิ่มรายจ่าย: ${note || 'ไม่ระบุ'} จำนวน ฿${parseFloat(amount).toLocaleString()}`,
            req
        );
        await RecalculateTotal(userId)
        await Recalculate_income_expese_Total(userId)
        res.status(201).json({ message: "Success", expense })
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Error" })
    }
}

exports.updateExpense = async (req, res) => {
    try {
        const { amount, userId, categoryId, date, note } = req.body
        const id = parseInt(req.params.id)
        const oldEntry = await prisma.entry.findUnique({ where: { id } });
        await prisma.entry.update({
            where: { id },
            data: {
                amount: parseFloat(amount),
                note,
                category: categoryId ? { connect: { id: parseInt(categoryId) } } : undefined,
                date: date ? new Date(date) : undefined,
                user: { connect: { id: parseInt(userId) } }
            }
        })

        await createActivityLog(
            userId,
            "UPDATE_EXPENSE",
            `แก้ไขรายจ่าย: จาก "${oldEntry.note || 'ไม่มีชื่อ'}" ฿${oldEntry.amount} เป็น "${note}" ฿${amount}`,
            req
        );
        await RecalculateTotal(userId)
        await Recalculate_income_expese_Total(userId)
        res.send("Update Success")
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Error" })
    }
}

exports.listExpense = async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 100
        const userId = req.user.id
        const expense = await prisma.entry.findMany({
            where: { type: "expense", userId },
            take: count,
            orderBy: { date: "desc" },
            include: { category: true }
        })
        res.json(expense)
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Error" })
    }
}

// ================== DELETE (ENTRY) ==================
// ================== DELETE (ENTRY) ==================
exports.removeEntry = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const entry = await prisma.entry.findUnique({ where: { id } });
        if (!entry) return res.status(404).json({ message: "Not found" });

        const userId = entry.userId;
        const typeLabel = entry.type === "income" ? "รายได้" : "รายจ่าย";
        const entryName = entry.source || entry.note || "ไม่มีชื่อ";

        // 🚩 แก้ไขตรงนี้ให้ฉลาดขึ้น
        if (entry.type === "expense" && entry.note && entry.note.includes("ผ่อน:")) {

            // 1. ตัด "ผ่อน: " ออก
            let cleanedName = entry.note.replace("ผ่อน: ", "").trim();

            // 2. ถ้ามีคำว่า " (งวดที่" ให้ตัดทิ้งเอาแค่ชื่อรายการข้างหน้า
            // เช่น "iPhone (งวดที่ 1/10)" -> จะเหลือแค่ "iPhone"
            if (cleanedName.includes(" (งวดที่")) {
                cleanedName = cleanedName.split(" (งวดที่")[0].trim();
            }

            const installmentItem = await prisma.installment.findFirst({
                where: {
                    userId: userId,
                    name: cleanedName // คราวนี้ชื่อจะตรงกับใน DB แน่นอน
                }
            });

            if (installmentItem && installmentItem.currentTerm > 0) {
                await prisma.installment.update({
                    where: { id: installmentItem.id },
                    data: {
                        currentTerm: installmentItem.currentTerm - 1,
                        status: "ACTIVE"
                    }
                });
                console.log(`✅ คืนงวดให้รายการ: ${cleanedName} เรียบร้อย`);
            }
        }

        await prisma.entry.delete({ where: { id } });

        await createActivityLog(
            userId,
            "DELETE_ENTRY",
            `ลบ${typeLabel}: ${entryName} (และปรับปรุงงวดผ่อนชำระคืน)`,
            req
        );

        await RecalculateTotal(userId);
        await Recalculate_income_expese_Total(userId);

        res.json({ message: "ลบรายการและคืนงวดผ่อนชำระเรียบร้อย" });
    } catch (err) {
        console.error("Remove Entry Error:", err);
        res.status(500).json({ message: "Error" });
    }
};