const RoutinesModel = require('../models/routines.model');

class RoutinesController {
  static async getAllRoutines(req, res) {
    try {
      const routines = await RoutinesModel.findAll();
      res.json(routines);
    } catch (err) {
      console.error('GET /api/routines error:', err);
      res.status(500).json({ error: 'Failed to fetch routines' });
    }
  }

  static async createRoutine(req, res) {
    try {
      const { name, ...data } = req.body;
      const routine = await RoutinesModel.create(name, data);
      res.status(201).json(routine);
    } catch (err) {
      console.error('POST /api/routines error:', err);
      res.status(500).json({ error: 'Failed to save routine' });
    }
  }

  static async deleteRoutine(req, res) {
    try {
      await RoutinesModel.deleteById(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('DELETE /api/routines error:', err);
      res.status(500).json({ error: 'Failed to delete routine' });
    }
  }
}

module.exports = RoutinesController;
