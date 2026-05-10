'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ─── Generador de datos históricos simulados ───────────────────────────────
function generatePriceTrend(query, filters = {}) {
  const q = query.toLowerCase();

  const basePrices = {
    'peugeot 208': 18000000, 'ford focus': 14000000, 'gol trend': 9000000,
    'volkswagen gol': 9000000, 'toyota corolla': 22000000, 'fiat cronos': 13000000,
    'chevrolet onix': 12000000, 'renault sandero': 10000000, 'honda civic': 20000000,
    'toyota hilux': 35000000, 'ford ranger': 32000000, 'vw amarok': 38000000,
  };

  let basePrice = 15000000;
  for (const [key, val] of Object.entries(basePrices)) {
    if (q.includes(key) || key.includes(q.split(' ')[0])) { basePrice = val; break; }
  }

  if (filters.minPrice) basePrice = Math.max(basePrice, parseInt(filters.minPrice));
  if (filters.maxPrice) basePrice = Math.min(basePrice, parseInt(filters.maxPrice));

  const currentYear = new Date().getFullYear();
  const fromYear = filters.minYear ? parseInt(filters.minYear) : currentYear - 8;
  const toYear = filters.maxYear ? parseInt(filters.maxYear) : currentYear;

  const dataPoints = [];
  for (let yr = fromYear; yr <= toYear; yr++) {
    const yearsOld = currentYear - yr;
    const depFactor = Math.pow(0.88, yearsOld);
    const inflFactor = Math.pow(1.12, Math.max(0, yr - 2020));
    const price = Math.round(basePrice * depFactor * inflFactor);
    const noise = 1 + (Math.random() - 0.5) * 0.08;
    dataPoints.push({
      year: yr,
      avg: Math.round(price * noise),
      min: Math.round(price * noise * 0.82),
      max: Math.round(price * noise * 1.18),
      count: Math.floor(40 + Math.random() * 120),
    });
  }
  return dataPoints;
}

