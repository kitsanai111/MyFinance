const prisma = require("../config/prisma")
const jwt = require("jsonwebtoken");
const { createActivityLog } = require('../middlewares/logger');

exports.create = async (req, res) => {
    try {
        const { name, type } = req.body;
        // ดึง userId จาก req.user (ที่ได้จาก authCheck middleware)
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: ไม่พบข้อมูลผู้ใช้" });
        }

        const category = await prisma.category.create({
            data: {
                name: name,
                type: type.toLowerCase(), // ✅ บังคับตัวเล็กให้ตรงกับ Enum 'income' ใน DB
                userId: Number(userId)
            }
        });

        await createActivityLog(
            userId,
            "CREATE_CATEGORY",
            `สร้างหมวดหมู่: ${name} (${type})`,
            req
        );

        res.send(category);
    } catch (err) {
        console.log("Create Category Error:", err);
        // เช็กว่า Error เกิดจากชื่อซ้ำหรือไม่ (Unique constraint)
        if (err.code === 'P2002') {
            return res.status(400).json({ message: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" });
        }
        res.status(500).json({ message: "Server error: ไม่สามารถสร้างหมวดหมู่ได้" });
    }
}

exports.list = async (req, res) => {
    try {
        const { type } = req.query; // รับค่าจาก query string เช่น ?type=expense

        const categories = await prisma.category.findMany({
            where: {
                // ถ้าส่ง type มาให้กรองตาม type ถ้าไม่ส่งให้ดึงทั้งหมด
                type: type ? type.toLowerCase() : undefined
            },
            orderBy: { name: 'asc' } // เรียงตามชื่อจะดูง่ายกว่าใน List
        });
        res.send(categories);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // ✅ 3. ดึงข้อมูลก่อนลบเพื่อเอาชื่อมาลง Log
        const targetCategory = await prisma.category.findUnique({
            where: { id: Number(id) }
        });

        if (!targetCategory) return res.status(404).json({ message: "ไม่พบหมวดหมู่" });

        const category = await prisma.category.delete({
            where: { id: Number(id) }
        });

        // ✅ 4. บันทึก Log เมื่อลบหมวดหมู่
        await createActivityLog(
            userId,
            "DELETE_CATEGORY",
            `ลบหมวดหมู่: ${targetCategory.name} (Type: ${targetCategory.type})`,
            req
        );

        res.send(category);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error: ไม่สามารถลบได้" });
    }
}

// server/controllers/categories.js

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;

        // 🚩 1. ดึง userId มาจาก req.user
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: ไม่พบข้อมูลผู้ใช้" });
        }

        // 🚩 2. ดึงข้อมูลเก่าเก็บไว้ก่อนอัปเดต เพื่อใช้ลง Log
        const oldCategory = await prisma.category.findUnique({
            where: { id: Number(id) }
        });

        if (!oldCategory) {
            return res.status(404).json({ message: "ไม่พบหมวดหมู่ที่ต้องการแก้ไข" });
        }

        const category = await prisma.category.update({
            where: {
                id: Number(id)
            },
            data: {
                name: name,
                type: type.toLowerCase() // บังคับตัวเล็กตาม Schema
            }
        });

        // ✅ ตอนนี้เรียกใช้ userId และ oldCategory ได้แล้ว
        await createActivityLog(
            userId,
            "UPDATE_CATEGORY",
            `แก้ไขหมวดหมู่ ID ${id}: จาก "${oldCategory.name}" เป็น "${name}"`,
            req
        );

        res.send(category);
    } catch (err) {
        console.log("Update Category Error:", err);
        // ถ้าชื่อซ้ำจะติด Error P2002
        if (err.code === 'P2002') {
            return res.status(400).json({ message: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" });
        }
        res.status(500).json({ message: "Server error: ไม่สามารถแก้ไขได้" });
    }
};