// src/pages/TripsPage.jsx
//
// Esta página muestra la lista de viajes del usuario logueado,
// actuando como un mini dashboard de "Mis viajes".
//
// Se conecta al backend real usando el endpoint protegido:
//   GET /api/trips
// que requiere el header:
//   Authorization: Bearer <token>
//
// En esta versión:
//  - Leemos el token y el usuario desde AuthContext.
//  - Llamamos al backend con apiClient (axios).
//  - Manejamos estados de carga, error y lista vacía.
//  - Mostramos los viajes en tarjetas modernas con Tailwind.
//  - Incluimos un botón claro para crear un nuevo viaje.
//  - Damos acceso directo al detalle de cada viaje (TripDetailPage).

import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext.jsx';

// ---------------------------------------------------------------------------
// Función utilitaria: formatear fechas a un formato legible en español.
// ---------------------------------------------------------------------------
function formatDate(dateString) {
  if (!dateString) return 'N/D';

  // Usamos Intl.DateTimeFormat para mostrar algo tipo "10 oct 2025".
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

// ---------------------------------------------------------------------------
// Función utilitaria: formatear presupuesto como moneda (ARS).
// ---------------------------------------------------------------------------
function formatBudget(amount) {
  if (amount === null || amount === undefined) return 'Sin definir';

  const number = Number(amount);
  if (Number.isNaN(number)) return 'Sin definir';

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(number);
}

// ---------------------------------------------------------------------------
// Pequeño componente para mostrar una "pill" con el estado del viaje.
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
  // Normalizamos el texto por las dudas.
  const value = (status || '').toLowerCase();

  let label = 'Sin estado';
  let classes = 'bg-slate-800 text-slate-200 border border-slate-600';

  if (value === 'planned') {
    label = 'Planificado';
    classes =
      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40';
  } else if (value === 'in_progress' || value === 'in-progress') {
    label = 'En curso';
    classes = 'bg-amber-500/15 text-amber-300 border border-amber-500/40';
  } else if (value === 'completed') {
    label = 'Completado';
    classes = 'bg-sky-500/15 text-sky-300 border border-sky-500/40';
  } else if (value === 'cancelled') {
    label = 'Cancelado';
    classes = 'bg-rose-500/15 text-rose-300 border border-rose-500/40';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Componente principal: TripsPage
// ---------------------------------------------------------------------------
function TripsPage() {
  // Leemos token y usuario desde el contexto de autenticación.
  // El endpoint /api/trips requiere:
  //   Authorization: Bearer <token>
  const { token, user } = useContext(AuthContext);

  // Estados para manejar la UX de la pantalla.
  const [trips, setTrips] = useState([]);       // Lista de viajes.
  const [loading, setLoading] = useState(true); // Mientras hablamos con el backend.
  const [error, setError] = useState(null);     // Mensaje de error en texto humano.

  // -------------------------------------------------------------------------
  // useEffect: cargar los viajes al entrar a la página.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Si por alguna razón llegamos acá sin token (algo raro, porque la ruta
    // ya está protegida por PrivateRoute), dejamos un mensaje de error
    // y no intentamos llamar al backend.
    if (!token) {
      setError('No hay token de autenticación. Volvé a iniciar sesión.');
      setLoading(false);
      return;
    }

    // Definimos una función async interna para poder usar await.
    const fetchTrips = async () => {
      try {
        // Limpiamos estado previo.
        setLoading(true);
        setError(null);

        // Llamada real al backend:
        //   GET /api/trips
        // El backend devuelve un objeto del estilo:
        // {
        //   ok: true,
        //   count: N,
        //   trips: [ { id, title, startDate, endDate, budget, status, ... }, ... ]
        // }
        const response = await apiClient.get('/api/trips', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { trips: tripsFromApi } = response.data || {};

        // Aseguramos que trips sea siempre un array.
        const safeTrips = Array.isArray(tripsFromApi) ? tripsFromApi : [];

        // Ordenamos los viajes para que los más recientes aparezcan primero.
        // Priorizamos startDate; si no existe, usamos createdAt.
        const sorted = [...safeTrips].sort((a, b) => {
          const dateA = new Date(a.startDate || a.createdAt || 0);
          const dateB = new Date(b.startDate || b.createdAt || 0);
          return dateB - dateA;
        });

        setTrips(sorted);

        // Log de apoyo para desarrollo.
        console.log('Viajes recibidos desde /api/trips:', response.data);
      } catch (err) {
        console.error('Error al cargar los viajes:', err);

        // Si el backend respondió con error (401, 500, etc.)
        if (err.response && err.response.data) {
          const apiErrorCode = err.response.data.error;

          // Podés ajustar estos mensajes según los códigos de tu backend.
          if (apiErrorCode === 'UNAUTHORIZED' || apiErrorCode === 'INVALID_TOKEN') {
            setError(
              'Tu sesión no es válida o expiró. Probá volver a iniciar sesión.'
            );
          } else {
            setError(
              `El servidor devolvió un error al cargar tus viajes: ${apiErrorCode}`
            );
          }
        } else {
          // Si directamente no hubo respuesta (servidor caído, problema de red, etc.).
          setError(
            'No se pudo conectar con el servidor para obtener tus viajes.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    // Disparamos la carga de viajes.
    fetchTrips();
  }, [token]);

  // -------------------------------------------------------------------------
  // Render principal de la página.
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Encabezado tipo dashboard */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
            Mis viajes
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            {user && user.name
              ? `Hola, ${user.name}. Acá ves todos los viajes que creaste con NomadIQ.`
              : 'Acá vas a ver todos los viajes asociados a tu cuenta.'}
          </p>
        </div>

        {/* Acción principal: crear nuevo viaje */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/trips/new"
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs md:text-sm font-medium text-emerald-950 shadow-md shadow-emerald-900/40 hover:bg-emerald-400 transition"
          >
            + Crear nuevo viaje
          </Link>
        </div>
      </header>

      {/* Bloque de estados especiales: loading, error, vacío */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
          <p className="animate-pulse">
            Cargando tus viajes desde el backend...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-700 bg-red-900/40 p-4 text-sm text-red-100">
          <p className="font-medium mb-1">No pudimos cargar tus viajes 😕</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && trips.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200 space-y-2">
          <p className="font-medium">Todavía no tenés viajes creados.</p>
          <p className="text-slate-400">
            Cuando empieces a planificar un viaje con NomadIQ, va a aparecer
            acá con sus fechas, presupuesto y estado.
          </p>
          <div className="pt-2">
            <Link
              to="/trips/new"
              className="inline-flex items-center rounded-full border border-emerald-400/80 bg-transparent px-4 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10 transition"
            >
              Crear mi primer viaje
            </Link>
          </div>
        </div>
      )}

      {/* Listado de viajes en tarjetas modernas */}
      {!loading && !error && trips.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs text-slate-400">
            {trips.length === 1
              ? 'Tenés 1 viaje registrado.'
              : `Tenés ${trips.length} viajes registrados.`}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <article
                key={trip.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-colors"
              >
                {/* Encabezado de la tarjeta: título + estado */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-base font-semibold text-slate-50 line-clamp-2">
                    {trip.title || 'Viaje sin título'}
                  </h2>
                  <StatusBadge status={trip.status} />
                </div>

                {/* Cuerpo de la tarjeta: fechas, presupuesto, intereses */}
                <div className="space-y-1 text-xs text-slate-300">
                  {trip.startDate && trip.endDate && (
                    <p>
                      <span className="text-slate-400">Fechas:&nbsp;</span>
                      <span className="font-medium text-slate-200">
                        {formatDate(trip.startDate)} →{' '}
                        {formatDate(trip.endDate)}
                      </span>
                    </p>
                  )}

                  {trip.budget !== undefined && (
                    <p>
                      <span className="text-slate-400">
                        Presupuesto estimado:&nbsp;
                      </span>
                      <span className="font-medium text-slate-200">
                        {formatBudget(trip.budget)}
                      </span>
                    </p>
                  )}

                  {Array.isArray(trip.interests) &&
                    trip.interests.length > 0 && (
                      <p>
                        <span className="text-slate-400">
                          Intereses:&nbsp;
                        </span>
                        <span className="font-medium text-slate-200">
                          {trip.interests.join(' • ')}
                        </span>
                      </p>
                    )}
                </div>

                {/* Pie de la tarjeta: info de creación + acceso al detalle */}
                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Creado:&nbsp;
                    {trip.createdAt ? formatDate(trip.createdAt) : 'N/D'}
                  </span>

                  {/* Link a la pantalla de detalle: /trips/:id → TripDetailPage */}
                  <Link
                    to={`/trips/${trip.id}`}
                    className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 hover:underline underline-offset-2 transition"
                  >
                    Ver detalle
                    <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default TripsPage;
