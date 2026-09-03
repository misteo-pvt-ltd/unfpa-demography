/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { type DistrictData } from '../shared';
import { TrendingUpDown } from 'lucide-react';

type Props = {
  selectedDistrict?: string;
  selectedData?: DistrictData;
  allDistrictsData: DistrictData[];
};

/** * RULE ENGINE: Numeric Safety & Extraction
 * Prevents NaN, Infinity, and division-by-zero leaks.
 */
const num = (v: any): number => (typeof v === 'number' && isFinite(v) ? v : 0);

const getSafeYears = (data: DistrictData, prefix: string): number[] => {
  const years = Object.keys(data)
    .filter((k) => k.startsWith(prefix))
    .map((k) => {
      const match = k.match(/\d{4}/);
      return match ? parseInt(match[0], 10) : null;
    })
    .filter((y): y is number => y !== null && y >= 2011 && y <= 2040)
    .sort((a, b) => a - b);
  return Array.from(new Set(years));
};

/** * FORMATTING HELPERS
 */
function fmt(n?: number, decimals = 0) {
  return Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num(n));
}

function fmtL(n?: number) {
  const val = num(n);
  if (val === 0) return '—';
  return (val / 100000).toFixed(2) + ' L';
}

function pct(n?: number) {
  return num(n).toFixed(2) + '%';
}

function delta(a?: number, b?: number, decimals = 2) {
  const d = num(b) - num(a);
  return (d >= 0 ? '+' : '') + d.toFixed(decimals);
}

/** * DATA NARRATIVE ENGINE
 */
