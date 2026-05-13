const prisma = require('../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createActivityLog } = require('../middlewares/logger');

const JWT_SECRET = process.env.SECRET || 'fallback_secret';

exports.register = async (req, res) => {
    try {
        const { email, password, username } = req.body

        if (!email || !password || !username) {
            return res.status(400).json({ message: "Email, password, and username are required." })
        }

        const user = await prisma.user.findFirst({ where: { email } })
        if (user) {
            return res.status(400).json({ message: "Email already exists." })
        }

        const usernameCheck = await prisma.user.findFirst({ where: { username } })
        if (usernameCheck) {
            return res.status(400).json({ message: "Username already exists." })
        }

        const hashPasswrd = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashPasswrd,
                username: username, 
                role: 'user',
                enabled: true
            },
            select: { id: true, email: true, username: true, role: true }
        })

        await createActivityLog(newUser.id, "REGISTER", `User registered with email: ${newUser.email}`, req);

        res.status(201).json({
            message: "Registration successful!",
            user: newUser
        })

    } catch (err) {
        console.error("Register Error:", err)
        res.status(500).json({ message: "Internal Server Error during registration." })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await prisma.user.findFirst({ where: { email } })

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials." })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." })
        }

        // 3. อัปเดต enabled เป็น true (Login สำเร็จ)
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { enabled: true },
            select: {
                id: true,
                email: true,
                role: true,
                enabled: true,
                username: true
            }
        });
        await createActivityLog(updatedUser.id, "LOGIN", `User logged in via ${req.headers['user-agent']}`, req);

        const payload = {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
        }

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                console.error("JWT Error:", err);
                return res.status(500).json({ message: "Could not generate authentication token." })
            }

            res.json({ payload: updatedUser, token })
        })

    } catch (err) {
        console.error("Login Error:", err)
        res.status(500).json({ message: "Internal Server Error during login." })
    }
}

exports.logout = async (req, res) => {
    try {
        console.log("User from Token:", req.user);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "User not identified" });
        }

        const userId = req.user.id;
        await createActivityLog(userId, "LOGOUT", `User logged out`, req);

        const updatedUser = await prisma.user.update({
            where: { id: Number(userId) },
            data: { enabled: false }, 
            select: { id: true, username: true, enabled: true }
        });

        console.log("Update Database Success:", updatedUser);

        res.status(200).json({
            message: "Logout successful and status updated.",
            user: updatedUser
        });

    } catch (err) {
        console.error("Logout Error Detailed:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.resetPasswordForgot = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await prisma.user.findFirst({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        await createActivityLog(user.id, "FORGOT_PASSWORD_RESET", `Reset password via forgot page for: ${email}`, req);

        res.json({ message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว! กรุณาเข้าสู่ระบบ" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.currentUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: req.user.email },
            select: {
                id: true,
                email: true,
                role: true,
                username: true
            }
        })

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ user })

    } catch (err) {
        console.error("Current User Error:", err)
        res.status(500).json({ message: 'Internal Server Error.' })
    }
}