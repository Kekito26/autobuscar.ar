'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=2400&q=90&auto=format&fit=crop';

const ALL_SOURCES = [
  { key: 'mercadolibre', label: 'MercadoLibre', url: 'https://autos.mercadolibre.com.ar', color: '#FFE600', textColor: '#333' },
  { key: 'kavak',        label: 'Kavak',         url: 'https://www.kavak.com/ar',          color: '#00B14F', textColor: '#fff' },
  { key: 'olx',          label: 'OLX',            url: 'https://www.olx.com.ar/autos_q_1',  color: '#6E2ADE', textColor: '#fff' },
  { key: 'v6',           label: 'V6',             url: 'https://www.v6.com.ar',             color: '#E63946', textColor: '#fff' },
  { key: 'facebook',     label: 'Facebook',       url: 'https://www.facebook.com/marketplace/category/vehicles', color: '#1877F2', textColor: '#fff' },
];

const POPULAR_SEARCHES = ['Ford Focus', 'VW Gol Trend', 'Toyota Corolla', 'Fiat Cronos', 'Peugeot 208', 'Chevrolet Onix'];

const FAKE_USER = { username: 'admin', password: 'testing123', name: 'Admin' };

function buildDefaultSources() {
  return ALL_SOURCES.reduce((acc, s) => { acc[s.key] = true; return acc; }, {});
}

