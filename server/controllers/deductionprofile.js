const prisma = require('../config/prisma')

exports.createProfile = async (req, res) => {
    try {
        const { userId, taxYear, deductionItems } = req.body
        const profile = await prisma.deductionProfile.create({
            data: {
                user: {
                    connect: { id: parseInt(userId) }
                },
                taxYear: parseInt(taxYear),
                deductionItems: {
                    create: deductionItems
                }
            }
        })
        res.status(201).json({ message: "Profile created successfully " })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Create Profile Error!" })
    }
}

exports.listProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const taxYear = 2026;

        // 1. ดึง Master Data ทั้งหมด
        const allFundTypes = await prisma.fundType.findMany();

        // 2. ดึงรายได้รวมจากตาราง Entry (จำเป็นมากเพื่อเอามาคิด % สิทธิ์)
        const incomeAggr = await prisma.entry.aggregate({
            where: { userId: parseInt(userId), type: "income" },
            _sum: { amount: true }
        });
        const totalIncome = Number(incomeAggr._sum.amount) || 0;

        // 3. ดึง Profile ของ User
        const profile = await prisma.deductionProfile.upsert({
            where: { userId_taxYear: { userId, taxYear } },
            update: {},
            create: { userId, taxYear },
            include: { investments: true }
        });

        // 4. 🔥 Logic หัวใจสำคัญ: ผสมข้อมูลพร้อมคำนวณ "ช่องว่าง (Gap)"
        const resultInvestments = allFundTypes.map(type => {
            const userInv = profile.investments.find(inv => inv.fundTypeId === type.id);
            const currentAmount = userInv ? Number(userInv.amount) : 0;

            // --- คำนวณสิทธิ์สูงสุด (Max Limit) ---
            let maxLimit = type.taxLimit; // เริ่มจากเพดานที่เป็นตัวเงินบาทก่อน (เช่น 200,000)

            // ถ้ามีกฎหมายเรื่อง % เงินได้ (เช่น SSF 30%, PVD 15%)
            if (type.incomeLimitRate > 0) {
                const limitByIncome = totalIncome * (type.incomeLimitRate / 100);
                // สิทธิ์จริงคือค่าที่น้อยกว่าระหว่าง "เพดานเงินบาท" กับ "% ของเงินได้"
                if (type.taxLimit > 0) {
                    maxLimit = Math.min(limitByIncome, type.taxLimit);
                } else {
                    maxLimit = limitByIncome; // กรณีไม่มีเพดานบาท (เช่น เงินบริจาคบางประเภท)
                }
            }

            return {
                fundTypeId: type.id,
                amount: currentAmount, // ยอดที่ซื้อแล้ว
                maxLimit: maxLimit,    // สิทธิ์สูงสุดที่ซื้อได้จริงตามรายได้ปัจจุบัน
                gap: Math.max(0, maxLimit - currentAmount), // 🚩 ยอดที่ระบบจะเอาไป "แนะนำ" ว่าซื้อเพิ่มได้อีกเท่าไหร่
                fundType: type 
            };
        });

        // 5. คำนวณภาพรวมภาษี (เพื่อให้หน้าสรุปโชว์เลขได้เลย)
        let totalDeduction = 60000; // ค่าลดหย่อนส่วนตัวพื้นฐาน
        resultInvestments.forEach(inv => { totalDeduction += inv.amount; });
        const expense = Math.min(totalIncome * 0.5, 100000);
        const netIncome = Math.max(0, totalIncome - expense - totalDeduction);
        const tax = calculateTaxStep(netIncome); // อย่าลืมใส่ฟังก์ชันคำนวณขั้นบันไดไว้ในไฟล์นี้ด้วย

        res.status(200).json({
            totalIncome,
            totalDeduction,
            netIncome,
            tax,
            profile,
            investments: resultInvestments // ก้อนนี้แหละที่มี Gap ไปโชว์ Alert
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};