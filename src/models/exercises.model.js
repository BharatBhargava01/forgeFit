const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class ExercisesModel {
  static async findAll() {
    const result = await pool.query('SELECT * FROM custom_exercises ORDER BY created_at DESC');
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

  static async create(name, data) {
    const id = nanoid();
    await pool.query(
      `INSERT INTO custom_exercises 
       (id, name, muscles, equipment, difficulty, type, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id, 
        name, 
        data.muscles || [], 
        data.equipment || 'Bodyweight', 
        data.difficulty || 2, 
        data.type || 'compound', 
        data.description || ''
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

  static async deleteById(id) {
    await pool.query('DELETE FROM custom_exercises WHERE id = $1', [id]);
  }
}

module.exports = ExercisesModel;
