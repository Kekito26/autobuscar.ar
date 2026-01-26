/**
 * Unified search service
 * Aggregates results from all available sources
 */

import { searchMercadoLibre } from './mercadolibre';
import { searchKavak } from './kavak';
import { searchOlx } from './olx';
import { searchV6 } from './v6';
import { searchFacebook } from './facebook';

/**
 * Search all sources in parallel
 * @param {string} query - Search query
 * @param {object} filters - Filter options (year, km, brand, model, state, etc.)
 * @param {array} sources - Array of source names to search (default: all)
 * @returns {Promise<array>} Combined results from all sources
 */
export async function searchAllSources(query, filters = {}, sources = null) {
  console.log('[SearchAll] Called with:', { query, filters, sources });
  
  if (!query || !query.trim()) {
    console.warn('[SearchAll] Empty query provided');
    return {
      results: [],
      stats: {
        total: 0,
        sources: {}
      }
    };
  }
  
  // Default to all sources if not specified
  const enabledSources = sources || ['mercadolibre', 'kavak', 'olx', 'v6', 'facebook'];
  console.log('[SearchAll] Enabled sources:', enabledSources);
  
  // Create search promises for each enabled source
  const searchPromises = [];
  
  // MercadoLibre now uses web scraping (API returns 403)
  if (enabledSources.includes('mercadolibre')) {
    searchPromises.push(
      searchMercadoLibre(query, filters)
        .then(results => {
          console.log('[SearchAll] MercadoLibre returned:', results.length, 'results');
          return { source: 'mercadolibre', results, success: true };
        })
        .catch(error => {
          console.error('[SearchAll] MercadoLibre error:', error);
          return { source: 'mercadolibre', results: [], success: false, error: error.message || String(error) };
        })
    );
  }
  
  if (enabledSources.includes('kavak')) {
    searchPromises.push(
      searchKavak(query, filters)
        .then(results => ({ source: 'kavak', results, success: true }))
        .catch(error => ({ source: 'kavak', results: [], success: false, error }))
    );
  }
  
  if (enabledSources.includes('olx')) {
    searchPromises.push(
      searchOlx(query, filters)
        .then(results => ({ source: 'olx', results, success: true }))
        .catch(error => ({ source: 'olx', results: [], success: false, error }))
    );
  }
  
  if (enabledSources.includes('v6')) {
    searchPromises.push(
      searchV6(query, filters)
        .then(results => ({ source: 'v6', results, success: true }))
        .catch(error => ({ source: 'v6', results: [], success: false, error }))
    );
  }
  
  if (enabledSources.includes('facebook')) {
    searchPromises.push(
      searchFacebook(query, filters)
        .then(results => ({ source: 'facebook', results, success: true }))
        .catch(error => ({ source: 'facebook', results: [], success: false, error }))
    );
  }
  
  // Execute all searches in parallel
  const results = await Promise.all(searchPromises);
  
  // Combine all results
  const allResults = [];
  const sourceStats = {};
  
  results.forEach(({ source, results, success, error }) => {
    sourceStats[source] = {
      success,
      count: results.length,
      error: error?.message || (error ? String(error) : undefined)
    };
    
    if (success && results.length > 0) {
      allResults.push(...results);
    } else if (!success) {
      console.error(`[SearchAll] ${source} failed:`, error);
    }
  });
  
  console.log('[SearchAll] Source stats:', sourceStats);
  console.log(`[SearchAll] Total results: ${allResults.length}`);
  
  // Sort by price (ascending)
  allResults.sort((a, b) => (a.price || 0) - (b.price || 0));
  
  return {
    results: allResults,
    stats: {
      total: allResults.length,
      sources: sourceStats
    }
  };
}
