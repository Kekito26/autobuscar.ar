'use client';

import { useState } from 'react';

export default function AutoComparador() {
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    year: '',
    minKm: '',
    maxKm: '',
    brand: '',
    model: '',
    state: ''
  });
  
  // Source selection
  const [selectedSources, setSelectedSources] = useState({
    mercadolibre: true,
    kavak: false,
    olx: false,
    v6: false,
    facebook: false
  });

  const searchCars = async () => {
    if (!searchTerm.trim()) {
      alert('Por favor ingresa el auto');
      return;
    }
    
    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.append(key, value.trim());
        }
      });
      
      // Add selected sources (MercadoLibre now works server-side via scraper)
      const activeSources = Object.entries(selectedSources)
        .filter(([_, enabled]) => enabled)
        .map(([source]) => source);
      
      if (activeSources.length > 0) {
        params.append('sources', activeSources.join(','));
      }
      
      // Fetch from API (for non-MercadoLibre sources)
      const response = await fetch('/api/search?' + params.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Data recibida:', JSON.stringify(data, null, 2));
      console.log('Results array:', data.results);
      console.log('Results length:', data.results?.length || 0);
      console.log('Stats:', JSON.stringify(data.stats, null, 2));
      
      // All results come from API now (MercadoLibre uses scraper server-side)
      const allResults = [...(data.results || [])];
      
      // Sort by price
      allResults.sort((a, b) => (a.price || 0) - (b.price || 0));
      
      // Stats are already in data.stats
      const updatedStats = data.stats;
      
      // Check if there are errors in stats
      if (data.stats?.sources) {
        Object.entries(data.stats.sources).forEach(([source, info]) => {
          if (!info.success || info.error) {
            console.error(`Source ${source} error:`, info.error || 'Unknown error');
          }
        });
      }
      
      if (allResults.length > 0) {
        setListings(allResults);
        setStats(updatedStats);
        console.log('Listings seteados:', allResults);
      } else {
        setListings([]);
        setStats(updatedStats);
        if (data.error) {
          alert(`Error: ${data.error}`);
        } else {
          alert('No se encontraron resultados');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al buscar: ' + error.message);
      setListings([]);
      setStats(null);
    }
    
    setLoading(false);
  };

  const getSourceBadgeColor = (source) => {
    const colors = {
      'MercadoLibre': 'bg-yellow-100 text-yellow-800',
      'Kavak': 'bg-green-100 text-green-800',
      'OLX': 'bg-orange-100 text-orange-800',
      'V6': 'bg-blue-100 text-blue-800',
      'Facebook': 'bg-indigo-100 text-indigo-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-white mb-2">AutoBuscar.ar</h1>
            <p className="text-sm text-blue-200">Buscador y comparador de autos en Argentina</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Busca tu auto (ej: Ford Focus)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCars()}
              className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
            />
            <button
              onClick={searchCars}
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          
          {/* Filters Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showFilters ? '▼' : '▶'} Filtros avanzados
            </button>
            
            {/* Source Selection */}
            <div className="flex gap-2 flex-wrap">
              <label className="text-xs text-gray-600 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSources.mercadolibre}
                  onChange={(e) => setSelectedSources({...selectedSources, mercadolibre: e.target.checked})}
                  className="rounded"
                />
                <span>MercadoLibre</span>
              </label>
              <label className="text-xs text-gray-600 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSources.kavak}
                  onChange={(e) => setSelectedSources({...selectedSources, kavak: e.target.checked})}
                  className="rounded"
                />
                <span>Kavak</span>
              </label>
              <label className="text-xs text-gray-600 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSources.olx}
                  onChange={(e) => setSelectedSources({...selectedSources, olx: e.target.checked})}
                  className="rounded"
                />
                <span>OLX</span>
              </label>
              <label className="text-xs text-gray-600 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSources.v6}
                  onChange={(e) => setSelectedSources({...selectedSources, v6: e.target.checked})}
                  className="rounded"
                />
                <span>V6</span>
              </label>
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Año</label>
                <input
                  type="number"
                  placeholder="2020"
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">KM Mín</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minKm}
                  onChange={(e) => setFilters({...filters, minKm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">KM Máx</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={filters.maxKm}
                  onChange={(e) => setFilters({...filters, maxKm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Marca</label>
                <input
                  type="text"
                  placeholder="Ford"
                  value={filters.brand}
                  onChange={(e) => setFilters({...filters, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Modelo</label>
                <input
                  type="text"
                  placeholder="Focus"
                  value={filters.model}
                  onChange={(e) => setFilters({...filters, model: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Provincia</label>
                <input
                  type="text"
                  placeholder="Buenos Aires"
                  value={filters.state}
                  onChange={(e) => setFilters({...filters, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-4 text-white text-sm">
            <div className="flex gap-4 flex-wrap">
              <span>Total resultados: <strong>{stats.total}</strong></span>
              {Object.entries(stats.sources || {}).map(([source, data]) => (
                <span key={source} className={data.success ? 'text-green-300' : 'text-red-300'}>
                  {source}: {data.success ? `${data.count} resultados` : 'Error'}
                </span>
              ))}
            </div>
          </div>
        )}

        {listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition">
                <div className="h-40 bg-gray-200 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {listing.thumbnail ? (
                    <img 
                      src={listing.thumbnail} 
                      alt={listing.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-6xl">🚗</span>
                  )}
                </div>
                
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceBadgeColor(listing.source)}`}>
                    {listing.source}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg mb-3 line-clamp-2">{listing.title}</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">
                  ${listing.price?.toLocaleString('es-AR')}
                </p>
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  {listing.year && <p><strong>Año:</strong> {listing.year}</p>}
                  {listing.km && <p><strong>KM:</strong> {listing.km.toLocaleString('es-AR')}</p>}
                  {listing.brand && <p><strong>Marca:</strong> {listing.brand}</p>}
                  {listing.model && <p><strong>Modelo:</strong> {listing.model}</p>}
                  <p><strong>Ubicación:</strong> {listing.location}</p>
                  <p className="text-xs text-gray-400">{listing.condition}</p>
                </div>
                
                <a
                  href={listing.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Ver publicación
                </a>
              </div>
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && !searchTerm && (
          <div className="text-center py-20 bg-white rounded-3xl">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-3">Encuentra tu auto</h3>
            <p className="text-gray-600">Busca y compara precios de autos de múltiples sitios</p>
            <p className="text-sm text-blue-600 mt-2">MercadoLibre, Kavak, OLX, V6 y más</p>
          </div>
        )}

        {!loading && listings.length === 0 && searchTerm && (
          <div className="text-center py-20 bg-white rounded-3xl">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No se encontraron resultados</h3>
            <p className="text-gray-600">Intenta con otro término de búsqueda o ajusta los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
