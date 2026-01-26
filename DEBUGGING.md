# Debugging Guide - MercadoLibre API Issue

## Current Problem
The API returns 200 OK but with empty results array. This means:
- The API route is working ✅
- The request is reaching the server ✅
- But MercadoLibre service is returning no results ❌

## How to Debug

### 1. Check Server Console Logs

**Local Development:**
- Look at your terminal where you ran `npm run dev`
- You should see logs prefixed with `[MercadoLibre]`, `[SearchAll]`, and `[API]`

**Vercel Production:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Click on the function that failed
5. Check the logs

### 2. Test MercadoLibre Directly

I've created a test endpoint. Try this:

```
http://localhost:3000/api/test-mercadolibre?q=ford%20focus
```

This will test the MercadoLibre service directly and show you:
- If the service is being called
- What error (if any) is occurring
- How many results are found

### 3. Check Browser Network Tab

1. Open DevTools → Network tab
2. Make a search
3. Click on the `/api/search` request
4. Check:
   - Request URL (should have `q=ford+focus&sources=mercadolibre`)
   - Response status (should be 200)
   - Response body (check the `stats` object for error messages)

### 4. Common Issues and Solutions

#### Issue: "Module not found" or Import Error
**Solution:** Check that all files exist:
- `app/lib/services/index.js`
- `app/lib/services/mercadolibre.js`

#### Issue: MercadoLibre API returns 403/429
**Solution:** 
- Rate limiting (wait a few minutes)
- IP blocking (unlikely for server-side calls)
- Check if the URL is correct

#### Issue: MercadoLibre API returns empty results
**Solution:**
- The query might not match any listings
- Try a more generic search: "auto" or "vehiculo"
- Check if category ID `MLA1744` is correct for vehicles

#### Issue: Fetch fails silently
**Solution:**
- In Next.js, `fetch` should work in API routes
- Check if there's a network issue
- Try the test endpoint to isolate the problem

### 5. Expected Log Output

When working correctly, you should see:

```
[API] Search request: { query: 'ford focus', filters: {...}, sources: ['mercadolibre'] }
[SearchAll] Called with: { query: 'ford focus', ... }
[SearchAll] Enabled sources: ['mercadolibre']
[MercadoLibre] Starting search with: { query: 'ford focus', ... }
[MercadoLibre] Fetching: https://api.mercadolibre.com/sites/MLA/search?q=ford+focus&category=MLA1744&limit=50
[MercadoLibre] Response status: 200 OK
[MercadoLibre] Response data keys: ['site_id', 'query', 'paging', 'results', ...]
[MercadoLibre] Results count: 50
[MercadoLibre] Found 50 results
[SearchAll] MercadoLibre returned: 50 results
[SearchAll] Source stats: { mercadolibre: { success: true, count: 50 } }
[SearchAll] Total results: 50
[API] Search completed: { totalResults: 50, sourceStats: {...} }
```

### 6. If You See Errors

**Error: "Cannot find module"**
- Check file paths
- Restart dev server: `npm run dev`

**Error: "fetch is not defined"**
- This shouldn't happen in Next.js API routes
- Check Next.js version (should be 13+)

**Error: "MercadoLibre API error: 400"**
- Check the URL format
- Verify query encoding

**No logs at all**
- The function might not be called
- Check if the import path is correct
- Verify the route file exists

### 7. Manual Test

Test the MercadoLibre API directly in your browser:

```
https://api.mercadolibre.com/sites/MLA/search?q=ford%20focus&category=MLA1744&limit=5
```

This should return JSON with results. If this works but your code doesn't, there's an issue with the fetch call or data processing.

### 8. Next Steps

1. **Check server logs** (most important!)
2. **Test the test endpoint**: `/api/test-mercadolibre?q=ford%20focus`
3. **Check browser console** for any client-side errors
4. **Verify the import paths** are correct
5. **Try a simpler query** like "auto" to see if it's a query-specific issue

## Quick Fixes to Try

1. **Restart dev server**: `npm run dev`
2. **Clear Next.js cache**: Delete `.next` folder and restart
3. **Check Node version**: Should be 18+ for Next.js 16
4. **Verify dependencies**: Run `npm install`
