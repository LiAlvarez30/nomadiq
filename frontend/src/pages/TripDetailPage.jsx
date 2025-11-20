// src/pages/TripDetailPage.jsx
//
// Esta pantalla muestra el detalle de UN viaje específico (Trip),
// usando el endpoint protegido:
//
//   GET /api/trips/:id
//
// La idea es que desde acá, más adelante, podamos:
// - generar itinerarios,
// - ver itinerarios existentes,
// - mostrar actividades vinculadas, etc.
//
// Por ahora, nos enfocamos en:
// - leer el id de la URL,
// - pedir el viaje al backend con token,
// - mostrarlo en una tarjeta moderna.

import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// Cliente axios con baseURL = http://localhost:3000
import apiClient from "../services/apiClient";

// Contexto de autenticación: necesitamos el token para el header Authorization
import { AuthContext } from "../context/AuthContext.jsx";

function TripDetailPage() {
  // useParams nos permite leer el :id de la URL
  // Ejemplo: /trips/trip123 → id = "trip123"
  const { id } = useParams();

  // Desde el contexto obtenemos el token para hablar con el backend
  const { token, user } = useContext(AuthContext);

  // Acá vamos a guardar el viaje que viene del backend
  const [trip, setTrip] = useState(null);

  // Estados de experiencia de usuario
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cuando se monta la página (o cambia el id), pedimos el viaje al backend
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si por alguna razón no tenemos token (no debería pasar porque
        // la ruta está protegida por PrivateRoute), mostramos error claro.
        if (!token) {
          setError("No hay token de sesión. Iniciá sesión nuevamente.");
          setLoading(false);
          return;
        }

        // Llamada real al backend:
        // GET /api/trips/:id con Authorization: Bearer <token>
        const res = await apiClient.get(`/api/trips/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Según tu backend, la respuesta puede ser:
        // { ok: true, trip: { ... } }
        // Por las dudas, contemplamos ambas variantes.
        const tripData = res.data.trip || res.data;
        setTrip(tripData);

        console.log("Detalle de viaje:", tripData);
      } catch (err) {
        console.error("Error al cargar el viaje:", err);

        if (err.response && err.response.status === 404) {
          setError("No encontramos este viaje. Puede que haya sido eliminado.");
        } else if (err.response && err.response.status === 403) {
          setError("No tenés permiso para ver este viaje (no sos la persona dueña).");
        } else {
          setError("No pudimos cargar la información de este viaje.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id, token]);

  // Función de ayuda para mostrar fechas en formato amigable
  const formatDate = (value) => {
    if (!value) return "Sin especificar";
    try {
      return new Date(value).toLocaleDateString("es-AR");
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado general de la sección */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-50">
          Detalle del viaje
        </h1>
        <p className="text-sm text-slate-300">
          Acá vas a ver la información completa de este viaje. Más adelante,
          desde esta misma pantalla, vamos a sumar generación y visualización
          de itinerarios inteligentes.
        </p>
      </header>

      {/* Estados globales: loading / error */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-300 animate-pulse">
          Cargando información del viaje...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-700 bg-red-900/40 p-4 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Si no hay loading ni error y tenemos viaje, lo mostramos */}
      {!loading && !error && trip && (
        <div className="space-y-4">
          {/* Tarjeta principal con info del viaje */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-slate-50">
                {trip.title || "Viaje sin título"}
              </h2>

              <p className="text-xs text-slate-400">
                ID del viaje:&nbsp;
                <span className="font-mono text-[11px] text-slate-300">
                  {trip.id || "(no disponible)"}
                </span>
              </p>

              {user && (
                <p className="text-xs text-slate-400">
                  Usuario:&nbsp;
                  <span className="font-medium text-slate-200">
                    {user.email}
                  </span>
                </p>
              )}
            </div>

            {/* Fechas y estado en formato de resumen */}
            <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-300">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Fecha de inicio</span>
                <span>{formatDate(trip.startDate)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Fecha de fin</span>
                <span>{formatDate(trip.endDate)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Estado</span>
                <span className="inline-flex w-fit rounded-full bg-slate-800 px-3 py-1 text-xs capitalize">
                  {trip.status || "sin estado"}
                </span>
              </div>
            </div>

            {/* Presupuesto e intereses */}
            <div className="grid gap-4 md:grid-cols-[1fr,2fr] text-sm text-slate-300">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Presupuesto estimado</span>
                <span>
                  {trip.budget
                    ? `${trip.budget.toLocaleString("es-AR")} ARS`
                    : "No especificado"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Intereses del viaje</span>
                {trip.interests && trip.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trip.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] border border-slate-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    Este viaje aún no tiene intereses configurados.
                  </span>
                )}
              </div>
            </div>

            {/* Metadata del viaje */}
            <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-400">
              <div>
                <span className="text-slate-500">Creado:&nbsp;</span>
                {trip.createdAt ? formatDate(trip.createdAt) : "N/D"}
              </div>
              <div>
                <span className="text-slate-500">Actualizado:&nbsp;</span>
                {trip.updatedAt ? formatDate(trip.updatedAt) : "N/D"}
              </div>
            </div>

            {/* Bloque de futuro: acá vamos a enganchar itinerarios */}
            <div className="mt-2 text-[11px] text-slate-500">
              Más adelante, desde acá vas a poder:
              <br />
              - Generar un itinerario con <span className="font-mono">POST /api/trips/:id/generate-itinerary</span>
              <br />
              - Ver y enriquecer itinerarios con IA.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default TripDetailPage;
