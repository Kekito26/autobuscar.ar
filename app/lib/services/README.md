# API Services Documentation

This directory contains service modules for each car listing source.

## Current Status

### ✅ Implemented
- **MercadoLibre** (`mercadolibre.js`) - Fully functional using public API

### 🚧 Placeholder (Need Implementation)
- **Kavak** (`kavak.js`) - Requires web scraping or API reverse engineering
- **OLX Autos** (`olx.js`) - Requires web scraping or API reverse engineering
- **V6** (`v6.js`) - Requires web scraping or API reverse engineering
- **Facebook Marketplace** (`facebook.js`) - Very difficult, may require Graph API

## How to Add a New Source

1. Create a new service file (e.g., `newSource.js`)
2. Export a function with this signature:
   ```javascript
   export async function searchNewSource(query, filters = {}) {
     // Your implementation
     return results; // Array of listings
   }
   ```

3. Each listing should follow this format:
   ```javascript
   {
     id: 'source_uniqueId',        // Unique ID (prefixed with source)
     title: 'Car title',
     price: 1000000,                // Number
     currency: 'ARS',
     thumbnail: 'https://...',      // Image URL
     permalink: 'https://...',      // Link to original listing
     location: 'City, Province',
     year: 2020,                    // Number or null
     km: 50000,                     // Number or null
     brand: 'Ford',                 // String or null
     model: 'Focus',                // String or null
     condition: 'Usado',            // 'Nuevo' or 'Usado'
     source: 'SourceName',          // Display name
     sourceId: 'originalId',        // Original ID from source
   }
   ```

4. Import and add to `index.js`:
   ```javascript
   import { searchNewSource } from './newSource';
   
   // In searchAllSources function:
   if (enabledSources.includes('newsource')) {
     searchPromises.push(
       searchNewSource(query, filters)
         .then(results => ({ source: 'newsource', results, success: true }))
         .catch(error => ({ source: 'newsource', results: [], success: false, error }))
     );
   }
   ```

## Filter Support

All services should support these filters (if available from the source):
- `year` - Filter by year
- `minKm` - Minimum kilometers
- `maxKm` - Maximum kilometers
- `brand` - Filter by brand
- `model` - Filter by model
- `state` - Filter by location/state
- `limit` - Maximum results to return

## Error Handling

- Always return an empty array `[]` on error (don't throw)
- Log errors with `console.error('[SourceName] Error:', error)`
- This allows other sources to continue working even if one fails

## Testing a New Source

1. Test the service function directly:
   ```javascript
   import { searchNewSource } from './newSource';
   const results = await searchNewSource('Ford Focus');
   console.log(results);
   ```

2. Test through the API:
   ```
   GET /api/search?q=Ford Focus&sources=newsource
   ```

3. Test in the UI by enabling the source checkbox

## MercadoLibre API Notes

- Uses public API: `https://api.mercadolibre.com/sites/MLA/search`
- Category ID for vehicles: `MLA1744`
- No authentication required
- Rate limits: ~10,000 requests/hour (should be fine for normal use)

## Other Sources - Implementation Ideas

### Kavak
- Check browser network tab when searching on kavak.com
- Look for API endpoints in XHR requests
- May require authentication tokens

### OLX
- Similar approach - check network requests
- May have internal API endpoints
- Consider web scraping as fallback

### V6
- Check v6.com.ar network requests
- May require reverse engineering

### Facebook Marketplace
- Very difficult - no public API
- Graph API requires app approval and has limited access
- Web scraping is complex due to authentication
- Consider browser automation (Puppeteer/Playwright) as last resort
