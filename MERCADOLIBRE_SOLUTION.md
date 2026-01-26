# MercadoLibre API - Complete Solution Guide

## The Problem
MercadoLibre API returns **403 Forbidden** when accessed from:
- ❌ Server-side (Next.js API routes)
- ❓ Client-side (browser) - needs testing

## Why This Happens
MercadoLibre's public API (`/sites/MLA/search`) **should** work without authentication, but they may:
1. Block server-side requests (detect Node.js/Next.js)
2. Require specific headers
3. Have rate limiting
4. Block certain IPs

## Solution Options

### Option 1: Test Client-Side Access (Current Approach)
The code now fetches MercadoLibre from the browser. **Test this:**

1. Open browser console (F12)
2. Search for "ford focus"
3. Look for these logs:
   - `[Client] Starting MercadoLibre client-side fetch...`
   - `[MercadoLibre Client] Fetching URL: ...`
   - `[MercadoLibre Client] Response status: ...`

**If you see CORS errors:** MercadoLibre doesn't allow cross-origin requests → Need Option 2 or 3

**If you see 403:** MercadoLibre blocks browser requests too → Need Option 3

### Option 2: Use a Proxy/API Route (Workaround)
Create a Next.js API route that acts as a proxy, but add headers to make it look like a browser:

```javascript
// app/api/proxy-mercadolibre/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  const response = await fetch(
    `https://api.mercadolibre.com/sites/MLA/search?q=${query}&limit=50`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.mercadolibre.com.ar/',
      }
    }
  );
  
  return Response.json(await response.json());
}
```

**Note:** This might still get 403 if they detect it's server-side.

### Option 3: Web Scraping (Most Reliable)
Instead of using the API, scrape MercadoLibre's website:

**Pros:**
- Always works (they can't block it easily)
- No API limitations
- Get all data

**Cons:**
- More complex
- Breaks if they change HTML
- May violate ToS (check their terms)

**Implementation:**
Use a library like `puppeteer` or `cheerio` to scrape:
```
https://autos.mercadolibre.com.ar/ford-focus/
```

### Option 4: Official MercadoLibre API (Best Long-term)
Register for MercadoLibre Developer account:

1. Go to https://developers.mercadolibre.com.ar/
2. Create an application
3. Get Client ID and Client Secret
4. Implement OAuth 2.0 flow
5. Get access tokens
6. Use authenticated API calls

**Pros:**
- Official and reliable
- No blocking issues
- Better rate limits

**Cons:**
- Requires registration
- More complex (OAuth flow)
- May have usage restrictions

## Recommended Approach

**For now (quick fix):**
1. ✅ Test client-side fetch (already implemented)
2. If CORS/403: Use Option 2 (proxy with better headers)
3. If still blocked: Use Option 3 (web scraping)

**For production (best solution):**
- Implement Option 4 (Official API with OAuth)

## Testing Right Now

**In your browser console, run:**
```javascript
fetch('https://api.mercadolibre.com/sites/MLA/search?q=ford%20focus&limit=5')
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('Results:', data.results?.length || 0);
    console.log('Data:', data);
  })
  .catch(err => console.error('Error:', err));
```

**Share the results:**
- Status code?
- Any CORS errors?
- Do you get results?

This will tell us which solution to use!
