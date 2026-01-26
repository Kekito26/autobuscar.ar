# Quick Test Steps

## 1. Check Server Console (Terminal)
Look at the terminal where you run `npm run dev`. You should see logs like:
```
[API] Search request: { query: 'ford focus', ... }
[SearchAll] Called with: { query: 'ford focus', ... }
[MercadoLibre] Starting search with: { query: 'ford focus', ... }
[MercadoLibre] Fetching: https://api.mercadolibre.com/...
[MercadoLibre] Response status: 200 OK
[MercadoLibre] Results count: 50
```

**If you see errors here, that's the problem!**

## 2. Test MercadoLibre Directly
Open in browser:
```
http://localhost:3000/api/test-mercadolibre?q=ford%20focus
```

This will show you if MercadoLibre service works independently.

## 3. Check Browser Console
In the browser console, expand the "Data recibida" object. Look for:
- `results: []` - empty array (this is the problem)
- `stats.sources.mercadolibre` - check if `success: false` or has an `error` field

## 4. Check Network Tab
1. Open DevTools → Network tab
2. Make a search
3. Click on `/api/search` request
4. Go to "Response" tab
5. See the actual JSON response

## Most Likely Issues:

### Issue 1: Server-side error not visible
- Check terminal logs
- Look for `[MercadoLibre] Error:` messages

### Issue 2: MercadoLibre API returns empty results
- Try a simpler query: "auto" or "vehiculo"
- Check if category ID `MLA1744` is correct

### Issue 3: Import/module error
- Check terminal for "Cannot find module" errors
- Restart dev server: `npm run dev`

### Issue 4: Fetch fails silently
- Check if you're behind a proxy/firewall
- Try the test endpoint first

## What to Share:
1. **Terminal logs** - Copy the server-side console output
2. **Browser console** - Expand "Data recibida" and copy the JSON
3. **Network tab response** - Copy the actual JSON response
