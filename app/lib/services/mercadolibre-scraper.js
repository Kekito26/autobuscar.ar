/**
 * MercadoLibre Web Scraper
 * Since the API returns 403 Forbidden, we scrape the search results page
 * MercadoLibre embeds JSON data in their pages, which we extract
 */

import * as cheerio from 'cheerio';

export async function searchMercadoLibreScraper(query, filters = {}) {
  try {
    console.log('[MercadoLibre Scraper] Starting search with:', { query, filters });
    
    // Build search URL - use their actual search page
    const searchQuery = encodeURIComponent(query);
    const url = `https://autos.mercadolibre.com.ar/vehiculos/_PublishedToday_YES/_DisplayType_G*_NoIndex_True?q=${searchQuery}`;
    
    console.log('[MercadoLibre Scraper] Fetching:', url);
    
    // Fetch the HTML page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
        'Referer': 'https://www.mercadolibre.com.ar/',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('[MercadoLibre Scraper] HTTP Error:', response.status);
      return [];
    }
    
    const html = await response.text();
    console.log('[MercadoLibre Scraper] HTML length:', html.length);
    
    // Method 1: Try to extract JSON data from script tags
    const scriptMatches = [
      /window\.__PRELOADED_STATE__\s*=\s*({.+?});/s,
      /window\.__INITIAL_STATE__\s*=\s*({.+?});/s,
      /"items":\s*(\[[\s\S]*?\])/,
      /"results":\s*(\[[\s\S]*?\])/,
    ];
    
    for (const pattern of scriptMatches) {
      const match = html.match(pattern);
      if (match) {
        try {
          const jsonStr = match[1];
          const data = JSON.parse(jsonStr);
          console.log('[MercadoLibre Scraper] Found JSON data with pattern');
          
          const items = extractItemsFromPreloadedState(data);
          if (items && items.length > 0) {
            console.log(`[MercadoLibre Scraper] Found ${items.length} items from embedded JSON`);
            return transformMercadoLibreItems(items, filters);
          }
        } catch (e) {
          console.warn('[MercadoLibre Scraper] Failed to parse JSON:', e.message);
        }
      }
    }
    
    // Method 2: Use cheerio to parse HTML and extract items
    const $ = cheerio.load(html);
    const items = [];
    
    // Try different selectors that MercadoLibre might use
    const selectors = [
      'li[data-id]',
      '.ui-search-result',
      '[data-item-id]',
      '.item',
      'article[data-id]',
      'li.andes-list__item',
      'div[data-item-id]',
      'section[data-item-id]',
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`[MercadoLibre Scraper] Found ${elements.length} elements with selector: ${selector}`);
        
        elements.each((i, elem) => {
          try {
            const $elem = $(elem);
            const itemId = $elem.attr('data-id') || 
                          $elem.attr('data-item-id') || 
                          $elem.find('[data-id]').first().attr('data-id') ||
                          $elem.find('[data-item-id]').first().attr('data-item-id');
            
            if (!itemId) {
              // Try to extract ID from link
              const link = $elem.find('a').first().attr('href') || '';
              const linkMatch = link.match(/MLA-(\d+)/);
              if (linkMatch) {
                const extractedId = linkMatch[1];
                // Extract data from the element
                const title = $elem.find('h2, h3, .ui-search-item__title, [class*="title"], [class*="Title"]').first().text().trim() ||
                             $elem.attr('title') ||
                             $elem.find('a').first().attr('title') ||
                             '';
                const priceText = $elem.find('[class*="price"], .price, [class*="amount"], [class*="Price"]').first().text().trim() ||
                                 $elem.find('span[class*="price"]').first().text().trim() ||
                                 '';
                const price = extractPrice(priceText);
                const fullLink = link.startsWith('http') ? link : (link.startsWith('/') ? `https://articulo.mercadolibre.com.ar${link}` : `https://articulo.mercadolibre.com.ar/MLA-${extractedId}`);
                const image = $elem.find('img').first().attr('src') || 
                             $elem.find('img').first().attr('data-src') || 
                             $elem.find('img').first().attr('data-lazy') ||
                             '';
                const location = $elem.find('[class*="location"], [class*="city"], [class*="Location"]').first().text().trim() || 'Argentina';
                
                if (title && (price || extractedId)) {
                  items.push({
                    id: extractedId,
                    title: title,
                    price: price || 0,
                    permalink: fullLink,
                    thumbnail: image,
                    location: location,
                  });
                }
              }
            } else {
              // Extract data from the element
              const title = $elem.find('h2, h3, .ui-search-item__title, [class*="title"], [class*="Title"]').first().text().trim() ||
                           $elem.attr('title') ||
                           $elem.find('a').first().attr('title') ||
                           '';
              const priceText = $elem.find('[class*="price"], .price, [class*="amount"], [class*="Price"]').first().text().trim() ||
                               $elem.find('span[class*="price"]').first().text().trim() ||
                               '';
              const price = extractPrice(priceText);
              const link = $elem.find('a').first().attr('href') || '';
              const fullLink = link.startsWith('http') ? link : (link.startsWith('/') ? `https://articulo.mercadolibre.com.ar${link}` : `https://articulo.mercadolibre.com.ar/MLA-${itemId.replace('MLA-', '')}`);
              const image = $elem.find('img').first().attr('src') || 
                           $elem.find('img').first().attr('data-src') || 
                           $elem.find('img').first().attr('data-lazy') ||
                           '';
              const location = $elem.find('[class*="location"], [class*="city"], [class*="Location"]').first().text().trim() || 'Argentina';
              
              if (title && (price || itemId)) {
                items.push({
                  id: itemId.replace('MLA-', '').replace(/[^\d]/g, ''),
                  title: title,
                  price: price || 0,
                  permalink: fullLink,
                  thumbnail: image,
                  location: location,
                });
              }
            }
          } catch (e) {
            console.warn('[MercadoLibre Scraper] Error extracting item:', e.message);
          }
        });
        
        if (items.length > 0) {
          console.log(`[MercadoLibre Scraper] Extracted ${items.length} items using cheerio with selector: ${selector}`);
          return transformMercadoLibreItems(items, filters);
        }
      }
    }
    
    // Method 3: Look for all links with MLA- IDs and extract nearby data
    const itemIdMatches = html.match(/MLA-\d+/g);
    if (itemIdMatches) {
      const uniqueIds = [...new Set(itemIdMatches)];
      console.log(`[MercadoLibre Scraper] Found ${uniqueIds.length} item IDs, trying to extract from HTML structure`);
      
      // Use cheerio to find links and extract data
      $('a[href*="MLA-"]').each((i, elem) => {
        try {
          const $link = $(elem);
          const href = $link.attr('href') || '';
          const idMatch = href.match(/MLA-(\d+)/);
          
          if (idMatch && items.length < 50) { // Limit to 50 items
            const itemId = idMatch[1];
            const $parent = $link.closest('li, article, div[data-id], section');
            
            const title = $link.attr('title') || 
                         $link.text().trim() ||
                         $parent.find('h2, h3, [class*="title"]').first().text().trim() ||
                         '';
            const priceText = $parent.find('[class*="price"], .price, [class*="amount"]').first().text().trim() ||
                            $link.siblings('[class*="price"]').first().text().trim() ||
                            '';
            const price = extractPrice(priceText);
            const image = $parent.find('img').first().attr('src') || 
                         $parent.find('img').first().attr('data-src') ||
                         $link.find('img').first().attr('src') ||
                         '';
            const location = $parent.find('[class*="location"]').first().text().trim() || 'Argentina';
            
            if (title && !items.find(item => item.id === itemId)) {
              items.push({
                id: itemId,
                title: title,
                price: price || 0,
                permalink: href.startsWith('http') ? href : `https://articulo.mercadolibre.com.ar${href}`,
                thumbnail: image,
                location: location,
              });
            }
          }
        } catch (e) {
          // Skip this item
        }
      });
      
      if (items.length > 0) {
        console.log(`[MercadoLibre Scraper] Extracted ${items.length} items from links`);
        return transformMercadoLibreItems(items, filters);
      }
    }
    
    console.warn('[MercadoLibre Scraper] Could not extract items from page - HTML structure may have changed');
    return [];
    
  } catch (error) {
    console.error('[MercadoLibre Scraper] Error:', error);
    return [];
  }
}

