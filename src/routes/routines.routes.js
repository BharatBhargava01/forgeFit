const express = require('express');
const router = express.Router();
const RoutinesController = require('../controllers/routines.controller');

router.get('/', RoutinesController.getAllRoutines);
router.post('/', RoutinesController.createRoutine);
router.delete('/:id', RoutinesController.deleteRoutine);

module.exports = router;
