// Datos dummy para mostrar el diseño mientras se integran las APIs reales
const DUMMY_CARS = [
  {
    id: 'ml-001',
    title: 'Ford Focus III SE Plus 1.6 2018',
    price: 8500000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&q=80',
    permalink: 'https://auto.mercadolibre.com.ar',
    location: 'Capital Federal',
    state: 'CABA',
    year: 2018,
    km: 85000,
    condition: 'Usado',
    isDealer: false,
    source: 'MercadoLibre',
  },
  {
    id: 'ml-002',
    title: 'Volkswagen Gol Trend 1.6 2020',
    price: 6200000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80',
    permalink: 'https://auto.mercadolibre.com.ar',
    location: 'La Plata',
    state: 'Buenos Aires',
    year: 2020,
    km: 42000,
    condition: 'Usado',
    isDealer: false,
    source: 'MercadoLibre',
  },
  {
    id: 'kv-001',
    title: 'Toyota Corolla XEI 1.8 CVT 2021',
    price: 18900000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=600&q=80',
    permalink: 'https://www.kavak.com/ar',
    location: 'Córdoba',
    state: 'Córdoba',
    year: 2021,
    km: 31000,
    condition: 'Usado',
    isDealer: true,
    source: 'Kavak',
  },
  {
    id: 'ml-003',
    title: 'Fiat Cronos 1.3 Drive 2022',
    price: 11400000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80',
    permalink: 'https://auto.mercadolibre.com.ar',
    location: 'Rosario',
    state: 'Santa Fe',
    year: 2022,
    km: 22000,
    condition: 'Usado',
    isDealer: false,
    source: 'MercadoLibre',
  },
  {
    id: 'v6-001',
    title: 'Peugeot 208 Allure 1.6 2023',
    price: 16800000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80',
    permalink: 'https://www.v6.com.ar',
    location: 'Mendoza',
    state: 'Mendoza',
    year: 2023,
    km: 15000,
    condition: 'Usado',
    isDealer: true,
    source: 'V6',
  },
  {
    id: 'fb-001',
    title: 'Chevrolet Onix Plus Premier 2021',
    price: 13200000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80',
    permalink: 'https://www.facebook.com/marketplace',
    location: 'Tucumán',
    state: 'Tucumán',
    year: 2021,
    km: 38000,
    condition: 'Usado',
    isDealer: false,
    source: 'Facebook',
  },
  {
    id: 'ml-004',
    title: 'Renault Sandero Stepway 1.6 2019',
    price: 7900000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
    permalink: 'https://auto.mercadolibre.com.ar',
    location: 'Mar del Plata',
    state: 'Buenos Aires',
    year: 2019,
    km: 67000,
    condition: 'Usado',
    isDealer: false,
    source: 'MercadoLibre',
  },
  {
    id: 'kv-002',
    title: 'Honda Civic EXL 1.5 Turbo 2020',
    price: 21500000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80',
    permalink: 'https://www.kavak.com/ar',
    location: 'Capital Federal',
    state: 'CABA',
    year: 2020,
    km: 44000,
    condition: 'Usado',
    isDealer: true,
    source: 'Kavak',
  },
  {
    id: 'v6-002',
    title: 'Toyota Hilux SRV 4x4 AT 2022',
    price: 38000000,
    currency: 'ARS',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
    permalink: 'https://www.v6.com.ar',
    location: 'Neuquén',
    state: 'Neuquén',
    year: 2022,
    km: 28000,
    condition: 'Usado',
    isDealer: true,
    source: 'V6',
  },
];

