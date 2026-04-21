const express = require('express')
const router = express.Router()  

const { calculateTax } = require('../controllers/taxcalculate')
router.post('/calculate-Tax', calculateTax)




module.exports = router

