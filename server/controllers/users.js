// server/controllers/users.js
const prisma = require('../config/prisma'); // ⚠️ เช็ค path ให้ตรงกับไฟล์ prisma ของคุณ

// 1. ดึงข้อมูล Users ทั้งหมด
// server/controllers/users.js

exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                enabled: true,
                createdAt: true,
                // updatedAt: true,  <-- ❌ ลบบรรทัดนี้ทิ้งครับ เพราะใน DB ไม่มี
                email: true // (ถ้าอยากได้ email ให้ใส่บรรทัดนี้แทน)
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        res.json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. เปลี่ยนสถานะ Enabled/Disabled
exports.changeStatus = async (req, res) => {
    try {
        const { id, enabled } = req.body;
        
        await prisma.user.update({
            where: { id: Number(id) },
            data: { enabled: enabled }
        });
        
        res.send('Update Status Success');
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 3. เปลี่ยน Role Admin/User (ถ้ามี)
exports.changeRole = async (req, res) => {
    try {
        const { id, role } = req.body;
        
        await prisma.user.update({
            where: { id: Number(id) },
            data: { role: role }
        });
        
        res.send('Update Role Success');
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 4. ลบผู้ใช้
exports.removeUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.user.delete({
            where: { id: Number(id) }
        });
        
        res.send('Delete User Success');
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
};