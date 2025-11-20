// src/scripts/seedDestinations.js
// --------------------------------
// Script para cargar varios destinos de ejemplo en Firestore.
// Se ejecuta con:  npm run seed:destinations  (después de agregar el script en package.json)

import { db } from '../config/firebase.js';

const destinations = [

    // -------------------------------------------------------------------
  // Nuevos destinos internacionales para enriquecer el catálogo NomadIQ
  // -------------------------------------------------------------------

  // Ushuaia: ciudad más austral del mundo, naturaleza extrema y nieve.
  {
    name: 'Ushuaia',
    country: 'Argentina',
    summary:
      'La ciudad más austral del mundo, con paisajes patagónicos extremos, nieve gran parte del año y excursiones al fin del mundo.',
    coords: { lat: -54.8019, lng: -68.3030 },
    tags: ['nieve', 'naturaleza', 'aventura', 'fin del mundo'],
    images: []
  },

  // El Calafate: acceso al glaciar Perito Moreno y la Patagonia sur.
  {
    name: 'El Calafate',
    country: 'Argentina',
    summary:
      'Puerta de entrada al glaciar Perito Moreno y a la Patagonia sur, ideal para amantes de la naturaleza y paisajes imponentes.',
    coords: { lat: -50.3379, lng: -72.2648 },
    tags: ['naturaleza', 'glaciares', 'aventura'],
    images: []
  },

  // Cartagena de Indias: ciudad amurallada, Caribe, historia y color.
  {
    name: 'Cartagena de Indias',
    country: 'Colombia',
    summary:
      'Ciudad colonial amurallada frente al mar Caribe, llena de color, historia y atardeceres inolvidables.',
    coords: { lat: 10.3910, lng: -75.4794 },
    tags: ['playa', 'historia', 'cultura', 'romántico'],
    images: []
  },

  // Ciudad de México: cultura, museos, gastronomía y caos encantador.
  {
    name: 'Ciudad de México',
    country: 'México',
    summary:
      'Metrópolis inmensa con museos de primer nivel, barrios históricos, gastronomía potente y una energía urbana única.',
    coords: { lat: 19.4326, lng: -99.1332 },
    tags: ['ciudad', 'cultura', 'gastronomía', 'historia'],
    images: []
  },

  // Cancún: playas de agua turquesa y resorts todo incluido.
  {
    name: 'Cancún',
    country: 'México',
    summary:
      'Destino caribeño famoso por sus playas de agua turquesa, resorts todo incluido y vida nocturna intensa.',
    coords: { lat: 21.1619, lng: -86.8515 },
    tags: ['playa', 'fiesta', 'relax'],
    images: []
  },

  // Cusco: capital histórica del Imperio Inca y puerta a Machu Picchu.
  {
    name: 'Cusco',
    country: 'Perú',
    summary:
      'Ciudad andina histórica, mezcla de herencia inca y colonial, base ideal para explorar el Valle Sagrado y Machu Picchu.',
    coords: { lat: -13.5319, lng: -71.9675 },
    tags: ['historia', 'montaña', 'cultura'],
    images: []
  },

  // Barcelona: arte, arquitectura de Gaudí y playa urbana.
  {
    name: 'Barcelona',
    country: 'España',
    summary:
      'Ciudad mediterránea con arquitectura de Gaudí, vida cultural intensa y playa urbana para equilibrar turismo y relax.',
    coords: { lat: 41.3874, lng: 2.1686 },
    tags: ['ciudad', 'arte', 'playa', 'gastronomía'],
    images: []
  },

  // Madrid: capital vibrante, museos y vida nocturna.
  {
    name: 'Madrid',
    country: 'España',
    summary:
      'Capital europea vibrante, con grandes museos, parques, gastronomía y una vida nocturna que parece no terminar.',
    coords: { lat: 40.4168, lng: -3.7038 },
    tags: ['ciudad', 'cultura', 'vida nocturna'],
    images: []
  },

  // Roma: historia antigua, ruinas, plazas y comida italiana.
  {
    name: 'Roma',
    country: 'Italia',
    summary:
      'Ciudad eterna llena de ruinas romanas, plazas fotogénicas y gastronomía italiana clásica.',
    coords: { lat: 41.9028, lng: 12.4964 },
    tags: ['historia', 'cultura', 'gastronomía'],
    images: []
  },

  // Nueva York: ciudad icónica, rascacielos y diversidad cultural.
  {
    name: 'Nueva York',
    country: 'Estados Unidos',
    summary:
      'Metrópolis icónica de rascacielos, barrios muy diferentes entre sí y una oferta cultural y gastronómica infinita.',
    coords: { lat: 40.7128, lng: -74.0060 },
    tags: ['ciudad', 'tecnología', 'cultura', 'compras'],
    images: []
  },

  // Tokio: megaciudad futurista con tradición y tecnología.
  {
    name: 'Tokio',
    country: 'Japón',
    summary:
      'Megaciudad que combina templos tradicionales con barrios ultramodernos, neones y cultura pop japonesa.',
    coords: { lat: 35.6762, lng: 139.6503 },
    tags: ['ciudad', 'tecnología', 'cultura', 'gastronomía'],
    images: []
  },

  // Bangkok: caos amable, templos, mercados y comida callejera.
  {
    name: 'Bangkok',
    country: 'Tailandia',
    summary:
      'Capital del sudeste asiático con templos dorados, mercados flotantes y una de las mejores comidas callejeras del mundo.',
    coords: { lat: 13.7563, lng: 100.5018 },
    tags: ['ciudad', 'cultura', 'gastronomía', 'exótico'],
    images: []
  },

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
