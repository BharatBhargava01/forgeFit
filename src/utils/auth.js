const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { cookies } = require('next/headers');

const JWT_SECRET = process.env.JWT_SECRET || 'forgefit-jwt-secret-key-change-me';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

async function getUserIdFromRequest() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  getUserIdFromRequest,
};
