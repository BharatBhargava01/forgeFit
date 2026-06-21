const LogsModel = require('../models/logs.model');

class LogsController {
  static async getAllLogs(req, res) {
    try {
      const logs = await LogsModel.findAll();
      res.json(logs);
    } catch (err) {
      console.error('GET /api/logs error:', err);
      res.status(500).json({ error: 'Failed to fetch workout logs' });
    }
  }

  static async createLog(req, res) {
    try {
      const { name, ...data } = req.body;
      const log = await LogsModel.create(name, data);
      res.status(201).json(log);
    } catch (err) {
      console.error('POST /api/logs error:', err);
      res.status(500).json({ error: 'Failed to save workout log' });
    }
  }

  static async deleteLog(req, res) {
    try {
      await LogsModel.deleteById(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('DELETE /api/logs error:', err);
      res.status(500).json({ error: 'Failed to delete workout log' });
    }
  }
}

module.exports = LogsController;
