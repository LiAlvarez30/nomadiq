import {
  tripCreateSchema,
  tripUpdateSchema,
  toPublicTrip
} from '../models/tripModel.js';

import {
  createTrip,
  getTripById,
  listTrips,
  updateTrip,
  deleteTrip
} from '../services/tripService.js';

// POST /api/trips
export async function create(req, res, next) {
  try {
    // el userId idealmente viene del token (req.user.sub), pero por ahora lo tomamos del body
    const data = tripCreateSchema.parse(req.body);
    const created = await createTrip(data);
    return res.status(201).json({ ok: true, trip: toPublicTrip(created) });
  } catch (err) {
    next(err);
  }
}

// GET /api/trips/:id
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const trip = await getTripById(id);
    if (!trip) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, trip: toPublicTrip(trip) });
  } catch (err) {
    next(err);
  }
}

// GET /api/trips?userId=...&status=planned&limit=20&startAfterId=...
export async function list(req, res, next) {
  try {
    const { userId, status, limit, startAfterId } = req.query;
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;

    const items = await listTrips({
      userId,
      status,
      limit: parsedLimit,
      startAfterId
    });

    return res.status(200).json({
      ok: true,
      count: items.length,
      trips: items.map(toPublicTrip)
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/trips/:id
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const data = tripUpdateSchema.parse(req.body);
    const updated = await updateTrip(id, data);
    if (!updated) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, trip: toPublicTrip(updated) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/trips/:id
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const ok = await deleteTrip(id);
    if (!ok) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, deleted: id });
  } catch (err) {
    next(err);
  }
}
