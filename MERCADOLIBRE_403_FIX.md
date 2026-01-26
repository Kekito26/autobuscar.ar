# MercadoLibre 403 Forbidden Error - Solutions

## Problem
MercadoLibre API returns `403 Forbidden` when making requests from Next.js server-side (API routes).

## Why This Happens
MercadoLibre's API detects server-side requests and blocks them, even though the public search API should work without authentication.

## Solutions

### Solution 1: Client-Side Fetch (Recommended)
Make MercadoLibre requests from the browser instead of server-side.

**Pros:**
- Works immediately
- No proxy needed
- Uses browser's CORS handling

**Cons:**
- Exposes API endpoint to client
- Slightly slower (client has to wait for MercadoLibre)

**Implementation:**
I've created `app/lib/services/mercadolibre-client.js` for this. You can modify the frontend to call MercadoLibre directly from the browser.

### Solution 2: Use a Proxy/API Route
Create a Next.js API route that acts as a proxy, but this still might get blocked.

### Solution 3: Remove Category Filter
Sometimes removing the `category=MLA1744` parameter helps, but you'll get all products, not just vehicles.

### Solution 4: Use MercadoLibre's Official API
Register for MercadoLibre Developer account and get an API key, but this requires OAuth authentication.

## Current Status
The code now:
- Catches 403 errors gracefully
- Returns empty array (allows other sources to work)
- Logs helpful error messages

## Quick Test
Try accessing MercadoLibre API directly in your browser:
```
https://api.mercadolibre.com/sites/MLA/search?q=ford%20focus&category=MLA1744&limit=5
```

If this works in browser but not from server, it confirms the blocking issue.

## Next Steps
1. **Try Solution 1** - Modify frontend to fetch MercadoLibre from client-side
2. **Or** - Use a CORS proxy service (not recommended for production)
3. **Or** - Focus on other sources first (Kavak, OLX, V6) and come back to MercadoLibre