// Filtrar y adaptar dummy data según la búsqueda
function filterDummyData(query, params) {
  let results = [...DUMMY_CARS];

  // Filtrar por término de búsqueda (básico)
  if (query) {
    const q = query.toLowerCase();
    const filtered = results.filter(car =>
      car.title.toLowerCase().includes(q) ||
      car.source.toLowerCase().includes(q) ||
      car.location.toLowerCase().includes(q)
    );
    // Si no hay matches exactos, devolver todos (para que siempre haya resultados)
    if (filtered.length > 0) results = filtered;
  }

  // Filtrar por fuentes seleccionadas
  const sources = params.get('sources')?.split(',') || [];
  if (sources.length > 0) {
    const sourceMap = {
      mercadolibre: 'MercadoLibre',
      kavak: 'Kavak',
      v6: 'V6',
      facebook: 'Facebook',
    };
    const activeSources = sources.map(s => sourceMap[s]).filter(Boolean);
    if (activeSources.length > 0) {
      results = results.filter(car => activeSources.includes(car.source));
    }
  }

  // Filtro de precio
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  if (minPrice) results = results.filter(c => c.price >= parseInt(minPrice));
  if (maxPrice) results = results.filter(c => c.price <= parseInt(maxPrice));

  // Filtro de año
  const minYear = params.get('minYear');
  const maxYear = params.get('maxYear');
  if (minYear) results = results.filter(c => c.year && c.year >= parseInt(minYear));
  if (maxYear) results = results.filter(c => c.year && c.year <= parseInt(maxYear));

  // Filtro de km
  const minKm = params.get('minKm');
  const maxKm = params.get('maxKm');
  if (minKm) results = results.filter(c => c.km && c.km >= parseInt(minKm));
  if (maxKm) results = results.filter(c => c.km && c.km <= parseInt(maxKm));

  // Filtro de vendedor
  const sellerType = params.get('sellerType');
  if (sellerType === 'Particular') results = results.filter(c => !c.isDealer);
  if (sellerType === 'Concesionaria') results = results.filter(c => c.isDealer);

  // Filtro de provincia
  const province = params.get('province');
  if (province && province !== 'Todas') {
    results = results.filter(c => c.state?.toLowerCase().includes(province.toLowerCase()));
  }

  return results;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  console.log('[API] Búsqueda recibida:', query);
  console.log('[API] Parámetros:', Object.fromEntries(searchParams));

  try {
    // Intentar con la API real de MercadoLibre
    const mlQuery = query || 'auto usado';
    const apiUrl = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(mlQuery)}&category=MLA1744&limit=20`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 seg timeout

    let mlResults = [];
    let mlSuccess = false;

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data.results?.length > 0) {
          mlResults = data.results.map(item => {
            const yearMatch = item.title.match(/\b(19|20)\d{2}\b/);
            const year = yearMatch ? parseInt(yearMatch[0]) : null;
            let km = null;
            if (item.attributes) {
              const kmAttr = item.attributes.find(a => a.id === 'KILOMETERS');
              if (kmAttr?.value_name) {
                km = parseInt(kmAttr.value_name.replace(/\D/g, '')) || null;
              }
            }
            return {
              id: `ml-${item.id}`,
              title: item.title,
              price: item.price,
              currency: item.currency_id,
              thumbnail: item.thumbnail?.replace('-I.jpg', '-O.jpg') || item.thumbnail,
              permalink: item.permalink,
              location: item.location?.city?.name || item.location?.state?.name || 'Argentina',
              state: item.location?.state?.name || '',
              year,
              km,
              condition: item.condition === 'new' ? 'Nuevo' : 'Usado',
              isDealer: item.official_store_id !== null,
              source: 'MercadoLibre',
            };
          });
          mlSuccess = true;
          console.log('[ML] Resultados reales:', mlResults.length);
        }
      }
    } catch (mlError) {
      clearTimeout(timeout);
      console.log('[ML] Error o timeout, usando dummy data:', mlError.message);
    }

    // Si la API real falló o no dio resultados, usar dummy data
    const finalResults = mlSuccess && mlResults.length > 0
      ? mlResults
      : filterDummyData(query, searchParams);

    console.log('[API] Resultados finales:', finalResults.length, mlSuccess ? '(reales)' : '(dummy)');

    return Response.json({
      results: finalResults,
      stats: {
        total: finalResults.length,
        isDummy: !mlSuccess,
        sources: {
          mercadolibre: { success: true, count: finalResults.filter(r => r.source === 'MercadoLibre').length },
          kavak:        { success: mlSuccess ? false : true, count: finalResults.filter(r => r.source === 'Kavak').length },
          v6:           { success: mlSuccess ? false : true, count: finalResults.filter(r => r.source === 'V6').length },
          facebook:     { success: mlSuccess ? false : true, count: finalResults.filter(r => r.source === 'Facebook').length },
        },
      },
      query,
    });

  } catch (error) {
    console.error('[API] Error general:', error);
    // En caso de error total, siempre devolver dummy data
    const fallback = filterDummyData(query, searchParams);
    return Response.json({
      results: fallback,
      stats: { total: fallback.length, isDummy: true, sources: {} },
      query,
    });
  }
}