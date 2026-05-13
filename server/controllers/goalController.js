const prisma = require('../config/prisma');
const { createActivityLog } = require('../middlewares/logger'); 

exports.createOrUpdateGoal = async (req, res) => {
    try {
        console.log("📥 Received Goal Data:", req.body); 

        const salary = req.body.salary || 0;
        const savingsTarget = req.body.savingsTarget || req.body.monthlySavings || 0;
        const totalGoal = req.body.totalGoal || 0;
        const isPercentage = req.body.isPercentage === true; // Boolean

        const userId = req.user.id;

        const income = parseFloat(salary);
        let savings = parseFloat(savingsTarget);
        
        if (isPercentage) {
            savings = (income * savings) / 100;
        }
        
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