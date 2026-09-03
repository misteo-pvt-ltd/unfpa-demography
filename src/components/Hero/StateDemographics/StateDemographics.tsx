'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { type DistrictData } from '../shared';

type Props = {
  selectedDistrict?: string;
  selectedData?: DistrictData;
  allDistrictsData: DistrictData[];
};

function fmt(n?: number, decimals = 0) {
  if (n == null || isNaN(n)) return '—';
  return Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtL(n?: number) {
  if (!n) return '—';
  return (n / 100000).toFixed(2) + ' L';
}

function pct(n?: number) {
  if (n == null) return '—';
  return n.toFixed(2) + '%';
}

function delta(a?: number, b?: number, decimals = 2) {
  if (a == null || b == null) return '—';
  const d = b - a;
  return (d >= 0 ? '+' : '') + d.toFixed(decimals);
}

// function trend(val?: number): 'up' | 'down' | 'flat' {
//   if (val == null) return 'flat';
//   return val > 0 ? 'up' : val < 0 ? 'down' : 'flat';
// }

function getYears(data: DistrictData, prefix: string): number[] {
  return Object.keys(data)
    .filter((k) => k.startsWith(prefix) && /\d{4}$/.test(k))
    .map((k) => parseInt(k.slice(-4)))
    .filter((y) => !isNaN(y))
    .sort((a, b) => a - b);
}

function buildNarrative(data: DistrictData) {
  const d = data;
  const name = d.district_name as string;
  const state = d.state_name as string;
  const area = d.area as number;

  const popYears = getYears(d, 'pop_');
  const firstYear = Math.min(...popYears);
  const lastYear = Math.max(...popYears);

  const pop2011 = (d['pop_2011_sum'] as number) || 0;
  const popLatest = (d[`pop_${lastYear}_sum`] as number) || 0;
  const densityLatest = (d[`density_${lastYear}`] as number) || 0;

  // --- FIX 1: Growth Rate anomalies ---
  const growthYears = getYears(d, 'growth_');
  const growthValues = growthYears.map((y) => ({
    year: y,
    val: d[`growth_${y}`] as number,
  }));

  // Filter out Infinity, NaN, and extreme outliers (e.g., > 100% growth)
  const validGrowth = growthValues.filter(
    (g) => g.val != null && isFinite(g.val) && g.val < 20 && g.val > -5,
  );

  const firstGrowth = validGrowth[0];
  const lastGrowth = validGrowth[validGrowth.length - 1];
  const minGrowth =
    validGrowth.length > 0
      ? validGrowth.reduce(
          (min, g) => (g.val < min.val ? g : min),
          validGrowth[0],
        )
      : null;

  // --- FIX 2: Sex Ratio Division by Zero ---
  const sexYears = getYears(d, 'male_2').filter((y) => y >= 2015 && y <= 2030);
  const currentSexYear = sexYears[sexYears.length - 1] || 2026;

  const maleLatest = (d[`male_${currentSexYear}`] as number) || 0;
  const femaleLatest = (d[`female_${currentSexYear}`] as number) || 0;

  // Prevent Infinity by checking if maleLatest > 0
  const sexRatioLatest =
    maleLatest > 0 ? Math.round((femaleLatest / maleLatest) * 1000) : 0;

  const male2015 = (d['male_2015'] as number) || 0;
  const female2015 = (d['female_2015'] as number) || 0;
  const sexRatio2015 =
    male2015 > 0 ? Math.round((female2015 / male2015) * 1000) : 0;

  // --- Urbanisation checks ---
  const ruralStart = (d['deg_urban_rural_2015'] as number) || 0;
  const ruralEnd = (d['deg_urban_rural_2030'] as number) || 0;
  const cityStart = (d['deg_urban_city_2015'] as number) || 0;
  const cityEnd = (d['deg_urban_city_2030'] as number) || 0;
  const townStart = (d['deg_urban_town_2015'] as number) || 0;
  const townEnd = (d['deg_urban_town_2030'] as number) || 0;

  // --- Age Structure & Percentage Checks ---
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
    /* ... your labels ... */
  };

  const latestAgeYear = (() => {
    for (let y = 2030; y >= 2015; y--) {
      if (d[`male_${y}_20_24`] != null) return y;
    }
    return 2026;
  })();

  const ageData = ageGroups.map((g) => ({
    group: g,
    label: ageLabels[g] || g,
    male: (d[`male_${latestAgeYear}_${g}`] as number) ?? 0,
    female: (d[`female_${latestAgeYear}_${g}`] as number) ?? 0,
  }));

  const maxAge = Math.max(...ageData.flatMap((a) => [a.male, a.female]), 1); // 1 prevents div by zero

  const totalAgeSum = ageData.reduce((s, a) => s + a.male + a.female, 0);
  const getAgePct = (groups: string[]) => {
    if (totalAgeSum <= 0) return '0.0';
    const sum = ageData
      .filter((a) => groups.includes(a.group))
      .reduce((s, a) => s + a.male + a.female, 0);
    return ((sum / totalAgeSum) * 100).toFixed(1);
  };

  const pctWorking = getAgePct(['20_24', '25_29', '30_34', '35_39']);
  const pctYouth = getAgePct(['0_12', '1_4', '5_9', '10_14']);
  const pctElderly = getAgePct([
    '65_69',
    '70_74',
    '75_79',
    '80_84',
    '85_89',
    '90_plus',
  ]);

  // --- FIX 3: Baseline Population Check ---
  const popGrowthPct =
    pop2011 > 0 ? (((popLatest - pop2011) / pop2011) * 100).toFixed(1) : '0.0';

  const growthBarMax = Math.max(...validGrowth.map((g) => g.val), 1);

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
    sexLatestYear: currentSexYear,
    ruralStart,
    ruralEnd,
    cityStart,
    cityEnd,
    townStart,
    townEnd,
    ageData,
    latestAgeYear,
    maxAge,
    pctWorking,
    pctYouth,
    pctElderly,
    popGrowthPct,
  };
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
    neutral: {},
  };
  return (
    <span
      className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full mr-1.5 mb-1.5 ${type === 'neutral' ? 'bg-secondary text-muted-foreground' : ''}`}
      style={styles[type]}
    >
      {label}
    </span>
  );
}

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
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 my-1.5">
      <span className="text-xs text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-1 rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-12 text-right">
        {value.toFixed(2)}%
      </span>
    </div>
  );
}

export function StateDemographics({
  selectedDistrict,
  selectedData,
  allDistrictsData,
}: Props) {
  useEffect(() => {
    console.log('StateDemographics', {
      selectedDistrict,
      total: allDistrictsData.length,
    });
  }, [selectedDistrict, selectedData, allDistrictsData]);

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
      {/* Population trajectory */}
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

      {/* Growth rate deceleration */}
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
          Growth rates — after filtering anomalous readings — ranged from{' '}
          <Hi>
            {n.firstGrowth?.val.toFixed(2)}% in {n.firstGrowth?.year}
          </Hi>{' '}
          down to{' '}
          <Hi>
            {n.lastGrowth?.val.toFixed(2)}% by {n.lastGrowth?.year}
          </Hi>
          . The lowest recorded rate was{' '}
          <Hi>
            {n.minGrowth?.val.toFixed(2)}% in {n.minGrowth?.year}
          </Hi>
          . This persistent deceleration is consistent with a district
          approaching <Hi>demographic maturity</Hi> — fertility decline
          outpacing in-migration. The trend implies the district's natural
          increase will continue compressing toward the <Hi>0.5–0.6%</Hi> band
          through 2036.
        </Narrative>
      </Section>

      {/* Sex-disaggregated */}
      <Section
        label={`Sex-disaggregated population · 2015 – ${n.sexLatestYear}`}
      >
        <StatGrid>
          <Stat
            label="male 2015"
            value={fmtL(n.male2015)}
            sub={
              n.male2015 && n.female2015
                ? `${((n.male2015 / (n.male2015 + n.female2015)) * 100).toFixed(1)}% share`
                : ''
            }
          />
          <Stat
            label="female 2015"
            value={fmtL(n.female2015)}
            sub={
              n.male2015 && n.female2015
                ? `${((n.female2015 / (n.male2015 + n.female2015)) * 100).toFixed(1)}% share`
                : ''
            }
          />
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
          {n.sexRatioLatest &&
          n.sexRatio2015 &&
          n.sexRatioLatest > n.sexRatio2015
            ? 'positive improvement'
            : 'marginal change'}
          , suggesting gradual equalisation consistent with improved female
          survival rates and declining gender-biased outcomes.
        </Narrative>
      </Section>

      {/* Age structure */}
      <Section
        label={`Age structure · ${n.latestAgeYear} snapshot (male vs female)`}
      >
        <div className="flex gap-3 mb-2">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="inline-block w-3 h-1 rounded-sm"
              style={{ background: '#378ADD' }}
            />
            Male
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="inline-block w-3 h-1 rounded-sm"
              style={{ background: '#D4537E' }}
            />
            Female
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
          {n.ageData
            .filter((a) => a.male + a.female > 0)
            .map((a) => {
              const mPct = n.maxAge ? Math.round((a.male / n.maxAge) * 100) : 0;
              const fPct = n.maxAge
                ? Math.round((a.female / n.maxAge) * 100)
                : 0;
              return (
                <div key={a.group} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-10 shrink-0">
                    {a.label}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div
                      className="h-1.5 rounded-none"
                      style={{ width: `${mPct}%`, background: '#378ADD' }}
                    />
                    <div
                      className="h-1.5 rounded-none"
                      style={{ width: `${fPct}%`, background: '#D4537E' }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        <Narrative>
          The {n.latestAgeYear} age structure reveals a{' '}
          <Hi>working-age dominant</Hi> population — the 20–39 cohort accounts
          for approximately <Hi>{n.pctWorking}%</Hi> of the district's
          population, representing an active{' '}
          <Hi>demographic dividend window</Hi>. Youth (0–14) form{' '}
          <Hi>{n.pctYouth}%</Hi> of the total, a share that is contracting
          across years, indicating <Hi>fertility decline</Hi>. The elderly (65+)
          represent <Hi>{n.pctElderly}%</Hi> — a share that will rise as the
          working-age bulge ages through the 2030s. Above age 70, female cohorts
          begin to exceed male cohorts, reflecting the universal{' '}
          <Hi>female longevity advantage</Hi>.
        </Narrative>
      </Section>

      {/* Urbanisation */}
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
        <div className="mb-3">
          {[2015, 2018, 2021, 2024, 2027, 2030].map((y) => {
            const r = selectedData[`deg_urban_rural_${y}`] as number;
            const c = selectedData[`deg_urban_city_${y}`] as number;
            if (!r) return null;
            return (
              <div key={y}>
                <TrendBar
                  label={`${y} rural`}
                  value={r}
                  max={40}
                  color="#888780"
                />
                <TrendBar
                  label={`${y} city`}
                  value={c}
                  max={40}
                  color="#378ADD"
                />
              </div>
            );
          })}
        </div>
        <Narrative>
          Urbanisation in <Hi>{n.name}</Hi> is progressing at a{' '}
          <Hi>measured pace</Hi>. Rural population share declined from{' '}
          <Hi>{pct(n.ruralStart)}</Hi> in 2015 to a projected{' '}
          <Hi>{pct(n.ruralEnd)}</Hi> by 2030 — a shift of{' '}
          <Hi>{delta(n.ruralStart, n.ruralEnd)}pp</Hi> over 15 years. City share
          grew from <Hi>{pct(n.cityStart)}</Hi> to <Hi>{pct(n.cityEnd)}</Hi>,
          while town share moved from <Hi>{pct(n.townStart)}</Hi> to{' '}
          <Hi>{pct(n.townEnd)}</Hi>. This pattern is characteristic of an{' '}
          <Hi>industrial district</Hi> absorbing incremental migration without
          experiencing the rapid urbanisation seen in service-economy hubs.
        </Narrative>
      </Section>

      {/* Signal pills */}
      <Section label="Demographic signal summary">
        <div className="flex flex-wrap">
          <Pill label="Population: stabilising" type="neutral" />
          <Pill label="Growth rate: decelerating" type="down" />
          <Pill label="Sex ratio: improving" type="up" />
          <Pill
            label={`Urbanisation: gradual (${delta(n.ruralStart, n.ruralEnd)}pp rural shift)`}
            type="neutral"
          />
          <Pill label={`Working-age share: ${n.pctWorking}%`} type="up" />
          <Pill label={`Youth share: ${n.pctYouth}% (declining)`} type="down" />
          <Pill
            label={`Elderly share: ${n.pctElderly}% (rising)`}
            type="neutral"
          />
          <Pill label={`Density: ${fmt(n.densityLatest)}/km²`} type="neutral" />
        </div>
      </Section>
    </motion.div>
  );
}
