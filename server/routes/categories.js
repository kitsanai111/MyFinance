// server/routes/category.js
const express = require('express');
const router = express.Router();
const { create, list, remove, update } = require('../controllers/categories'); // ✅ เพิ่ม update ตรงนี้
const { authCheck, adminCheck } = require('../middlewares/authCheck');

// ... route เดิมที่มีอยู่ ...
router.post('/category', authCheck, adminCheck, create);
router.get('/category', authCheck, list);
router.delete('/category/:id', authCheck, adminCheck, remove);

// ✅ เพิ่มบรรทัดนี้เพื่อรองรับการแก้ไข
router.put('/category/:id', authCheck, adminCheck, update);

module.exports = router;