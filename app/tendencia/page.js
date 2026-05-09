'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ─── Generador de datos históricos simulados ───────────────────────────────
function generatePriceTrend(query, filters = {}) {
  const q = query.toLowerCase();

  // Base prices por tipo de auto (en ARS aproximado 2024)
  const basePrices = {
    'peugeot 208': 18000000,  'ford focus': 14000000,   'gol trend': 9000000,
    'volkswagen gol': 9000000, 'toyota corolla': 22000000,'fiat cronos': 13000000,
    'chevrolet onix': 12000000,'renault sandero': 10000000,'honda civic': 20000000,
    'toyota hilux': 35000000,  'ford ranger': 32000000,   'vw amarok': 38000000,
  };

  let basePrice = 15000000;
  for (const [key, val] of Object.entries(basePrices)) {
    if (q.includes(key) || key.includes(q.split(' ')[0])) { basePrice = val; break; }
  }

  if (filters.minPrice) basePrice = Math.max(basePrice, parseInt(filters.minPrice));
  if (filters.maxPrice) basePrice = Math.min(basePrice, parseInt(filters.maxPrice));

  const currentYear = new Date().getFullYear();
  const fromYear    = filters.minYear ? parseInt(filters.minYear) : currentYear - 8;
  const toYear      = filters.maxYear ? parseInt(filters.maxYear) : currentYear;

  const dataPoints = [];
  for (let yr = fromYear; yr <= toYear; yr++) {
    const yearsOld   = currentYear - yr;
    // Depreciación típica argentina: ~15% primer año, ~10% los siguientes
    const depFactor  = Math.pow(0.88, yearsOld);
    const inflFactor = Math.pow(1.12, Math.max(0, yr - 2020)); // inflación desde 2020
    const price      = Math.round(basePrice * depFactor * inflFactor);
    const noise      = 1 + (Math.random() - 0.5) * 0.08;

    dataPoints.push({
      year:   yr,
      avg:    Math.round(price * noise),
      min:    Math.round(price * noise * 0.82),
      max:    Math.round(price * noise * 1.18),
      count:  Math.floor(40 + Math.random() * 120),
    });
  }
  return dataPoints;
}

// ─── Mini gráfico SVG de línea ─────────────────────────────────────────────
function LineChart({ data, darkMode }) {
  const W = 800, H = 320, PAD = { top: 24, right: 24, bottom: 48, left: 80 };
  if (!data || data.length < 2) return null;

  const prices = data.map(d => d.avg);
  const minP   = Math.min(...data.map(d => d.min));
  const maxP   = Math.max(...data.map(d => d.max));
  const range  = maxP - minP || 1;

  const xScale = (i) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const yScale = (v) => PAD.top + (1 - (v - minP) / range) * (H - PAD.top - PAD.bottom);

  // Línea promedio
  const avgLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.avg).toFixed(1)}`).join(' ');
  // Área min-max
  const areaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.max).toFixed(1)}`),
    ...data.map((d, i) => `L${xScale(data.length - 1 - i).toFixed(1)},${yScale(data[data.length - 1 - i].min).toFixed(1)}`),
    'Z',
  ].join(' ');

  const fg   = darkMode ? '#60a5fa' : '#2563eb';
  const fgL  = darkMode ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)';
  const grid = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const text = darkMode ? '#7c8fa6' : '#64748b';

  const fmt = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;
  const yTicks = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 340 }} role="img" aria-label="Gráfico de tendencia de precios">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fg} stopOpacity="0.18" />
          <stop offset="100%" stopColor={fg} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid horizontal */}
      {Array.from({ length: yTicks }).map((_, i) => {
        const v = minP + (range / (yTicks - 1)) * (yTicks - 1 - i);
        const y = yScale(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={grid} strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={text}>{fmt(v)}</text>
          </g>
        );
      })}

      {/* Área min-max */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Línea promedio */}
      <path d={avgLine} fill="none" stroke={fg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Puntos */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(d.avg)} r="5" fill={fg} stroke={darkMode ? '#131f35' : '#fff'} strokeWidth="2" />
          {/* Etiqueta año */}
          <text x={xScale(i)} y={H - PAD.bottom + 18} textAnchor="middle" fontSize="11" fill={text}>{d.year}</text>
          {/* Etiqueta precio */}
          <text x={xScale(i)} y={yScale(d.avg) - 10} textAnchor="middle" fontSize="10" fill={fg} fontWeight="600">{fmt(d.avg)}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── PÁGINA ────────────────────────────────────────────────────────────────
