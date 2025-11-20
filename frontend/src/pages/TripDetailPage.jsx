// src/pages/TripDetailPage.jsx
//
// Esta pantalla muestra el detalle de UN viaje específico (Trip),
// usando el endpoint protegido:
//
//   GET /api/trips/:id
//
// En este paso, además, sumamos el feature clave:
//   POST /api/trips/:id/generate-itinerary
//
// para generar un itinerario inteligente basado en el viaje,
// y lo mostramos en una UI tipo "timeline" simple.
//
// Más adelante podremos:
// - enriquecer itinerarios con IA,
// - listar itinerarios existentes,
// - permitir regenerar, etc.

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

  // Desde el contexto obtenemos el token (para hablar con el backend)
  // y los datos del usuario logueado (solo para mostrar quién es).
  const { token, user } = useContext(AuthContext);

  // Estado donde guardamos el viaje que viene del backend
  const [trip, setTrip] = useState(null);

  // Estados de experiencia de usuario para la carga del viaje
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para la generación de itinerario
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // Este flag nos sirve solo para no intentar cargar itinerarios
  // varias veces de manera innecesaria.
  const [initialItineraryLoaded, setInitialItineraryLoaded] = useState(false);


  // Cuando se monta la página (o cambia el id), pedimos el viaje al backend
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si no tenemos token por alguna razón (aunque la ruta está protegida),
        // mostramos un mensaje claro.
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


  // Cuando tenemos un trip y un token, intentamos cargar
  // si ya existe algún itinerario guardado para este viaje
  // usando GET /api/itineraries?tripId=...
  //
  // La idea es:
  // - Si el backend ya tiene itinerarios para este trip,
  //   mostramos el más reciente sin necesidad de tocar el botón.
  // - Si no hay itinerarios, no mostramos nada y esperamos
  //   a que la persona genere uno nuevo.
  useEffect(() => {
    const fetchExistingItinerary = async () => {
      try {
        // Si no tenemos token o ya intentamos cargar antes, salimos.
        if (!token || initialItineraryLoaded) return;

        // Marcamos que ya intentamos cargar, así no repetimos
        // la llamada en cada render.
        setInitialItineraryLoaded(true);

        console.log("Buscando itinerarios existentes para el viaje:", id);

        const res = await apiClient.get(`/api/itineraries`, {
          params: { tripId: id },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // El backend debería devolver algo como:
        // { ok: true, count: N, itineraries: [ ... ] }
        const itineraries = res.data.itineraries || res.data.items || [];

        if (Array.isArray(itineraries) && itineraries.length > 0) {
          // Elegimos el último itinerario de la lista.
          // Podríamos ordenarlos por fecha si fuera necesario,
          // pero asumimos que el backend ya los devuelve en orden razonable.
          const latest = itineraries[itineraries.length - 1];

          console.log("Itinerario existente cargado desde backend:", latest);
          setGeneratedItinerary(latest);
        } else {
          console.log("No hay itinerarios guardados para este viaje todavía.");
        }
      } catch (err) {
        // Si falla esta carga inicial, no rompemos la UI:
        // simplemente logueamos y dejamos que la persona
        // genere un itinerario manualmente con el botón.
        console.error("Error al buscar itinerarios existentes:", err);
      }
    };

    fetchExistingItinerary();
  }, [id, token, initialItineraryLoaded]);



  // Función de ayuda para mostrar fechas en formato amigable
  const formatDate = (value) => {
    if (!value) return "Sin especificar";
    try {
      return new Date(value).toLocaleDateString("es-AR");
    } catch {
      return value;
    }
  };

  // Handler para el botón "Generar itinerario"
  //
  // Este método:
  // - llama al endpoint POST /api/trips/:id/generate-itinerary
  // - muestra estado "generating" mientras tanto
  // - guarda el itinerario devuelto en generatedItinerary
  // - maneja errores y los convierte en mensajes humanos
  const handleGenerateItinerary = async () => {
    try {
      // Limpiamos error previo y marcamos que estamos generando
      setGenerateError(null);
      setGenerating(true);

      // Chequeo defensivo: si no hay token, no intentamos llamar al backend
      if (!token) {
        setGenerateError("Tu sesión no es válida. Iniciá sesión nuevamente.");
        setGenerating(false);
        return;
      }

      console.log("Generando itinerario para el viaje:", id);

      // Llamada real al backend:
      // POST /api/trips/:id/generate-itinerary
      //
      // Según tu contrato, el body puede incluir destinationId opcional.
      // Por ahora mandamos un body vacío, o podrías armar:
      // { destinationId: trip.destinationId } si lo tenés guardado.
      const res = await apiClient.post(
        `/api/trips/${id}/generate-itinerary`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Respuesta esperada:
      // {
      //   ok: true,
      //   itinerary: {
      //     id: "it123",
      //     tripId: "trip123",
      //     data: { days: [ ... ] },
      //     ...
      //   }
      // }
      const itineraryData = res.data.itinerary || res.data;
      setGeneratedItinerary(itineraryData);

      console.log("Itinerario generado:", itineraryData);
    } catch (err) {
      console.error("Error al generar el itinerario:", err);

      // Intentamos traducir el error del backend a algo más humano
      if (err.response && err.response.data) {
        const apiErrorCode = err.response.data.error;

        if (apiErrorCode === "TRIP_NOT_FOUND") {
          setGenerateError("El viaje no existe o fue eliminado.");
        } else if (apiErrorCode === "FORBIDDEN_TRIP_OWNER") {
          setGenerateError("No tenés permiso para generar itinerarios de este viaje.");
        } else if (apiErrorCode === "RATE_LIMIT_EXCEEDED") {
          setGenerateError("Hiciste demasiadas solicitudes seguidas. Probá de nuevo en unos minutos.");
        } else {
          setGenerateError(
            `No se pudo generar el itinerario. Código de error: ${apiErrorCode}`
          );
        }
      } else {
        setGenerateError(
          "No pudimos comunicarnos con el servidor para generar el itinerario."
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  // Componente auxiliar para renderizar el contenido del itinerario
  const renderItinerary = () => {
    if (!generatedItinerary || !generatedItinerary.data) return null;

    const days = generatedItinerary.data.days || [];

    if (!Array.isArray(days) || days.length === 0) {
      return (
        <p className="text-sm text-slate-300">
          El itinerario no tiene días cargados. Revisá la lógica del motor de reglas.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {days.map((day) => (
          <div
            key={day.day}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2"
          >
            {/* Encabezado del día */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Día {day.day}</p>
                <p className="text-sm font-semibold text-slate-50">
                  {day.date ? formatDate(day.date) : "Fecha no especificada"}
                </p>
              </div>
            </div>

            {/* Lista de periodos (mañana, tarde, noche, etc.) */}
            <div className="mt-2 space-y-3">
              {(day.periods || []).map((period, index) => (
                <div
                  key={`${day.day}-${index}`}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1"
                >
                  <p className="text-xs uppercase tracking-wide text-emerald-300">
                    {period.timeOfDay || "Sin horario"}
                  </p>
                  <p className="text-sm font-semibold text-slate-50">
                    {period.title || "Actividad sin título"}
                  </p>
                  <p className="text-xs text-slate-300">
                    {period.description || "Sin descripción detallada."}
                  </p>

                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 mt-1">
                    {period.activityId && (
                      <span className="font-mono">
                        Actividad: {period.activityId}
                      </span>
                    )}
                    {typeof period.estimatedCost === "number" && (
                      <span>
                        Costo estimado:{" "}
                        {period.estimatedCost.toLocaleString("es-AR")} ARS
                      </span>
                    )}
                    {period.notes && (
                      <span className="italic">
                        Notas: {period.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado general de la sección */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-50">
          Detalle del viaje
        </h1>
        <p className="text-sm text-slate-300">
          Acá ves la información completa de este viaje. Ya podés generar
          un itinerario automático basado en estas preferencias.
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

            {/* CTA para generar itinerario */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGenerateItinerary}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {generating ? "Generando itinerario..." : "Generar itinerario para este viaje"}
                <span>🧭</span>
              </button>

              <p className="text-[11px] text-slate-500">
                El itinerario se genera a partir de las fechas, presupuesto e intereses
                del viaje. Más adelante, vas a poder enriquecerlo con IA.
              </p>

              {/* Mensaje de error específico de la generación */}
              {generateError && (
                <div className="rounded-xl border border-red-700 bg-red-900/40 p-3 text-[11px] text-red-100">
                  {generateError}
                </div>
              )}
            </div>
          </section>

          {/* Bloque donde mostramos el itinerario generado, si existe */}
          {generatedItinerary && (
            <section className="rounded-2xl border border-emerald-600 bg-slate-900/80 p-5 space-y-3">
              <header className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-emerald-300">
                  Itinerario generado 🧠✨
                </h2>
                <p className="text-xs text-slate-300">
                  Este es el resultado del motor de reglas para este viaje. Cada día
                  tiene una serie de bloques (mañana, tarde, noche, etc.).
                </p>
              </header>

              {renderItinerary()}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default TripDetailPage;
