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
      chest_volume: parseFloat(row.chest_volume) || 0,
      back_volume: parseFloat(row.back_volume) || 0,
      shoulders_volume: parseFloat(row.shoulders_volume) || 0,
      biceps_volume: parseFloat(row.biceps_volume) || 0,
      triceps_volume: parseFloat(row.triceps_volume) || 0,
      quads_volume: parseFloat(row.quads_volume) || 0,
      hamstrings_volume: parseFloat(row.hamstrings_volume) || 0,
      glutes_volume: parseFloat(row.glutes_volume) || 0,
      calves_volume: parseFloat(row.calves_volume) || 0,
      abs_volume: parseFloat(row.abs_volume) || 0,
      obliques_volume: parseFloat(row.obliques_volume) || 0,
      loggedAt: row.created_at,
    }));
  }

  static async create(name, data, userId) {
    const id = nanoid();

    let chest = 0, back = 0, shoulders = 0, biceps = 0, triceps = 0;
    let quads = 0, hamstrings = 0, glutes = 0, calves = 0;
    let abs = 0, obliques = 0;

    if (data && data.exercises) {
      data.exercises.forEach(ex => {
        let exVolume = 0;
        if (ex.sets) {
          ex.sets.forEach(s => {
            if (s.completed) {
              const w = parseFloat(s.weight) || (ex.equipment === 'Bodyweight' ? 10 : 0);
              exVolume += w;
            }
          });
        }
        if (ex.muscles) {
          ex.muscles.forEach(m => {
            const muscle = m.toLowerCase();
            if (muscle === 'chest') chest += exVolume;
            else if (muscle === 'back') back += exVolume;
            else if (muscle === 'shoulders') shoulders += exVolume;
            else if (muscle === 'biceps') biceps += exVolume;
            else if (muscle === 'triceps') triceps += exVolume;
            else if (muscle === 'quads') quads += exVolume;
            else if (muscle === 'hamstrings') hamstrings += exVolume;
            else if (muscle === 'glutes') glutes += exVolume;
            else if (muscle === 'calves') calves += exVolume;
            else if (muscle === 'abs') abs += exVolume;
            else if (muscle === 'obliques') obliques += exVolume;
            else if (muscle === 'core') {
              abs += exVolume; // Core maps to Abs
            }
          });
        }
      });
    }

    const createdAt = data && data.date ? new Date(data.date) : new Date();

    await pool.query(
      `INSERT INTO workout_logs (
        id, name, data, user_id, 
        chest_volume, back_volume, shoulders_volume, biceps_volume, triceps_volume,
        quads_volume, hamstrings_volume, glutes_volume, calves_volume, abs_volume, obliques_volume,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id, name || 'Workout Log', data, userId,
        chest, back, shoulders, biceps, triceps,
        quads, hamstrings, glutes, calves, abs, obliques,
        createdAt
      ]
    );

    return { 
      id, name, ...data, 
      chest_volume: chest, back_volume: back, shoulders_volume: shoulders, 
      biceps_volume: biceps, triceps_volume: triceps, quads_volume: quads, 
      hamstrings_volume: hamstrings, glutes_volume: glutes, calves_volume: calves, 
      abs_volume: abs, obliques_volume: obliques,
      loggedAt: createdAt.toISOString() 
    };
  }

  static async update(id, name, data, userId) {
    let chest = 0, back = 0, shoulders = 0, biceps = 0, triceps = 0;
    let quads = 0, hamstrings = 0, glutes = 0, calves = 0;
    let abs = 0, obliques = 0;

    if (data && data.exercises) {
      data.exercises.forEach(ex => {
        let exVolume = 0;
        if (ex.sets) {
          ex.sets.forEach(s => {
            if (s.completed) {
              const w = parseFloat(s.weight) || (ex.equipment === 'Bodyweight' ? 10 : 0);
              exVolume += w;
            }
          });
        }
        if (ex.muscles) {
          ex.muscles.forEach(m => {
            const muscle = m.toLowerCase();
            if (muscle === 'chest') chest += exVolume;
            else if (muscle === 'back') back += exVolume;
            else if (muscle === 'shoulders') shoulders += exVolume;
            else if (muscle === 'biceps') biceps += exVolume;
            else if (muscle === 'triceps') triceps += exVolume;
            else if (muscle === 'quads') quads += exVolume;
            else if (muscle === 'hamstrings') hamstrings += exVolume;
            else if (muscle === 'glutes') glutes += exVolume;
            else if (muscle === 'calves') calves += exVolume;
            else if (muscle === 'abs') abs += exVolume;
            else if (muscle === 'obliques') obliques += exVolume;
            else if (muscle === 'core') {
              abs += exVolume;
            }
          });
        }
      });
    }

    const updatedAt = data && data.date ? new Date(data.date) : new Date();

    await pool.query(
      `UPDATE workout_logs 
       SET name = $2, data = $3, 
           chest_volume = $4, back_volume = $5, shoulders_volume = $6, biceps_volume = $7, triceps_volume = $8,
           quads_volume = $9, hamstrings_volume = $10, glutes_volume = $11, calves_volume = $12, abs_volume = $13, obliques_volume = $14,
           created_at = $15
       WHERE id = $1 AND user_id = $16`,
      [
        id, name || 'Workout Log', data,
        chest, back, shoulders, biceps, triceps,
        quads, hamstrings, glutes, calves, abs, obliques,
        updatedAt, userId
      ]
    );

    return { 
      id, name, ...data, 
      chest_volume: chest, back_volume: back, shoulders_volume: shoulders, 
      biceps_volume: biceps, triceps_volume: triceps, quads_volume: quads, 
      hamstrings_volume: hamstrings, glutes_volume: glutes, calves_volume: calves, 
      abs_volume: abs, obliques_volume: obliques,
      loggedAt: updatedAt.toISOString() 
    };
  }

  static async deleteById(id, userId) {
    await pool.query('DELETE FROM workout_logs WHERE id = $1 AND user_id = $2', [id, userId]);
  }
}

module.exports = LogsModel;
