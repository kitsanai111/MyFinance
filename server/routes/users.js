const express = require('express');
const router = express.Router();
const { listUsers, changeStatus, changeRole, removeUser } = require('../controllers/users');
const { authCheck, adminCheck } = require('../middlewares/authCheck'); // อย่าลืมใส่ Middleware นะครับ

router.get('/users', authCheck, adminCheck, listUsers);
router.post('/change-status', authCheck, adminCheck, changeStatus);
router.post('/change-role', authCheck, adminCheck, changeRole);
router.delete('/users/:id', authCheck, adminCheck, removeUser);

module.exports = router;