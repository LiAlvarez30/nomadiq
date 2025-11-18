// Importamos el Router de Express para crear un "subconjunto" de rutas
// relacionadas con la autenticación (registro, login, etc.).
import { Router } from 'express';

// Importamos los controladores que manejan la lógica de negocio
// para cada endpoint de autenticación.
import { register, login } from '../controllers/authController.js';

// Creamos una nueva instancia de router específica para /auth.
const router = Router();

// Ruta para registrar un nuevo usuario.
// Método: POST
// URL completa: POST /auth/register
router.post('/register', register);

// Ruta para iniciar sesión.
// Método: POST
// URL completa: POST /auth/login
router.post('/login', login);

// Exportamos el router para montarlo en index.js como:
// app.use('/auth', authRoutes);
export default router;
