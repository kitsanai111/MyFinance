const express = require('express');
const router = express.Router();
const { authCheck } = require('../middlewares/authCheck'); 
const { createBudget, getBudgets, deleteBudget, updateBudget } = require('../controllers/budget');

// @ENDPOINT http://localhost:5000/api/budget
router.post('/budget', authCheck, createBudget);
router.get('/budget', authCheck, getBudgets);
router.delete('/budget/:id', authCheck, deleteBudget);
router.put('/budget/:id', authCheck, updateBudget);

module.exports = router;