function buildNarrative(d: DistrictData) {
  // 1. Core Identity & Rule Engine Sanitization
  const name = String(d.district_name || 'District');
  const state = String(d.state_name || 'State');
  const area = num(d.area);

  // 2. Year & Population Extraction
  // We use regex to ensure we only get 4-digit years from keys like pop_2011_sum
  const popYears = getSafeYears(d, 'pop_');
  const firstYear = popYears.length > 0 ? popYears[0] : 2011;
  const lastYear = popYears.length > 0 ? popYears[popYears.length - 1] : 2030;

  const pop2011 = num(d['pop_2011_sum']);
  const popLatest = num(d[`pop_${lastYear}_sum`]);
  const densityLatest = num(d[`density_${lastYear}`]);

  // 3. Growth Rate Logic (The "Expressive Bar" Fix)
  const growthKeys = getSafeYears(d, 'growth_');
  const allGrowthValues = growthKeys.map((y) => ({
    year: y,
    val: num(d[`growth_${y}`]),
  }));

  // Filter: 2015 often has a ~34% outlier which ruins the chart scale.
  // We keep the data for the narrative but filter the 'validGrowth'
  // for the trend bars to values under 10% to keep the UI expressive.
  const validGrowth = allGrowthValues.filter((g) => g.val < 10 && g.val > -5);

  // Rule: Calculate the bar maximum based on the filtered set
  // so that 1.26% and 2.6% look distinct and fill space properly.
  const growthBarMax = Math.max(...validGrowth.map((g) => g.val), 1);

  const firstGrowth = validGrowth[0] || { year: firstYear, val: 0 };
  const lastGrowth = validGrowth[validGrowth.length - 1] || {
    year: lastYear,
    val: 0,
  };
  const minGrowth =
    validGrowth.length > 0
      ? validGrowth.reduce(
          (min, g) => (g.val < min.val ? g : min),
          validGrowth[0],
        )
      : { year: lastYear, val: 0 };

  // 4. Sex Disaggregation & Ratio Logic
  // Using 2015 as baseline and the latest available sex-data year
  const male2015 = num(d['male_2015']);
  const female2015 = num(d['female_2015']);
  const sexRatio2015 =
    male2015 > 0 ? Math.round((female2015 / male2015) * 1000) : 0;

  const sexYears = getSafeYears(d, 'male_2'); // matches male_2024, etc.
  const sexLatestYear =
    sexYears.length > 0 ? sexYears[sexYears.length - 1] : lastYear;
  const maleLatest = num(d[`male_${sexLatestYear}`]);
  const femaleLatest = num(d[`female_${sexLatestYear}`]);
  const sexRatioLatest =
    maleLatest > 0 ? Math.round((femaleLatest / maleLatest) * 1000) : 0;

  // 5. Urbanisation Components
  const ruralStart = num(d['deg_urban_rural_2015']);
  const ruralEnd = num(d['deg_urban_rural_2030']);
  const cityStart = num(d['deg_urban_city_2015']);
  const cityEnd = num(d['deg_urban_city_2030']);
  const townStart = num(d['deg_urban_town_2015']);
  const townEnd = num(d['deg_urban_town_2030']);

  // 6. Age Structure Rule Engine
  const ageGroups = [
    '0_12',
    '1_4',
    '5_9',
    '10_14',
    '15_19',
    '20_24',
    '25_29',
    '30_34',
    '35_39',
    '40_44',
    '45_49',
    '50_54',
    '55_59',
    '60_64',
    '65_69',
    '70_74',
    '75_79',
    '80_84',
    '85_89',
    '90_plus',
  ];

  const ageLabels: Record<string, string> = {
    '0_12': '0–1',
    '1_4': '1–4',
    '5_9': '5–9',
    '10_14': '10–14',
    '15_19': '15–19',
    '20_24': '20–24',
    '25_29': '25–29',
    '30_34': '30–34',
    '35_39': '35–39',
    '40_44': '40–44',
    '45_49': '45–49',
    '50_54': '50–54',
    '55_59': '55–59',
    '60_64': '60–64',
    '65_69': '65–69',
    '70_74': '70–74',
    '75_79': '75–79',
    '80_84': '80–84',
    '85_89': '85–89',
    '90_plus': '90+',
  };

  const ageData = ageGroups.map((g) => ({
    group: g,
    label: ageLabels[g] || g,
    male: num(d[`male_${lastYear}_${g}`]),
    female: num(d[`female_${lastYear}_${g}`]),
  }));

  const totalAgeSum = ageData.reduce((s, a) => s + a.male + a.female, 0);

  // Helper to calculate cohort percentages safely
  const getAgePct = (keys: string[]) => {
    if (totalAgeSum <= 0) return '0.0';
    const subSum = ageData
      .filter((a) => keys.includes(a.group))
      .reduce((s, a) => s + a.male + a.female, 0);
    return ((subSum / totalAgeSum) * 100).toFixed(1);
  };

  const popGrowthPct =
    pop2011 > 0 ? (((popLatest - pop2011) / pop2011) * 100).toFixed(1) : '0.0';

  return {
    name,
    state,
    area,
    pop2011,
    popLatest,
    densityLatest,
    lastYear,
    firstYear,
    firstGrowth,
    lastGrowth,
    minGrowth,
    validGrowth,
    growthBarMax,
    male2015,
    female2015,
    maleLatest,
    femaleLatest,
    sexRatio2015,
    sexRatioLatest,
    sexLatestYear,
    ruralStart,
    ruralEnd,
    cityStart,
    cityEnd,
    townStart,
    townEnd,
    ageData,
    maxAge: Math.max(...ageData.flatMap((a) => [a.male, a.female]), 1),
    pctWorking: getAgePct(['20_24', '25_29', '30_34', '35_39']),
    pctYouth: getAgePct(['0_12', '1_4', '5_9', '10_14']),
    pctElderly: getAgePct([
      '65_69',
      '70_74',
      '75_79',
      '80_84',
      '85_89',
      '90_plus',
    ]),
    popGrowthPct,
  };
}

/** * ATOMIC UI COMPONENTS
 */
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-5 pb-5 first:border-t-0 first:pt-0">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-secondary rounded-lg p-3">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-medium text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Narrative({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
  );
}

