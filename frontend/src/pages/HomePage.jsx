// src/pages/HomePage.jsx

// Importamos hooks de React para manejar estado y efectos.
import { useEffect, useState } from 'react';

// Importamos nuestro cliente de API que ya está configurado
// para apuntar al backend de NomadIQ.
import apiClient from '../services/apiClient';

// Esta página será la "Home" inicial de la app.
// Por ahora su única responsabilidad es:
// - hacer un healthcheck al backend (GET /),
// - mostrar el resultado de forma clara y amigable.
function HomePage() {
  const [loading, setLoading] = useState(true);   // Estado de carga
  const [data, setData] = useState(null);         // Respuesta del backend
  const [error, setError] = useState(null);       // Mensaje de error (si hay)

  useEffect(() => {
    const checkApi = async () => {
      try {
        setLoading(true);
        setError(null);

        // Llamamos a GET / usando el apiClient.
        // Esto va a: http://localhost:3000/
        const response = await apiClient.get('/');

        setData({
          status: response.status,
          body: response.data,
        });
      } catch (err) {
        let message = 'Error desconocido al conectar con la API';

        if (err.response) {
          message = `El backend respondió con estado ${err.response.status}`;
        } else if (err.request) {
          message = 'No se recibió respuesta del backend. ¿Está prendido?';
        } else if (err.message) {
          message = err.message;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    // Disparamos el healthcheck una sola vez al montar.
    checkApi();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        NomadIQ – Healthcheck del Backend
      </h1>

      {loading && (
        <p className="text-slate-300">
          Verificando conexión con{' '}
          <span className="font-mono">http://localhost:3000</span>...
        </p>
      )}

      {!loading && error && (
        <div className="mt-2 p-3 rounded-lg bg-red-900/40 border border-red-500/60">
          <p className="font-semibold text-red-200">API ERROR</p>
          <p className="text-sm text-red-100 mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="mt-2 p-3 rounded-lg bg-emerald-900/40 border border-emerald-500/60">
          <p className="font-semibold text-emerald-200">API OK ✅</p>
          <p className="text-sm text-emerald-100 mt-2">
            <span className="font-mono">HTTP {data.status}</span>
          </p>

          <p className="text-xs text-emerald-100/90 mt-3">
            Respuesta completa del backend (JSON):
          </p>
          <pre className="mt-1 text-xs bg-slate-950/70 rounded-md p-2 overflow-x-auto border border-slate-800">
            {JSON.stringify(data.body, null, 2)}
          </pre>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Este es solo un healthcheck inicial. Más adelante,
        esta pantalla se convertirá en el dashboard principal de NomadIQ.
      </p>
    </div>
  );
}

export default HomePage;
