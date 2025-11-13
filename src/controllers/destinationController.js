import {
  destinationCreateSchema,
  destinationUpdateSchema,
  toPublicDestination
} from '../models/destinationModel.js';
import {
  createDestination,
  getDestinationById,
  listDestinations,
  updateDestination,
  deleteDestination
} from '../services/destinationService.js';

// POST /api/destinations
export async function create(req, res, next) {
  try {
    const data = destinationCreateSchema.parse(req.body);
    const created = await createDestination(data);
    return res.status(201).json({ ok: true, destination: toPublicDestination(created) });
  } catch (err) {
    next(err);
  }
}

// GET /api/destinations/:id
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const dest = await getDestinationById(id);
    if (!dest) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, destination: toPublicDestination(dest) });
  } catch (err) {
    next(err);
  }
}

// GET /api/destinations?country=AR&tag=playa&limit=20&startAfterId=...
export async function list(req, res, next) {
  try {
    const { country, tag, limit, startAfterId } = req.query;
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    const items = await listDestinations({
      country,
      tag,
      limit: parsedLimit,
      startAfterId
    });
    return res.status(200).json({
      ok: true,
      count: items.length,
      destinations: items.map(toPublicDestination)
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/destinations/:id
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const data = destinationUpdateSchema.parse(req.body);
    const updated = await updateDestination(id, data);
    if (!updated) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, destination: toPublicDestination(updated) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/destinations/:id
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const ok = await deleteDestination(id);
    if (!ok) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, deleted: id });
  } catch (err) {
    next(err);
  }
}
