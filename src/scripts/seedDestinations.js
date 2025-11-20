// src/scripts/seedDestinations.js
// --------------------------------
// Script para cargar varios destinos de ejemplo en Firestore.
// Se ejecuta con:  npm run seed:destinations  (después de agregar el script en package.json)

import { db } from '../config/firebase.js';

const destinations = [
  {
    name: 'Bariloche',
    country: 'Argentina',
    summary: 'Destino de lagos, montañas y nieve, ideal para naturaleza y aventura.',
    coords: { lat: -41.1335, lng: -71.3103 },
    tags: ['montaña', 'nieve', 'aventura', 'naturaleza'],
    images: []
  },
  {
    name: 'Buenos Aires',
    country: 'Argentina',
    summary: 'Ciudad cosmopolita, llena de cultura, gastronomía y vida nocturna.',
    coords: { lat: -34.6037, lng: -58.3816 },
    tags: ['ciudad', 'gastronomía', 'cultura', 'noche'],
    images: []
  },
  {
    name: 'Mendoza',
    country: 'Argentina',
    summary: 'Región de viñedos y montañas, perfecta para enoturismo y aventura.',
    coords: { lat: -32.8895, lng: -68.8458 },
    tags: ['vino', 'montaña', 'naturaleza'],
    images: []
  },
  {
    name: 'Salta',
    country: 'Argentina',
    summary: 'Paisajes únicos, pueblos coloniales y cultura del norte argentino.',
    coords: { lat: -24.7829, lng: -65.4232 },
    tags: ['cultura', 'historia', 'paisajes'],
    images: []
  },
  {
    name: 'Iguazú',
    country: 'Argentina',
    summary: 'Cataratas impresionantes en plena selva misionera.',
    coords: { lat: -25.6953, lng: -54.4367 },
    tags: ['agua', 'naturaleza', 'selva'],
    images: []
  },
  {
    name: 'Rio de Janeiro',
    country: 'Brasil',
    summary: 'Playas famosas, carnaval y vistas icónicas como el Cristo Redentor.',
    coords: { lat: -22.9068, lng: -43.1729 },
    tags: ['playa', 'fiesta', 'ciudad'],
    images: []
  },
  {
    name: 'Florianópolis',
    country: 'Brasil',
    summary: 'Isla con playas, naturaleza y ambiente relajado.',
    coords: { lat: -27.5949, lng: -48.5482 },
    tags: ['playa', 'naturaleza', 'relax'],
    images: []
  },
  {
    name: 'Santiago de Chile',
    country: 'Chile',
    summary: 'Capital moderna rodeada de montañas, ideal como base para explorar.',
    coords: { lat: -33.4489, lng: -70.6693 },
    tags: ['ciudad', 'montaña', 'gastronomía'],
    images: []
  },
  {
    name: 'Lima',
    country: 'Perú',
    summary: 'Centro gastronómico de Sudamérica, frente al Pacífico.',
    coords: { lat: -12.0464, lng: -77.0428 },
    tags: ['gastronomía', 'cultura', 'ciudad'],
    images: []
  },
  {
    name: 'Cusco',
    country: 'Perú',
    summary: 'Antigua capital del Imperio Inca, puerta de entrada a Machu Picchu.',
    coords: { lat: -13.5319, lng: -71.9675 },
    tags: ['historia', 'montaña', 'cultura'],
    images: []
  }
  // 👉 Podés seguir agregando destinos acá copiando el mismo formato
];

// Función principal del script
async function main() {
  console.log('🌍 Iniciando seed de destinos...');

  const col = db.collection('destinations');
  const now = new Date().toISOString();

  for (const dest of destinations) {
    const docRef = col.doc(); // ID automático
    await docRef.set({
      ...dest,
      createdAt: now,
      updatedAt: now
    });
    console.log(`✅ Destino creado: ${dest.name} (id: ${docRef.id})`);
  }

  console.log('✅ Seed completado. Destinos cargados en Firestore.');
  process.exit(0);
}

// Ejecutamos main y capturamos errores
main().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
