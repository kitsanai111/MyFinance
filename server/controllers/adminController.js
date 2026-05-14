const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { createActivityLog } = require('../middlewares/logger');

exports.listUsers = async (req, res) => {
    try {
        const { startDate, endDate, username } = req.query;
        const requesterRole = req.user.role;

        const whereClause = {
            username: username ? { contains: username } : undefined,
            createdAt: (startDate && endDate) ? {
                gte: new Date(startDate + "T00:00:00.000Z"),
                lte: new Date(endDate + "T23:59:59.999Z"),
            } : undefined,
            //  Admin ปกติจะไม่เห็นรายชื่อ Superadmin
            role: requesterRole === 'admin' ? { not: 'superadmin' } : undefined
        };

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                role: true,
                enabled: true,
                createdAt: true,
                email: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.createAdminBySuper = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // เช็คว่าคนสั่งเป็น Superadmin จริงไหม (เผื่อ Middleware หลุด)
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: "เฉพาะ Superadmin เท่านั้นที่สร้าง Admin ได้" });
        }

        const userExists = await prisma.user.findFirst({ where: { email } });
        if (userExists) return res.status(400).json({ message: "อีเมลนี้มีในระบบแล้ว" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: 'admin',
                enabled: true
            }
        });
        await createActivityLog(
            req.user.id,
            "CREATE_ADMIN",
            `สร้างผู้ดูแลระบบใหม่: ${username} (${email})`,
            req
        );

        res.json({ message: "สร้างผู้ดูแลระบบสำเร็จ", user: { username: newAdmin.username, role: newAdmin.role } });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.changeUserStatus = async (req, res) => {
    try {
        const { id, enabled } = req.body;
        const requesterRole = req.user.role;

        const targetUser = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!targetUser) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

        if (requesterRole === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'superadmin')) {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์จัดการผู้ดูแลระบบ" });
        }

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: { enabled: enabled }
        });
        await createActivityLog(
            req.user.id,
            "CHANGE_STATUS",
            `เปลี่ยนสถานะผู้ใช้ ${targetUser.username} เป็น ${enabled ? 'ใช้งานได้' : 'ระงับการใช้งาน'}`,
            req
        );
        res.json({ message: "อัปเดตสำเร็จ", user });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.removeUser = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterRole = req.user.role;

        const targetUser = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!targetUser) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });

        if (req.user.id === Number(id)) return res.status(400).json({ message: "ลบตัวเองไม่ได้" });

        if (requesterRole === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'superadmin')) {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบผู้ดูแลระบบ" });
        }
        await createActivityLog(
            req.user.id, 
            "DELETE_USER", 
            `ลบผู้ใช้งาน: ${targetUser.username} (Email: ${targetUser.email})`, 
            req
        );

        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ message: "ลบข้อมูลสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await prisma.activityLog.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }, 
            take: 500 
        });
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};