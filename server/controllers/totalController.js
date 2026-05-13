const { Recalculate_income_expese_Total } = require('../RecalculateController/RecalculateTotal');

exports.getTotal = async (req, res) => {
    try {
        const userId = req.user.id; // มาจาก authCheck middleware
        const totals = await Recalculate_income_expese_Total(userId);

        res.json({
            total: totals.netTotal,
            income: totals.incomeTotal,
            expense: totals.expenseTotal,
            date: new Date().toLocaleDateString('th-TH'),
            time: new Date().toLocaleTimeString('th-TH')
        });
    } catch (err) {
        console.error("Error in getTotal:", err);
        res.status(500).json({ message: 'Cannot get total', error: err.message });
    }
};