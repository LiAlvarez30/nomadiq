// src/pages/HomePage.jsx
//
// Esta pantalla es la "puerta de entrada" a NomadIQ.
// La idea es que se sienta como una app de viajes nivel startup:
//  - Hero principal con el concepto de la app.
//  - CTAs claros según si la persona está logueada o no.
//  - Explicación corta de la IA híbrida (motor de reglas + IA opcional).
//  - Un recuadro con el estado del backend (healthcheck) para fines didácticos.
//
// Además, reutilizamos el healthcheck que ya existía, pero ahora
// lo mostramos dentro de una tarjeta de "Estado del sistema" en lugar
// de que sea el único contenido de la página.

import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Cliente axios ya configurado con baseURL del backend.
import apiClient from '../services/apiClient';

// Contexto de autenticación: nos dice si hay usuario logueado.
import { AuthContext } from '../context/AuthContext.jsx';

// Componente principal de la Home.
function HomePage() {
  // Obtenemos el usuario actual (si hay) desde el AuthContext.
  // No necesitamos el token acá, solo saber si hay sesión activa.
  const { user } = useContext(AuthContext);

  // Derivamos un flag de conveniencia.
  const isLoggedIn = Boolean(user);

  // Estado relacionado con el healthcheck del backend.
  const [loading, setLoading] = useState(true);   // indica si estamos verificando la API
  const [data, setData] = useState(null);         // respuesta del backend (status + body)
  const [error, setError] = useState(null);       // mensaje de error si algo falla

  // ---------------------------------------------------------------------------
  // useEffect: hacer un HEALTHCHECK al backend cuando se monta la página.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Definimos una función asíncrona para poder usar async/await.
    const checkApi = async () => {
      try {
        // Reseteamos estados antes de llamar.
        setLoading(true);
        setError(null);

        // Llamada simple al backend:
        //   GET /
        // El apiClient ya tiene la baseURL configurada (http://localhost:3000 en dev).
        const res = await apiClient.get('/');

        // Guardamos un objeto sencillo para poder mostrar tanto el status
        // HTTP como el cuerpo completo de la respuesta.
        setData({
          status: res.status,
          body: res.data,
        });
      } catch (err) {
        console.error('Error en healthcheck del backend:', err);

        // Construimos un mensaje humano según el tipo de error.
        let message = 'No se pudo verificar el estado del backend.';

        // Si el servidor respondió con un status (ej: 500, 404, etc.).
        if (err.response) {
          message = `El backend respondió con estado ${err.response.status}`;
        }
        // Si se hizo la petición pero no hubo respuesta (problema de red, servidor caído, etc.).
        else if (err.request) {
          message = 'No se recibió respuesta del backend. ¿Está prendido?';
        }
        // Cualquier otro error (config, excepción interna, etc.).
        else if (err.message) {
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

  // ---------------------------------------------------------------------------
  // Derivamos las rutas y textos de los botones según el estado de sesión.
  // ---------------------------------------------------------------------------
  const primaryCtaTo = isLoggedIn ? '/trips' : '/login';
  const primaryCtaLabel = isLoggedIn ? 'Ir a mis viajes' : 'Iniciar sesión';

  const secondaryCtaTo = isLoggedIn ? '/trips/new' : '/destinations';
  const secondaryCtaLabel = isLoggedIn
    ? 'Crear un nuevo viaje'
    : 'Explorar destinos';

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------------
          HERO PRINCIPAL
          -------------------------------------------------------------------
          Bloque grande que presenta la propuesta de valor de NomadIQ y da
          accesos directos a las acciones principales.
        */}
      <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/40 px-6 py-6 md:px-8 md:py-8 shadow-lg shadow-emerald-900/20">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Columna izquierda: título, descripción y botones */}
          <div className="space-y-4 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              IA híbrida para viajeros curiosos
            </p>

            <h1 className="text-3xl md:text-4xl font-semibold text-slate-50 leading-tight">
              Diseñá itinerarios inteligentes
              <span className="block text-emerald-300">
                aunque la IA externa falle.
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-200/90 leading-relaxed">
              NomadIQ combina un motor de reglas propio con una capa opcional de
              IA generativa. Vos elegís el destino y los días; la app propone un
              plan coherente y luego, si querés, lo enriquece con un tono más
              humano.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {/* Botón principal: cambia según haya sesión o no */}
              <Link
                to={primaryCtaTo}
                className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-emerald-950 shadow-md shadow-emerald-900/40 hover:bg-emerald-400 transition"
              >
                {primaryCtaLabel}
              </Link>

              {/* Botón secundario: también se adapta al contexto */}
              <Link
                to={secondaryCtaTo}
                className="inline-flex items-center rounded-full border border-emerald-400/70 bg-transparent px-4 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10 transition"
              >
                {secondaryCtaLabel}
              </Link>
            </div>

            <p className="text-[11px] text-emerald-200/70">
              Motor de reglas propio · IA opcional · Guardado automático de tus
              itinerarios en la nube.
            </p>
          </div>

          {/* Columna derecha: pequeño "mock" de lo que hace la app */}
          <div className="w-full max-w-xs md:max-w-sm self-stretch">
            <div className="h-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Cómo funciona
                </p>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-none" />
                    <span>
                      Elegís un destino y las fechas de tu viaje, con tus
                      intereses principales.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-none" />
                    <span>
                      El motor de reglas arma un borrador de itinerario día por
                      día, totalmente offline.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-none" />
                    <span>
                      Si querés, activás el modo IA para pulir descripciones y
                      darle un tono más humano.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-100">
                <p className="font-semibold">
                  IA híbrida con fallback seguro
                </p>
                <p className="mt-1">
                  Si la IA externa falla, el motor de reglas sigue funcionando.
                  Nunca te quedás sin itinerario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
          SECCIÓN: PASOS / BENEFICIOS
          ------------------------------------------------------------------- */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            1. Creá tu viaje
          </h2>
          <p className="text-xs text-slate-300">
            Definí destino, fechas, presupuesto aproximado e intereses. NomadIQ
            usa esta info como “brief” para el motor de reglas.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            2. Generá el itinerario
          </h2>
          <p className="text-xs text-slate-300">
            El backend arma un plan estructurado por días y momentos del día,
            usando actividades del destino y buenos defaults.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-100">
            3. Enriquecé con IA (si querés)
          </h2>
          <p className="text-xs text-slate-300">
            Desde el detalle del viaje podés activar el modo IA local para
            pulir textos, sin depender 100% de un proveedor externo.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------------
          SECCIÓN: ESTADO DEL SISTEMA (HEALTHCHECK)
          -------------------------------------------------------------------
          Reaprovechamos el healthcheck original para mostrar que el backend
          está vivo. Esto queda buenísimo para explicarle a los docentes cómo
          monitoreás el estado de tu API.
        */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Estado del sistema
            </h2>
            <p className="text-xs text-slate-400">
              Verificación rápida de que la API de NomadIQ está respondiendo.
            </p>
          </div>
        </header>

        {loading && (
          <p className="text-xs text-slate-300">
            Verificando conexión con{' '}
            <span className="font-mono text-slate-100">
              http://localhost:3000
            </span>
            ...
          </p>
        )}

        {!loading && error && (
          <div className="mt-1 rounded-lg border border-red-500/60 bg-red-900/40 px-3 py-2">
            <p className="text-xs font-semibold text-red-100">API ERROR</p>
            <p className="mt-1 text-xs text-red-100/90">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="mt-1 rounded-lg border border-emerald-500/60 bg-emerald-900/30 px-3 py-2 space-y-2">
            <p className="text-xs font-semibold text-emerald-100">
              API OK ✅
            </p>
            <p className="text-[11px] text-emerald-100/90">
              <span className="font-mono">HTTP {data.status}</span>
            </p>
            <div>
              <p className="mt-1 text-[11px] text-emerald-100/80">
                Respuesta completa del backend (JSON):
              </p>
              <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-slate-800 bg-slate-950/80 p-2 text-[11px] text-emerald-100/90">
                {JSON.stringify(data.body, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {!loading && !error && !data && (
          <p className="text-xs text-slate-400">
            No se recibió información del backend. Podés volver a cargar la
            página para intentar de nuevo.
          </p>
        )}

        <p className="mt-1 text-[11px] text-slate-500">
          Este recuadro es principalmente didáctico: te permite mostrar que la
          API está viva y que el frontend está correctamente conectado.
        </p>
      </section>
    </div>
  );
}

export default HomePage;
