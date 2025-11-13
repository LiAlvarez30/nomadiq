import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES = process.env.TOKEN_EXPIRES || '1d';

export function signToken(payload) {
  if (!JWT_SECRET) throw new Error('Falta JWT_SECRET en .env');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
}

export function verifyToken(token) {
  if (!JWT_SECRET) throw new Error('Falta JWT_SECRET en .env');
  return jwt.verify(token, JWT_SECRET);
}
