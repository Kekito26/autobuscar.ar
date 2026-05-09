'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=2400&q=90&auto=format&fit=crop';

const ALL_SOURCES = [
  { key: 'mercadolibre', label: 'MercadoLibre', url: 'https://autos.mercadolibre.com.ar', color: '#FFE600', textColor: '#333' },
  { key: 'kavak',        label: 'Kavak',         url: 'https://www.kavak.com/ar',          color: '#00B14F', textColor: '#fff' },
  { key: 'v6',           label: 'V6',             url: 'https://www.v6.com.ar',             color: '#E63946', textColor: '#fff' },
  { key: 'facebook',     label: 'Facebook',       url: 'https://www.facebook.com/marketplace/category/vehicles', color: '#1877F2', textColor: '#fff' },
];

const POPULAR_SEARCHES = ['Ford Focus', 'VW Gol Trend', 'Toyota Corolla', 'Fiat Cronos', 'Peugeot 208', 'Chevrolet Onix'];
const FAKE_USER = { username: 'admin', password: 'testing123', name: 'Admin' };

const BODY_STYLES = [
  { key: 'any',         label: 'Cualquiera', icon: '🚗' },
  { key: 'sedan',       label: 'Sedán',      icon: '🚗' },
  { key: 'hatchback',   label: 'Hatchback',  icon: '🚙' },
  { key: 'suv',         label: 'SUV',        icon: '🚐' },
  { key: 'pickup',      label: 'Pickup',     icon: '🛻' },
  { key: 'coupe',       label: 'Coupé',      icon: '🏎️' },
  { key: 'familiar',    label: 'Familiar',   icon: '🚌' },
  { key: 'van',         label: 'Van',        icon: '🚐' },
  { key: 'convertible', label: 'Descapotable', icon: '🏎️' },
];

