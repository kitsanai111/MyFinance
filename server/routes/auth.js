const express = require('express')
const router = express.Router()
const { register, login, currentUser, logout, resetPasswordForgot } = require('../controllers/auth')
const { authCheck, adminCheck } = require('../middlewares/authCheck')

router.post('/register', register)
router.post('/login', login)
router.post('/current-user', authCheck, currentUser)
router.post('/current-admin', authCheck, adminCheck, currentUser)
router.post('/logout', authCheck, logout)
router.post('/forgot-password', resetPasswordForgot)

module.exports = router