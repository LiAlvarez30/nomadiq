// src/pages/CreateTripPage.jsx
//
// Esta pantalla permite crear un nuevo viaje (Trip)
// usando el endpoint del backend:
//
//   POST /api/trips   (requiere Authorization: Bearer <token>)
//
// En el paso anterior solo veíamos una “vista previa” del JSON.
// Ahora ya hacemos la llamada REAL al backend y, si todo sale bien,
// redirigimos a la lista de viajes (/trips).

import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Cliente axios con baseURL = http://localhost:3000
import apiClient from "../services/apiClient";

// Contexto de autenticación: desde acá obtenemos el token del usuario.
import { AuthContext } from "../context/AuthContext.jsx";

function CreateTripPage() {
  // Navegación programática: nos permite ir a /trips después de crear el viaje
  const navigate = useNavigate();

  // Leemos los parámetros de la URL, por ejemplo:
  // /trips/new?destinationId=dest123&destinationName=Bariloche
  const [searchParams] = useSearchParams();
  const destinationIdFromUrl = searchParams.get("destinationId");
  const destinationNameFromUrl = searchParams.get("destinationName");

  // Desde el contexto obtenemos el token (para el header Authorization)
  const { token } = useContext(AuthContext);

  // Estado del formulario del viaje
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [status, setStatus] = useState("planned");

  // Estados relacionados con la acción de “enviar” el formulario
  const [submitting, setSubmitting] = useState(false); // indica si estamos hablando con el backend
  const [submitError, setSubmitError] = useState(null); // mensaje de error en texto humano

  // (Opcional) podemos seguir mostrando una vista previa del payload
  // para entender qué se está enviando.
  const [previewData, setPreviewData] = useState(null);

  // Si tenemos destinationName en la URL y el título está vacío,
  // proponemos un título por defecto amigable.
  useEffect(() => {
    if (destinationNameFromUrl && !title) {
      setTitle(`Viaje a ${destinationNameFromUrl}`);
    }
  }, [destinationNameFromUrl, title]);

  // Handler de envío del formulario.
  // Ahora SÍ llamamos al backend con POST /api/trips.
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Si por alguna razón no tenemos token (no debería pasar porque la ruta
    // está protegida por PrivateRoute), frenamos y mostramos un error.
    if (!token) {
      setSubmitError("No hay token de sesión. Volvé a iniciar sesión e intentá de nuevo.");
      return;
    }

    // Convertimos interests (texto separado por comas)
    // en un array de strings limpio.
    const interestsArray = interests
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    // Armamos el payload respetando el contrato del backend:
    //
    // {
    //   "title": "Viaje a Bariloche en invierno",
    //   "startDate": "2025-07-15",
    //   "endDate": "2025-07-18",
    //   "budget": 800000,
    //   "interests": ["nieve", "paisajes", "gastronomía"],
    //   "status": "planned"
    // }
    //
    const tripPayload = {
      title,
      startDate: startDate || null,
      endDate: endDate || null,
      budget: budget ? Number(budget) : null,
      interests: interestsArray,
      status,
      // destinationId no es obligatorio en tu backend,
      // pero lo dejamos listo por si tu lógica futura lo usa.
      destinationId: destinationIdFromUrl || null,
    };

    // Guardamos el payload en preview para ver qué se envió (modo didáctico)
    setPreviewData(tripPayload);

    try {
      setSubmitError(null);
      setSubmitting(true);

      console.log("Enviando a POST /api/trips:", tripPayload);

      // Llamada REAL al backend:
      const response = await apiClient.post("/api/trips", tripPayload, {
        headers: {
          // Muy importante: el backend requiere este header para saber quién es el usuario
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Respuesta de creación de viaje:", response.data);

      // Si llegamos hasta acá, asumimos que el backend respondió ok: true
      // y creó el viaje correctamente.
      //
      // UX esperada:
      // - Redirigir al usuario a la lista de viajes (/trips),
      //   donde ya debería aparecer el nuevo viaje creado.
      navigate("/trips");
    } catch (err) {
      console.error("Error al crear el viaje:", err);

      // Si el backend respondió con un JSON de error, tratamos de mostrar
      // algo amigable en función del código de error.
      if (err.response && err.response.data) {
        const apiErrorCode = err.response.data.error;

        if (apiErrorCode === "VALIDATION_ERROR") {
          setSubmitError("Los datos del viaje no pasaron la validación. Revisá los campos.");
        } else if (apiErrorCode === "UNAUTHORIZED" || apiErrorCode === "INVALID_TOKEN") {
          setSubmitError("Tu sesión no es válida o expiró. Volvé a iniciar sesión.");
        } else {
          setSubmitError(
            `El servidor rechazó la creación del viaje. Código: ${apiErrorCode}`
          );
        }
      } else {
        // Error genérico de red o algo fuera del backend
        setSubmitError(
          "No pudimos comunicarnos con el servidor para crear el viaje. Verificá que el backend esté corriendo."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de la página */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Crear nuevo viaje ✈️</h1>
        <p className="text-sm text-slate-300">
          Completá los datos principales de tu viaje. Ahora este formulario
          está conectado al backend real de NomadIQ.
        </p>

        {/* Si venimos desde un destino concreto, lo mostramos como contexto */}
        {destinationNameFromUrl && (
          <p className="text-xs text-emerald-300">
            Estás planificando un viaje a{" "}
            <span className="font-semibold">{destinationNameFromUrl}</span>.
          </p>
        )}
      </header>

      {/* Mensaje de error al enviar (si lo hubiera) */}
      {submitError && (
        <div className="rounded-2xl border border-red-700 bg-red-900/40 p-3 text-xs text-red-100">
          {submitError}
        </div>
      )}

      {/* Formulario principal */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título del viaje */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">
              Título del viaje
            </label>
            <input
              type="text"
              placeholder="Ej: Escapada a la Patagonia en invierno"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              required
            />
          </div>

          {/* Fechas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Fecha de inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Fecha de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              />
            </div>
          </div>

          {/* Presupuesto */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">
              Presupuesto estimado (en ARS)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="Ej: 800000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </div>

          {/* Intereses */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">
              Intereses del viaje (separados por comas)
            </label>
            <textarea
              rows={3}
              placeholder="Ej: nieve, paisajes, gastronomía, paseos en barco"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
            <p className="text-[11px] text-slate-500">
              Estos intereses se convertirán en un listado que luego el motor
              de itinerarios puede usar para sugerir actividades.
            </p>
          </div>

          {/* Estado del viaje */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">
              Estado del viaje
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="planned">Planificado</option>
              <option value="in-progress">En curso</option>
              <option value="completed">Completado</option>
            </select>
          </div>

          {/* Botón de submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Creando viaje..." : "Crear viaje"}
            </button>
          </div>
        </form>
      </section>

      {/* Vista previa de los datos que se enviaron (modo didáctico) */}
      {previewData && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300 space-y-2">
          <p className="font-medium text-slate-100">
            Último payload enviado a <span className="font-mono">POST /api/trips</span>
          </p>
          <pre className="bg-slate-950/70 rounded-lg p-3 overflow-x-auto text-[11px] text-slate-200">
            {JSON.stringify(previewData, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}

export default CreateTripPage;
