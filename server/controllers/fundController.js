const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createActivityLog } = require('../middlewares/logger');

// ✅ 1. ดึงรายการทั้งหมด
exports.getAllFundTypes = async (req, res) => {
    try {
        const funds = await prisma.fundType.findMany({
            orderBy: { id: 'asc' }
        });
        res.status(200).json(funds);
    } catch (error) {
        res.status(500).json({ message: "Error fetching funds", error: error.message });
    }
};

// ✅ 2. เพิ่มกองทุนใหม่
exports.createFundType = async (req, res) => {
    try {
        const userId = req.user?.id; // 🚩 เพิ่มบรรทัดนี้
        const {
            code, name, taxLimit, description, category,
            isFixed, isCount, expectedReturn, incomeLimitRate,
            hasDividend
        } = req.body;

        const newFund = await prisma.fundType.create({
            data: {
                code: code.toUpperCase(),
                name,
                category: category || "investment",
                taxLimit: Number(taxLimit),
                expectedReturn: Number(expectedReturn || 0),
                incomeLimitRate: Number(incomeLimitRate || 0),
                description,
                isFixed: isFixed === true,
                isCount: isCount === true,
                hasDividend: hasDividend === true
            }
        });

        // ✅ บันทึก Log
        await createActivityLog(
            userId,
            "CREATE_DEDUCTION",
            `เพิ่มรายการลดหย่อน: ${name} (Code: ${code.toUpperCase()}) เพดาน: ฿${Number(taxLimit).toLocaleString()}`,
            req
        );

        res.status(201).json({ message: "เพิ่มสำเร็จ", data: newFund });
    } catch (error) {
        res.status(400).json({ message: "เพิ่มไม่สำเร็จ", error: error.message });
    }
};

// ✅ 3. แก้ไขข้อมูล
exports.updateFundType = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // 🚩 เพิ่มบรรทัดนี้
        const {
            name, taxLimit, description, category,
            isFixed, isCount, expectedReturn, incomeLimitRate,
            hasDividend
        } = req.body;

        // 🚩 ดึงข้อมูลเก่ามาก่อนเพื่อเอาชื่อไปลง Log
        const oldFund = await prisma.fundType.findUnique({ where: { id: Number(id) } });

        const updated = await prisma.fundType.update({
            where: { id: Number(id) },
            data: {
                name,
                taxLimit: Number(taxLimit),
                expectedReturn: Number(expectedReturn || 0),
                incomeLimitRate: Number(incomeLimitRate || 0),
                description,
                category,
                isFixed: isFixed,
                isCount: isCount,
                hasDividend: hasDividend
            }
        });

        // ✅ บันทึก Log
        await createActivityLog(
            userId,
            "UPDATE_DEDUCTION",
            `แก้ไขรายการลดหย่อน: ${oldFund?.name || 'Unknown'} (ID: ${id})`,
            req
        );

        res.status(200).json({ message: "อัปเดตสำเร็จ", data: updated });
    } catch (error) {
        res.status(400).json({ message: "อัปเดตไม่สำเร็จ", error: error.message });
    }
};

// ✅ 4. ลบกองทุน
exports.deleteFundType = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // 🚩 เพิ่มบรรทัดนี้

        // 🚩 ดึงข้อมูลก่อนลบเพื่อเอาชื่อไปลง Log
        const target = await prisma.fundType.findUnique({ where: { id: Number(id) } });

        await prisma.fundType.delete({
            where: { id: Number(id) }
        });

        // ✅ บันทึก Log
        await createActivityLog(
            userId,
            "DELETE_DEDUCTION",
            `ลบรายการลดหย่อน: ${target?.name || 'Unknown'} (Code: ${target?.code || id})`,
            req
        );
        
        res.status(200).json({ message: "ลบเรียบร้อย" });
    } catch (error) {
        res.status(400).json({ message: "ลบไม่ได้", error: error.message });
    }
};