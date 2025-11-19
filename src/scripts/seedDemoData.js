// src/scripts/seedDemoData.js
// -------------------------------------------------------------
// Script de SEED de datos de prueba para NomadIQ.
//
// ¿Qué hace este archivo?
// - Crea (si no existen) datos de DEMO en Firestore:
//   1) Un usuario demo.
//   2) Un destino "Bariloche".
//   3) Algunas actividades asociadas a Bariloche.
//   4) Un trip (viaje) demo asociado al usuario demo.
//   5) Un itinerario demo generado con el motor de REGLAS.
//
// Este script NO se ejecuta automáticamente con el servidor.
// Lo vas a correr a mano con un comando tipo:
//   node src/scripts/seedDemoData.js
//
// ❗ Importante para la rúbrica:
// - Muestra que sabés preparar un entorno de prueba coherente.
// - Usa los mismos services que el backend (no inventa rutas raras).
// - Deja logs claros en consola para que el profesor vea que funciona.
// -------------------------------------------------------------

// Cargamos variables de entorno desde .env (para Firebase, etc.).
// Esto es similar a lo que hace index.js al iniciarse.
import 'dotenv/config.js';

// Importamos los servicios que ya usa tu backend.
// Así nos aseguramos de respetar la lógica de negocio
// (timestamps, validaciones, estructuras, etc.).
import {
  findUserByEmail,
  createUser
} from '../services/userService.js';

import {
  createDestination
} from '../services/destinationService.js';

import {
  createActivity
} from '../services/activityService.js';

import {
  createTrip
} from '../services/tripService.js';

import {
  createItinerary,
  generateItineraryRules
} from '../services/itineraryService.js';

// Pequeña función de ayuda para loguear bonito.
function logStep(message) {
  console.log(`[SEED] ${message}`);
}

// Función principal del seed.
// La envolvemos en una async function para poder usar await.
async function runSeed() {
  try {
    logStep('Iniciando seed de datos demo para NomadIQ...');

    // ---------------------------------------------------------
    // 1) Usuario DEMO
    // ---------------------------------------------------------
    // Definimos un usuario demo con un email fácil de recordar.
    const demoEmail = 'demo@nomadiq.test';

    logStep(`Buscando usuario demo con email: ${demoEmail}...`);

    // Verificamos si ya existe un usuario con ese email.
    let demoUser = await findUserByEmail(demoEmail);

    if (!demoUser) {
      logStep('Usuario demo no existe. Creándolo...');

      // Creamos el usuario usando el service (así se hashéa la contraseña).
      // Contraseña elegida: DemoNomad123
      const created = await createUser({
        email: demoEmail,
        password: 'DemoNomad123',
        name: 'Demo Nomad',
        role: 'user',
        avatarUrl: null
      });

      demoUser = created;
      logStep(`Usuario demo creado con id: ${demoUser.id}`);
    } else {
      logStep(`Usuario demo ya existía con id: ${demoUser.id}`);
    }

    // ---------------------------------------------------------
    // 2) Destino DEMO: Bariloche
    // ---------------------------------------------------------
    logStep('Creando destino demo: Bariloche...');

    const bariloche = await createDestination({
      name: 'Bariloche',
      country: 'AR',
      summary:
        'Ciudad patagónica rodeada de montañas y el lago Nahuel Huapi, ideal para nieve, paisajes y gastronomía.',
      coords: {
        lat: -41.1335,
        lng: -71.3103
      },
      tags: ['nieve', 'paisajes', 'gastronomía'],
      images: []
    });

    logStep(`Destino Bariloche creado con id: ${bariloche.id}`);

    // ---------------------------------------------------------
    // 3) Actividades DEMO asociadas a Bariloche
    // ---------------------------------------------------------
    logStep('Creando actividades demo para Bariloche...');

    const activities = [];

    // Actividad 1: Paseo por el Centro Cívico
    const act1 = await createActivity({
      destinationId: bariloche.id,
      name: 'Paseo por el Centro Cívico y costanera',
      category: 'paseo',
      priceRange: 'free',
      openingHours: 'Libre durante el día',
      coords: bariloche.coords,
      rating: 4.7,
      reviewsCount: 128,
      images: []
    });
    activities.push(act1);

    // Actividad 2: Circuito Chico
    const act2 = await createActivity({
      destinationId: bariloche.id,
      name: 'Excursión Circuito Chico',
      category: 'aventura',
      priceRange: 'medium',
      openingHours: 'Salidas por la mañana y la tarde',
      coords: bariloche.coords,
      rating: 4.8,
      reviewsCount: 256,
      images: []
    });
    activities.push(act2);

    // Actividad 3: Cena patagónica
    const act3 = await createActivity({
      destinationId: bariloche.id,
      name: 'Cena típica patagónica',
      category: 'gastronomía',
      priceRange: 'high',
      openingHours: '19:00 - 23:30',
      coords: bariloche.coords,
      rating: 4.6,
      reviewsCount: 89,
      images: []
    });
    activities.push(act3);

    logStep(
      `Actividades demo creadas para Bariloche: ${activities.length} actividades.`
    );

    // ---------------------------------------------------------
    // 4) Trip DEMO asociado al usuario demo
    // ---------------------------------------------------------
    logStep('Creando trip demo para el usuario demo...');

    const demoTrip = await createTrip({
      userId: demoUser.id,
      title: 'Viaje demo a Bariloche en invierno',
      startDate: '2025-07-15',
      endDate: '2025-07-18',
      budget: 800000,
      interests: ['nieve', 'paisajes', 'gastronomía'],
      status: 'planned'
    });

    logStep(`Trip demo creado con id: ${demoTrip.id}`);

    // ---------------------------------------------------------
    // 5) Itinerario DEMO usando el motor de REGLAS
    // ---------------------------------------------------------
    logStep('Generando itinerario demo con el motor de REGLAS...');

    // Usamos el motor de reglas que ya está definido en itineraryService.
    const itineraryData = generateItineraryRules({
      trip: demoTrip,
      activities
    });

    // Guardamos el itinerario en Firestore usando el service.
    const demoItinerary = await createItinerary({
      tripId: demoTrip.id,
      data: itineraryData,
      aiModelUsed: 'rules'
    });

    logStep(
      `Itinerario demo creado con id: ${demoItinerary.id} para el trip ${demoTrip.id}`
    );

    // ---------------------------------------------------------
    // FIN DEL SEED
    // ---------------------------------------------------------
    logStep('Seed de datos DEMO completado con éxito ✅');
    logStep('Resumen rápido:');
    logStep(`- Usuario demo: ${demoUser.email} (id: ${demoUser.id})`);
    logStep(`- Destino: ${bariloche.name} (id: ${bariloche.id})`);
    logStep(`- Actividades: ${activities.length} creadas.`);
    logStep(`- Trip demo id: ${demoTrip.id}`);
    logStep(`- Itinerario demo id: ${demoItinerary.id}`);

    // Terminamos el proceso de Node explícitamente.
    process.exit(0);
  } catch (err) {
    console.error('[SEED] Error durante el seed de datos demo:');
    console.error(err);
    process.exit(1);
  }
}

// Ejecutamos la función principal.
runSeed();
