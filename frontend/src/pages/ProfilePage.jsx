// src/pages/ProfilePage.jsx
//
// Esta pantalla muestra la información del usuario logueado,
// consultando el endpoint protegido GET /users/me.
//
// Queremos algo claro, minimalista y moderno, porque luego
// acá vamos a permitir cambiar foto, datos personales, etc.

import { useContext, useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import { AuthContext } from "../context/AuthContext";

function ProfilePage() {
  const { token, user } = useContext(AuthContext);

  // Estado donde guardaremos la info completa de /users/me
  const [profile, setProfile] = useState(null);

  // Estados de carga y error para dar buena UX
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Llamamos al backend al entrar a la página
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError(null);
        setLoading(true);

        // GET /users/me con el token
        const res = await apiClient.get("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data.user);
      } catch (err) {
        console.error("Error en /users/me:", err);
        setError("No se pudo cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold">Tu perfil 👤</h1>

      {loading && (
        <p className="animate-pulse text-slate-300">
          Cargando tu información…
        </p>
      )}

      {error && (
        <p className="text-red-400 font-medium">{error}</p>
      )}

      {/* Si hay perfil, mostramos los datos */}
      {profile && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-4">
            <img
              src={
                profile.avatarUrl ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(profile.name)
              }
              alt="Avatar"
              className="w-16 h-16 rounded-full border border-slate-700"
            />
            <div>
              <p className="text-xl font-semibold">{profile.name}</p>
              <p className="text-slate-400 text-sm">{profile.email}</p>
            </div>
          </div>

          {/* Datos secundarios */}
          <div className="text-slate-300 text-sm space-y-1">
            <p>
              <span className="text-slate-400">Rol: </span>
              {profile.role}
            </p>

            <p>
              <span className="text-slate-400">Cuenta creada: </span>
              {new Date(profile.createdAt).toLocaleDateString("es-AR")}
            </p>

            <p>
              <span className="text-slate-400">Última actualización: </span>
              {new Date(profile.updatedAt).toLocaleDateString("es-AR")}
            </p>
          </div>

          <div className="mt-4 text-slate-500 text-xs">
            (Más adelante: cambiar avatar, editar datos, ajustes de sesión…)
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
