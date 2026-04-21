const prisma = require('../config/prisma');

exports.calculateTax = async (req, res) => {
  try {
    const {  } = req.body;
    
    const incomeEntry = await prisma.entry.findFirst({
      where: {
        userId: parseInt(userId),
        taxYear: parseInt(taxYear)
      }
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tax Calculation Error" });
  }
};