export default function AutoComparador() {
  const [searchTerm, setSearchTerm]     = useState('');
  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [stats, setStats]               = useState(null);
  const [showFilters, setShowFilters]   = useState(false);
  const [darkMode, setDarkMode]         = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [heroOpacity, setHeroOpacity]   = useState(1);
  const heroRef = useRef(null);

  // Auth
  const [user, setUser]                 = useState(null);
  const [showLogin, setShowLogin]       = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loginForm, setLoginForm]       = useState({ username: '', password: '' });
  const [loginError, setLoginError]     = useState('');
  const userMenuRef = useRef(null);
  const loginRef    = useRef(null);

  const [filters, setFilters] = useState({ year: '', minKm: '', maxKm: '', brand: '', model: '', state: '' });
  const [selectedSources, setSelectedSources] = useState(buildDefaultSources);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('autobuscar-theme');
    const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    const savedUser = localStorage.getItem('autobuscar-user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Cerrar dropdowns al clickear afuera
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (loginRef.current && !loginRef.current.contains(e.target)) setShowLogin(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('autobuscar-theme', next ? 'dark' : 'light');
  };

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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('autobuscar-user');
    setShowUserMenu(false);
  };

  const searchCars = async (term) => {
    const q = term ?? searchTerm;
    if (!q.trim()) { alert('Por favor ingresa el auto'); return; }
    setSearchTerm(q);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', q);
      Object.entries(filters).forEach(([k, v]) => { if (v?.trim()) params.append(k, v.trim()); });
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
      setListings([]);
      setStats(null);
    }
    setLoading(false);
  };

  const getSourceBadgeColor = (source) => {
    const map = {
      'MercadoLibre': darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      'Kavak':        darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-800',
      'OLX':          darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800',
      'V6':           darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800',
      'Facebook':     darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800',
    };
    return map[source] || (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700');
  };

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

          {/* Logo */}
          <div className="flex flex-col leading-tight" data-testid="site-title-container">
            <span className="font-display text-xl md:text-2xl" style={{ color: 'var(--accent-primary)' }} data-testid="site-title">
              AutoBuscar.ar
            </span>
            <span className="text-xs hidden md:block" style={{ color: 'var(--foreground-muted)' }} data-testid="site-subtitle">
              Buscador unificado de autos • Argentina
            </span>
          </div>

          {/* Buscador rápido en header (visible luego de scroll) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <input
              type="text"
              placeholder="Buscar auto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCars()}
              className="w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              data-testid="header-search-input"
              aria-label="Búsqueda rápida en header"
            />
          </div>

          {/* Controles derecha */}
          <div className="flex items-center gap-3">

            {/* Toggle tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-soft flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }}
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              data-testid="theme-toggle"
              role="switch"
              aria-checked={darkMode}
            >
              <span>{darkMode ? '☀️' : '🌙'}</span>
              <span className="hidden md:inline">{darkMode ? 'Claro' : 'Oscuro'}</span>
            </button>

            {/* AUTH */}
            {user ? (
              /* Usuario logueado → dropdown */
              <div className="relative" ref={userMenuRef} data-testid="user-menu-container">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-soft flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'var(--background-card)' }}
                  data-testid="user-menu-trigger"
                  aria-haspopup="true"
                  aria-expanded={showUserMenu}
                >
                  <span>👤</span>
                  <span>Hola, {user.name}!</span>
                  <span style={{ fontSize: '10px' }}>{showUserMenu ? '▲' : '▼'}</span>
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-2xl border shadow-xl overflow-hidden animate-fade-in"
                    style={{ background: 'var(--background-card)', borderColor: 'var(--border)', zIndex: 100 }}
                    data-testid="user-dropdown"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Conectado como</div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>@{user.username}</div>
                    </div>
                    {[
                      { label: '👤 Mi perfil',       testid: 'user-menu-profile',  onClick: () => alert('Próximamente: Mi perfil') },
                      { label: '🔔 Mis alertas',     testid: 'user-menu-alerts',   onClick: () => alert('Próximamente: Mis alertas') },
                      { label: '❤️ Favoritos',       testid: 'user-menu-favs',     onClick: () => alert('Próximamente: Favoritos') },
                      { label: '⚙️ Configuración',  testid: 'user-menu-settings', onClick: () => alert('Próximamente: Configuración') },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-opacity-80 transition-colors"
                        style={{ color: 'var(--foreground)', background: 'transparent' }}
                        data-testid={item.testid}
                        role="menuitem"
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm font-semibold"
                        style={{ color: '#ef4444', background: 'transparent' }}
                        data-testid="user-menu-logout"
                        role="menuitem"
                      >
                        🚪 Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No logueado → botón Iniciar sesión + modal */
              <div className="relative" ref={loginRef} data-testid="login-container">
                <button
                  type="button"
                  onClick={() => setShowLogin(!showLogin)}
                  className="btn-soft flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                  data-testid="login-trigger"
                  aria-haspopup="dialog"
                >
                  Iniciar sesión
                </button>

                {showLogin && (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl p-6 animate-scale-in"
                    style={{ background: 'var(--background-card)', borderColor: 'var(--border)', zIndex: 100 }}
                    data-testid="login-modal"
                    role="dialog"
                    aria-label="Formulario de inicio de sesión"
                  >
                    <h3 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                      Iniciar sesión
                    </h3>
                    <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
                      Modo demo: usuario <strong>admin</strong> / contraseña <strong>testing123</strong>
                    </p>

                    <form onSubmit={handleLogin} data-testid="login-form">
                      <div className="mb-3">
                        <label htmlFor="login-username" className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                          Usuario
                        </label>
                        <input
                          id="login-username"
                          type="text"
                          placeholder="admin"
                          value={loginForm.username}
                          onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                          data-testid="login-username-input"
                          aria-label="Nombre de usuario"
                          autoComplete="username"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="login-password" className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                          Contraseña
                        </label>
                        <input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                          data-testid="login-password-input"
                          aria-label="Contraseña"
                          autoComplete="current-password"
                        />
                      </div>

                      {loginError && (
                        <p className="text-xs text-red-500 mb-3" data-testid="login-error" role="alert">{loginError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl font-semibold text-white text-sm"
                        style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                        data-testid="login-submit"
                      >
                        Ingresar
                      </button>
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
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: darkMode
                ? 'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.80) 60%, rgba(15,23,42,1) 100%)'
                : 'linear-gradient(180deg, rgba(240,244,248,0.40) 0%, rgba(240,244,248,0.72) 60%, rgba(240,244,248,1) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-6"
              style={{ borderColor: 'var(--border)', color: 'var(--accent-secondary)', background: 'color-mix(in srgb, var(--background-card), transparent 20%)' }}
              data-testid="hero-badge"
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-secondary)' }} />
              Buscá en todos los marketplaces de Argentina
            </div>

            <h2
              className="font-display text-4xl md:text-6xl leading-[1.05] mb-5 text-center"
              style={{ color: 'var(--foreground)' }}
              data-testid="hero-title"
            >
              Encontrá tu próximo<br />
              <span style={{ color: 'var(--accent-primary)' }}>auto en Argentina</span>
            </h2>

            <p
              className="text-base md:text-lg mb-8 text-center mx-auto max-w-2xl"
              style={{ color: 'var(--foreground-soft)' }}
              data-testid="hero-description"
            >
              AutoBuscar reúne publicaciones de múltiples marketplaces en un solo lugar.
              Comparás precios, filtrás por lo que te importa y llegás directo al aviso original.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <button
                type="button"
                onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-soft px-8 py-3.5 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
                data-testid="hero-cta-search"
                aria-label="Ir a la búsqueda"
              >
                Empezar a buscar
              </button>
              <a
                href="#how"
                className="btn-soft px-8 py-3.5 rounded-xl font-semibold border text-center"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'color-mix(in srgb, var(--background-card), transparent 20%)' }}
                data-testid="hero-cta-how"
                aria-label="Cómo funciona"
              >
                Cómo funciona
              </a>
            </div>

            {/* Stats animados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto" data-testid="hero-stats">
              {[
                { num: '5.000+', label: 'Autos indexados' },
                { num: '5',      label: 'Marketplaces' },
                { num: '24hs',   label: 'Actualización' },
                { num: '100%',   label: 'Gratis' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="rounded-xl border p-3 text-center"
                  style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--background-card), transparent 20%)' }}
                  data-testid={`hero-stat-${i}`}
                >
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

        {/* Search box */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6 animate-scale-in"
          style={{ background: 'var(--background-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          data-testid="search-form-container"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="search-input" className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
                Búsqueda
              </label>
              <input
                id="search-input"
                type="text"
                placeholder="Ej: Ford Focus 2018, Peugeot 208, Gol Trend..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchCars()}
                className="w-full px-4 py-3.5 rounded-xl text-base border transition-colors focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                data-testid="search-input"
                aria-label="Buscar auto"
                role="searchbox"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => searchCars()}
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

          {/* Búsquedas populares */}
          <div className="mt-4" data-testid="popular-searches">
            <span className="text-xs mr-2" style={{ color: 'var(--foreground-muted)' }}>Populares:</span>
            <div className="inline-flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => searchCars(term)}
                  className="btn-soft px-3 py-1 rounded-full text-xs border transition-colors hover:border-[var(--accent-primary)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)', background: 'var(--background)' }}
                  data-testid={`popular-search-${term.replace(/\s/g, '-').toLowerCase()}`}
                  aria-label={`Buscar ${term}`}
                >
                  {term}
                </button>
              ))}
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
              {showFilters ? 'Ocultar filtros ▲' : 'Filtros avanzados ▼'}
            </button>
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
                  { key: 'year',   label: 'Año',       placeholder: '2020',        type: 'number' },
                  { key: 'minKm',  label: 'KM mín',    placeholder: '0',           type: 'number' },
                  { key: 'maxKm',  label: 'KM máx',    placeholder: '100000',      type: 'number' },
                  { key: 'brand',  label: 'Marca',     placeholder: 'Ford',        type: 'text'   },
                  { key: 'model',  label: 'Modelo',    placeholder: 'Focus',       type: 'text'   },
                  { key: 'state',  label: 'Provincia', placeholder: 'Buenos Aires',type: 'text'   },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label htmlFor={`filter-${key}`} className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                      {label}
                    </label>
                    <input
                      id={`filter-${key}`}
                      type={type}
                      placeholder={placeholder}
                      value={filters[key]}
                      onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      data-testid={`filter-${key}`}
                      aria-label={`Filtrar por ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              <div
                className="mt-5 rounded-xl border p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                data-testid="sources-selector"
                role="group"
                aria-label="Selección de fuentes"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Fuentes</div>
                    <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Activá o desactivá marketplaces.</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-soft text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }} onClick={() => setSelectedSources(buildDefaultSources())} data-testid="select-all-sources" aria-label="Seleccionar todas las fuentes">Todas</button>
                    <button type="button" className="btn-soft text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }} onClick={() => setSelectedSources(ALL_SOURCES.reduce((a, s) => { a[s.key] = false; return a; }, {}))} data-testid="deselect-all-sources" aria-label="Deseleccionar todas las fuentes">Ninguna</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3" role="group" aria-label="Fuentes disponibles">
                  {ALL_SOURCES.map(s => (
                    <label key={s.key} className="flex items-center gap-2 cursor-pointer text-sm" data-testid={`source-${s.key}-label`}>
                      <input
                        type="checkbox"
                        checked={!!selectedSources[s.key]}
                        onChange={e => setSelectedSources({ ...selectedSources, [s.key]: e.target.checked })}
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

        {/* Stats */}
        {stats && (
          <div className="mb-6 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--foreground-muted)' }} data-testid="search-stats" role="status" aria-live="polite">
            <span data-testid="total-results">Resultados: <strong style={{ color: 'var(--accent-primary)' }}>{stats.total}</strong></span>
            {Object.entries(stats.sources || {}).map(([source, data]) => (
              <span key={source} style={{ color: data.success ? 'var(--success)' : '#ef4444' }} data-testid={`source-stat-${source}`}>
                {source}: {data.success ? data.count : 'Error'}
              </span>
            ))}
          </div>
        )}

        {/* Skeleton loader */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10" data-testid="skeleton-loader">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border animate-pulse" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }}>
                <div className="h-44 bg-slate-200" style={{ background: 'var(--border)' }} />
                <div className="p-5 space-y-3">
                  <div className="h-3 rounded" style={{ background: 'var(--border)', width: '60%' }} />
                  <div className="h-5 rounded" style={{ background: 'var(--border)' }} />
                  <div className="h-6 rounded" style={{ background: 'var(--border)', width: '40%' }} />
                  <div className="h-3 rounded" style={{ background: 'var(--border)', width: '70%' }} />
                  <div className="h-10 rounded-xl mt-2" style={{ background: 'var(--border)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="results-grid" role="list" aria-label="Resultados">
            {listings.map((listing, i) => (
              <article
                key={listing.id}
                className="card-hover rounded-2xl overflow-hidden border"
                style={{ background: 'var(--background-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                data-testid={`listing-card-${i}`}
                role="listitem"
              >
                <div className="aspect-[16/10] overflow-hidden" style={{ background: 'var(--border)' }}>
                  {listing.thumbnail ? (
                    <img src={listing.thumbnail} alt={`Imagen de ${listing.title}`} className="w-full h-full object-cover" data-testid={`listing-image-${i}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl" style={{ color: 'var(--foreground-muted)' }} data-testid={`listing-no-image-${i}`}>🚗</div>
                  )}
                </div>
                <div className="p-5">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mb-2 ${getSourceBadgeColor(listing.source)}`} data-testid={`listing-source-${i}`}>{listing.source}</span>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2" style={{ color: 'var(--foreground)' }} data-testid={`listing-title-${i}`}>{listing.title}</h3>
                  <p className="text-xl font-bold mb-4" style={{ color: 'var(--success)' }} data-testid={`listing-price-${i}`}>${listing.price?.toLocaleString('es-AR')}</p>
                  <div className="text-sm space-y-1 mb-4" style={{ color: 'var(--foreground-muted)' }} data-testid={`listing-details-${i}`}>
                    {listing.year && <p data-testid={`listing-year-${i}`}>📅 Año {listing.year}</p>}
                    {listing.km   && <p data-testid={`listing-km-${i}`}>🛣️ {listing.km.toLocaleString('es-AR')} km</p>}
                    <p data-testid={`listing-location-${i}`}>📍 {listing.location}</p>
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
                    Ver publicación →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && listings.length === 0 && !searchTerm && (
          <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }} data-testid="empty-state-initial" role="status">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-primary)' }}>Buscá. Compará. Elegí mejor.</h3>
            <p style={{ color: 'var(--foreground-muted)' }}>Escribí un auto arriba para ver resultados de todos los marketplaces.</p>
          </div>
        )}

        {!loading && listings.length === 0 && searchTerm && (
          <div className="text-center py-16 rounded-2xl border" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }} data-testid="empty-state-no-results" role="status" aria-live="polite">
            <div className="text-5xl mb-4">😔</div>
            <h3 className="font-display text-xl md:text-2xl mb-2" style={{ color: 'var(--accent-primary)' }}>No encontramos resultados</h3>
            <p style={{ color: 'var(--foreground-muted)' }}>Probá con un término más general o ajustá los filtros.</p>
          </div>
        )}

        {/* ─── HOW IT WORKS ─── */}
        <div className="my-16 border-t" style={{ borderColor: 'var(--border)' }} />

        <section id="how" className="mt-6" data-testid="how-it-works-section" role="region" aria-labelledby="how-title">
          <div className="text-center mb-10">
            <h3 id="how-title" className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-secondary)' }}>
              ¿Cómo funciona?
            </h3>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>
              Sin vueltas. Buscás una vez y nosotros consultamos todos los marketplaces por vos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
            {[
              { icon: '🔎', step: '01', t: 'Buscás una vez', d: 'Ingresás el auto que buscás y consultamos múltiples fuentes en paralelo.' },
              { icon: '⚡', step: '02', t: 'Filtrás fácil',  d: 'Ajustá por año, kilómetros, provincia y fuente. Sin ruido, más señal.' },
              { icon: '🔗', step: '03', t: 'Vas al aviso',   d: 'Cuando encontrás algo, te llevamos directo a la publicación original.' },
            ].map((x, i) => (
              <div
                key={x.t}
                className="rounded-2xl border p-6 card-hover relative overflow-hidden"
                style={{ borderColor: 'var(--border)', background: 'var(--background-card)', boxShadow: 'var(--shadow)' }}
                data-testid={`how-step-${i}`}
                role="listitem"
              >
                <div className="text-4xl mb-3">{x.icon}</div>
                <div className="absolute top-4 right-4 text-5xl font-black opacity-5" style={{ color: 'var(--accent-secondary)' }}>{x.step}</div>
                <div className="font-bold text-lg mb-2" style={{ color: 'var(--accent-secondary)' }}>{x.t}</div>
                <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{x.d}</div>
              </div>
            ))}
          </div>

          {/* Visual comparativo */}
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
                    ['Pestañas abiertas', '1', '5+'],
                    ['Tiempo de búsqueda', '~30 seg', '~15 min'],
                    ['Fuentes consultadas', 'Todas', 'Las que recuerdes'],
                    ['Comparar precios', '✅ Fácil', '❌ Difícil'],
                    ['Costo', '✅ Gratis', '—'],
                  ].map(([action, si, no], i) => (
                    <tr key={action} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--background), transparent 50%)' }}>
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
            <h3 id="partners-title" className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-tertiary)' }}>
              Marketplaces integrados
            </h3>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>
              Buscamos en estas plataformas y te llevamos directo al aviso original.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4" role="list">
            {ALL_SOURCES.map((p, i) => (
              <a
                key={p.key}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-hover rounded-2xl border p-5 text-center flex flex-col items-center gap-2 text-sm font-semibold"
                style={{ borderColor: 'var(--border)', background: 'var(--background-card)', color: 'var(--foreground)', textDecoration: 'none' }}
                data-testid={`partner-${i}`}
                aria-label={`Ir a ${p.label}`}
                role="listitem"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: p.color, color: p.textColor }}>
                  {p.label.charAt(0)}
                </div>
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
            <h3 id="faq-title" className="font-display text-2xl md:text-3xl mb-3" style={{ color: 'var(--accent-primary)' }}>
              Preguntas frecuentes
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: '¿Es un marketplace?', a: 'No. Somos un agregador: mostramos resultados y te llevamos al aviso original. La venta se concreta en el marketplace.' },
              { q: '¿Qué fuentes están integradas?', a: 'MercadoLibre activo. Kavak, OLX, V6 y Facebook en proceso de integración.' },
              { q: '¿Es gratis?', a: 'Sí, la búsqueda es 100% gratis. En el futuro habrá opciones premium para vendedores.' },
              { q: '¿Con qué frecuencia se actualizan los datos?', a: 'Cada búsqueda consulta los marketplaces en tiempo real para mostrarte los avisos más recientes.' },
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
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                El buscador unificado de autos de Argentina. Compará precios en un solo lugar.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Marketplaces</div>
              <ul className="space-y-2">
                {ALL_SOURCES.map(s => (
                  <li key={s.key}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: 'var(--foreground-muted)' }} data-testid={`footer-link-${s.key}`}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Info</div>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                <li>🇦🇷 Hecho en Argentina</li>
                <li>📧 contacto@autobuscar.ar</li>
                <li>Versión Beta 0.1</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
            © 2026 AutoBuscar.ar — Todos los derechos reservados. Los avisos pertenecen a sus respectivos marketplaces.
          </div>
        </div>
      </footer>
    </div>
  );
}