const FUEL_TYPES   = ['Cualquiera', 'Nafta', 'Diésel', 'GNC', 'Híbrido', 'Eléctrico'];
const TRANSMISSIONS = ['Cualquiera', 'Manual', 'Automático'];
const SELLER_TYPES  = ['Cualquiera', 'Particular', 'Concesionaria'];
const PROVINCES     = ['Todas', 'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];
const COLORS_EXT    = ['Cualquiera', 'Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Marrón', 'Beige'];

function buildDefaultSources() {
  return ALL_SOURCES.reduce((acc, s) => { acc[s.key] = true; return acc; }, {});
}

const EMPTY_FILTERS = {
  brand: '', model: '', minYear: '', maxYear: '', minKm: '', maxKm: '',
  minPrice: '', maxPrice: '', transmission: 'Cualquiera', sellerType: 'Cualquiera',
  bodyStyle: 'any', fuelType: 'Cualquiera', color: 'Cualquiera', province: 'Todas',
};

export default function AutoComparador() {
  const [activeTab, setActiveTab]       = useState('comprar'); // 'comprar' | 'tendencia'
  const [searchTerm, setSearchTerm]     = useState('');
  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [stats, setStats]               = useState(null);
  const [showFilters, setShowFilters]   = useState(false);
  const [darkMode, setDarkMode]         = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [heroOpacity, setHeroOpacity]   = useState(1);
  const heroRef = useRef(null);

  const [filters, setFilters]           = useState(EMPTY_FILTERS);
  const [selectedSources, setSelectedSources] = useState(buildDefaultSources);

  // Auth
  const [user, setUser]                 = useState(null);
  const [showLogin, setShowLogin]       = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loginForm, setLoginForm]       = useState({ username: '', password: '' });
  const [loginError, setLoginError]     = useState('');
  const userMenuRef = useRef(null);
  const loginRef    = useRef(null);

  useEffect(() => {
    setMounted(true);
    const stored  = localStorage.getItem('autobuscar-theme');
    const isDark  = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const savedUser = localStorage.getItem('autobuscar-user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (loginRef.current && !loginRef.current.contains(e.target)) setShowLogin(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / (Math.max(1, rect.height) * 0.8)));
      setHeroOpacity(1 - progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('autobuscar-theme', next ? 'dark' : 'light');
  };

  const activeSourceKeys = useMemo(() => {
    const keys = Object.entries(selectedSources).filter(([_, v]) => v).map(([k]) => k);
    return keys.length > 0 ? keys : ALL_SOURCES.map(s => s.key);
  }, [selectedSources]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === FAKE_USER.username && loginForm.password === FAKE_USER.password) {
      const u = { name: FAKE_USER.name, username: FAKE_USER.username };
      setUser(u);
      localStorage.setItem('autobuscar-user', JSON.stringify(u));
      setShowLogin(false);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('autobuscar-user'); setShowUserMenu(false); };

  const searchCars = async (term) => {
    const q = term ?? searchTerm;
    if (!q.trim()) { alert('Por favor ingresa el auto'); return; }
    setSearchTerm(q);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', q);
      Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'Cualquiera' && v !== 'Todas' && v !== 'any') params.append(k, v); });
      params.append('sources', activeSourceKeys.join(','));
      const response = await fetch('/api/search?' + params.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const all = [...(data.results || [])].sort((a, b) => (a.price || 0) - (b.price || 0));
      setListings(all);
      setStats(data.stats);
      if (all.length === 0 && !data.error) alert('No se encontraron resultados');
    } catch (err) {
      console.error('Error:', err);
      alert('Error al buscar: ' + err.message);
      setListings([]); setStats(null);
    }
    setLoading(false);
  };

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const getSourceBadgeColor = (source) => {
    const map = {
      'MercadoLibre': darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      'Kavak':        darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-800',
      'V6':           darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800',
      'Facebook':     darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800',
    };
    return map[source] || (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700');
  };

  // Componente de filtros compartido (usado en ambas pestañas)
  const FiltersPanel = () => (
    <div className="mt-5 border-t pt-5 animate-fade-in" style={{ borderColor: 'var(--border)' }} data-testid="advanced-filters">

      {/* Fila 1: Marca, Modelo, Año, KM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { key: 'brand',   label: 'Marca',    placeholder: 'Ej: Ford',   type: 'text'   },
          { key: 'model',   label: 'Modelo',   placeholder: 'Ej: Focus',  type: 'text'   },
          { key: 'minYear', label: 'Año desde', placeholder: '2015',      type: 'number' },
          { key: 'maxYear', label: 'Año hasta', placeholder: '2025',      type: 'number' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label htmlFor={`filter-${key}`} className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>{label}</label>
            <input
              id={`filter-${key}`}
              type={type}
              placeholder={placeholder}
              value={filters[key]}
              onChange={e => setFilter(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              data-testid={`filter-${key}`}
            />
          </div>
        ))}
      </div>

      {/* Fila 2: KM y Precio */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { key: 'minKm',    label: 'KM mínimo',      placeholder: '0',      type: 'number' },
          { key: 'maxKm',    label: 'KM máximo',      placeholder: '200000', type: 'number' },
          { key: 'minPrice', label: 'Precio mínimo $', placeholder: '0',     type: 'number' },
          { key: 'maxPrice', label: 'Precio máximo $', placeholder: 'Sin límite', type: 'number' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label htmlFor={`filter-${key}`} className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>{label}</label>
            <input
              id={`filter-${key}`}
              type={type}
              placeholder={placeholder}
              value={filters[key]}
              onChange={e => setFilter(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              data-testid={`filter-${key}`}
            />
          </div>
        ))}
      </div>

      {/* Fila 3: Selects */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>Transmisión</label>
          <select value={filters.transmission} onChange={e => setFilter('transmission', e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="filter-transmission">
            {TRANSMISSIONS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>Combustible</label>
          <select value={filters.fuelType} onChange={e => setFilter('fuelType', e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="filter-fuelType">
            {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>Vendedor</label>
          <select value={filters.sellerType} onChange={e => setFilter('sellerType', e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="filter-sellerType">
            {SELLER_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>Color exterior</label>
          <select value={filters.color} onChange={e => setFilter('color', e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="filter-color">
            {COLORS_EXT.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Provincia */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground-muted)' }}>Provincia</label>
        <select value={filters.province} onChange={e => setFilter('province', e.target.value)} className="w-full md:w-64 px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="filter-province">
          {PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Tipo de carrocería */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>Tipo de carrocería</label>
        <div className="flex flex-wrap gap-2">
          {BODY_STYLES.map(b => (
            <button
              key={b.key}
              type="button"
              onClick={() => setFilter('bodyStyle', b.key)}
              className="btn-soft flex flex-col items-center gap-1 px-4 py-2 rounded-xl border text-xs font-medium transition-all"
              style={{
                borderColor: filters.bodyStyle === b.key ? 'var(--accent-primary)' : 'var(--border)',
                background: filters.bodyStyle === b.key ? 'var(--accent-primary)' : 'var(--background)',
                color: filters.bodyStyle === b.key ? '#fff' : 'var(--foreground-muted)',
              }}
              data-testid={`filter-body-${b.key}`}
            >
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fuentes */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} data-testid="sources-selector">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Fuentes</div>
            <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Activá o desactivá marketplaces.</div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-soft text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }} onClick={() => setSelectedSources(buildDefaultSources())} data-testid="select-all-sources">Todas</button>
            <button type="button" className="btn-soft text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }} onClick={() => setSelectedSources(ALL_SOURCES.reduce((a, s) => { a[s.key] = false; return a; }, {}))} data-testid="deselect-all-sources">Ninguna</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {ALL_SOURCES.map(s => (
            <label key={s.key} className="flex items-center gap-2 cursor-pointer text-sm" data-testid={`source-${s.key}-label`}>
              <input type="checkbox" checked={!!selectedSources[s.key]} onChange={e => setSelectedSources({ ...selectedSources, [s.key]: e.target.checked })} className="rounded border" style={{ borderColor: 'var(--border)' }} data-testid={`source-${s.key}-checkbox`} aria-label={`Usar fuente ${s.label}`} />
              <span style={{ color: 'var(--foreground-muted)' }}>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Limpiar filtros */}
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs btn-soft px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)', background: 'transparent' }} data-testid="clear-filters">
          Limpiar filtros
        </button>
      </div>
    </div>
  );

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }} data-testid="loading-screen">
      <div style={{ color: 'var(--foreground-muted)' }}>Cargando…</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }} data-testid="main-container">

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b glass" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }} data-testid="header" role="banner">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl md:text-2xl" style={{ color: 'var(--accent-primary)' }} data-testid="site-title">AutoBuscar.ar</span>
            <span className="text-xs hidden md:block" style={{ color: 'var(--foreground-muted)' }}>Buscador unificado de autos • Argentina</span>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <input type="text" placeholder="Búsqueda rápida..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchCars()} className="w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="header-search-input" />
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={toggleTheme} className="btn-soft flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }} aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'} data-testid="theme-toggle" role="switch" aria-checked={darkMode}>
              <span>{darkMode ? '☀️' : '🌙'}</span>
              <span className="hidden md:inline">{darkMode ? 'Claro' : 'Oscuro'}</span>
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef} data-testid="user-menu-container">
                <button type="button" onClick={() => setShowUserMenu(!showUserMenu)} className="btn-soft flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'var(--background-card)' }} data-testid="user-menu-trigger" aria-haspopup="true" aria-expanded={showUserMenu}>
                  <span>👤</span><span>Hola, {user.name}!</span><span style={{ fontSize: '10px' }}>{showUserMenu ? '▲' : '▼'}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border shadow-xl overflow-hidden animate-fade-in" style={{ background: 'var(--background-card)', borderColor: 'var(--border)', zIndex: 100 }} data-testid="user-dropdown" role="menu">
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Conectado como</div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>@{user.username}</div>
                    </div>
                    {[
                      { label: '👤 Mi perfil',      testid: 'user-menu-profile' },
                      { label: '🔔 Mis alertas',    testid: 'user-menu-alerts' },
                      { label: '❤️ Favoritos',      testid: 'user-menu-favs' },
                      { label: '⚙️ Configuración', testid: 'user-menu-settings' },
                    ].map(item => (
                      <button key={item.label} type="button" onClick={() => alert('Próximamente')} className="w-full text-left px-4 py-3 text-sm" style={{ color: 'var(--foreground)', background: 'transparent' }} data-testid={item.testid} role="menuitem">{item.label}</button>
                    ))}
                    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-semibold" style={{ color: '#ef4444', background: 'transparent' }} data-testid="user-menu-logout" role="menuitem">🚪 Cerrar sesión</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={loginRef} data-testid="login-container">
                <button type="button" onClick={() => setShowLogin(!showLogin)} className="btn-soft flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} data-testid="login-trigger">Iniciar sesión</button>
                {showLogin && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl p-6 animate-scale-in" style={{ background: 'var(--background-card)', borderColor: 'var(--border)', zIndex: 100 }} data-testid="login-modal" role="dialog">
                    <h3 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>Iniciar sesión</h3>
                    <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>Demo: usuario <strong>admin</strong> / contraseña <strong>testing123</strong></p>
                    <form onSubmit={handleLogin} data-testid="login-form">
                      <div className="mb-3">
                        <label htmlFor="login-username" className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Usuario</label>
                        <input id="login-username" type="text" placeholder="admin" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="login-username-input" autoComplete="username" />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="login-password" className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>Contraseña</label>
                        <input id="login-password" type="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="login-password-input" autoComplete="current-password" />
                      </div>
                      {loginError && <p className="text-xs text-red-500 mb-3" data-testid="login-error" role="alert">{loginError}</p>}
                      <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} data-testid="login-submit">Ingresar</button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative overflow-hidden" data-testid="hero-section" role="region" aria-label="Hero">
        <div className="absolute inset-0" style={{ opacity: heroOpacity }} aria-hidden>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
          <div className="absolute inset-0" style={{ background: darkMode ? 'linear-gradient(180deg,rgba(11,17,32,0.50) 0%,rgba(11,17,32,0.78) 60%,rgba(11,17,32,1) 100%)' : 'linear-gradient(180deg,rgba(244,246,251,0.35) 0%,rgba(244,246,251,0.68) 60%,rgba(244,246,251,1) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-6" style={{ borderColor: 'var(--border)', color: 'var(--accent-secondary)', background: 'color-mix(in srgb,var(--background-card),transparent 20%)' }} data-testid="hero-badge">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-secondary)' }} />
              Buscá en todos los marketplaces de Argentina
            </div>
            <h2 className="font-display text-4xl md:text-6xl leading-tight mb-5 text-center" style={{ color: 'var(--foreground)' }} data-testid="hero-title">
              Encontrá tu próximo<br /><span style={{ color: 'var(--accent-primary)' }}>auto en Argentina</span>
            </h2>
            <p className="text-base md:text-lg mb-8 text-center mx-auto max-w-2xl" style={{ color: 'var(--foreground-soft)' }} data-testid="hero-description">
              AutoBuscar reúne publicaciones de múltiples marketplaces en un solo lugar. Comparás precios, filtrás por lo que te importa y llegás directo al aviso original.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <button type="button" onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })} className="btn-soft px-8 py-3.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }} data-testid="hero-cta-search">Empezar a buscar</button>
              <a href="#how" className="btn-soft px-8 py-3.5 rounded-xl font-semibold border text-center" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'color-mix(in srgb,var(--background-card),transparent 20%)' }} data-testid="hero-cta-how">Cómo funciona</a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto" data-testid="hero-stats">
              {[{ num: '5.000+', label: 'Autos indexados' }, { num: '4', label: 'Marketplaces' }, { num: '24hs', label: 'Actualización' }, { num: '100%', label: 'Gratis' }].map((s, i) => (
                <div key={s.label} className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb,var(--background-card),transparent 20%)' }} data-testid={`hero-stat-${i}`}>
                  <div className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>{s.num}</div>
                  <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN ─── */}
      <main id="search" className="max-w-7xl mx-auto px-4 -mt-8 md:-mt-10 pb-16 relative z-20" data-testid="search-section" role="main">

        {/* ─── TABS ─── */}
        <div className="flex gap-1 mb-0 rounded-t-2xl overflow-hidden border border-b-0 w-fit" style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }} data-testid="tabs" role="tablist">
          {[
            { key: 'comprar',   label: '🔍 Comprar un auto' },
            { key: 'tendencia', label: '📈 Tendencia de precios' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-5 py-3 text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.key ? 'var(--background-card)' : 'transparent',
                color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--foreground-muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: COMPRAR ─── */}
        {activeTab === 'comprar' && (
          <div className="rounded-b-2xl rounded-tr-2xl p-6 md:p-8 mb-6 animate-scale-in" style={{ background: 'var(--background-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }} data-testid="search-form-container">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="search-input" className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>Búsqueda libre</label>
                <input id="search-input" type="text" placeholder="Ej: Ford Focus 2018, Peugeot 208, Gol Trend..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchCars()} className="w-full px-4 py-3.5 rounded-xl text-base border transition-colors focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="search-input" aria-label="Buscar auto" role="searchbox" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => searchCars()} disabled={loading} className="btn-soft w-full md:w-auto px-10 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }} data-testid="search-button" aria-busy={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            <div className="mt-4" data-testid="popular-searches">
              <span className="text-xs mr-2" style={{ color: 'var(--foreground-muted)' }}>Populares:</span>
              <div className="inline-flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map(term => (
                  <button key={term} type="button" onClick={() => searchCars(term)} className="btn-soft px-3 py-1 rounded-full text-xs border" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)', background: 'var(--background)' }} data-testid={`popular-${term.replace(/\s/g,'-').toLowerCase()}`}>{term}</button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setShowFilters(!showFilters)} className="link-soft text-sm font-medium" style={{ color: 'var(--accent-primary)' }} data-testid="toggle-filters-button" aria-expanded={showFilters}>
                {showFilters ? 'Ocultar filtros ▲' : 'Filtros avanzados ▼'}
              </button>
              {Object.values(filters).some(v => v && v !== 'Cualquiera' && v !== 'Todas' && v !== 'any') && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--accent-primary)', color: '#fff' }}>Filtros activos</span>
              )}
            </div>

            {showFilters && <FiltersPanel />}
          </div>
        )}

        {/* ─── TAB: TENDENCIA ─── */}
        {activeTab === 'tendencia' && (
          <div className="rounded-b-2xl rounded-tr-2xl p-6 md:p-8 mb-6 animate-scale-in" style={{ background: 'var(--background-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }} data-testid="tendencia-form-container">
            <div className="mb-4">
              <h3 className="font-display text-lg mb-1" style={{ color: 'var(--foreground)' }}>Tendencia de precios</h3>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Ingresá el modelo que querés analizar. Los filtros que hayas usado en "Comprar" se mantienen.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="trend-search-input" className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>Modelo a analizar</label>
                <input id="trend-search-input" type="text" placeholder="Ej: Ford Focus, Peugeot 208, Gol Trend..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && searchTerm.trim()) window.location.href = `/tendencia?q=${encodeURIComponent(searchTerm)}&${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v && v !== 'Cualquiera' && v !== 'Todas' && v !== 'any'))).toString()}`; }} className="w-full px-4 py-3.5 rounded-xl text-base border transition-colors focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} data-testid="trend-search-input" aria-label="Modelo para tendencia de precios" />
              </div>
              <div className="flex items-end">
                <a
                  href={searchTerm.trim() ? `/tendencia?q=${encodeURIComponent(searchTerm)}&${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v && v !== 'Cualquiera' && v !== 'Todas' && v !== 'any'))).toString()}` : '#'}
                  onClick={e => { if (!searchTerm.trim()) { e.preventDefault(); alert('Por favor ingresa un modelo'); } }}
                  className="btn-soft w-full md:w-auto px-10 py-3.5 rounded-xl font-semibold text-white text-center"
                  style={{ background: 'linear-gradient(135deg,var(--accent-secondary),var(--accent-tertiary))' }}
                  data-testid="trend-search-button"
                >
                  Ver tendencia →
                </a>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setShowFilters(!showFilters)} className="link-soft text-sm font-medium" style={{ color: 'var(--accent-secondary)' }} data-testid="toggle-filters-trend-button" aria-expanded={showFilters}>
                {showFilters ? 'Ocultar filtros ▲' : 'Filtros avanzados ▼'}
              </button>
            </div>

            {showFilters && <FiltersPanel />}
          </div>
        )}

        {/* ─── STATS ─── */}
        {stats && activeTab === 'comprar' && (
          <div className="mb-6 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--foreground-muted)' }} data-testid="search-stats" role="status" aria-live="polite">
            <span data-testid="total-results">Resultados: <strong style={{ color: 'var(--accent-primary)' }}>{stats.total}</strong></span>
            {Object.entries(stats.sources || {}).map(([source, data]) => (
              <span key={source} style={{ color: data.success ? 'var(--success)' : '#ef4444' }} data-testid={`source-stat-${source}`}>{source}: {data.success ? data.count : 'Error'}</span>
            ))}
          </div>
        )}

        {/* Skeleton */}
        {loading && activeTab === 'comprar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10" data-testid="skeleton-loader">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border animate-pulse" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }}>
                <div className="h-44" style={{ background: 'var(--border)' }} />
                <div className="p-5 space-y-3">
                  <div className="h-3 rounded" style={{ background: 'var(--border)', width: '60%' }} />
                  <div className="h-5 rounded" style={{ background: 'var(--border)' }} />
                  <div className="h-6 rounded" style={{ background: 'var(--border)', width: '40%' }} />
                  <div className="h-10 rounded-xl mt-2" style={{ background: 'var(--border)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && listings.length > 0 && activeTab === 'comprar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="results-grid" role="list">
            {listings.map((listing, i) => (
              <article key={listing.id} className="card-hover rounded-2xl overflow-hidden border" style={{ background: 'var(--background-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }} data-testid={`listing-card-${i}`} role="listitem">
                <div className="aspect-video overflow-hidden" style={{ background: 'var(--border)' }}>
                  {listing.thumbnail ? (
                    <img src={listing.thumbnail} alt={`Imagen de ${listing.title}`} className="w-full h-full object-cover" data-testid={`listing-image-${i}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl" style={{ color: 'var(--foreground-muted)' }}>🚗</div>
                  )}
                </div>
                <div className="p-5">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mb-2 ${getSourceBadgeColor(listing.source)}`} data-testid={`listing-source-${i}`}>{listing.source}</span>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2" style={{ color: 'var(--foreground)' }} data-testid={`listing-title-${i}`}>{listing.title}</h3>
                  <p className="text-xl font-bold mb-4" style={{ color: 'var(--success)' }} data-testid={`listing-price-${i}`}>${listing.price?.toLocaleString('es-AR')}</p>
                  <div className="text-sm space-y-1 mb-4" style={{ color: 'var(--foreground-muted)' }}>
                    {listing.year && <p data-testid={`listing-year-${i}`}>📅 Año {listing.year}</p>}
                    {listing.km   && <p data-testid={`listing-km-${i}`}>🛣️ {listing.km.toLocaleString('es-AR')} km</p>}
                    <p data-testid={`listing-location-${i}`}>📍 {listing.location}</p>
                  </div>
                  <a href={listing.permalink} target="_blank" rel="noopener noreferrer" className="link-soft btn-soft block text-center py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }} data-testid={`listing-link-${i}`} aria-label={`Ver publicación de ${listing.title}`}>Ver publicación →</a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && listings.length === 0 && !searchTerm && activeTab === 'comprar' && (
          <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }} data-testid="empty-state-initial" role="status">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-primary)' }}>Buscá. Compará. Elegí mejor.</h3>
            <p style={{ color: 'var(--foreground-muted)' }}>Escribí un auto arriba o usá los filtros avanzados.</p>
          </div>
        )}
        {!loading && listings.length === 0 && searchTerm && activeTab === 'comprar' && (
          <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }} data-testid="empty-state-no-results" role="status">
            <div className="text-5xl mb-4">😔</div>
            <h3 className="font-display text-xl md:text-2xl mb-2" style={{ color: 'var(--accent-primary)' }}>No encontramos resultados</h3>
            <p style={{ color: 'var(--foreground-muted)' }}>Probá con un término más general o ajustá los filtros.</p>
          </div>
        )}

        {/* ─── HOW IT WORKS ─── */}
        <div className="my-16 border-t" style={{ borderColor: 'var(--border)' }} />
        <section id="how" className="mt-6" data-testid="how-it-works-section" role="region" aria-labelledby="how-title">
          <div className="text-center mb-10">
            <h3 id="how-title" className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-secondary)' }}>¿Cómo funciona?</h3>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>Sin vueltas. Buscás una vez y nosotros consultamos todos los marketplaces por vos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔎', step: '01', t: 'Buscás una vez',   d: 'Ingresás el auto y consultamos múltiples fuentes en paralelo.' },
              { icon: '⚡', step: '02', t: 'Filtrás fácil',    d: 'Año, km, provincia, combustible y más. Sin ruido, más señal.' },
              { icon: '🔗', step: '03', t: 'Vas al aviso',      d: 'Te llevamos directo a la publicación original del marketplace.' },
            ].map((x, i) => (
              <div key={x.t} className="rounded-2xl border p-6 card-hover relative overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--background-card)', boxShadow: 'var(--shadow)' }} data-testid={`how-step-${i}`}>
                <div className="text-4xl mb-3">{x.icon}</div>
                <div className="absolute top-4 right-4 text-5xl font-black opacity-5" style={{ color: 'var(--accent-secondary)' }}>{x.step}</div>
                <div className="font-bold text-lg mb-2" style={{ color: 'var(--accent-secondary)' }}>{x.t}</div>
                <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{x.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h4 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>¿Por qué AutoBuscar vs buscar en cada sitio?</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--background)' }}>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--foreground-muted)' }}>Acción</th>
                    <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--accent-primary)' }}>AutoBuscar.ar</th>
                    <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--foreground-muted)' }}>Sin AutoBuscar</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Pestañas abiertas','1','4+'],
                    ['Tiempo de búsqueda','~30 seg','~15 min'],
                    ['Fuentes consultadas','Todas','Las que recuerdes'],
                    ['Comparar precios','✅ Fácil','❌ Difícil'],
                    ['Tendencia de precios','✅ Incluida','❌ No disponible'],
                    ['Costo','✅ Gratis','—'],
                  ].map(([action, si, no], i) => (
                    <tr key={action} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb,var(--background),transparent 50%)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{action}</td>
                      <td className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--success)' }}>{si}</td>
                      <td className="px-4 py-3 text-center" style={{ color: 'var(--foreground-muted)' }}>{no}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── PARTNERS ─── */}
        <div className="my-16 border-t" style={{ borderColor: 'var(--border)' }} />
        <section className="mt-6" data-testid="partners-section" role="region" aria-labelledby="partners-title">
          <div className="text-center mb-10">
            <h3 id="partners-title" className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-tertiary)' }}>Marketplaces integrados</h3>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>Buscamos en estas plataformas y te llevamos directo al aviso original.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ALL_SOURCES.map((p, i) => (
              <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer" className="card-hover rounded-2xl border p-5 text-center flex flex-col items-center gap-2 text-sm font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--background-card)', color: 'var(--foreground)', textDecoration: 'none' }} data-testid={`partner-${i}`} aria-label={`Ir a ${p.label}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: p.color, color: p.textColor }}>{p.label.charAt(0)}</div>
                <span>{p.label}</span>
                <span className="text-xs" style={{ color: 'var(--accent-primary)' }}>Visitar →</span>
              </a>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <div className="my-16 border-t" style={{ borderColor: 'var(--border)' }} />
        <section className="mt-6 mb-10" data-testid="faq-section" role="region" aria-labelledby="faq-title">
          <div className="text-center mb-10">
            <h3 id="faq-title" className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-primary)' }}>Preguntas frecuentes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: '¿Es un marketplace?', a: 'No. Somos un agregador: mostramos resultados y te llevamos al aviso original.' },
              { q: '¿Qué fuentes están integradas?', a: 'MercadoLibre activo. Kavak, V6 y Facebook en proceso de integración.' },
              { q: '¿Es gratis?', a: 'Sí, la búsqueda es 100% gratis. En el futuro habrá opciones premium para vendedores.' },
              { q: '¿Qué es la Tendencia de precios?', a: 'Es una función que muestra cómo evolucionó el precio de un modelo a lo largo del tiempo, basada en datos históricos de publicaciones.' },
            ].map((x, i) => (
              <div key={x.q} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }} data-testid={`faq-${i}`}>
                <div className="font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>{x.q}</div>
                <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{x.a}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t mt-8" style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }} data-testid="footer" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="font-display text-xl mb-2" style={{ color: 'var(--accent-primary)' }}>AutoBuscar.ar</div>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>El buscador unificado de autos de Argentina.</p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Marketplaces</div>
              <ul className="space-y-2">
                {ALL_SOURCES.map(s => (
                  <li key={s.key}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--foreground-muted)' }} data-testid={`footer-link-${s.key}`}>{s.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Info</div>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                <li>🇦🇷 Hecho en Argentina</li>
                <li>📧 contacto@autobuscar.ar</li>
                <li>Versión Beta 0.2</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
            © 2026 AutoBuscar.ar — Los avisos pertenecen a sus respectivos marketplaces.
          </div>
        </div>
      </footer>
    </div>
  );
}