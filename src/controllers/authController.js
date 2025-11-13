import { userRegisterSchema, userLoginSchema, toPublicUser } from '../models/userModel.js';
import { createUser, validateCredentials } from '../services/userService.js';
import { signToken } from '../utils/jwt.js';

export async function register(req, res, next) {
  try {
    const data = userRegisterSchema.parse(req.body);
    const newUser = await createUser(data);
    const token = signToken({ sub: newUser.id, email: newUser.email, role: newUser.role });
    return res.status(201).json({ ok: true, user: newUser, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = userLoginSchema.parse(req.body);
    const user = await validateCredentials(data.email, data.password);
    if (!user) return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return res.status(200).json({ ok: true, user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
}
