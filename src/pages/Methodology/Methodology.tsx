import React from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../PageWrapper/PageWrapper';
import { ODISHA_DISTRICT_SHAPES, ODISHA_VIEW } from '../../data/odishaDistrictShapes';
import {
  BookOpen,
  MapPin,
  Database,
  Cpu,
  TrendingUp,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  BookMarked,
  ExternalLink,
  Workflow,
} from 'lucide-react';

const POSTER_BLUE = '#1F4E96';

const Chevron = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 36 56" className={`w-8 h-12 flex-shrink-0 ${className}`} fill={POSTER_BLUE}>
    <polygon points="2,2 16,2 34,28 16,54 2,54 19,28" />
  </svg>
);

const StepBadge = ({ n }: { n: string }) => (
  <span className="inline-flex items-stretch rounded-md overflow-hidden shadow-sm whitespace-nowrap border border-[#1F4E96]/20">
    <span className="bg-[#1F4E96] text-white text-[9px] font-black tracking-[0.18em] px-2.5 flex items-center">
      STEP
    </span>
    <span className="bg-[#F6B93B] text-gray-900 text-[12px] font-black px-2.5 py-1 flex items-center">
      {n}
    </span>
  </span>
);

const TabLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block bg-[#F3E3BE] border-2 border-dashed border-[#C9A662] px-4 py-1.5 text-sm font-black tracking-[0.25em] text-gray-900 rounded-sm">
    {children}
  </span>
);


const gridCells = (
  rows: number,
  cols: number,
  s: number,
  fill: (v: number) => string,
) => {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.hypot(c - cols / 2 + 0.5, r - rows / 2 + 0.5);
      let v = Math.max(0, 1 - d / (cols / 2.2)) + (((r * 7 + c * 13) % 5) - 2) * 0.05;
      v = Math.min(1, Math.max(0, v));
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * s}
          y={r * s}
          width={s}
          height={s}
          fill={fill(v)}
          stroke="#fff"
          strokeWidth={0.6}
        />,
      );
    }
  }
  return cells;
};

const grayFill = (v: number) => {
  const g = Math.round(243 - v * 210);
  return `rgb(${g},${g},${g})`;
};

const BuaGraphic = () => (
  <svg viewBox="0 0 162 112" className="w-full max-w-[200px] mx-auto">
    <defs>
      <linearGradient id="buaLeg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1F2937" />
        <stop offset="1" stopColor="#F3F4F6" />
      </linearGradient>
    </defs>
    <rect x={2} y={4} width={8} height={104} fill="url(#buaLeg)" stroke="#94A3B8" strokeWidth={0.5} />
    <text x={13} y={10} fontSize={6} fill="#64748B">100%</text>
    <text x={13} y={108} fontSize={6} fill="#64748B">0%</text>
    <g transform="translate(28,0)">{gridCells(8, 9, 14, grayFill)}</g>
  </svg>
);

const OdishaDistrictsGraphic = () => {
  const pops = ODISHA_DISTRICT_SHAPES.map((s) => s.pop2011);
  const lo = Math.min(...pops);
  const hi = Math.max(...pops);
  const shade = (pop: number) => {
    const t = Math.sqrt((pop - lo) / (hi - lo || 1));
    return `hsl(24, 88%, ${88 - t * 46}%)`;
  };
  const { w, h } = ODISHA_VIEW;
  return (
    <svg viewBox={`0 0 ${w} ${h + 12}`} className="w-full max-w-[200px] mx-auto">
      {ODISHA_DISTRICT_SHAPES.map((s) => (
        <path key={s.name} d={s.d} fill={shade(s.pop2011)} stroke="#fff" strokeWidth={0.8}>
          <title>{s.name}</title>
        </path>
      ))}
      {/* legend */}
      <defs>
        <linearGradient id="odLeg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="hsl(24, 88%, 88%)" />
          <stop offset="1" stopColor="hsl(24, 88%, 42%)" />
        </linearGradient>
      </defs>
      <rect x={w - 62} y={h + 2} width={44} height={6} rx={2} fill="url(#odLeg)" />
      <text x={w - 66} y={h + 8} fontSize={6} fill="#64748B" textAnchor="end">low</text>
      <text x={w - 14} y={h + 8} fontSize={6} fill="#64748B">high</text>
    </svg>
  );
};

