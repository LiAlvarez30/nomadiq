// src/pages/TripsPage.jsx

// Esta página muestra la lista de viajes del usuario logueado.
// Se conecta al backend real usando el endpoint protegido:
//   GET /api/trips
// que requiere el header:
//   Authorization: Bearer <token>
//
// Acá vamos a:
// - Leer el token desde AuthContext.
// - Llamar al backend con axios (apiClient).
// - Manejar estados de carga, error y vacío.
// - Mostrar los viajes en tarjetas modernas con Tailwind.

import { useContext, useEffect, useState } from 'react';

// Cliente axios configurado con baseURL = http://localhost:3000
import apiClient from '../services/apiClient';

// Contexto de autenticación, desde acá obtenemos el token del usuario.
import { AuthContext } from '../context/AuthContext.jsx';

//Esto le dice al componente que vamos a usar navegación interna de React Router, sin recargar la página.
import { Link } from "react-router-dom";


// Pequeñas funciones de ayuda para formatear fechas y dinero
function formatDate(dateString) {
  if (!dateString) return 'Fecha no disponible';

  // Usamos Intl para mostrar la fecha en un formato amigable en español.
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatCurrency(amount) {
  if (amount == null) return 'Sin presupuesto';

  // Formateamos el presupuesto como moneda (pesos argentinos por defecto).
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Pequeño componente para mostrar una "pill" con el estado del viaje.
function StatusBadge({ status }) {
  // Normalizamos el texto por las dudas.
  const value = (status || '').toLowerCase();

  let label = 'Sin estado';
  let classes = 'bg-slate-800 text-slate-200';

  if (value === 'planned') {
    label = 'Planificado';
    classes = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40';
  } else if (value === 'in-progress') {
    label = 'En curso';
    classes = 'bg-amber-500/15 text-amber-300 border border-amber-500/40';
  } else if (value === 'completed') {
    label = 'Completado';
    classes = 'bg-sky-500/15 text-sky-300 border border-sky-500/40';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function TripsPage() {
  // -------------------------------------------------------
  // 1) Leemos el token desde el contexto de autenticación
  // -------------------------------------------------------
  //
  // El endpoint /api/trips requiere:
  //   Authorization: Bearer <token>
  //
  // Ese token lo guardamos en AuthContext cuando el usuario hace login.
  const { token, user } = useContext(AuthContext);

  // -------------------------------------------------------
  // 2) Estados para manejar la UX de la pantalla
  // -------------------------------------------------------
  const [trips, setTrips] = useState([]);       // Lista de viajes.
  const [loading, setLoading] = useState(true); // Mientras hablamos con el backend.
  const [error, setError] = useState(null);     // Mensaje de error en texto humano.

  // -------------------------------------------------------
  // 3) useEffect para cargar los viajes al entrar a la página
  // -------------------------------------------------------
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
        setError(null);
        setLoading(true);

        // Llamada REAL al endpoint protegido:
        //   GET /api/trips
        //
        // Notá el header:
        //   Authorization: Bearer <token>
        //
        const response = await apiClient.get('/api/trips', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // El backend debería devolver algo como:
        // {
        //   ok: true,
        //   count: N,
        //   trips: [ { id, title, startDate, endDate, budget, status, ... }, ... ]
        // }
        const { trips: tripsFromApi } = response.data;

        setTrips(tripsFromApi || []);

        // Solo para debug mientras desarrollamos:
        console.log('Viajes recibidos desde /api/trips:', response.data);
      } catch (err) {
        console.error('Error al cargar los viajes:', err);

        // Si el backend respondió con error (401, 500, etc.)
        if (err.response && err.response.data) {
          const apiErrorCode = err.response.data.error;

          // Podés ajustar estos mensajes según los códigos de tu backend.
          if (apiErrorCode === 'UNAUTHORIZED' || apiErrorCode === 'INVALID_TOKEN') {
            setError('Tu sesión no es válida o expiró. Probá volver a iniciar sesión.');
          } else {
            setError(`El servidor devolvió un error al cargar tus viajes: ${apiErrorCode}`);
          }
        } else {
          // Si directamente no hubo respuesta (servidor caído, problema de red, etc.).
          setError('No se pudo conectar con el servidor para obtener tus viajes.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Ejecutamos la función async definida arriba.
    fetchTrips();
  }, [token]); // Si el token cambia (por ejemplo, nuevo login), recargamos los viajes.

  // -------------------------------------------------------
  // 4) Render de la pantalla
  // -------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Encabezado de la sección */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">
          Tus viajes ✈️
        </h1>
        <p className="text-sm text-slate-300">
          {user
            ? `Hola, ${user.name}. Acá vas a ver todos los viajes que creaste con NomadIQ.`
            : 'Acá vas a ver todos los viajes creados con tu cuenta.'}
        </p>
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
          <p className="font-medium mb-2">
            Todavía no tenés viajes creados.
          </p>
          <p className="text-slate-400">
            Cuando empieces a planificar un viaje con NomadIQ, va a aparecer acá
            con sus fechas, presupuesto y estado. Más adelante vamos a agregar
            un botón para crear un viaje nuevo desde esta misma pantalla.
          </p>
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
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm hover:border-emerald-500/60 hover:shadow-emerald-500/10 transition-colors"
              >
                {/* Encabezado de la tarjeta: título + estado */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-base font-semibold text-slate-50 line-clamp-2">
                    {trip.title || 'Viaje sin título'}
                  </h2>
                  <StatusBadge status={trip.status} />
                </div>

                {/* Fechas del viaje */}
                <div className="text-xs text-slate-400 mb-2">
                  <p>
                    {trip.startDate && trip.endDate
                      ? `Del ${formatDate(trip.startDate)} al ${formatDate(trip.endDate)}`
                      : 'Fechas no definidas'}
                  </p>
                </div>

                {/* Presupuesto e intereses */}
                <div className="flex flex-col gap-2 text-xs text-slate-300">
                  <p>
                    <span className="text-slate-400">Presupuesto estimado:&nbsp;</span>
                    <span className="font-medium">
                      {formatCurrency(trip.budget)}
                    </span>
                  </p>

                  {Array.isArray(trip.interests) && trip.interests.length > 0 && (
                    <p>
                      <span className="text-slate-400">Intereses:&nbsp;</span>
                      <span className="font-medium text-slate-200">
                        {trip.interests.join(' • ')}
                      </span>
                    </p>
                  )}
                </div>

                {/* Pie de la tarjeta (luego acá podemos agregar botones) */}
                <div className="mt-3 flex justify-between items-center text-[11px] text-slate-500">
                  <span>
                    Creado:&nbsp;
                    {trip.createdAt ? formatDate(trip.createdAt) : 'N/D'}
                  </span>
                  {/* Placeholder para acciones futuras */}
                  <span className="text-emerald-400">
                    Próximamente: ver detalle ›
                  </span>
                </div>

                {/* Footer de la tarjeta: acceso al detalle */}
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Ver detalle completo del viaje
                 </span>

                {/* Link a la pantalla de detalle:
                 /trips/:id → TripDetailPage */}
                 <Link
                  to={`/trips/${trip.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/10 transition"
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
