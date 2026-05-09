'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=2200&q=80&auto=format&fit=crop';

const ALL_SOURCES = [
  { key: 'mercadolibre', label: 'MercadoLibre' },
  { key: 'kavak', label: 'Kavak' },
  { key: 'olx', label: 'OLX' },
  { key: 'v6', label: 'V6' },
  { key: 'facebook', label: 'Facebook Marketplace' },
];

function buildDefaultSources() {
  return ALL_SOURCES.reduce((acc, s) => {
    acc[s.key] = true;
    return acc;
  }, {});
}

export default function AutoComparador() {
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [heroOpacity, setHeroOpacity] = useState(1);
  const heroRef = useRef(null);

  const [filters, setFilters] = useState({
    year: '',
    minKm: '',
    maxKm: '',
    brand: '',
    model: '',
    state: '',
  });

  const [selectedSources, setSelectedSources] = useState(buildDefaultSources);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('autobuscar-theme');
    const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('autobuscar-theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const onScroll = () => {
      const heroEl = heroRef.current;
      if (!heroEl) return;
      const rect = heroEl.getBoundingClientRect();
      const heroHeight = Math.max(1, rect.height);
      const progress = Math.min(1, Math.max(0, -rect.top / (heroHeight * 0.8)));
      setHeroOpacity(1 - progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeSourceKeys = useMemo(() => {
    const keys = Object.entries(selectedSources)
      .filter(([_, enabled]) => enabled)
      .map(([k]) => k);
    return keys.length > 0 ? keys : ALL_SOURCES.map((s) => s.key);
  }, [selectedSources]);

  const searchCars = async () => {
    if (!searchTerm.trim()) {
      alert('Por favor ingresa el auto');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) params.append(key, value.trim());
      });
      params.append('sources', activeSourceKeys.join(','));

      const response = await fetch('/api/search?' + params.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const allResults = [...(data.results || [])];
      allResults.sort((a, b) => (a.price || 0) - (b.price || 0));

      if (allResults.length > 0) {
        setListings(allResults);
        setStats(data.stats);
      } else {
        setListings([]);
        setStats(data.stats);
        if (!data.error) alert('No se encontraron resultados');
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
    const light = {
      'MercadoLibre': 'bg-amber-100 text-amber-800',
      'Kavak': 'bg-emerald-100 text-emerald-800',
      'OLX': 'bg-orange-100 text-orange-800',
      'V6': 'bg-sky-100 text-sky-800',
      'Facebook': 'bg-indigo-100 text-indigo-800'
    };
    const dark = {
      'MercadoLibre': 'bg-amber-900/40 text-amber-300',
      'Kavak': 'bg-emerald-900/40 text-emerald-300',
      'OLX': 'bg-orange-900/40 text-orange-300',
      'V6': 'bg-sky-900/40 text-sky-300',
      'Facebook': 'bg-indigo-900/40 text-indigo-300'
    };
    const map = darkMode ? dark : light;
    return map[source] || (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700');
  };

  if (!mounted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ background: 'var(--background)' }}
        data-testid="loading-screen"
      >
        <div className="text-lg" style={{ color: 'var(--foreground-muted)' }}>Cargando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }} data-testid="main-container">
      {/* Top nav */}
      <header
        className="sticky top-0 z-50 border-b transition-colors duration-300 glass"
        style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        data-testid="header"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="flex flex-col leading-tight">
              <span 
                className="font-display text-xl md:text-2xl glow-title" 
                style={{ color: 'var(--accent-primary)' }}
                data-testid="site-title"
              >
                AutoBuscar.ar
              </span>
              <span 
                className="text-xs md:text-sm" 
                style={{ color: 'var(--foreground-muted)' }}
                data-testid="site-subtitle"
              >
                Buscador unificado de autos • Argentina
              </span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="btn-soft flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }}
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              data-testid="theme-toggle"
              role="switch"
              aria-checked={darkMode}
            >
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--foreground-muted)' }}>
                {darkMode ? <span className="w-2 h-2 rounded-full" style={{ background: 'var(--foreground)' }} /> : null}
              </span>
              <span>{darkMode ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section 
        ref={heroRef} 
        className="relative overflow-hidden"
        data-testid="hero-section"
        role="region"
        aria-label="Hero section"
      >
        <div className="absolute inset-0 hero-bg" style={{ opacity: heroOpacity }} aria-hidden>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
          <div
            className="absolute inset-0"
            style={{
              background: darkMode
                ? 'linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.94) 55%, rgba(15,23,42,1) 100%)'
                : 'linear-gradient(180deg, rgba(240,244,248,0.64) 0%, rgba(240,244,248,0.9) 55%, rgba(240,244,248,1) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div className="max-w-3xl animate-fade-in-up">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-5"
              style={{ borderColor: 'var(--border)', color: 'var(--accent-secondary)', background: 'color-mix(in srgb, var(--background-card), transparent 10%)' }}
              data-testid="hero-badge"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-secondary)' }} />
              Compará en un solo lugar
            </div>

            <h2 
              className="font-display glow-title-hero text-4xl md:text-6xl leading-[1.05] mb-5" 
              style={{ color: 'var(--accent-primary)' }}
              data-testid="hero-title"
            >
              Encontrá tu próximo auto en Argentina
            </h2>
            <p 
              className="text-base md:text-lg mb-7" 
              style={{ color: 'var(--foreground-soft)' }}
              data-testid="hero-description"
            >
              AutoBuscar reúne publicaciones de múltiples marketplaces y te permite filtrar por año, kilometraje, marca, modelo y ubicación.
              La idea es simple: menos pestañas, mejores decisiones.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-soft px-6 py-3 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                data-testid="hero-cta-search"
                aria-label="Ir a la búsqueda"
              >
                Empezar a buscar
              </button>
              <a
                href="#how"
                className="btn-soft px-6 py-3 rounded-xl font-semibold border text-center"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }}
                data-testid="hero-cta-how"
                aria-label="Cómo funciona"
              >
                Cómo funciona
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="hero-features">
              {[
                { k: 'Búsqueda unificada', v: '1 consulta → varios sitios' },
                { k: 'Filtros útiles', v: 'año, km, provincia' },
                { k: 'Transparente', v: 'link al aviso original' },
                { k: 'Rápido', v: 'pensado para mobile' },
              ].map((item, idx) => (
                <div 
                  key={item.k} 
                  className="rounded-xl border p-3" 
                  style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--background-card), transparent 10%)' }}
                  data-testid={`hero-feature-${idx}`}
                >
                  <div className="text-xs mb-1" style={{ color: 'var(--accent-tertiary)' }}>{item.k}</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search module */}
      <main 
        id="search" 
        className="max-w-7xl mx-auto px-4 -mt-8 md:-mt-10 pb-16 relative z-20"
        data-testid="search-section"
        role="main"
      >
        <div
          className="rounded-2xl p-6 md:p-8 mb-10 animate-scale-in"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          data-testid="search-form-container"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label 
                htmlFor="search-input" 
                className="block text-xs font-medium mb-2" 
                style={{ color: 'var(--foreground-muted)' }}
              >
                Búsqueda
              </label>
              <input
                id="search-input"
                type="text"
                placeholder="Ej: Ford Focus 2018"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCars()}
                className="w-full px-4 py-3.5 rounded-xl text-base border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                data-testid="search-input"
                aria-label="Buscar auto"
                role="searchbox"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={searchCars}
                disabled={loading}
                className="btn-soft w-full md:w-auto px-10 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                data-testid="search-button"
                aria-label="Buscar autos"
                aria-busy={loading}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="link-soft text-sm font-medium"
              style={{ color: 'var(--accent-primary)' }}
              data-testid="toggle-filters-button"
              aria-expanded={showFilters}
              aria-controls="advanced-filters"
            >
              {showFilters ? 'Ocultar filtros avanzados' : 'Filtros avanzados'}
            </button>

            <div 
              className="text-sm" 
              style={{ color: 'var(--foreground-muted)' }}
              data-testid="default-sources-info"
            >
              Por defecto buscamos en <strong style={{ color: 'var(--accent-secondary)' }}>todas</strong> las fuentes disponibles.
            </div>
          </div>

          {showFilters && (
            <div 
              id="advanced-filters"
              className="mt-5 border-t pt-5 animate-fade-in" 
              style={{ borderColor: 'var(--border)' }}
              data-testid="advanced-filters"
              role="region"
              aria-label="Filtros avanzados"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'year', label: 'Año', placeholder: '2020', type: 'number' },
                  { key: 'minKm', label: 'KM mín', placeholder: '0', type: 'number' },
                  { key: 'maxKm', label: 'KM máx', placeholder: '100000', type: 'number' },
                  { key: 'brand', label: 'Marca', placeholder: 'Ford', type: 'text' },
                  { key: 'model', label: 'Modelo', placeholder: 'Focus', type: 'text' },
                  { key: 'state', label: 'Provincia', placeholder: 'Buenos Aires', type: 'text' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label 
                      htmlFor={`filter-${key}`}
                      className="block text-xs font-medium mb-1" 
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      {label}
                    </label>
                    <input
                      id={`filter-${key}`}
                      type={type}
                      placeholder={placeholder}
                      value={filters[key]}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      data-testid={`filter-${key}`}
                      aria-label={`Filtrar por ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              <div 
                className="mt-5 rounded-xl border p-4" 
                style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--background), transparent 0%)' }}
                data-testid="sources-selector"
                role="group"
                aria-label="Selección de fuentes"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Fuentes</div>
                    <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      Podés desactivar fuentes para acelerar o depurar resultados.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-soft text-xs px-3 py-2 rounded-lg border"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }}
                      onClick={() => setSelectedSources(buildDefaultSources())}
                      data-testid="select-all-sources"
                      aria-label="Seleccionar todas las fuentes"
                    >
                      Seleccionar todas
                    </button>
                    <button
                      type="button"
                      className="btn-soft text-xs px-3 py-2 rounded-lg border"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }}
                      onClick={() =>
                        setSelectedSources(
                          ALL_SOURCES.reduce((acc, s) => {
                            acc[s.key] = false;
                            return acc;
                          }, {})
                        )
                      }
                      data-testid="deselect-all-sources"
                      aria-label="Deseleccionar todas las fuentes"
                    >
                      Ninguna
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3" role="group" aria-label="Fuentes disponibles">
                  {ALL_SOURCES.map((s) => (
                    <label 
                      key={s.key} 
                      className="flex items-center gap-2 cursor-pointer text-sm"
                      data-testid={`source-${s.key}-label`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedSources[s.key]}
                        onChange={(e) => setSelectedSources({ ...selectedSources, [s.key]: e.target.checked })}
                        className="rounded border"
                        style={{ borderColor: 'var(--border)' }}
                        data-testid={`source-${s.key}-checkbox`}
                        aria-label={`Usar fuente ${s.label}`}
                      />
                      <span style={{ color: 'var(--foreground-muted)' }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {stats && (
          <div 
            className="mb-6 flex flex-wrap gap-4 text-sm animate-fade-in" 
            style={{ color: 'var(--foreground-muted)' }}
            data-testid="search-stats"
            role="status"
            aria-live="polite"
          >
            <span data-testid="total-results">
              Resultados: <strong style={{ color: 'var(--accent-primary)' }}>{stats.total}</strong>
            </span>
            {Object.entries(stats.sources || {}).map(([source, data]) => (
              <span 
                key={source} 
                style={{ color: data.success ? 'var(--success)' : '#ef4444' }}
                data-testid={`source-stat-${source}`}
              >
                {source}: {data.success ? `${data.count}` : 'Error'}
              </span>
            ))}
          </div>
        )}

        {listings.length > 0 && (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger"
            data-testid="results-grid"
            role="list"
            aria-label="Resultados de búsqueda"
          >
            {listings.map((listing, i) => (
              <article
                key={listing.id}
                className="card-hover rounded-2xl overflow-hidden border"
                style={{ background: 'var(--background-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                data-testid={`listing-card-${i}`}
                role="listitem"
              >
                <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  {listing.thumbnail ? (
                    <img 
                      src={listing.thumbnail} 
                      alt={`Imagen de ${listing.title}`} 
                      className="w-full h-full object-cover"
                      data-testid={`listing-image-${i}`}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-4xl font-light" 
                      style={{ color: 'var(--foreground-muted)' }}
                      data-testid={`listing-no-image-${i}`}
                    >
                      —
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <span 
                    className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mb-2 ${getSourceBadgeColor(listing.source)}`}
                    data-testid={`listing-source-${i}`}
                  >
                    {listing.source}
                  </span>
                  <h3 
                    className="font-semibold text-lg mb-2 line-clamp-2" 
                    style={{ color: 'var(--foreground)' }}
                    data-testid={`listing-title-${i}`}
                  >
                    {listing.title}
                  </h3>
                  <p 
                    className="text-xl font-bold mb-4" 
                    style={{ color: 'var(--success)' }}
                    data-testid={`listing-price-${i}`}
                  >
                    ${listing.price?.toLocaleString('es-AR')}
                  </p>
                  <div 
                    className="text-sm space-y-1 mb-4" 
                    style={{ color: 'var(--foreground-muted)' }}
                    data-testid={`listing-details-${i}`}
                  >
                    {listing.year && <p data-testid={`listing-year-${i}`}>Año {listing.year}</p>}
                    {listing.km && <p data-testid={`listing-km-${i}`}>{listing.km.toLocaleString('es-AR')} km</p>}
                    <p data-testid={`listing-location-${i}`}>{listing.location}</p>
                  </div>
                  <a
                    href={listing.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-soft btn-soft block text-center py-3 rounded-xl font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                    data-testid={`listing-link-${i}`}
                    aria-label={`Ver publicación de ${listing.title}`}
                  >
                    Ver publicación
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && !searchTerm && (
          <div 
            className="text-center py-16 rounded-2xl border animate-fade-in" 
            style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }}
            data-testid="empty-state-initial"
            role="status"
          >
            <div className="max-w-xl mx-auto px-6">
              <h3 
                className="font-display text-2xl md:text-3xl glow-title mb-3" 
                style={{ color: 'var(--accent-primary)' }}
              >
                Buscá. Compará. Elegí mejor.
              </h3>
              <p style={{ color: 'var(--foreground-muted)' }}>
                Empezá con una búsqueda y filtrá por lo que te importa. Cada resultado te lleva al aviso original.
              </p>
            </div>
          </div>
        )}

        {!loading && listings.length === 0 && searchTerm && (
          <div 
            className="text-center py-16 rounded-2xl border animate-fade-in" 
            style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }}
            data-testid="empty-state-no-results"
            role="status"
            aria-live="polite"
          >
            <div className="max-w-xl mx-auto px-6">
              <h3 
                className="font-display text-xl md:text-2xl glow-title mb-2" 
                style={{ color: 'var(--accent-primary)' }}
              >
                No encontramos resultados
              </h3>
              <p style={{ color: 'var(--foreground-muted)' }}>
                Probá con un término más general o ajustá filtros/fuentes.
              </p>
            </div>
          </div>
        )}

        {/* Separador visual */}
        <div className="my-16 border-t" style={{ borderColor: 'var(--border)' }} />

        {/* Landing sections */}
        <section 
          id="how" 
          className="mt-14 md:mt-18"
          data-testid="how-it-works-section"
          role="region"
          aria-labelledby="how-it-works-title"
        >
          <div className="mb-6">
            <h3 
              id="how-it-works-title"
              className="font-display text-2xl md:text-3xl glow-title-secondary" 
              style={{ color: 'var(--accent-secondary)' }}
            >
              Cómo funciona
            </h3>
            <p className="mt-2" style={{ color: 'var(--foreground-muted)' }}>
              La mecánica es la misma que los mejores agregadores del mundo: unificamos búsqueda, normalizamos datos y te devolvemos links directos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list">
            {[
              { t: '1) Buscás una vez', d: 'Consultamos múltiples fuentes en paralelo y estandarizamos los resultados.' },
              { t: '2) Filtrás fácil', d: 'Año, km, provincia y más. Menos ruido, más señales útiles.' },
              { t: '3) Abrís el aviso original', d: 'Te llevamos al link del marketplace para que contactes al vendedor.' },
            ].map((x, idx) => (
              <div 
                key={x.t} 
                className="rounded-2xl border p-5 card-hover" 
                style={{ borderColor: 'var(--border)', background: 'var(--background-card)', boxShadow: 'var(--shadow)' }}
                data-testid={`how-step-${idx}`}
                role="listitem"
              >
                <div className="font-semibold mb-2" style={{ color: 'var(--accent-secondary)' }}>{x.t}</div>
                <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="my-16 border-t" style={{ borderColor: 'var(--border)' }} />

        <section 
          className="mt-14"
          data-testid="partners-section"
          role="region"
          aria-labelledby="partners-title"
        >
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h3 
                id="partners-title"
                className="font-display text-2xl md:text-3xl glow-title-tertiary" 
                style={{ color: 'var(--accent-tertiary)' }}
              >
                Partners (próximamente)
              </h3>
              <p className="mt-2" style={{ color: 'var(--foreground-muted)' }}>
                Queremos integraciones oficiales. Mientras tanto, el objetivo es sumar fuentes de manera confiable y rápida.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3" role="list">
            {['MercadoLibre', 'Kavak', 'OLX', 'V6', 'Facebook'].map((p, idx) => (
              <div 
                key={p} 
                className="rounded-xl border p-4 text-center text-sm" 
                style={{ borderColor: 'var(--border)', background: 'var(--background-card)', color: 'var(--foreground-muted)' }}
                data-testid={`partner-${idx}`}
                role="listitem"
              >
                {p}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}