const CompositeGraphic = () => (
  <svg viewBox="0 0 260 112" className="w-full max-w-[280px] mx-auto">
    <g transform="translate(0,14)">
      <g opacity={0.55} transform="translate(14,-12)">
        <rect x={0} y={0} width={92} height={80} fill="#E5E7EB" stroke="#94A3B8" strokeWidth={0.8} />
      </g>
      <g opacity={0.8} transform="translate(7,-6)">
        <rect x={0} y={0} width={92} height={80} fill="#EDEFF2" stroke="#94A3B8" strokeWidth={0.8} />
      </g>
      <g>{gridCells(6, 7, 13.2, grayFill)}</g>
      <g fill="#FFFFFF" stroke="#94A3B8" strokeWidth={0.7}>
        <ellipse cx={26} cy={22} rx={13} ry={6.5} />
        <ellipse cx={36} cy={18} rx={9} ry={5} />
        <ellipse cx={64} cy={54} rx={11} ry={5.5} />
      </g>
    </g>
    <g transform="translate(112,44)">
      <polygon points="0,4 14,4 26,16 14,28 0,28 11,16" fill={POSTER_BLUE} />
    </g>
    <g transform="translate(152,14)">
      {gridCells(6, 7, 13.2, grayFill)}
      <text x={46} y={95} fontSize={7.5} fontWeight={700} fill="#475569" textAnchor="middle">
        cloud-free composite
      </text>
    </g>
  </svg>
);

const LayerStackGraphic = () => {
  const layer = (y: number, fill: string, label: string, key: string) => (
    <g key={key}>
      <path d={`M28 ${y} L112 ${y} L96 ${y + 20} L12 ${y + 20} Z`} fill={fill} stroke="#fff" strokeWidth={1.4} />
      <text x={118} y={y + 14} fontSize={7.5} fontWeight={700} fill="#475569">
        {label}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 178 118" className="w-full max-w-[220px] mx-auto">
      {layer(4, '#397D49', 'NDVI / vegetation', 'l1')}
      {layer(30, '#0F172A', 'Nightlights (VIIRS)', 'l2')}
      {layer(56, '#F76000', 'LST (thermal)', 'l3')}
      {layer(82, '#94A3B8', 'Built-up / LULC', 'l4')}
      {[[52, 40], [68, 43], [80, 38], [60, 36]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.8} fill="#F6B93B" />
      ))}
    </svg>
  );
};

