const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const LogController = require('../controllers/logController');

router.post('/', authMiddleware, LogController.createLog);
router.get('/mine', authMiddleware, LogController.getLogsForUser);
router.delete('/:id', LogController.deleteLogById);

module.exports = router;