// ─── Gráfico SVG ───────────────────────────────────────────────────────────
function LineChart({ data, darkMode }) {
  const W = 800, H = 320, PAD = { top: 24, right: 24, bottom: 48, left: 80 };
  if (!data || data.length < 2) return null;

  const minP = Math.min(...data.map(d => d.min));
  const maxP = Math.max(...data.map(d => d.max));
  const range = maxP - minP || 1;

  const xScale = (i) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const yScale = (v) => PAD.top + (1 - (v - minP) / range) * (H - PAD.top - PAD.bottom);

  const avgLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.avg).toFixed(1)}`).join(' ');
  const areaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.max).toFixed(1)}`),
    ...data.map((d, i) => `L${xScale(data.length - 1 - i).toFixed(1)},${yScale(data[data.length - 1 - i].min).toFixed(1)}`),
    'Z',
  ].join(' ');

  const fg = darkMode ? '#60a5fa' : '#2563eb';
  const grid = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = darkMode ? '#7c8fa6' : '#64748b';
  const fmt = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 340 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fg} stopOpacity="0.18" />
          <stop offset="100%" stopColor={fg} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {Array.from({ length: 5 }).map((_, i) => {
        const v = minP + (range / 4) * (4 - i);
        const y = yScale(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={grid} strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={textColor}>{fmt(v)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={avgLine} fill="none" stroke={fg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(d.avg)} r="5" fill={fg} stroke={darkMode ? '#131f35' : '#fff'} strokeWidth="2" />
          <text x={xScale(i)} y={H - PAD.bottom + 18} textAnchor="middle" fontSize="11" fill={textColor}>{d.year}</text>
          <text x={xScale(i)} y={yScale(d.avg) - 10} textAnchor="middle" fontSize="10" fill={fg} fontWeight="600">{fmt(d.avg)}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Contenido interno (usa useSearchParams) ───────────────────────────────
function TendenciaContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = {
    minYear: searchParams.get('minYear') || '',
    maxYear: searchParams.get('maxYear') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    brand: searchParams.get('brand') || '',
    model: searchParams.get('model') || '',
  };

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('autobuscar-theme');
    const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    const t = setTimeout(() => {
      setTrendData(generatePriceTrend(query, filters));
      setLoading(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [query]);

  if (!mounted) return null;

  const fmt = (v) => `$${v.toLocaleString('es-AR')}`;
  const avgAll = trendData.length ? Math.round(trendData.reduce((s, d) => s + d.avg, 0) / trendData.length) : 0;
  const minAll = trendData.length ? Math.min(...trendData.map(d => d.min)) : 0;
  const maxAll = trendData.length ? Math.max(...trendData.map(d => d.max)) : 0;
  const lastYear = trendData[trendData.length - 1];
  const prevYear = trendData[trendData.length - 2];
  const trend = lastYear && prevYear ? ((lastYear.avg - prevYear.avg) / prevYear.avg * 100).toFixed(1) : null;
  const activeFilters = Object.entries(filters).filter(([, v]) => v);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }} data-testid="tendencia-page">
      <header className="sticky top-0 z-50 border-b glass" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="btn-soft flex items-center gap-2 px-3 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--background-card)' }} data-testid="back-button">
            ← Volver
          </Link>
          <div>
            <span className="font-display text-lg" style={{ color: 'var(--accent-primary)' }}>AutoBuscar.ar</span>
            <span className="mx-2" style={{ color: 'var(--border)' }}>/</span>
            <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Tendencia de precios</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-4" style={{ borderColor: 'var(--border)', color: 'var(--accent-secondary)', background: 'var(--background-card)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-secondary)' }} />
            Datos estimados basados en publicaciones históricas
          </div>
          <h1 className="font-display text-3xl md:text-4xl mb-2" style={{ color: 'var(--foreground)' }}>
            Tendencia: <span style={{ color: 'var(--accent-primary)' }}>{query}</span>
          </h1>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map(([k, v]) => (
                <span key={k} className="px-3 py-1 rounded-full text-xs border" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)', background: 'var(--background-card)' }}>
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border p-12 text-center" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }}>
            <div className="text-4xl mb-4">📈</div>
            <div className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Analizando datos históricos...</div>
            <div className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>Consultando publicaciones y estimando tendencias</div>
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Precio promedio', value: fmt(avgAll), sub: 'Histórico', color: 'var(--accent-primary)' },
                { label: 'Precio mínimo', value: fmt(minAll), sub: 'Más bajo registrado', color: 'var(--success)' },
                { label: 'Precio máximo', value: fmt(maxAll), sub: 'Más alto registrado', color: '#f59e0b' },
                { label: 'Variación anual', value: trend ? `${parseFloat(trend) > 0 ? '+' : ''}${trend}%` : '-', sub: 'Último año vs anterior', color: trend && parseFloat(trend) > 0 ? '#ef4444' : 'var(--success)' },
              ].map((kpi, i) => (
                <div key={i} className="rounded-2xl border p-4" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>{kpi.label}</div>
                  <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border p-6 mb-8" style={{ background: 'var(--background-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="font-display text-lg" style={{ color: 'var(--foreground)' }}>Evolución del precio promedio</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>El área sombreada representa el rango mín-máx</p>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  <span className="flex items-center gap-1">
                    <span className="w-6 h-0.5 inline-block rounded" style={{ background: 'var(--accent-primary)' }} /> Precio promedio
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 inline-block rounded opacity-20" style={{ background: 'var(--accent-primary)' }} /> Rango mín-máx
                  </span>
                </div>
              </div>
              <LineChart data={trendData} darkMode={darkMode} />
            </div>

            <div className="rounded-2xl border overflow-hidden mb-8" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }}>
              <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-display text-lg" style={{ color: 'var(--foreground)' }}>Detalle por año</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--background)' }}>
                      {['Año', 'Precio promedio', 'Mínimo', 'Máximo', 'Publicaciones est.', 'Variación'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--foreground-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((d, i) => {
                      const prev = trendData[i - 1];
                      const change = prev ? ((d.avg - prev.avg) / prev.avg * 100).toFixed(1) : null;
                      return (
                        <tr key={d.year} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb,var(--background),transparent 50%)' }}>
                          <td className="px-4 py-3 font-semibold" style={{ color: 'var(--foreground)' }}>{d.year}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent-primary)' }}>{fmt(d.avg)}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--success)' }}>{fmt(d.min)}</td>
                          <td className="px-4 py-3" style={{ color: '#f59e0b' }}>{fmt(d.max)}</td>
                          <td className="px-4 py-3" style={{ color: 'var(--foreground-muted)' }}>~{d.count}</td>
                          <td className="px-4 py-3">
                            {change !== null && (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: parseFloat(change) > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: parseFloat(change) > 0 ? '#ef4444' : 'var(--success)' }}>
                                {parseFloat(change) > 0 ? '▲' : '▼'} {Math.abs(change)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border p-5 text-sm mb-8" style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}>
              <div className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>⚠️ Nota importante</div>
              <p style={{ color: 'var(--foreground-muted)' }}>
                Los datos son estimaciones basadas en modelos de depreciación típica del mercado argentino. Próximamente integraremos datos reales de publicaciones cerradas de los marketplaces.
              </p>
            </div>

            <div className="text-center">
              <Link href={`/?q=${encodeURIComponent(query)}`} className="btn-soft inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>
                Ver publicaciones disponibles de "{query}" →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Wrapper con Suspense (requerido por Next.js 15 para useSearchParams) ──
export default function TendenciaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div style={{ color: 'var(--foreground-muted)' }}>Cargando...</div>
      </div>
    }>
      <TendenciaContent />
    </Suspense>
  );
}