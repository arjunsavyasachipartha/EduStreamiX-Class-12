const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyControllers');

router.get('/', studyController.getStudy);
router.post('/generate-test', studyController.generateTest);
router.post('/evaluate-theory', studyController.evaluateTheoryTest);

module.exports = router;