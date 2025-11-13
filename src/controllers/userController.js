import { getUserById } from '../services/userService.js';
import { toPublicUser } from '../models/userModel.js';

export async function me(req, res, next) {
  try {
    const user = await getUserById(req.user.id);
    return res.status(200).json({ ok: true, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}