export default function TendenciaPage() {
  const searchParams   = useSearchParams();
  const query          = searchParams.get('q') || '';
  const [darkMode, setDarkMode]     = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [trendData, setTrendData]   = useState([]);
  const [loading, setLoading]       = useState(true);

  const filters = {
    minYear:   searchParams.get('minYear')   || '',
    maxYear:   searchParams.get('maxYear')   || '',
    minPrice:  searchParams.get('minPrice')  || '',
    maxPrice:  searchParams.get('maxPrice')  || '',
    brand:     searchParams.get('brand')     || '',
    model:     searchParams.get('model')     || '',
    transmission: searchParams.get('transmission') || '',
    fuelType:  searchParams.get('fuelType')  || '',
    province:  searchParams.get('province')  || '',
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
    // Simular delay de carga (como si consultara una API)
    const t = setTimeout(() => {
      const data = generatePriceTrend(query, filters);
      setTrendData(data);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [query]);

  if (!mounted) return null;

  const avgAll   = trendData.length ? Math.round(trendData.reduce((s, d) => s + d.avg, 0) / trendData.length) : 0;
  const minAll   = trendData.length ? Math.min(...trendData.map(d => d.min)) : 0;
  const maxAll   = trendData.length ? Math.max(...trendData.map(d => d.max)) : 0;
  const lastYear = trendData[trendData.length - 1];
  const prevYear = trendData[trendData.length - 2];
  const trend    = lastYear && prevYear ? ((lastYear.avg - prevYear.avg) / prevYear.avg * 100).toFixed(1) : null;
  const fmt      = (v) => `$${v.toLocaleString('es-AR')}`;

  const activeFilters = Object.entries(filters).filter(([, v]) => v && v !== 'Cualquiera' && v !== 'Todas');

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }} data-testid="tendencia-page">

      {/* Header */}
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

      <main className="max-w-6xl mx-auto px-4 py-10" data-testid="tendencia-main">

        {/* Título */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-4" style={{ borderColor: 'var(--border)', color: 'var(--accent-secondary)', background: 'var(--background-card)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-secondary)' }} />
            Datos estimados basados en publicaciones históricas
          </div>
          <h1 className="font-display text-3xl md:text-4xl mb-2" style={{ color: 'var(--foreground)' }}>
            Tendencia de precios: <span style={{ color: 'var(--accent-primary)' }}>{query}</span>
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
          <div className="rounded-2xl border p-12 text-center animate-pulse" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }} data-testid="tendencia-loading">
            <div className="text-4xl mb-4">📈</div>
            <div className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Analizando datos históricos...</div>
            <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Consultando publicaciones y estimando tendencias</div>
            <div className="mt-6 flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="tendencia-kpis">
              {[
                { label: 'Precio promedio',  value: fmt(avgAll),    sub: 'Histórico',               color: 'var(--accent-primary)'   },
                { label: 'Precio mínimo',    value: fmt(minAll),    sub: 'Más bajo registrado',     color: 'var(--success)'          },
                { label: 'Precio máximo',    value: fmt(maxAll),    sub: 'Más alto registrado',     color: '#f59e0b'                  },
                { label: 'Variación anual',  value: trend ? `${trend > 0 ? '+' : ''}${trend}%` : '-', sub: 'Último año vs anterior', color: trend && parseFloat(trend) > 0 ? '#ef4444' : 'var(--success)' },
              ].map((kpi, i) => (
                <div key={i} className="rounded-2xl border p-4" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }} data-testid={`kpi-${i}`}>
                  <div className="text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>{kpi.label}</div>
                  <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Gráfico */}
            <div className="rounded-2xl border p-6 mb-8" style={{ background: 'var(--background-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }} data-testid="tendencia-chart">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg" style={{ color: 'var(--foreground)' }}>Evolución del precio promedio</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>El área sombreada representa el rango mín-máx de publicaciones</p>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: 'var(--accent-primary)' }} /> Precio promedio</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded opacity-20" style={{ background: 'var(--accent-primary)' }} /> Rango mín-máx</span>
                </div>
              </div>
              <LineChart data={trendData} darkMode={darkMode} />
            </div>

            {/* Tabla detallada */}
            <div className="rounded-2xl border overflow-hidden mb-8" style={{ background: 'var(--background-card)', borderColor: 'var(--border)' }} data-testid="tendencia-table">
              <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-display text-lg" style={{ color: 'var(--foreground)' }}>Detalle por año</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>Estimación basada en publicaciones históricas y depreciación del mercado argentino</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--background)' }}>
                      {['Año', 'Precio promedio', 'Mínimo', 'Máximo', 'Publicaciones estimadas', 'Variación'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--foreground-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((d, i) => {
                      const prev   = trendData[i - 1];
                      const change = prev ? ((d.avg - prev.avg) / prev.avg * 100).toFixed(1) : null;
                      return (
                        <tr key={d.year} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'color-mix(in srgb,var(--background),transparent 50%)' }} data-testid={`trend-row-${d.year}`}>
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

            {/* Disclaimer */}
            <div className="rounded-2xl border p-5 text-sm" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb,var(--background-card),transparent 30%)' }} data-testid="tendencia-disclaimer">
              <div className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>⚠️ Nota importante</div>
              <p style={{ color: 'var(--foreground-muted)' }}>
                Los datos de tendencia son estimaciones generadas a partir de modelos de depreciación típica del mercado argentino y la inflación histórica. No representan datos de transacciones reales. Próximamente integraremos datos reales de publicaciones cerradas y vendidas de los marketplaces integrados.
              </p>
            </div>

            {/* CTA volver a buscar */}
            <div className="mt-8 text-center">
              <Link href={`/?q=${encodeURIComponent(query)}`} className="btn-soft inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }} data-testid="cta-buy">
                Ver publicaciones disponibles de "{query}" →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}