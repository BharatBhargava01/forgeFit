const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class LogsModel {
  static async findAll() {
    const result = await pool.query('SELECT * FROM workout_logs ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      ...row.data,
      loggedAt: row.created_at,
    }));
  }

  static async create(name, data) {
    const id = nanoid();
    await pool.query(
      'INSERT INTO workout_logs (id, name, data) VALUES ($1, $2, $3)',
      [id, name || 'Workout Log', data]
    );
    return { id, name, ...data, loggedAt: new Date().toISOString() };
  }

  static async deleteById(id) {
    await pool.query('DELETE FROM workout_logs WHERE id = $1', [id]);
  }
}

module.exports = LogsModel;
