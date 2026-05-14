const express = require('express');
const router = express.Router();
const {  updateProfile, updateUsername } = require('../controllers/users');
const { authCheck, adminCheck } = require('../middlewares/authCheck'); 

router.put('/update-username', authCheck, adminCheck, updateUsername);
router.put('/update-profile', authCheck, updateProfile);
module.exports = router;