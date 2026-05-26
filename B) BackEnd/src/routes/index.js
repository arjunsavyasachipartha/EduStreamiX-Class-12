const express = require('express');
const router = express.Router();

router.use('/study', require('./!studyRoutes'))

module.exports = router;