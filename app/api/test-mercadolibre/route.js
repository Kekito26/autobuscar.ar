import { searchMercadoLibre } from '../../lib/services/mercadolibre';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'ford focus';
    
    console.log('[Test] Testing MercadoLibre with query:', query);
    
    const results = await searchMercadoLibre(query, { limit: 5 });
    
    return Response.json({ 
      success: true,
      query: query,
      resultsCount: results.length,
      results: results.slice(0, 3), // Return first 3 for testing
      message: 'MercadoLibre service test'
    });
    
  } catch (error) {
    console.error('[Test] Error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
