  // src/pages/DestinationsPage.jsx
  //
  // Esta pantalla es el "Explorador de destinos" de NomadIQ.
  // Ahora está conectada al backend real:
  //
  //   GET /api/destinations
  //
  // y además agrega:
  // - buscador por texto (nombre, resumen, tags),
  // - filtro por país,
  // - filtro por tag (intereses).
  //
  // Importante: los filtros son del lado del frontend.
  // No cambiamos el contrato de la API, solo trabajamos
  // con los datos que ya recibimos.

  import { useEffect, useState } from "react";
  import { Link } from "react-router-dom";
  import apiClient from "../services/apiClient";



  // Pequeño componente visual para mostrar un tag con estilo
  function Tag({ text }) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
        {text}
      </span>
    );
  }

  function DestinationsPage() {
    // Destinos tal como vienen del backend
    const [destinations, setDestinations] = useState([]);

    // Estados de UX
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados de filtro/búsqueda
    const [searchTerm, setSearchTerm] = useState("");        // texto libre
    const [selectedCountry, setSelectedCountry] = useState(""); // país elegido
    const [selectedTag, setSelectedTag] = useState("");         // tag elegido

    // Llamada al backend al montar la pantalla
    useEffect(() => {
      const fetchDestinations = async () => {
        try {
          setError(null);
          setLoading(true);

          // Llamada real al backend: GET /api/destinations
          const res = await apiClient.get("/api/destinations");

          // El backend responde con:
          // { ok: true, count: N, destinations: [ ... ] }
          setDestinations(res.data.destinations || []);

          console.log("Destinos recibidos:", res.data);
        } catch (err) {
          console.error("Error al cargar destinos:", err);
          setError("No pudimos cargar los destinos. Por favor, intentá más tarde.");
        } finally {
          setLoading(false);
        }
      };

      fetchDestinations();
    }, []);

    // --------------------------------------------------------
    // 1) Derivamos lista de países y tags disponibles
    //    a partir de los destinos recibidos
    // --------------------------------------------------------
    const countries = Array.from(
      new Set(
        (destinations || [])
          .map((d) => d.country)
          .filter(Boolean) // sacamos null/undefined
      )
    ).sort();

    const allTags = Array.from(
      new Set(
        (destinations || []).flatMap((d) => d.tags || [])
      )
    ).sort();

    // --------------------------------------------------------
    // 2) Aplicamos filtros en memoria
    //    (NO tocamos la llamada al backend)
    // --------------------------------------------------------
    const filteredDestinations = (destinations || []).filter((dest) => {
      // Filtro por país
      if (selectedCountry && dest.country !== selectedCountry) {
        return false;
      }

      // Filtro por tag
      if (selectedTag) {
        const tags = dest.tags || [];
        if (!tags.includes(selectedTag)) {
          return false;
        }
      }

      // Filtro por texto
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const name = (dest.name || "").toLowerCase();
        const summary = (dest.summary || "").toLowerCase();
        const tagsText = (dest.tags || []).join(" ").toLowerCase();

        const matches =
          name.includes(term) ||
          summary.includes(term) ||
          tagsText.includes(term);

        if (!matches) return false;
      }

      return true;
    });

    return (
      <div className="space-y-6">
        {/* Encabezado */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Explorar destinos 🌍</h1>
          <p className="text-sm text-slate-300">
            Descubrí lugares increíbles recomendados por NomadIQ. Podés filtrar
            por país, intereses o buscar por nombre.
          </p>
        </header>

        {/* Filtros y buscador */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            {/* Buscador de texto */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">
                Buscar por nombre, descripción o tag
              </label>
              <input
                type="text"
                placeholder="Ej: Bariloche, playa, nieve, gastronomía..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              />
            </div>

            {/* Filtro por país */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Filtrar por país</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              >
                <option value="">Todos los países</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por tag */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Filtrar por tag</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              >
                <option value="">Todos los tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

            {/* Botón para limpiar todos los filtros */}
            <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
        // Este botón resetea los 3 filtros:
        // - buscador,
        // - país,
        // - tag.
        // Es la forma rápida de volver a ver todos los destinos.
                setSearchTerm("");
                setSelectedCountry("");
                setSelectedTag("");
            }}
                className="text-xs px-3 py-1 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                Limpiar filtros
            </button>
            </div>



          {/* Pequeño resumen de resultados */}
          {!loading && !error && (
            <p className="text-[11px] text-slate-400">
              Mostrando{" "}
              <span className="text-emerald-300 font-semibold">
                {filteredDestinations.length}
              </span>{" "}
              destino
              {filteredDestinations.length === 1 ? "" : "s"} filtrado
              {searchTerm || selectedCountry || selectedTag ? "s" : "s (sin filtros)"}
              .
            </p>
          )}
        </section>

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-300 animate-pulse">
            Cargando destinos...
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-700 bg-red-900/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* VACÍO (después de filtros) */}
        {!loading && !error && filteredDestinations.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-300">
            <p className="font-medium mb-1">
              No encontramos destinos que coincidan con tu búsqueda.
            </p>
            <p className="text-slate-400 text-sm">
              Probá borrar los filtros o usar otras palabras clave.
            </p>
          </div>
        )}

        {/* LISTADO filtrado */}
        {!loading && !error && filteredDestinations.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDestinations.map((dest) => (
              <article
              key={dest.id}
              className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow hover:border-emerald-500/70 hover:shadow-emerald-500/10 transition"
              >
    {/* Envolvemos todo el contenido en un Link para que al hacer clic en cualquier parte de la tarjeta navegue al detalle de ese destino. */}
      <Link to={`/destinations/${dest.id}`} className="block">
        {/* Imagen principal */}
        <div className="h-40 w-full bg-slate-800 overflow-hidden">
          {dest.images && dest.images.length > 0 ? (
            <img
              src={dest.images[0]}
              alt={dest.name}
              className="h-full w-full object-cover hover:scale-105 transition"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Sin imagen
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-2">
          <h2 className="text-lg font-semibold text-slate-50">
            {dest.name}
          </h2>

          <p className="text-xs text-slate-400">
            País:{" "}
            <span className="font-medium text-slate-300">
              {dest.country || "N/D"}
            </span>
          </p>

          <p className="text-sm text-slate-300 line-clamp-3">
            {dest.summary || "Sin descripción disponible."}
          </p>

          {/* Tags */}
          {dest.tags && dest.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {dest.tags.map((tag) => (
                <Tag key={tag} text={tag} />
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  ))}

          </div>
        )}
      </div>
    );
  }

  export default DestinationsPage;

    