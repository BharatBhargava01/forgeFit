const express = require('express');
const router = express.Router();
const LogsController = require('../controllers/logs.controller');

router.get('/', LogsController.getAllLogs);
router.post('/', LogsController.createLog);
router.delete('/:id', LogsController.deleteLog);

module.exports = router;
