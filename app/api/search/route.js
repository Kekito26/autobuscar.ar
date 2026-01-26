import { searchAllSources } from '../../lib/services/index';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return Response.json({ 
        results: [],
        stats: { total: 0, sources: {} }
      });
    }
    
    // Extract filters from query parameters
    const filters = {
      year: searchParams.get('year') || null,
      minKm: searchParams.get('minKm') || null,
      maxKm: searchParams.get('maxKm') || null,
      brand: searchParams.get('brand') || null,
      model: searchParams.get('model') || null,
      state: searchParams.get('state') || null,
      limit: parseInt(searchParams.get('limit')) || 50
    };
    
    // Get sources to search (comma-separated list, default: all)
    const sourcesParam = searchParams.get('sources');
    const sources = sourcesParam ? sourcesParam.split(',').map(s => s.trim()) : null;
    
    console.log('[API] Search request:', { query, filters, sources });
    
    // Search all sources
    const searchResult = await searchAllSources(query, filters, sources);
    
    // Ensure we have the correct structure
    const results = searchResult?.results || [];
    const stats = searchResult?.stats || { total: 0, sources: {} };
    
    console.log('[API] Search completed:', { 
      totalResults: results.length, 
      sourceStats: stats,
      searchResultType: typeof searchResult,
      hasResults: Array.isArray(results),
      hasStats: typeof stats === 'object'
    });
    
    // Log detailed stats for debugging
    if (stats.sources) {
      Object.entries(stats.sources).forEach(([source, info]) => {
        console.log(`[API] ${source}:`, {
          success: info.success,
          count: info.count,
          error: info.error
        });
      });
    }
    
    return Response.json({ 
      results: results,
      stats: stats,
      query: query,
      filters: filters
    });
    
  } catch (error) {
    console.error('[API] Error:', error);
    return Response.json({ 
      results: [],
      stats: { total: 0, sources: {} },
      error: error.message 
    }, { status: 500 });
  }
}