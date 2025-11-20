// src/pages/DestinationDetailPage.jsx
//
// Esta pantalla muestra el detalle de UN destino puntual,
// usando el endpoint:
//
//   GET /api/destinations/:id
//
// La idea es que, más adelante, cuando el usuario haga clic en un destino
// de la grilla, llegue a esta vista con información más completa.
//
// En este paso la vamos a dejar lista y conectada al backend,
// aunque todavía no la enlacemos desde las tarjetas.

import { useEffect, useState } from "react";
// useParams → leer el :id de la URL
// Link → navegar a otras rutas desde botones/enlaces
import { useParams, Link } from "react-router-dom";
import apiClient from "../services/apiClient";


// Componente pequeño para mostrar una etiqueta de tag
function Tag({ text }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
      {text}
    </span>
  );
}

function DestinationDetailPage() {
  // useParams nos permite leer el :id de la URL.
  // Ejemplo: /destinations/abc123 → id = "abc123"
  const { id } = useParams();

  // Estado donde vamos a guardar el destino completo
  const [destination, setDestination] = useState(null);

  // Estados de experiencia de usuario
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Llamamos al backend cuando se monta la página
  useEffect(() => {
    const fetchDestination = async () => {
      try {
        setError(null);
        setLoading(true);

        // Llamada real al backend:
        // GET /api/destinations/:id
        const res = await apiClient.get(`/api/destinations/${id}`);

        // La respuesta debería incluir un objeto destino
        setDestination(res.data.destination || res.data);
        console.log("Detalle de destino:", res.data);
      } catch (err) {
        console.error("Error al cargar destino:", err);

        if (err.response && err.response.status === 404) {
          setError("No encontramos este destino. Puede que haya sido eliminado.");
        } else {
          setError("No pudimos cargar la información de este destino.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Ejecutamos la función
    fetchDestination();
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Estados globales: loading / error */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-300 animate-pulse">
          Cargando información del destino...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-700 bg-red-900/40 p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Si no hay loading ni error, y tenemos destino, lo mostramos */}
      {!loading && !error && destination && (
        <>
          {/* Encabezado principal */}
<header className="flex flex-col gap-2">
  <h1 className="text-2xl font-bold text-slate-50">
    {destination.name || "Destino sin nombre"}
  </h1>
  <p className="text-sm text-slate-300">
    País:&nbsp;
    <span className="font-medium text-slate-100">
      {destination.country || "No especificado"}
    </span>
  </p>

  {/* CTA principal: desde este destino, crear un nuevo viaje.
     - Usamos /trips/new (ruta protegida)
     - Le pasamos destinationId y destinationName por querystring,
       para que el formulario pueda precargar el título y contexto. */}
  <div className="mt-2">
    <Link
      to={
        `/trips/new?destinationId=${destination.id}` +
        `&destinationName=${encodeURIComponent(destination.name || "")}`
      }
      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition"
    >
      Planear viaje a este destino
      <span className="text-[13px]">✈️</span>
    </Link>
  </div>
</header>


          {/* Imagen destacada */}
          <section className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/70">
            <div className="h-60 w-full bg-slate-800 overflow-hidden">
              {destination.images && destination.images.length > 0 ? (
                <img
                  src={destination.images[0]}
                  alt={destination.name}
                  className="h-full w-full object-cover hover:scale-105 transition"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Este destino todavía no tiene imagen cargada.
                </div>
              )}
            </div>
          </section>

          {/* Descripción y datos extra */}
          <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
            {/* Columna principal: descripción */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Descripción
              </h2>
              <p className="text-sm text-slate-300">
                {destination.summary ||
                  "Este destino todavía no tiene una descripción detallada. Más adelante podés completar esta información desde el panel de administración."}
              </p>
            </div>

            {/* Columna lateral: tags / metadata */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm text-slate-300">
              <div>
                <h3 className="text-xs font-semibold text-slate-200 mb-1">
                  Tags / tipo de destino
                </h3>
                {destination.tags && destination.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {destination.tags.map((tag) => (
                      <Tag key={tag} text={tag} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Este destino aún no tiene tags cargados.
                  </p>
                )}
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  <span className="text-slate-500">ID interno:&nbsp;</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {destination.id || "(no disponible)"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Creado:&nbsp;</span>
                  {destination.createdAt
                    ? new Date(destination.createdAt).toLocaleDateString("es-AR")
                    : "N/D"}
                </p>
                <p>
                  <span className="text-slate-500">Actualizado:&nbsp;</span>
                  {destination.updatedAt
                    ? new Date(destination.updatedAt).toLocaleDateString("es-AR")
                    : "N/D"}
                </p>
              </div>

              <div className="text-[11px] text-slate-500">
                Más adelante, desde acá vas a poder:
                <br />
                - Crear un viaje a partir de este destino.
                <br />
                - Ver actividades recomendadas.
                <br />
                - Generar un itinerario inteligente.
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default DestinationDetailPage;
