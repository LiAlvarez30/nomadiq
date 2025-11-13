import {
  activityCreateSchema,
  activityUpdateSchema,
  toPublicActivity
} from '../models/activityModel.js';
import {
  createActivity,
  getActivityById,
  listActivities,
  updateActivity,
  deleteActivity
} from '../services/activityService.js';

// POST /api/activities
export async function create(req, res, next) {
  try {
    const data = activityCreateSchema.parse(req.body);
    const created = await createActivity(data);
    return res.status(201).json({ ok: true, activity: toPublicActivity(created) });
  } catch (err) {
    next(err);
  }
}

// GET /api/activities/:id
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const a = await getActivityById(id);
    if (!a) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, activity: toPublicActivity(a) });
  } catch (err) {
    next(err);
  }
}

// GET /api/activities?destinationId=...&category=...&limit=20&startAfterId=...
export async function list(req, res, next) {
  try {
    const { destinationId, category, limit, startAfterId } = req.query;
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    const items = await listActivities({
      destinationId,
      category,
      limit: parsedLimit,
      startAfterId
    });
    return res.status(200).json({
      ok: true,
      count: items.length,
      activities: items.map(toPublicActivity)
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/activities/:id
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const data = activityUpdateSchema.parse(req.body);
    const updated = await updateActivity(id, data);
    if (!updated) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, activity: toPublicActivity(updated) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/activities/:id
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const ok = await deleteActivity(id);
    if (!ok) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, deleted: id });
  } catch (err) {
    next(err);
  }
}
