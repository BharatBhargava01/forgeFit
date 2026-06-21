const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class WorkoutsModel {
  static async findAll() {
    const result = await pool.query('SELECT * FROM workouts ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      ...row.data,
      savedAt: row.created_at,
    }));
  }

  static async create(name, data) {
    const id = nanoid();
    await pool.query(
      'INSERT INTO workouts (id, name, data) VALUES ($1, $2, $3)',
      [id, name || 'Untitled Workout', data]
    );
    return { id, name, ...data, savedAt: new Date().toISOString() };
  }

  static async deleteById(id) {
    await pool.query('DELETE FROM workouts WHERE id = $1', [id]);
  }
}

module.exports = WorkoutsModel;
