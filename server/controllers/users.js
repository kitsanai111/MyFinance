
const prisma = require('../config/prisma'); 
const { createActivityLog } = require('../middlewares/logger');


exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                enabled: true,
                createdAt: true,
                email: true 
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

// Enabled/Disabled
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