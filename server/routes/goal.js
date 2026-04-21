const express = require('express');
const router = express.Router();
const { authCheck } = require('../middlewares/authCheck'); // อย่าลืม import middleware
const { createOrUpdateGoal, getGoal } = require('../controllers/goalController');

// Endpoint สำหรับ Goal
router.post('/goal', authCheck, createOrUpdateGoal); // บันทึก/แก้ไข
router.get('/goal', authCheck, getGoal);             // ดึงข้อมูล

module.exports = router;