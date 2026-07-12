const { pool } = require('../config/database');
const { nanoid } = require('../utils/id');

class UsersModel {
  static async create({ name, email, passwordHash, avatarUrl, provider = 'local', providerId = null }) {
    const id = nanoid();
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, avatar_url, provider, provider_id, profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, avatar_url, provider, profile, created_at`,
      [id, name, email, passwordHash, avatarUrl, provider, providerId, '{}']
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, provider, profile, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateProfile(id, profile) {
    const result = await pool.query(
      `UPDATE users
       SET profile = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, avatar_url, provider, profile, created_at`,
      [JSON.stringify(profile), id]
    );
    return result.rows[0];
  }

  static async findByProvider(provider, providerId) {
    const result = await pool.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', [provider, providerId]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }

  /**
   * Automatically assign any database records without a user_id to this user,
   * but ONLY if this is the first and only user in the database.
   */
  static async claimOrphanRecords(userId) {
    try {
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      const count = parseInt(userCountRes.rows[0].count, 10);
      
      if (count === 1) {
        console.log(`[Migration] First user detected (${userId}). Claiming existing orphan records...`);
        
        const updates = [
          pool.query('UPDATE workouts SET user_id = $1 WHERE user_id IS NULL', [userId]),
          pool.query('UPDATE routines SET user_id = $1 WHERE user_id IS NULL', [userId]),
          pool.query('UPDATE custom_exercises SET user_id = $1 WHERE user_id IS NULL', [userId]),
          pool.query('UPDATE workout_logs SET user_id = $1 WHERE user_id IS NULL', [userId]),
        ];
        
        const results = await Promise.allSettled(updates);
        results.forEach((res, i) => {
          if (res.status === 'rejected') {
            console.error(`[Migration] Failed updating table index ${i}:`, res.reason);
          }
        });
        
        console.log('[Migration] Orphan record claim complete.');
      }
    } catch (err) {
      console.error('[Migration] Error in claimOrphanRecords:', err);
    }
  }
}

module.exports = UsersModel;
