'use client';

import { useState } from 'react';

export default function AutoComparador() {
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMercadoLibre = async () => {
    if (!searchTerm.trim()) {
      alert('Por favor ingresa el auto');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const demoResults = [
      {
        id: '1',
        title: 'Ford Focus Titanium 2.0 2018',
        price: 8500000,
        year: 2018,
        km: 85000,
        location: 'Capital Federal'
      },
      {
        id: '2',
        title: 'Toyota Corolla XEI 2020',
        price: 16500000,
        year: 2020,
        km: 55000,
        location: 'Buenos Aires'
      }
    ];
    
    setListings(demoResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-white mb-2">AutoBuscar.ar</h1>
            <p className="text-sm text-blue-200">Buscador de autos en Argentina</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Busca tu auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
            />
            <button
              onClick={searchMercadoLibre}
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl shadow-lg p-5">
                <div className="h-40 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-6xl">🚗</span>
                </div>
                <h3 className="font-bold text-lg mb-3">{listing.title}</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">
                  $ {listing.price.toLocaleString('es-AR')}
                </p>
                <div className="text-sm text-gray-600 mb-4">
                  <p>Año: {listing.year}</p>
                  <p>KM: {listing.km.toLocaleString('es-AR')}</p>
                  <p>{listing.location}</p>
                </div>
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">
                  Ver publicacion
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-3">Encontra tu auto</h3>
            <p className="text-gray-600">Busca y compara precios</p>
          </div>
        )}
      </div>
    </div>
  );
}