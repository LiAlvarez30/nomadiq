// src/pages/DestinationsPage.jsx
//
// Esta pantalla muestra el catálogo de destinos disponibles en NomadIQ.
// La idea es que se sienta como una galería de lugares inspiradores,
// con una UX más cuidada que un simple listado.
//
// Se conecta al backend usando:
//   GET /api/destinations
//
// El backend devuelve un objeto del estilo:
//   { ok: true, count: N, destinations: [ ... ] }
//
// En esta versión:
//  - Leemos opcionalmente el token (por si la ruta está protegida).
//  - Cargamos la lista de destinos desde el backend.
//  - Mostramos estados de carga, error y vacío.
//  - Renderizamos tarjetas modernas con Tailwind para cada destino.
//  - Agregamos búsqueda por texto y filtro simple por país.

import { useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext.jsx';

// ---------------------------------------------------------------------------
// Función utilitaria: construir una lista de países únicos a partir
// de la lista de destinos. Nos sirve para el filtro por país.
// ---------------------------------------------------------------------------
function extractCountries(destinations) {
  const set = new Set();

  destinations.forEach((dest) => {
    if (dest.country) {
      set.add(dest.country);
    }
  });

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

// ---------------------------------------------------------------------------
// Componente para mostrar los tags de un destino (playa, montaña, etc.).
// ---------------------------------------------------------------------------
function TagList({ tags }) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta individual de destino.
// Muestra nombre, país, resumen y tags.
// ---------------------------------------------------------------------------
function DestinationCard({ destination }) {
  const { name, country, summary, tags } = destination;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-colors">
      <header className="mb-2">
        <h2 className="text-sm font-semibold text-slate-50 line-clamp-2">
          {name || 'Destino sin nombre'}
        </h2>
        {country && (
          <p className="text-[11px] text-slate-400 mt-0.5">{country}</p>
        )}
      </header>

      {summary && (
        <p className="text-xs text-slate-300 line-clamp-3">{summary}</p>
      )}

      <TagList tags={tags} />

      <div className="mt-auto pt-3 text-[11px] text-slate-500">
        <p>Ideal para explorar en tus próximos itinerarios con NomadIQ.</p>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Componente principal: DestinationsPage
// ---------------------------------------------------------------------------
function DestinationsPage() {
  // Leemos el token desde el contexto de autenticación.
  // Algunas APIs pueden requerir Authorization; otras pueden ser públicas.
  const { token } = useContext(AuthContext);

  // Lista completa de destinos traída desde el backend.
  const [destinations, setDestinations] = useState([]);

  // Estados de UX.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para búsqueda por texto.
  const [search, setSearch] = useState('');

  // Estado para filtro por país.
  const [selectedCountry, setSelectedCountry] = useState('todos');

  // -------------------------------------------------------------------------
  // useEffect: cargar destinos al entrar a la página.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si hay token, lo incluimos en los headers. Si no, llamamos sin él.
        const config = token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : {};

        // Llamada real al backend:
        //   GET /api/destinations
        const response = await apiClient.get('/api/destinations', config);

        const { destinations: destinationsFromApi } = response.data || {};

        // Aseguramos que destinations sea siempre un array.
        const safeDestinations = Array.isArray(destinationsFromApi)
          ? destinationsFromApi
          : [];

        setDestinations(safeDestinations);

        console.log(
          'Destinos recibidos desde /api/destinations:',
          safeDestinations
        );
      } catch (err) {
        console.error('Error al cargar destinos:', err);

        if (err.response && err.response.data) {
          const apiErrorCode = err.response.data.error;

          setError(
            apiErrorCode
              ? `El servidor devolvió un error al cargar los destinos: ${apiErrorCode}`
              : 'El servidor devolvió un error al cargar los destinos.'
          );
        } else if (err.request) {
          setError('No se recibió respuesta del backend. ¿Está prendido?');
        } else {
          setError(
            err.message ||
              'Ocurrió un error inesperado al intentar cargar los destinos.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, [token]);

  // -------------------------------------------------------------------------
  // Derivamos lista de países disponibles a partir de los destinos.
  // Uso useMemo para no recalcular en cada render si destinations no cambió.
  // -------------------------------------------------------------------------
  const countries = useMemo(
    () => extractCountries(destinations),
    [destinations]
  );

  // -------------------------------------------------------------------------
  // Derivamos la lista final de destinos a mostrar según:
  //  - filtro por país
  //  - búsqueda por texto (en nombre y resumen)
  // -------------------------------------------------------------------------
  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      const matchesCountry =
        selectedCountry === 'todos' ||
        (dest.country && dest.country === selectedCountry);

      const searchTerm = search.trim().toLowerCase();
      const matchesSearch =
        searchTerm.length === 0 ||
        (dest.name && dest.name.toLowerCase().includes(searchTerm)) ||
        (dest.summary && dest.summary.toLowerCase().includes(searchTerm));

      return matchesCountry && matchesSearch;
    });
  }, [destinations, selectedCountry, search]);

  // -------------------------------------------------------------------------
  // Render principal de la página.
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Encabezado de la sección */}
      <header className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
          Destinos
        </h1>
        <p className="text-xs md:text-sm text-slate-300">
          Explorá destinos que ya tienen actividades precargadas para ayudarte a
          generar itinerarios más interesantes.
        </p>
      </header>

      {/* Controles de búsqueda y filtro */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Búsqueda por texto */}
        <div className="flex-1 max-w-md">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">
            Buscar destino
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Barcelona, montaña, playa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filtro por país */}
        <div className="w-full md:w-56">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">
            Filtrar por país
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="todos">Todos los países</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Estados de carga / error / vacío */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
          <p className="animate-pulse">
            Cargando destinos disponibles desde el backend...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-700 bg-red-900/40 p-4 text-sm text-red-100">
          <p className="font-medium mb-1">
            No pudimos cargar los destinos 😕
          </p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredDestinations.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200 space-y-2">
          <p className="font-medium">No encontramos destinos para tu búsqueda.</p>
          <p className="text-slate-400 text-xs">
            Probá borrar el texto de búsqueda o seleccionar "Todos los países"
            para ver nuevamente el catálogo completo.
          </p>
        </div>
      )}

      {/* Grid de destinos */}
      {!loading && !error && filteredDestinations.length > 0 && (
        <section className="space-y-2">
          <p className="text-[11px] text-slate-400">
            Mostrando {filteredDestinations.length}{' '}
            {filteredDestinations.length === 1 ? 'destino' : 'destinos'}.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDestinations.map((dest) => (
              <DestinationCard key={dest.id || dest.name} destination={dest} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default DestinationsPage;
