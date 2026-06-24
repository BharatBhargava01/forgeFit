const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class ExercisesModel {
  static async findAll(userId) {
    const result = await pool.query(
      'SELECT * FROM custom_exercises WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      muscles: row.muscles,
      equipment: row.equipment,
      difficulty: row.difficulty,
      type: row.type,
      description: row.description,
      isCustom: true,
      createdAt: row.created_at,
      savedAt: row.created_at,
    }));
  }

  static async create(name, data, userId) {
    const id = nanoid();
    await pool.query(
      `INSERT INTO custom_exercises 
       (id, name, muscles, equipment, difficulty, type, description, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id, 
        name, 
        data.muscles || [], 
        data.equipment || 'Bodyweight', 
        data.difficulty || 2, 
        data.type || 'compound', 
        data.description || '',
        userId
      ]
    );
    return {
      id,
      name,
      ...data,
      isCustom: true,
      createdAt: new Date().toISOString(),
      savedAt: new Date().toISOString()
    };
  }

  static async deleteById(id, userId) {
    await pool.query('DELETE FROM custom_exercises WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}

module.exports = ExercisesModel;
