const prisma = require('../config/prisma');
const { createActivityLog } = require('../middlewares/logger'); // ✅ 1. Import มาใช้

// exports.createOrUpdateGoal = async (req, res) => {
//     try {
//         const { salary, savingsTarget, totalGoal, isPercentage } = req.body;
//         const userId = req.user.id;

//         const income = parseFloat(salary);
//         let savings = parseFloat(savingsTarget);
//         if (isPercentage) {
//             savings = (income * savings) / 100;
//         }
//         const monthlyLimit = income - savings;

//         // 🚩 ดึงข้อมูลเป้าหมายเดิมมาดูก่อนเพื่อใช้เปรียบเทียบใน Log (ถ้ามี)
//         const oldGoal = await prisma.goal.findUnique({
//             where: { userId: parseInt(userId) }
//         });

//         const goal = await prisma.goal.upsert({
//             where: { userId: parseInt(userId) },
//             update: {
//                 salary: income,
//                 savingsTarget: parseFloat(savingsTarget),
//                 totalGoal: parseFloat(totalGoal),
//                 isPercentage: isPercentage,
//                 monthlyLimit: monthlyLimit
//             },
//             create: {
//                 userId: parseInt(userId),
//                 salary: income,
//                 savingsTarget: parseFloat(savingsTarget),
//                 totalGoal: parseFloat(totalGoal),
//                 isPercentage: isPercentage,
//                 monthlyLimit: monthlyLimit
//             }
//         });

//         // ✅ 2. บันทึก Log เมื่อบันทึกเป้าหมายสำเร็จ
//         const actionType = oldGoal ? "UPDATE_GOAL" : "CREATE_GOAL";
//         const detailMsg = oldGoal
//             ? `อัปเดตเป้าหมาย: เงินเดือน ฿${income.toLocaleString()}, เป้าหมายออมรวม ฿${parseFloat(totalGoal).toLocaleString()}`
//             : `ตั้งเป้าหมายครั้งแรก: เงินเดือน ฿${income.toLocaleString()}, เป้าหมายออมรวม ฿${parseFloat(totalGoal).toLocaleString()}`;

//         await createActivityLog(
//             userId,
//             actionType,
//             detailMsg,
//             req
//         );

//         res.json({ message: "บันทึกเป้าหมายสำเร็จ", goal });
//     } catch (err) {
//         console.error("Create/Update Goal Error:", err);
//         res.status(500).json({ message: "Server Error" });
//     }
// };


exports.createOrUpdateGoal = async (req, res) => {
    try {
        console.log("📥 Received Goal Data:", req.body); // ไว้ Debug

        // 🛡️ ดักจับชื่อ Key ทั้งสองแบบ เผื่อเพื่อนลืมแก้
        const salary = req.body.salary || 0;
        const savingsTarget = req.body.savingsTarget || req.body.monthlySavings || 0;
        const totalGoal = req.body.totalGoal || 0;
        const isPercentage = req.body.isPercentage === true; // มั่นใจว่าเป็น Boolean

        const userId = req.user.id;

        const income = parseFloat(salary);
        let savings = parseFloat(savingsTarget);
        
        if (isPercentage) {
            savings = (income * savings) / 100;
        }
        
        // 🚩 คำนวณ monthlyLimit ใหม่ใน Server เพื่อความชัวร์
        const monthlyLimit = income - savings;

        const goal = await prisma.goal.upsert({
            where: { userId: parseInt(userId) },
            update: {
                salary: income,
                savingsTarget: parseFloat(savingsTarget),
                totalGoal: parseFloat(totalGoal),
                isPercentage: isPercentage,
                monthlyLimit: monthlyLimit
            },
            create: {
                userId: parseInt(userId),
                salary: income,
                savingsTarget: parseFloat(savingsTarget),
                totalGoal: parseFloat(totalGoal),
                isPercentage: isPercentage,
                monthlyLimit: monthlyLimit
            }
        });

        // บันทึก Log และส่ง Response (โค้ดส่วนเดิมของคุณ...)
        res.json({ message: "บันทึกสำเร็จ", goal });

    } catch (err) {
        console.error("🔥 Server Error:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const goal = await prisma.goal.findUnique({
            where: { userId: parseInt(userId) }
        });

        if (!goal) {    
            return res.json(null);
        }

        res.json(goal);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error: Get goal failed" });
    }
};