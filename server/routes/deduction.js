// routes/deduction.js
const express = require('express');
const router = express.Router();
const { getDeductionSummary, updateDeduction } = require('../controllers/deductionController');
const { authCheck } = require('../middlewares/authCheck');

router.get('/deduction', authCheck, getDeductionSummary); 

router.post('/deduction', authCheck, updateDeduction);

module.exports = router;