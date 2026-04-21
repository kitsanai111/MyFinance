const prisma = require('../config/prisma'); // ดึง prisma client ของคุณมา

const createActivityLog = async (userId, action, detail = null, req = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: Number(userId),
        action: action, // เช่น "LOGIN", "CREATE_ENTRY"
        detail: detail, // เช่น "ลบหมวดหมู่: ค่าอาหาร"
        ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null
      }
    });
  } catch (err) {
    console.error("❌ Failed to create log:", err);
  }
};

module.exports = { createActivityLog };