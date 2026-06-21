const express = require('express');
const router = express.Router();
const WorkoutsController = require('../controllers/workouts.controller');
const AIController = require('../controllers/ai.controller');

router.get('/', WorkoutsController.getAllWorkouts);
router.post('/', WorkoutsController.createWorkout);
router.post('/ai-generate', AIController.generateAIWorkout);
router.delete('/:id', WorkoutsController.deleteWorkout);

module.exports = router;
