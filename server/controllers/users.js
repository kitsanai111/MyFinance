
const prisma = require('../config/prisma'); 
const { createActivityLog } = require('../middlewares/logger');


exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username } = req.body;
        const oldUser = await prisma.user.findUnique({ where: { id: userId } });

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { username }
        });

        await createActivityLog(
            req.user.id,
            'UPDATE_USERNAME',
            `เปลี่ยน username "${oldUser.username}" → "${username}"`
        );
        res.json({ message: "อัปเดตสำเร็จ", user: updated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUsername = async (req, res) => {
    try {
        const { userId, username } = req.body;
        
        const oldUser = await prisma.user.findUnique({ where: { id: Number(userId) } });
        
        await prisma.user.update({
            where: { id: Number(userId) },
            data: { username }
        });

        await createActivityLog(
            req.user.id,
            'UPDATE_USERNAME',
            `เปลี่ยน username "${oldUser.username}" → "${username}"`
        );

        res.json({ message: "แก้ไข username สำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};