const express = require('express');
const router = express.Router();
const { authCheck } = require('../middlewares/authCheck');
const { createInstallment, getInstallments, togglePaid, deleteInstallment,updateInstallment } = require('../controllers/installment');

// @ENDPOINT http://localhost:5000/api/installment
router.post('/installment', authCheck, createInstallment);
router.get('/installment', authCheck, getInstallments);
router.put('/installment/pay/:id', authCheck, togglePaid); // กดปุ่มจ่าย
router.delete('/installment/:id', authCheck, deleteInstallment);
router.put('/installment/:id', authCheck, updateInstallment);

module.exports = router;