const CorrBarsGraphic = () => {
  const bars: [string, number, boolean][] = [
    ['Nightlights', 0.79, true],
    ['Built-up', 0.68, true],
    ['Agriculture', 0.52, true],
    ['UI', 0.12, false],
    ['BUI', 0.05, false],
  ];
  return (
    <svg viewBox="0 0 250 118" className="w-full max-w-[270px] mx-auto">
      <line x1={78} y1={4} x2={78} y2={106} stroke="#94A3B8" strokeWidth={1} />
      {bars.map(([label, v, keep], i) => {
        const y = 8 + i * 21;
        const w = v * 150;
        return (
          <g key={label}>
            <text x={72} y={y + 10} fontSize={8} fontWeight={700} fill="#475569" textAnchor="end">
              {label}
            </text>
            <rect x={80} y={y} width={w} height={13} rx={2.5} fill={keep ? '#F76000' : '#CBD5E1'} />
            <text x={84 + w} y={y + 10} fontSize={7.5} fontWeight={700} fill={keep ? '#475569' : '#94A3B8'}>
              r = {v.toFixed(2)}
            </text>
            {!keep && (
              <g stroke="#DC2626" strokeWidth={2} strokeLinecap="round">
                <line x1={236} y1={y + 2} x2={246} y2={y + 11} />
                <line x1={246} y1={y + 2} x2={236} y2={y + 11} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const ModelsGraphic = () => {
  const box = (x: number, y: number, label: string, selected: boolean) => (
    <g key={label}>
      <rect
        x={x}
        y={y}
        width={104}
        height={30}
        rx={7}
        fill={selected ? POSTER_BLUE : '#FFFFFF'}
        stroke={selected ? POSTER_BLUE : '#94A3B8'}
        strokeWidth={1.6}
      />
      <text
        x={x + 52}
        y={y + 19}
        fontSize={10.5}
        fontWeight={800}
        fill={selected ? '#FFFFFF' : '#64748B'}
        textAnchor="middle"
      >
        {label}
      </text>
      {selected && (
        <g transform={`translate(${x + 92}, ${y - 6})`}>
          <circle r={7.5} fill="#16A34A" />
          <path d="M-3.4 0 L-1 2.8 L3.6 -2.6" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
  return (
    <svg viewBox="0 0 250 104" className="w-full max-w-[270px] mx-auto overflow-visible">
      {box(6, 12, 'Random Forest', false)}
      {box(140, 12, 'XGBoost', false)}
      {box(6, 64, 'LightGBM', true)}
      {box(140, 64, 'CatBoost', true)}
    </svg>
  );
};

const DotsGridGraphic = () => (
  <svg viewBox="0 0 120 92" className="w-full max-w-[140px] mx-auto">
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => (
        <g key={`${r}${c}`}>
          <rect x={c * 30} y={r * 30} width={30} height={30} fill="#fff" stroke="#94A3B8" strokeWidth={0.8} />
          {Array.from({ length: ((r * 4 + c) * 5) % 9 }, (_, i) => (
            <circle
              key={i}
              cx={c * 30 + 5 + ((i * 11 + r * 7) % 21)}
              cy={r * 30 + 5 + ((i * 17 + c * 5) % 21)}
              r={1.6}
              fill="#1F4E96"
            />
          ))}
        </g>
      )),
    )}
  </svg>
);

const HeatGridGraphic = () => (
  <svg viewBox="0 0 120 92" className="w-full max-w-[140px] mx-auto">
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => {
        const v = (((r * 4 + c) * 5) % 9) / 9;
        return (
          <rect
            key={`${r}${c}`}
            x={c * 30}
            y={r * 30}
            width={30}
            height={30}
            fill={`hsl(24, 88%, ${92 - v * 40}%)`}
            stroke="#fff"
            strokeWidth={1}
          />
        );
      }),
    )}
  </svg>
);

const TrendGraphic = () => (
  <svg viewBox="0 0 170 112" className="w-full max-w-[210px] mx-auto">
    <line x1={18} y1={6} x2={18} y2={94} stroke="#94A3B8" strokeWidth={1.2} />
    <line x1={18} y1={94} x2={164} y2={94} stroke="#94A3B8" strokeWidth={1.2} />
    <path d="M18 78 C 45 72, 70 62, 96 50" fill="none" stroke="#F76000" strokeWidth={2.4} />
    <path d="M18 78 C 45 72, 70 62, 96 50 L96 94 L18 94 Z" fill="#F76000" fillOpacity={0.12} />
    <path d="M96 50 C 118 40, 142 32, 160 26" fill="none" stroke="#F76000" strokeWidth={2.2} strokeDasharray="5 4" />
    <circle cx={96} cy={50} r={3} fill="#F76000" />
    <line x1={96} y1={50} x2={96} y2={94} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3 3" />
    <text x={18} y={104} fontSize={7} fill="#64748B" textAnchor="middle">2011</text>
    <text x={96} y={104} fontSize={7} fill="#64748B" textAnchor="middle">2025</text>
    <text x={160} y={104} fontSize={7} fill="#64748B" textAnchor="middle">2036</text>
    <text x={56} y={40} fontSize={6.5} fontWeight={700} fill="#475569">estimates</text>
    <text x={120} y={18} fontSize={6.5} fontWeight={700} fill="#475569">projection</text>
  </svg>
);

const DensityMapGraphic = () => {
  const pops = ODISHA_DISTRICT_SHAPES.map((s) => s.pop2011);
  const lo = Math.min(...pops);
  const hi = Math.max(...pops);
  const shade = (pop: number) => {
    const t = Math.sqrt((pop - lo) / (hi - lo || 1));
    return `hsl(268, 45%, ${90 - t * 48}%)`;
  };
  const { w, h } = ODISHA_VIEW;
  return (
    <svg viewBox={`0 0 ${w} ${h + 22}`} className="w-full max-w-[200px] mx-auto">
      {ODISHA_DISTRICT_SHAPES.map((s) => (
        <path key={s.name} d={s.d} fill={shade(s.pop2011)} stroke="#fff" strokeWidth={0.8}>
          <title>{s.name}</title>
        </path>
      ))}
      <defs>
        <linearGradient id="outLeg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="hsl(268, 45%, 90%)" />
          <stop offset="1" stopColor="hsl(268, 45%, 42%)" />
        </linearGradient>
      </defs>
      <rect x={w - 62} y={h + 2} width={44} height={6} rx={2} fill="url(#outLeg)" />
      <text x={w - 66} y={h + 8} fontSize={6} fill="#64748B" textAnchor="end">low</text>
      <text x={w - 14} y={h + 8} fontSize={6} fill="#64748B">high</text>
      <text x={w / 2} y={h + 20} fontSize={7} fontWeight={700} fill="#64748B" textAnchor="middle">
        density · growth · urban/rural (per district, per year)
      </text>
    </svg>
  );
};

const StepCard = ({
  step,
  title,
  tab,
  dashed,
  className = '',
  children,
}: {
  step: string;
  title?: string;
  tab?: string;
  dashed?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`${dashed
      ? 'border-2 border-dashed border-gray-400 rounded-lg'
      : 'border-[2.5px] border-[#1F4E96] rounded-xl'
      } bg-white p-4 md:p-5 flex flex-col ${className}`}
  >
    <div className="flex items-center justify-between gap-2 mb-3">
      {tab ? <TabLabel>{tab}</TabLabel> : <span className="text-sm font-black text-[#1F4E96]">{title}</span>}
      <StepBadge n={step} />
    </div>
    <div className="flex-1 flex flex-col justify-center">{children}</div>
  </div>
);

const MobileDown = () => (
  <div className="lg:hidden flex justify-center">
    <Chevron className="rotate-90" />
  </div>
);

const SolutionFlowDiagram: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-4 md:p-6">
      <div className="grid grid-cols-1 gap-3 lg:gap-2 lg:grid-cols-[1fr_44px_1fr] lg:grid-rows-[auto_2.75rem_auto_2.75rem_auto_2.75rem_auto]">

        <StepCard step="01" tab="INPUT" dashed className="lg:col-start-1 lg:row-start-1">
          <div className="flex items-center justify-center gap-2">
            <div className="flex-1">
              <BuaGraphic />
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {[
                  'Landsat 5/7/8',
                  'Sentinel-2 L2A',
                  'VIIRS Nightlights',
                  'ESRI 10 m Land Cover',
                  'GHS-SMOD',
                  'OpenStreetMap',
                  'GADM boundaries',
                ].map((d) => (
                  <span
                    key={d}
                    className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-bold text-gray-700 whitespace-nowrap"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <p className="text-center text-[9px] text-gray-500 mt-1.5">
                + WorldPop & UNFPA projections (validation only)
              </p>
            </div>
            <span className="text-3xl font-black text-green-600 flex-shrink-0">+</span>
            <div className="flex-1">
              <OdishaDistrictsGraphic />
              <p className="text-center text-[11px] font-bold text-gray-900 mt-2 leading-snug">
                Census 2011 population - district & sub-district wise (ground truth)
              </p>
            </div>
          </div>
        </StepCard>

        <div className="hidden lg:flex lg:col-start-2 lg:row-start-1 items-center justify-center">
          <Chevron />
        </div>
        <MobileDown />

        {/*Preprocessing */}
        <StepCard step="02" title="Preprocessing & Composites" className="lg:col-start-3 lg:row-start-1">
          <CompositeGraphic />
          <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
            Annual cloud-free composites: radiometric and atmospheric correction, cloud masking
            tightened to 3–5%, and Landsat-7 gap fill.
          </p>
        </StepCard>

        <div className="hidden lg:flex lg:col-start-3 lg:row-start-2 items-center justify-center">
          <Chevron className="rotate-90" />
        </div>
        <MobileDown />

        {/*Feature Engineering */}
        <StepCard step="03" title="Feature Engineering" className="lg:col-start-3 lg:row-start-3">
          <LayerStackGraphic />
          <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
            Nine spectral indices, LST, VIIRS nightlights, VTLPI and LULC class areas, reduced to
            per-district values via zonal statistics.
          </p>
        </StepCard>

        <div className="hidden lg:flex lg:col-start-2 lg:row-start-3 items-center justify-center">
          <Chevron className="rotate-180" />
        </div>
        <MobileDown />

        {/*Feature Selection */}
        <StepCard step="04" title="Feature Selection" className="lg:col-start-1 lg:row-start-3">
          <CorrBarsGraphic />
          <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
            Pearson screening against Census 2011 keeps the strong predictors, nightlights
            (r&nbsp;=&nbsp;0.79) and built-up (r&nbsp;=&nbsp;0.65–0.70), and drops noisy features.
          </p>
        </StepCard>

        <div className="hidden lg:flex lg:col-start-1 lg:row-start-4 items-center justify-center">
          <Chevron className="rotate-90" />
        </div>
        <MobileDown />

        {/* Model Training*/}
        <StepCard step="05" title="Model Training" className="lg:col-start-1 lg:row-start-5">
          <ModelsGraphic />
          <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
            Four ensemble regressors trained on Census 2011, the only full ground truth; CatBoost
            and LightGBM selected as the primary estimators.
          </p>
        </StepCard>

        <div className="hidden lg:flex lg:col-start-2 lg:row-start-5 items-center justify-center">
          <Chevron />
        </div>
        <MobileDown />

        {/*Validation*/}
        <StepCard step="06" title="Validation" className="lg:col-start-3 lg:row-start-5">
          <div className="flex items-start justify-center gap-3">
            <div className="flex-1">
              <DotsGridGraphic />
              <p className="text-center text-[10px] font-bold text-gray-900 mt-1.5">Leave-one-out</p>
            </div>
            <div className="flex-1">
              <HeatGridGraphic />
              <p className="text-center text-[10px] font-bold text-gray-900 mt-1.5">Spatial blocks</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
            Both splits guard against spatial autocorrelation: 2021 score{' '}
            <strong>R² = 0.91</strong> (CatBoost), back-tests 2012–2020 hold R² 0.77–0.92.
          </p>
        </StepCard>

        <div className="hidden lg:flex lg:col-start-3 lg:row-start-6 items-center justify-center">
          <Chevron className="rotate-90" />
        </div>
        <MobileDown />

        {/*Estimation & Projection*/}
        <StepCard step="07" title="Estimation & Projection" className="lg:col-start-3 lg:row-start-7">
          <TrendGraphic />
          <div className="mx-auto w-fit bg-gray-50 border-l-4 border-[#F76000] rounded-r-lg px-3 py-1 font-mono text-[10px] text-gray-800 mt-2">
            ln P(d, y) = a<sub>d</sub> + r<sub>d</sub> · y
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
            Each year's imagery yields the 2012–2025 estimates; a log-linear fit on recent years
            projects each district to 2036, reconciled to the state total.
          </p>
        </StepCard>

        <div className="hidden lg:flex lg:col-start-2 lg:row-start-7 items-center justify-center">
          <Chevron className="rotate-180" />
        </div>
        <MobileDown />

        {/* OUTPUT*/}
        <StepCard step="08" tab="OUTPUT" dashed className="lg:col-start-1 lg:row-start-7">
          <DensityMapGraphic />
          <p className="text-[11px] text-gray-600 leading-relaxed mt-3">
            An annual district series for 2011–2036 with density, growth and urban/rural split,
            within ±5% of UNFPA and WorldPop references, powering the dashboard and the district
            profile reports.
          </p>
        </StepCard>
      </div>
    </div>
  );
};

const VALIDATION = [
  {
    stat: 'R² = 0.91',
    title: 'ML estimates back-tested',
    desc: '2021 leave-one-out score; year-by-year back-tests for 2012–2020 hold R² between 0.77 and 0.92.',
  },
  {
    stat: '±5%',
    title: 'Agreement with UNFPA projections',
    desc: 'The full 2011–2036 series tracks the official, independently produced projections in every year.',
  },
  {
    stat: 'WorldPop',
    title: 'Gridded product cross-check',
    desc: 'Levels and growth trajectories verified against WorldPop R2025A over the overlapping years.',
  },
  {
    stat: '0/40',
    title: 'Hotspots manually audited',
    desc: 'All hotspot tags reviewed against ground knowledge; classifier refined until zero wrong tags remained.',
  },
];

const LIMITATIONS = [
  {
    label: 'Census 2011 is the only full-count anchor',
    text: 'Post-2011 estimates rest on modelled, satellite-derived signals; uncertainty grows with distance from the anchor.',
  },
  {
    label: 'Projection uncertainty compounds toward 2036',
    text: 'Terminal-year district estimates carry an 80% confidence band of roughly ±5–10%.',
  },
  {
    label: 'Uniform urbanisation rate (+0.17 pp/year)',
    text: 'Real district rates vary; this is the largest known error source in the urban/rural split.',
  },
  {
    label: 'Totals, not age–sex cohorts',
    text: 'A cohort-component extension is the natural follow-on for age-structured breakdowns.',
  },
  {
    label: 'Satellite proxies have physical limits',
    text: 'Monsoon cloud, nightlight saturation in dense cores, and the 60 m change-scoring resolution bound what can be seen.',
  },
  {
    label: 'Settlement-type tags are spatial proxies',
    text: 'They are designed to be read alongside census and survey data, not to replace it.',
  },
  {
    label: 'Boundary vintage',
    text: "GADM polygons are a contemporary snapshot; Odisha's boundaries have been stable since 2011, so mismatch contributes at most a few percent.",
  },
];

const MethodologyPage: React.FC = () => {
  return (
    <PageWrapper title="Methodology">
      <div className="w-full max-w-9xl mx-auto">
        {/* Header Hero Section */}
        <div className="mb-10 border-b border-gray-100 pb-8">
          <p className="text-[#F76000] font-black text-xs uppercase tracking-[0.2em] mb-3">
            Odisha Demographic & Data Intelligence Platform
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
            Population Estimation & Dynamics for Odisha using Geospatial & AI/ML Methods
          </h2>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-3xl">
            A summary of the analytical frameworks, data pipelines, machine-learning estimators and
            validation behind the platform. Full dataset details are listed in the{' '}
            <Link to="/catalog" className="text-[#F76000] font-semibold hover:underline">
              Data Catalog
            </Link>
            .
          </p>
        </div>

        <main className="space-y-16 pb-24 text-gray-700 leading-relaxed text-sm md:text-base">
          {/* ── Solution flow ── */}
          <section id="solution-flow" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                The Solution at a Glance
              </h3>
            </div>
            <p className="text-gray-500 text-xs md:text-sm mb-6 max-w-3xl">
              The full estimation methodology, step by step: from raw satellite imagery and Census
              2011 ground truth to a validated 2011–2036 district population series.
            </p>

            <SolutionFlowDiagram />
          </section>

          {/* ── 1. Overview ── */}
          <section id="overview" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">1. Overview</h3>
            </div>
            <p className="mb-6 text-gray-600">
              The platform provides annual, district-level population estimates and projections for
              all 30 districts of Odisha from 2011 through 2036, together with land-use change
              analysis, settlement classification and satellite-derived urbanisation indicators.
              With the decennial census providing ground truth only once per decade (and the 2021
              round delayed), it answers what the census alone cannot:{' '}
              <em>
                how is the population changing year by year, where exactly, and what is driving it?
              </em>{' '}
              Three complementary pipelines, built on open data and open-source tooling, do the
              work:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  no: '01',
                  tint: 'bg-[#FFF4EB] text-[#F76000]',
                  title: 'Satellite Estimation',
                  desc: 'ML models trained on Census 2011 estimate annual population from satellite proxies (built-up area, nightlights, Land Surface Temperature (LST), vegetation), 2011–2025.',
                },
                {
                  no: '02',
                  tint: 'bg-blue-50 text-blue-600',
                  title: 'Population Prediction',
                  desc: 'Growth trajectories learned from the estimated series and projected to 2036, validated against WorldPop and UNFPA.',
                },
                {
                  no: '03',
                  tint: 'bg-green-50 text-green-600',
                  title: 'Land-Use Change',
                  desc: 'Multi-signal change detection attributing settlement, industrial, mining and transport transformations, 2016–2024.',
                },
              ].map((p) => (
                <div
                  key={p.no}
                  className="p-5 bg-[#F9FAFB] rounded-2xl border border-gray-200/50 hover:bg-white hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${p.tint} flex items-center justify-center font-bold mb-3 text-sm`}
                  >
                    {p.no}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1.5 text-sm">{p.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-orange-50/50 border-l-4 border-[#F76000] text-[#F76000] rounded-r-xl text-xs md:text-sm font-medium">
              All outputs are delivered through an interactive web application built on React and
              MapLibre GL, streaming Cloud-Optimized GeoTIFFs (COGs) and PMTiles.
            </div>
          </section>

          {/* ── 2. Study Area ── */}
          <section id="study-area" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">2. Study Area</h3>
            </div>
            <p className="mb-5 text-gray-600">
              Odisha spans approximately <strong>155,707 km²</strong> with a 2011 Census population
              of <strong>41,974,218</strong> across <strong>30 districts</strong>. Its highly
              heterogeneous geography produces two demographic regimes that shape the analysis, and
              makes the state an ideal testbed for satellite-based demographic methods:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#F9FAFB] rounded-2xl border-l-4 border-amber-500">
                <h4 className="font-bold text-gray-900 mb-1.5 text-sm">
                  Coastal Industrial & Metropolitan Corridors
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Khordha, Cuttack, Puri, Ganjam, Jajpur: rapid urbanisation around Bhubaneswar and
                  the Paradip–Kalinganagar industrial belt, with cyclone and flood exposure.
                </p>
              </div>
              <div className="p-5 bg-[#F9FAFB] rounded-2xl border-l-4 border-emerald-500">
                <h4 className="font-bold text-gray-900 mb-1.5 text-sm">
                  Interior Tribal & Mining Belts
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The KBK region, Kendujhar, Sundargarh, Mayurbhanj: dispersed rural settlement,
                  mining-driven workforce concentrations, slower formal urbanisation.
                </p>
              </div>
            </div>
          </section>

          {/* ── 3. Data Sources ── */}
          <section id="data-sources" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">3. Data Sources</h3>
            </div>
            <p className="text-gray-600">
              Ten open datasets power the platform, from Census 2011 ground truth to Sentinel-2
              imagery. The rationale and purpose of each is documented in the{' '}
              <Link to="/catalog" className="text-[#F76000] font-semibold hover:underline">
                Data Catalog
              </Link>
              .
            </p>
          </section>

          {/* ── 4. Pipeline 1 ── */}
          <section id="pipeline-1" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                4. Pipeline 1: Satellite-Based Population Estimation (AI/ML)
              </h3>
            </div>
            <p className="mb-4 text-gray-600">
              Built-up extent, nighttime lights and related spectral signals are strong physical
              proxies for where people live. Annual cloud-free composites (Google Earth Engine,
              2011–2024) yield a per-district feature stack of spectral indices, land surface
              temperature, VIIRS nightlights and land-cover class areas. Correlation screening
              against Census 2011 kept the strongest predictors (nightlights r&nbsp;=&nbsp;0.79,
              built-up r&nbsp;=&nbsp;0.65–0.70) and dropped noisy ones.
            </p>
            <p className="mb-5 text-gray-600">
              Four ensemble regressors (Random Forest, XGBoost, LightGBM, CatBoost) were trained on
              2011, the only full ground truth, and validated under both leave-one-out and spatially
              blocked splits to guard against spatial autocorrelation. Iterative refinement, most
              notably tightening the cloud-cover threshold to 3–5%, lifted CatBoost to{' '}
              <strong>R² = 0.91</strong> against 2021 references. The final CatBoost/LightGBM
              configuration produces annual estimates for 2011–2025, reconciled across
              administrative levels and disaggregated to a continuous grid.
            </p>
            <div className="flex flex-wrap gap-2">
              {['R² = 0.91 (2021)', 'CatBoost + LightGBM', 'LOO + spatial-block validation', '14 satellite features'].map(
                (chip) => (
                  <span
                    key={chip}
                    className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>
          </section>

          {/* ── 5. Pipeline 2 ── */}
          <section id="pipeline-2" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                5. Pipeline 2: Population Prediction 2026–2036
              </h3>
            </div>
            <p className="mb-4 text-gray-600">
              Forward projections extend each district's <em>own</em> trajectory rather than
              importing external ones. A log-linear growth model is fitted to the most recent
              estimated years (growth in Odisha is decelerating, so a recent window beats a long-run
              average) and applied geometrically to 2036, with district predictions reconciled to
              the state aggregate. WorldPop and UNFPA series are reserved strictly for independent
              validation.
            </p>
            <div className="my-5 p-4 bg-gray-50 border-l-4 border-[#F76000] rounded-r-2xl text-center font-mono text-xs md:text-sm text-gray-800 shadow-sm space-y-1.5">
              <div>
                ln P(d, y) = a<sub>d</sub> + r<sub>d</sub> · y
              </div>
              <div>
                P(d, y) = P(d, 2025) · exp(r<sub>d</sub> · (y − 2025)), &nbsp; y ∈ &#123;2026, ...,
                2036&#125;
              </div>
            </div>
            <p className="text-gray-600">
              From the combined 2011–2036 series the platform derives, per district and year:
              density (against Census 2011 land area), year-on-year growth, and an urban/rural
              split advanced at Odisha's observed <strong>+0.17 pp/year</strong> urbanisation rate.
              A parallel sub-pipeline converts GHS-SMOD rasters (2010–2030) into district COGs,
              powering the Degree-of-Urbanisation layers.
            </p>
          </section>

          {/* ── 6. Pipeline 3 ── */}
          <section id="pipeline-3" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                6. Pipeline 3: Land-Use Change Detection & Driver Attribution (2016–2024)
              </h3>
            </div>
            <p className="mb-4 text-gray-600">
              Population numbers say <em>how much</em>; this pipeline shows <em>where</em> and{' '}
              <em>why</em>. Post-monsoon (October–February) Sentinel-2 median composites for 2016
              and 2024 are differenced across five spectral indices, robust-z-normalised and
              combined with an ESRI-derived built-expansion mask (land-cover transition weighted
              0.40, NDBI gain 0.35), with reservoir artefacts excluded by a water mask.
            </p>
            <p className="text-gray-600">
              Scores are aggregated to a 1 km grid and non-maximum suppression selects the{' '}
              <strong>top five spatially distinct hotspots per district, 150 statewide</strong>.
              Each receives a full attribution record: its dominant land-cover transition, nearby
              drivers (a curated ~250-feature registry plus live OSM queries), a likely cause with
              a confidence score, and a settlement-type tag (residential, industrial, mining,
              transport). Every hotspot is re-fetched at native 10 m for visual verification.
            </p>
          </section>

          {/* ── Validation ── */}
          <section id="validation" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                7. Validation & Quality Assurance
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VALIDATION.map((v) => (
                <div
                  key={v.title}
                  className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-7 h-1 rounded-full bg-[#F76000] mb-3" />
                  <div className="text-xl font-black text-gray-900 mb-1">{v.stat}</div>
                  <div className="font-bold text-gray-900 text-xs md:text-sm mb-1.5">{v.title}</div>
                  <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Assumptions & Limitations ── */}
          <section id="assumptions" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                8. Assumptions & Limitations
              </h3>
            </div>
            <div className="bg-amber-50/40 border border-amber-200/60 p-6 rounded-2xl">
              <ul className="space-y-3.5">
                {LIMITATIONS.map((lim) => (
                  <li key={lim.label} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                    <div className="text-xs md:text-sm">
                      <strong className="text-gray-900">{lim.label}.</strong>{' '}
                      <span className="text-gray-600 leading-relaxed">{lim.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Technology ── */}
          <section id="technology" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                9. Technology & Reproducibility
              </h3>
            </div>
            <p className="text-gray-600 mb-5">
              The full pipeline is built on open-source software, with reproducibility engineered
              in: deterministic query caching, fixed random seeds, median compositing, and
              idempotent runs that produce byte-identical outputs. Extending to additional
              districts or states requires only new boundary, census-anchor, and area dictionaries.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Google Earth Engine',
                'Planetary Computer STAC',
                'Python (rasterio/rioxarray)',
                'CatBoost & LightGBM',
                'React & TypeScript',
                'MapLibre GL (COG & PMTiles)',
                'Recharts',
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-gray-100 hover:bg-[#FFF4EB] hover:text-[#F76000] border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* ── References ── */}
          <section id="references" className="scroll-mt-24 border-t border-gray-100 pt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <BookMarked className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">10. References</h3>
            </div>

            <ol className="space-y-4 text-xs md:text-sm text-gray-600 list-decimal pl-5">
              <li>
                Census of India 2011, Primary Census Abstract, Odisha. Office of the Registrar General & Census Commissioner, India.              </li>
              <li>
                WorldPop. <em>Global 2015–2030 Population Projections, R2025A v1</em>. School of Geography
                and Environmental Science, University of Southampton.{' '}
                <a
                  href="https://www.worldpop.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F76000] hover:underline inline-flex items-center gap-0.5"
                >
                  worldpop.org <ExternalLink className="w-3 h-3" />
                </a>
              </li>

              <li>
                European Commission JRC, GHS Settlement Model grid R2023A v2.0 (Schiavina, Freire, MacManus, 2023). {' '}
                <a
                  href="https://human-settlement.emergency.copernicus.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F76000] hover:underline inline-flex items-center gap-0.5"
                >
                  human-settlement.emergency.copernicus.eu <ExternalLink className="w-3 h-3" />
                </a>
              </li>

              <li>
                Eurostat, Food and Agriculture Organization of the United Nations (FAO), International Labour
                Organization (ILO), Organisation for Economic Co-operation and Development (OECD),
                United Nations Human Settlements Programme (UN-Habitat), and World Bank. (2020).{' '}
                <em>A harmonised definition of cities and rural areas: the Degree of Urbanisation (DEGURBA)</em>.
                Endorsed by the United Nations Statistical Commission.
              </li>

              <li>
                GADM. <em>Database of Global Administrative Areas (Version 4.1)</em>.{' '}
                <a
                  href="https://gadm.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F76000] hover:underline inline-flex items-center gap-0.5"
                >
                  gadm.org <ExternalLink className="w-3 h-3" />
                </a>
              </li>

              <li>
                European Space Agency (ESA) Copernicus. <em>Sentinel-2 Level-2A imagery</em>; U.S. Geological
                Survey (USGS). <em>Landsat Collection 2</em>; National Oceanic and Atmospheric Administration
                (NOAA). <em>Visible Infrared Imaging Radiometer Suite (VIIRS) Day/Night Band (DNB)</em>.
              </li>

              <li>
                Esri, Impact Observatory, and Microsoft. <em>Annual Land Use / Land Cover (10 m)</em>.{' '}
                <a
                  href="https://livingatlas.arcgis.com/landcover/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F76000] hover:underline inline-flex items-center gap-0.5"
                >
                  livingatlas.arcgis.com/landcover <ExternalLink className="w-3 h-3" />
                </a>
              </li>

              <li>
                OpenStreetMap contributors. <em>OpenStreetMap</em>.{' '}
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F76000] hover:underline inline-flex items-center gap-0.5"
                >
                  openstreetmap.org <ExternalLink className="w-3 h-3" />
                </a>
                . Additional “nearby drivers” indicators were derived from a curated feature registry and live
                OpenStreetMap-based spatial queries.
              </li>

              <li>
                Cloud Optimized GeoTIFF. <em>Cloud Optimized GeoTIFF (COG) Specification</em>.{' '}
                <a
                  href="https://www.cogeo.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F76000] hover:underline inline-flex items-center gap-0.5"
                >
                  cogeo.org <ExternalLink className="w-3 h-3" />
                </a>
              </li>

            </ol>
          </section>
        </main>
      </div>
    </PageWrapper>
  );
};

export default MethodologyPage;
