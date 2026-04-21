// server/routes/users.js
const express = require('express');
const router = express.Router();

// นำเข้า Controller ที่เราสร้างไว้ข้อ 1
const { 
    listUsers, 
    changeStatus, 
    changeRole, 
    removeUser 
} = require("../controllers/users");

// @ENDPOINT http://localhost:5001/api/users
router.get('/users', listUsers);

// @ENDPOINT http://localhost:5001/api/change-status
router.post('/change-status', changeStatus);

// @ENDPOINT http://localhost:5001/api/change-role
router.post('/change-role', changeRole);

// @ENDPOINT http://localhost:5001/api/users/:id
router.delete('/users/:id', removeUser);

module.exports = router;