const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class RoutinesModel {
  static async findAll() {
    const result = await pool.query('SELECT * FROM routines ORDER BY created_at DESC');
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
      'INSERT INTO routines (id, name, data) VALUES ($1, $2, $3)',
      [id, name || 'Untitled Routine', data]
    );
    return { id, name, ...data, savedAt: new Date().toISOString() };
  }

  static async deleteById(id) {
    await pool.query('DELETE FROM routines WHERE id = $1', [id]);
  }
}

module.exports = RoutinesModel;
