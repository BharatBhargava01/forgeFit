const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class LogsModel {
  static async findAll(userId) {
    const result = await pool.query(
      'SELECT * FROM workout_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      ...row.data,
      loggedAt: row.created_at,
    }));
  }

  static async create(name, data, userId) {
    const id = nanoid();
    await pool.query(
      'INSERT INTO workout_logs (id, name, data, user_id) VALUES ($1, $2, $3, $4)',
      [id, name || 'Workout Log', data, userId]
    );
    return { id, name, ...data, loggedAt: new Date().toISOString() };
  }

  static async deleteById(id, userId) {
    await pool.query('DELETE FROM workout_logs WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}

module.exports = LogsModel;
