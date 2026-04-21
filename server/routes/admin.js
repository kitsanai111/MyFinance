const express = require('express'); 
const router = express.Router();

const { authCheck, adminCheck, superAdminCheck } = require('../middlewares/authCheck');
const { listUsers, changeUserStatus, removeUser, createAdminBySuper,getActivityLogs } = require('../controllers/adminController');

router.get('/users', authCheck, adminCheck, listUsers);
router.post('/change-status', authCheck, adminCheck, changeUserStatus);
router.delete('/users/:id', authCheck, adminCheck, removeUser);
router.get('/logs', authCheck, adminCheck, getActivityLogs);

// เฉพาะ Superadmin เท่านั้น (ใช้จัดการ Admin)
router.post('/create-admin', authCheck, superAdminCheck, createAdminBySuper);
module.exports = router;