const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class WorkoutsModel {
  static async findAll(userId) {
    const result = await pool.query(
      'SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      ...row.data,
      savedAt: row.created_at,
    }));
  }

  static async create(name, data, userId) {
    const id = nanoid();
    await pool.query(
      'INSERT INTO workouts (id, name, data, user_id) VALUES ($1, $2, $3, $4)',
      [id, name || 'Untitled Workout', data, userId]
    );
    return { id, name, ...data, savedAt: new Date().toISOString() };
  }

  static async deleteById(id, userId) {
    await pool.query('DELETE FROM workouts WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}

module.exports = WorkoutsModel;
