const WorkoutsModel = require('../models/workouts.model');

class WorkoutsController {
  static async getAllWorkouts(req, res) {
    try {
      const workouts = await WorkoutsModel.findAll();
      res.json(workouts);
    } catch (err) {
      console.error('GET /api/workouts error:', err);
      res.status(500).json({ error: 'Failed to fetch workouts' });
    }
  }

  static async createWorkout(req, res) {
    try {
      const { name, ...data } = req.body;
      const workout = await WorkoutsModel.create(name, data);
      res.status(201).json(workout);
    } catch (err) {
      console.error('POST /api/workouts error:', err);
      res.status(500).json({ error: 'Failed to save workout' });
    }
  }

  static async deleteWorkout(req, res) {
    try {
      await WorkoutsModel.deleteById(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('DELETE /api/workouts error:', err);
      res.status(500).json({ error: 'Failed to delete workout' });
    }
  }
}

module.exports = WorkoutsController;