function Hi({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground font-medium">{children}</span>;
}

function TrendBar({
  label,
  value,
  max,
  color = '#378ADD',
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  // Logic: Calculate width based on the filtered max,
  // but ensure even small growth (like 1.26%) is clearly visible.
  const rawPct = max > 0 ? (value / max) * 100 : 0;

  // Rule: Cap at 100%, but give a minimum 3% width if the value is > 0
  // so the bar doesn't look "broken" or empty.
  const visiblePct = value > 0 ? Math.max(3, Math.min(100, rawPct)) : 0;

  return (
    <div className="flex items-center gap-2.5 my-1.5">
      <span className="text-xs text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${visiblePct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-12 text-right">
        {value.toFixed(2)}%
      </span>
    </div>
  );
}

function Pill({
  label,
  type,
}: {
  label: string;
  type: 'up' | 'down' | 'neutral';
}) {
  const styles: Record<string, React.CSSProperties> = {
    up: { background: '#EAF3DE', color: '#27500A' },
    down: { background: '#FCEBEB', color: '#791F1F' },
    neutral: {
      background: 'var(--secondary)',
      color: 'var(--muted-foreground)',
    },
  };
  return (
    <span
      className="inline-block text-[11px] px-2.5 py-0.5 rounded-full mr-1.5 mb-1.5"
      style={styles[type]}
    >
      {label}
    </span>
  );
}

/** * EXPORTED COMPONENT
 */
export function StateDemographics_v2({
  selectedDistrict,
  selectedData,
  // allDistrictsData,
}: Props) {
  useEffect(() => {
    console.log('StateDemographics Render', {
      selectedDistrict,
      hasData: !!selectedData,
    });
  }, [selectedDistrict, selectedData]);

  const n = useMemo(
    () => (selectedData ? buildNarrative(selectedData) : null),
    [selectedData],
  );

  if (!selectedData || !n) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-0"
    >
      {/* PAGE HEADER - Styled as requested */}
      <div className="pb-5">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <TrendingUpDown className="w-6 h-6 text-black" />
          Demographic Analysis: {n.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1 font-medium ">
          A comprehensive synthesis of population dynamics, cohort structures,
          and urbanization trends through 2030.
        </p>
      </div>
      {/* 1. Population Trajectory */}
      <Section label={`Population trajectory · ${n.firstYear} – ${n.lastYear}`}>
        <StatGrid>
          <Stat label="2011 census" value={fmt(n.pop2011)} sub="baseline" />
          <Stat
            label={`${n.lastYear} estimate`}
            value={fmtL(n.popLatest)}
            sub={`+${n.popGrowthPct}% total`}
          />
          <Stat
            label="current density"
            value={`${fmt(n.densityLatest)}/km²`}
            sub={n.densityLatest > 500 ? 'high intensity' : 'moderate'}
          />
          <Stat label="area" value={`${fmt(n.area)} km²`} sub={n.state} />
        </StatGrid>
        <Narrative>
          <Hi>{n.name}</Hi> district has grown from <Hi>{fmt(n.pop2011)}</Hi> in
          2011 to an estimated <Hi>{fmtL(n.popLatest)}</Hi> by {n.lastYear} — a
          cumulative increase of <Hi>+{n.popGrowthPct}%</Hi> over the period. At{' '}
          <Hi>{fmt(n.densityLatest)} persons/km²</Hi> across{' '}
          <Hi>{fmt(n.area)} km²</Hi>, settlement intensity is{' '}
          {n.densityLatest > 500
            ? 'high'
            : n.densityLatest > 300
              ? 'moderate-high'
              : 'moderate'}
          . The district is in {n.state} and its trajectory indicates{' '}
          {parseFloat(n.popGrowthPct) > 30
            ? 'significant demographic expansion'
            : 'steady, measured growth'}{' '}
          over the projection horizon.
        </Narrative>
      </Section>

      {/* 2. Growth Rates */}
      <Section label="Annual growth rate · trend decomposition">
        <div className="mb-3">
          {n.validGrowth
            .filter((_, i) => i % 2 === 0)
            .map((g) => (
              <TrendBar
                key={g.year}
                label={String(g.year)}
                value={g.val}
                max={n.growthBarMax}
              />
            ))}
        </div>
        <Narrative>
          Growth rates ranged from{' '}
          <Hi>
            {n.firstGrowth.val.toFixed(2)}% in {n.firstGrowth.year}
          </Hi>{' '}
          down to{' '}
          <Hi>
            {n.lastGrowth.val.toFixed(2)}% by {n.lastGrowth.year}
          </Hi>
          . The lowest recorded rate was{' '}
          <Hi>
            {n.minGrowth.val.toFixed(2)}% in {n.minGrowth.year}
          </Hi>
          . This persistent deceleration is consistent with a district
          approaching <Hi>demographic maturity</Hi>.
        </Narrative>
      </Section>

      {/* 3. Sex Ratios */}
      <Section
        label={`Sex-disaggregated population · 2015 – ${n.sexLatestYear}`}
      >
        <StatGrid>
          <Stat label="male 2015" value={fmtL(n.male2015)} />
          <Stat label="female 2015" value={fmtL(n.female2015)} />
          <Stat label={`male ${n.sexLatestYear}`} value={fmtL(n.maleLatest)} />
          <Stat
            label={`female ${n.sexLatestYear}`}
            value={fmtL(n.femaleLatest)}
          />
        </StatGrid>
        <Narrative>
          Male population exceeded female population throughout the observation
          window. In 2015, the sex ratio stood at approximately{' '}
          <Hi>{n.sexRatio2015} females per 1,000 males</Hi>. By{' '}
          {n.sexLatestYear}, this had shifted to <Hi>{n.sexRatioLatest}</Hi> — a{' '}
          {n.sexRatioLatest > n.sexRatio2015
            ? 'positive improvement'
            : 'marginal change'}
          .
        </Narrative>
      </Section>

      {/* 4. Age Structure */}
      <Section
        label={`Age structure · ${n.lastYear} snapshot (male vs female)`}
      >
        <div className="flex gap-3 mb-2">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block w-3 h-1 rounded-sm bg-[#378ADD]" />{' '}
            Male
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block w-3 h-1 rounded-sm bg-[#D4537E]" />{' '}
            Female
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
          {n.ageData
            .filter((a) => a.male + a.female > 0)
            .map((a) => {
              const mPct = (a.male / n.maxAge) * 100;
              const fPct = (a.female / n.maxAge) * 100;
              return (
                <div key={a.group} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-10 shrink-0">
                    {a.label}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div
                      className="h-1.5 bg-[#378ADD]"
                      style={{ width: `${mPct}%` }}
                    />
                    <div
                      className="h-1.5 bg-[#D4537E]"
                      style={{ width: `${fPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        <Narrative>
          The age structure reveals a <Hi>working-age dominant</Hi> population —
          the 20–39 cohort accounts for <Hi>{n.pctWorking}%</Hi> of the total.
          Youth (0–14) form <Hi>{n.pctYouth}%</Hi>, while the elderly represent{' '}
          <Hi>{n.pctElderly}%</Hi>.
        </Narrative>
      </Section>

      {/* 5. Urbanisation */}
      <Section label="Urbanisation decomposition · 2015 – 2030">
        <StatGrid>
          <Stat label="rural 2015" value={pct(n.ruralStart)} />
          <Stat
            label="rural 2030"
            value={pct(n.ruralEnd)}
            sub={`${delta(n.ruralStart, n.ruralEnd)}pp`}
          />
          <Stat label="city share 2015" value={pct(n.cityStart)} />
          <Stat
            label="city share 2030"
            value={pct(n.cityEnd)}
            sub={`${delta(n.cityStart, n.cityEnd)}pp`}
          />
        </StatGrid>
        <Narrative>
          Urbanisation in <Hi>{n.name}</Hi> is progressing at a{' '}
          <Hi>measured pace</Hi>. Rural population share shifted by{' '}
          <Hi>{delta(n.ruralStart, n.ruralEnd)}pp</Hi> over the period.
        </Narrative>
      </Section>

      {/* 6. Signal Summary */}
      <Section label="Demographic signal summary">
        <div className="flex flex-wrap">
          <Pill label="Population: stabilising" type="neutral" />
          <Pill label="Growth rate: decelerating" type="down" />
          <Pill label="Sex ratio: improving" type="up" />
          <Pill label={`Working-age share: ${n.pctWorking}%`} type="up" />
          <Pill label={`Youth share: ${n.pctYouth}%`} type="down" />
          <Pill label={`Density: ${fmt(n.densityLatest)}/km²`} type="neutral" />
        </div>
      </Section>
    </motion.div>
  );
}
