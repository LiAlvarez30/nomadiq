// Importamos Router para agrupar rutas relacionadas con el usuario.
import { Router } from 'express';

// Importamos el controlador que devuelve la información del usuario actual.
import { me } from '../controllers/userController.js';

// Importamos el middleware de autenticación.
// Este middleware verifica el token y adjunta req.user.
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Creamos el router específico para /users.
const router = Router();

// Ruta para obtener el perfil del usuario autenticado.
// Método: GET
// URL completa: GET /users/me
// Requiere pasar por authMiddleware primero (es decir, token válido).
router.get('/me', authMiddleware, me);

// Exportamos el router para usarlo en index.js como:
// app.use('/users', userRoutes);
export default router;
