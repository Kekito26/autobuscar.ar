/**
 * MercadoLibre Client-Side Service
 * This version makes requests from the browser to avoid 403 errors
 * Use this if server-side requests are blocked
 */

export async function searchMercadoLibreClient(query, filters = {}) {
  console.log('[MercadoLibre Client] Starting search with:', { query, filters });
  
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('q', query);
    // Try without category first - sometimes category filter causes issues
    // params.append('category', 'MLA1744'); // Vehicles category
    params.append('limit', filters.limit || 50);
    
    const url = `https://api.mercadolibre.com/sites/MLA/search?${params.toString()}`;
    
    console.log('[MercadoLibre Client] Fetching URL:', url);
    
    // Client-side fetch (from browser)
    // Note: MercadoLibre API should allow CORS from browsers
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors', // Explicitly set CORS mode
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('[MercadoLibre Client] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MercadoLibre Client] API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // If 403, try without category filter
      if (response.status === 403) {
        console.log('[MercadoLibre Client] 403 error - trying without category filter...');
        const paramsNoCategory = new URLSearchParams();
        paramsNoCategory.append('q', query);
        paramsNoCategory.append('limit', filters.limit || 50);
        const urlNoCategory = `https://api.mercadolibre.com/sites/MLA/search?${paramsNoCategory.toString()}`;
        
        const retryResponse = await fetch(urlNoCategory, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (retryResponse.ok) {
          console.log('[MercadoLibre Client] Retry successful without category');
          const retryData = await retryResponse.json();
          // Filter to only vehicles manually
          if (retryData.results && Array.isArray(retryData.results)) {
            // Filter by checking if title contains vehicle-related keywords
            const vehicleKeywords = ['auto', 'vehiculo', 'carro', 'coche', 'ford', 'chevrolet', 'toyota', 'volkswagen', 'fiat', 'peugeot', 'renault', 'citroen'];
            retryData.results = retryData.results.filter(item => {
              const titleLower = item.title.toLowerCase();
              return vehicleKeywords.some(keyword => titleLower.includes(keyword)) ||
                     item.category_id === 'MLA1744' ||
                     (item.attributes && item.attributes.some(attr => 
                       attr.id === 'BRAND' || attr.id === 'MARCA' || 
                       attr.id === 'KILOMETERS' || attr.id === 'KILOMETRAJE'
                     ));
            });
            // Continue with filtered results
            const data = retryData;
            return processMercadoLibreResults(data, filters);
          }
        }
      }
      
      return [];
    }
    
    const data = await response.json();
    return processMercadoLibreResults(data, filters);
    
  } catch (error) {
    console.error('[MercadoLibre Client] Error:', error);
    console.error('[MercadoLibre Client] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return [];
  }
}

function processMercadoLibreResults(data, filters) {
  if (!data.results || !Array.isArray(data.results)) {
    console.warn('[MercadoLibre Client] No results or invalid format:', data);
    return [];
  }
  
  console.log(`[MercadoLibre Client] Found ${data.results.length} raw results`);
  
  // Transform results to unified format (same as server-side version)
  const results = data.results.map(item => {
      const yearMatch = item.title.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;
      
      let km = null;
      let brand = null;
      let model = null;
      
      if (item.attributes && Array.isArray(item.attributes)) {
        const kmAttr = item.attributes.find(attr => 
          attr.id === 'KILOMETERS' || attr.id === 'KILOMETRAJE'
        );
        if (kmAttr && kmAttr.value_name) {
          const kmStr = kmAttr.value_name.replace(/\./g, '').replace(/\s/g, '');
          km = parseInt(kmStr) || null;
        }
        
        const brandAttr = item.attributes.find(attr => 
          attr.id === 'BRAND' || attr.id === 'MARCA'
        );
        if (brandAttr && brandAttr.value_name) {
          brand = brandAttr.value_name;
        }
        
        const modelAttr = item.attributes.find(attr => 
          attr.id === 'MODEL' || attr.id === 'MODELO'
        );
        if (modelAttr && modelAttr.value_name) {
          model = modelAttr.value_name;
        }
      }
      
      const location = 
        (item.location?.city?.name) || 
        (item.location?.state?.name) || 
        'Argentina';
      
      return {
        id: `ml_${item.id}`,
        title: item.title,
        price: item.price,
        currency: item.currency_id || 'ARS',
        thumbnail: item.thumbnail,
        permalink: item.permalink,
        location: location,
        year: year,
        km: km,
        brand: brand,
        model: model,
        condition: item.condition === 'new' ? 'Nuevo' : 'Usado',
        source: 'MercadoLibre',
        sourceId: item.id,
      };
    });
    
    // Apply filters (same as server-side)
    let filteredResults = results;
    
    if (filters.year && filters.year !== 'null' && filters.year !== '') {
      const yearFilter = parseInt(filters.year);
      filteredResults = filteredResults.filter(item => item.year === yearFilter);
    }
    
    if (filters.minKm !== undefined && filters.minKm !== null && filters.minKm !== 'null' && filters.minKm !== '') {
      const minKmFilter = parseInt(filters.minKm);
      filteredResults = filteredResults.filter(item => !item.km || item.km >= minKmFilter);
    }
    
    if (filters.maxKm !== undefined && filters.maxKm !== null && filters.maxKm !== 'null' && filters.maxKm !== '') {
      const maxKmFilter = parseInt(filters.maxKm);
      filteredResults = filteredResults.filter(item => !item.km || item.km <= maxKmFilter);
    }
    
    if (filters.brand && filters.brand !== 'null' && filters.brand !== '') {
      const brandLower = filters.brand.toLowerCase();
      filteredResults = filteredResults.filter(item => 
        item.brand?.toLowerCase().includes(brandLower) ||
        item.title?.toLowerCase().includes(brandLower)
      );
    }
    
    if (filters.model && filters.model !== 'null' && filters.model !== '') {
      const modelLower = filters.model.toLowerCase();
      filteredResults = filteredResults.filter(item => 
        item.model?.toLowerCase().includes(modelLower) ||
        item.title?.toLowerCase().includes(modelLower)
      );
    }
    
    if (filters.state && filters.state !== 'null' && filters.state !== '') {
      const stateLower = filters.state.toLowerCase();
      filteredResults = filteredResults.filter(item => 
        item.location?.toLowerCase().includes(stateLower)
      );
    }
    
    console.log(`[MercadoLibre Client] After filters: ${filteredResults.length} results`);
    return filteredResults;
}
