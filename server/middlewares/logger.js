const prisma = require('../config/prisma'); // ดึง prisma client ของคุณมา

const createActivityLog = async (userId, action, detail = null, req = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: Number(userId),
        action: action, 
        detail: detail, 
      }
    });
  } catch (err) {
    console.error("❌ Failed to create log:", err);
  }
};

module.exports = { createActivityLog };

