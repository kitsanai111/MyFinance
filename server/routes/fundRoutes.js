const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');
const { authCheck, adminCheck } = require('../middlewares/authCheck'); // สมมติว่าคุณมี adminCheck

// User ทั่วไปดูได้อย่างเดียว
router.get('/fund-types', authCheck, fundController.getAllFundTypes);

// Admin เท่านั้นที่จัดการได้
router.post('/fund-types', authCheck, adminCheck, fundController.createFundType);
router.put('/fund-types/:id', authCheck, adminCheck, fundController.updateFundType);
router.delete('/fund-types/:id', authCheck, adminCheck, fundController.deleteFundType);

module.exports = router;