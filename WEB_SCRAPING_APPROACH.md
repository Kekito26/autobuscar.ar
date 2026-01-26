# MercadoLibre Web Scraping Solution

## Why Web Scraping?
The MercadoLibre API returns **403 Forbidden** even from browsers, confirming they block public API access. Web scraping is the most reliable alternative.

## How It Works
1. Fetch MercadoLibre's search page HTML
2. Extract embedded JSON data (they put it in `<script>` tags)
3. Parse and transform the data
4. Return results in our unified format

## Implementation
I've created `app/lib/services/mercadolibre-scraper.js` that:
- Fetches the search page: `https://autos.mercadolibre.com.ar/vehiculos/...`
- Extracts embedded JSON from `window.__PRELOADED_STATE__`
- Transforms items to our format
- Applies filters

## Installation
You'll need to install cheerio (optional, for better HTML parsing):
```bash
npm install cheerio
```

But the current implementation works without it by extracting JSON directly.

## Testing
1. Restart your dev server: `npm run dev`
2. Search for "ford focus"
3. Check server logs for `[MercadoLibre Scraper]` messages
4. You should see results!

## If Scraping Doesn't Work
If MercadoLibre changes their page structure:
1. Check the HTML structure
2. Update the `extractItemsFromPreloadedState` function
3. Or use cheerio for more robust HTML parsing

## Alternative: Official API
For production, consider registering for MercadoLibre Developer account:
- https://developers.mercadolibre.com.ar/
- Requires OAuth authentication
- More reliable long-term

## Next Steps
1. **Test the scraper** - it should work now
2. **If it fails** - check server logs to see what's happening
3. **Focus on other sources** - Kavak, OLX, V6 might be easier to implement
