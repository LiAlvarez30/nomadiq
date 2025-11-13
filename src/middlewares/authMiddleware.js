import { verifyToken } from '../utils/jwt.js';
import { getUserById } from '../services/userService.js';

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ ok: false, error: 'TOKEN_REQUIRED' });

    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);
    if (!user) return res.status(401).json({ ok: false, error: 'INVALID_USER' });

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}
