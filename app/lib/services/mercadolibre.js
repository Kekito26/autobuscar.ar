/**
 * MercadoLibre API Service
 * Fetches car listings from MercadoLibre Argentina
 */

// Import scraper as fallback
import { searchMercadoLibreScraper } from './mercadolibre-scraper';

export async function searchMercadoLibre(query, filters = {}) {
  console.log('[MercadoLibre] Starting search with:', { query, filters });
  console.log('[MercadoLibre] Note: API returns 403, using scraper instead');
  
  // Since API returns 403, use scraper
  return await searchMercadoLibreScraper(query, filters);
  
  /* Original API code - kept for reference but won't work due to 403
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('category', 'MLA1744'); // Vehicles category
    params.append('limit', filters.limit || 50);
    
    // Add filters if provided
    if (filters.year) {
      params.append('ITEM_CONDITION', filters.condition || '2230280'); // Used
    }
    
    const url = `https://api.mercadolibre.com/sites/MLA/search?${params.toString()}`;
    
    console.log('[MercadoLibre] Fetching:', url);
    
    // MercadoLibre API often blocks server-side requests with 403
    // This is a known issue - the public API should work but they block server requests
    // Solution: Make request from client-side or use a proxy
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log('[MercadoLibre] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MercadoLibre] API Error:', response.status, errorText);
      
      // 403 Forbidden - MercadoLibre might be blocking server-side requests
      if (response.status === 403) {
        console.warn('[MercadoLibre] 403 Forbidden - API might be blocking server-side requests');
        console.warn('[MercadoLibre] Possible solutions:');
        console.warn('  1. Use client-side fetch instead of server-side');
        console.warn('  2. Use a proxy service');
        console.warn('  3. Check if IP is rate-limited');
        console.warn('  4. Try without category filter');
      }
      
      // Don't throw - return empty array to allow other sources to work
      return [];
    }
    
    const data = await response.json();
    
    console.log('[MercadoLibre] Response data keys:', Object.keys(data));
    console.log('[MercadoLibre] Results count:', data.results?.length || 0);
    
    if (!data.results || !Array.isArray(data.results)) {
      console.warn('[MercadoLibre] No results or invalid format. Full response:', JSON.stringify(data, null, 2));
      return [];
    }
    
    console.log(`[MercadoLibre] Found ${data.results.length} results`);
    
    // Transform results to unified format
    const results = data.results.map(item => {
      // Extract year from title
      const yearMatch = item.title.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;
      
      // Extract kilometers from attributes
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
      
      // Get location
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
        rawData: item // Keep raw data for debugging
      };
    });
    
    // Apply filters
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
    
    console.log(`[MercadoLibre] After filters: ${filteredResults.length} results`);
    
    return filteredResults;
    
  } catch (error) {
    console.error('[MercadoLibre] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      error: error
    });
    // Return empty array but log the error for debugging
    return [];
  }
  */
}
