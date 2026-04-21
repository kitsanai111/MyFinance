const express = require('express')
const router = express.Router();

const { createProfile, listProfile } = require("../controllers/deductionprofile")
router.post('/deductionProfile', createProfile);
router.get('/deductionProfile/:id',listProfile)

module.exports = router;