function extractPrice(priceText) {
  if (!priceText) return null;
  // Remove currency symbols and extract numbers
  const numbers = priceText.replace(/[^\d]/g, '');
  return numbers ? parseInt(numbers) : null;
}

function extractItemsFromPreloadedState(data) {
  // MercadoLibre's preloaded state structure can vary
  // Try common paths where items might be stored
  const paths = [
    'initialState.components.results.items',
    'results.items',
    'items',
    'initialState.results',
    'searchResults.items',
  ];
  
  for (const path of paths) {
    const value = getNestedValue(data, path);
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }
  
  // Try to find any array that looks like items
  function findItems(obj, depth = 0) {
    if (depth > 5) return null;
    if (Array.isArray(obj) && obj.length > 0) {
      const first = obj[0];
      if (first && typeof first === 'object' && (first.id || first.permalink || first.title)) {
        return obj;
      }
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        const found = findItems(obj[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  }
  
  return findItems(data);
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function transformMercadoLibreItems(items, filters) {
  return items
    .filter(item => item && (item.id || item.permalink))
    .map(item => {
      // Extract data from MercadoLibre item structure
      const title = item.title || item.plain_text || '';
      const price = item.price || item.currency_id === 'ARS' ? item.amount : null;
      
      // Extract year from title
      const yearMatch = title.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;
      
      // Extract location
      const location = item.location?.city_name || 
                      item.location?.state_name || 
                      item.seller?.address?.city || 
                      'Argentina';
      
      // Extract attributes
      let km = null;
      let brand = null;
      let model = null;
      
      if (item.attributes) {
        const kmAttr = item.attributes.find(attr => 
          attr.id === 'KILOMETERS' || attr.id === 'KILOMETRAJE' || attr.name === 'Kilometraje'
        );
        if (kmAttr) {
          const kmValue = kmAttr.value_name || kmAttr.value;
          if (kmValue) {
            const kmStr = String(kmValue).replace(/\./g, '').replace(/\s/g, '');
            km = parseInt(kmStr) || null;
          }
        }
        
        const brandAttr = item.attributes.find(attr => 
          attr.id === 'BRAND' || attr.id === 'MARCA' || attr.name === 'Marca'
        );
        if (brandAttr) {
          brand = brandAttr.value_name || brandAttr.value;
        }
        
        const modelAttr = item.attributes.find(attr => 
          attr.id === 'MODEL' || attr.id === 'MODELO' || attr.name === 'Modelo'
        );
        if (modelAttr) {
          model = modelAttr.value_name || modelAttr.value;
        }
      }
      
      return {
        id: `ml_${item.id}`,
        title: title,
        price: price,
        currency: item.currency_id || 'ARS',
        thumbnail: item.thumbnail || item.pictures?.[0]?.url,
        permalink: item.permalink || `https://articulo.mercadolibre.com.ar/MLA-${item.id}`,
        location: location,
        year: year,
        km: km,
        brand: brand,
        model: model,
        condition: item.condition === 'new' ? 'Nuevo' : 'Usado',
        source: 'MercadoLibre',
        sourceId: item.id,
      };
    })
    .filter(item => {
      // Apply filters
      if (filters.year && filters.year !== 'null' && filters.year !== '') {
        if (item.year !== parseInt(filters.year)) return false;
      }
      if (filters.minKm && item.km && item.km < parseInt(filters.minKm)) return false;
      if (filters.maxKm && item.km && item.km > parseInt(filters.maxKm)) return false;
      if (filters.brand && filters.brand !== 'null' && filters.brand !== '') {
        const brandLower = filters.brand.toLowerCase();
        if (!item.brand?.toLowerCase().includes(brandLower) && 
            !item.title?.toLowerCase().includes(brandLower)) {
          return false;
        }
      }
      if (filters.model && filters.model !== 'null' && filters.model !== '') {
        const modelLower = filters.model.toLowerCase();
        if (!item.model?.toLowerCase().includes(modelLower) && 
            !item.title?.toLowerCase().includes(modelLower)) {
          return false;
        }
      }
      if (filters.state && filters.state !== 'null' && filters.state !== '') {
        if (!item.location?.toLowerCase().includes(filters.state.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
}
