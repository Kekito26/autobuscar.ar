# Testing MercadoLibre API Access

## The Issue
MercadoLibre API is returning 403 Forbidden errors, both server-side and potentially client-side.

## Testing Steps

### 1. Test in Browser Console
Open your browser console (F12) and run this:

```javascript
fetch('https://api.mercadolibre.com/sites/MLA/search?q=ford%20focus&limit=5')
  .then(r => r.json())
  .then(data => console.log('Results:', data.results?.length || 0, data))
  .catch(err => console.error('Error:', err));
```

**If this works:** The API is accessible from browser, and we just need to fix the client-side code.
**If this fails:** The API might require authentication or be blocking all requests.

### 2. Test Without Category Filter
Sometimes the category filter causes issues. Try:

```javascript
fetch('https://api.mercadolibre.com/sites/MLA/search?q=ford%20focus&limit=5')
  .then(r => r.json())
  .then(data => {
    console.log('Total results:', data.results?.length || 0);
    // Filter manually for vehicles
    const vehicles = data.results?.filter(item => 
      item.category_id === 'MLA1744' || 
      item.title.toLowerCase().includes('auto') ||
      item.title.toLowerCase().includes('vehiculo')
    ) || [];
    console.log('Vehicle results:', vehicles.length);
  })
  .catch(err => console.error('Error:', err));
```

### 3. Check CORS
If you see CORS errors in console, MercadoLibre might not allow cross-origin requests. In that case:
- We need to use a proxy
- Or make requests through your Next.js API route (but that gets 403)
- Or use a CORS proxy service (not recommended for production)

### 4. Alternative: Use MercadoLibre's Official API
If the public API doesn't work, you might need to:
1. Register at https://developers.mercadolibre.com.ar/
2. Create an application
3. Get OAuth credentials
4. Implement OAuth flow to get access tokens
5. Use authenticated requests

This is more complex but more reliable.

## Current Status
- Server-side: ❌ 403 Forbidden
- Client-side: ❓ Need to test in browser console
- Public API: ❓ Need to verify if it works at all

## Next Steps
1. **Test in browser console** (step 1 above)
2. **Check browser console** for any errors when searching
3. **Look for CORS errors** - if present, we need a different approach
4. **If nothing works** - consider web scraping or using their official API with authentication
