const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

exports.authCheck = async (req, res, next) => {
    try {
        const headerToken = req.headers.authorization
        if (!headerToken) {
            return res.status(401).json({ message: "No Token, Authorization" })
        }
        const token = headerToken.split(" ")[1]
        const decode = jwt.verify(token, process.env.SECRET)
        req.user = decode

        const user = await prisma.user.findFirst({
            where: { email: req.user.email }
        })

        if (!user || !user.enabled) {
            return res.status(401).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน หรือไม่พบข้อมูล' })
        }

        // ✅ ส่งข้อมูล User ที่ดึงจาก DB ไปกับ request ด้วย เพื่อให้ controller รู้ Role ล่าสุด
        req.user = user 
        next()
    } catch (err) {
        console.log(err)
        res.status(401).json({ message: 'Token Invalid' })
    }
}

// ✅ Admin Check: ยอมรับทั้ง 'admin' และ 'superadmin'
exports.adminCheck = async (req, res, next) => {
    try {
        const { role } = req.user // ดึงจาก req.user ที่เรา set ไว้ใน authCheck
        if (role !== 'admin' && role !== 'superadmin') {
            return res.status(403).json({ message: 'Access Denied: Admin Only' })
        }
        next()
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error Admin access denied' })
    }
}

// ✅ Super Admin Check: ยอมรับเฉพาะ 'superadmin' เท่านั้น
exports.superAdminCheck = async (req, res, next) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access Denied: Super Admin Only' })
        }
        next()
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error Super Admin access denied' })
    }
}