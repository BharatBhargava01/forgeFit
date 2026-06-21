const express = require('express');
const router = express.Router();
const ExercisesController = require('../controllers/exercises.controller');

router.get('/custom', ExercisesController.getAllExercises);
router.post('/custom', ExercisesController.createExercise);
router.delete('/custom/:id', ExercisesController.deleteExercise);

module.exports = router;
