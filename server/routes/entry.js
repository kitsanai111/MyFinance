const express = require('express');
const router = express.Router();
const { authCheck } = require('../middlewares/authCheck');

const {
    createExpense,
    createIncome,
    listExpense,
    listIncome,
    removeEntry,
    updateExpense,
    updateIncome,
    getTotal,
    getYearSummary
} = require("../controllers/entry");

// Income
router.post('/income', authCheck, createIncome);
router.get('/income', authCheck, listIncome);
router.put('/income/:id', authCheck, updateIncome);
router.delete('/income/:id', authCheck, removeEntry);

// Expense
router.post('/expense', authCheck, createExpense);
router.get('/expense', authCheck, listExpense);
router.put('/expense/:id', authCheck, updateExpense);
router.delete('/expense/:id', authCheck, removeEntry);

// ✅ Total (สำหรับ Dashboard)
router.get('/total', authCheck, getTotal);
router.get('/summary/year/:year', authCheck, getYearSummary)

module.exports = router;