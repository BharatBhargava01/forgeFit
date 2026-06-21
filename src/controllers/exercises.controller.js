const ExercisesModel = require('../models/exercises.model');

class ExercisesController {
  static async getAllExercises(req, res) {
    try {
      const exercises = await ExercisesModel.findAll();
      res.json(exercises);
    } catch (err) {
      console.error('GET /api/exercises/custom error:', err);
      res.status(500).json({ error: 'Failed to fetch custom exercises' });
    }
  }

  static async createExercise(req, res) {
    try {
      const { name, ...data } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Exercise name is required' });
      }
      const exercise = await ExercisesModel.create(name, data);
      res.status(201).json(exercise);
    } catch (err) {
      console.error('POST /api/exercises/custom error:', err);
      res.status(500).json({ error: 'Failed to save custom exercise' });
    }
  }

  static async deleteExercise(req, res) {
    try {
      await ExercisesModel.deleteById(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('DELETE /api/exercises/custom error:', err);
      res.status(500).json({ error: 'Failed to delete custom exercise' });
    }
  }
}

module.exports = ExercisesController;
