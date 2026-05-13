const prisma = require("../config/prisma")
const jwt = require("jsonwebtoken");
const { createActivityLog } = require('../middlewares/logger');

exports.create = async (req, res) => {
    try {
        const { name, type } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: ไม่พบข้อมูลผู้ใช้" });
        }

        const category = await prisma.category.create({
            data: {
                name: name,
                type: type.toLowerCase(), 
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
        if (err.code === 'P2002') {
            return res.status(400).json({ message: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" });
        }
        res.status(500).json({ message: "Server error: ไม่สามารถสร้างหมวดหมู่ได้" });
    }
}

exports.list = async (req, res) => {
    try {
        const { type } = req.query; 

        const categories = await prisma.category.findMany({
            where: {
                type: type ? type.toLowerCase() : undefined
            },
            orderBy: { name: 'asc' } 
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

        const targetCategory = await prisma.category.findUnique({
            where: { id: Number(id) }
        });

        if (!targetCategory) return res.status(404).json({ message: "ไม่พบหมวดหมู่" });

        const category = await prisma.category.delete({
            where: { id: Number(id) }
        });

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


exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: ไม่พบข้อมูลผู้ใช้" });
        }

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
                type: type.toLowerCase() 
            }
        });


        await createActivityLog(
            userId,
            "UPDATE_CATEGORY",
            `แก้ไขหมวดหมู่ ID ${id}: จาก "${oldCategory.name}" เป็น "${name}"`,
            req
        );

        res.send(category);
    } catch (err) {
        console.log("Update Category Error:", err);
        if (err.code === 'P2002') {
            return res.status(400).json({ message: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" });
        }
        res.status(500).json({ message: "Server error: ไม่สามารถแก้ไขได้" });
    }
};