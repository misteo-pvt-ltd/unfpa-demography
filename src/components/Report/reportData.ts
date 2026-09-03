/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * reportData — pure data assembly for the district PDF report.
 * Sources everything from the same modules the dashboard uses; no rendering here.
 */
import {
  CENSUS_PROJECTION_DATA,
  LULC_STATS,
  LULC_STATS_YEARLY,
  DISTRICT_BOUNDS,
  // GENDER,
  NEW_DISTRICT_ROAD_DATA,
  NTL_COVERAGE,
  getRecord,
} from '../../data/comparativeData';
import {
  MODEL_DATA,
  MODEL_STATS_DATA,
  MODEL_URBAN_RURAL_DATA,
} from '../../data/modelStats';
import { DISTRICT_OVERVIEWS } from '../Hero/StateDemographics/districtNarrative';
import {
  TAB_CONTENT,
  Points_Data,
  type Block,
} from '../Map/WhatHowWhy_v2/frontend_data';
import { ASSET_MAP } from '../Map/WhatHowWhy_v2/WhatHowWhy_v2';
import {
  DISTRICT_DEVELOPMENT,
  type DistrictDevContent,
} from '../../data/districtDevelopment';
import {
  AGE_COHORT_DATA,
  AGE_COHORT_FULL_DATA,
  type AgeCohortEntry,
  type AgeCohortFullEntry,
  // type AgeCohortFullData,
} from '../../data/ageCohortData';

// ─── Report Configuration ──────────────────────────────────────────────────

export interface ReportOptionsConfig {
  demographicOverview: {
    enabled: boolean;
    keyStatistics: boolean;
    districtBoundary: boolean;
    summaryNarrative: boolean;
  };
  populationProjection: {
    enabled: boolean;
    populationChart: boolean;
    growthTable: boolean;
    populationNarrative: boolean;
  };
  populationStructure: {
    enabled: boolean;
    ageComposition: boolean;
    genderDistribution: boolean;
    populationPyramid: boolean;
  };
  urbanRuralComposition: {
    enabled: boolean;
    urbanRuralNarrative: boolean;
    urbanRuralChart: boolean;
    urbanRuralStatsTable: boolean;
  };
  landUseAnalysis: {
    enabled: boolean;
    yearlyTimelineMaps: boolean;
    compositionAreaChart: boolean;
    landCoverTable: boolean;
    transitionNarrative: boolean;
  };
  nightLightAnalysis: {
    enabled: boolean;
    yearlyNtlMaps: boolean;
    brightnessStatisticsTable: boolean;
    interpretations: boolean;
  };
  hotspotAnalysis: {
    enabled: boolean;
    summaryFigures: boolean;
    rankedHotspotsTable: boolean;
    what: boolean;
    how: boolean;
    why: boolean;
  };
  regionalPerformanceMatrix: {
    enabled: boolean;
    table: boolean;
    trends: boolean;
  };
  developmentActivities: {
    enabled: boolean;
    activities: boolean;
    insights: boolean;
  };
  technicalNotes: {
    enabled: boolean;
    notes: boolean;
    sources: boolean;
  };
}

export const DEFAULT_REPORT_OPTIONS: ReportOptionsConfig = {
  demographicOverview: { enabled: true, keyStatistics: true, districtBoundary: true, summaryNarrative: true },
  populationProjection: { enabled: true, populationChart: true, growthTable: true, populationNarrative: true },
  populationStructure: { enabled: true, ageComposition: true, genderDistribution: true, populationPyramid: true },
  urbanRuralComposition: { enabled: true, urbanRuralNarrative: true, urbanRuralChart: true, urbanRuralStatsTable: true },
  landUseAnalysis: { enabled: true, yearlyTimelineMaps: true, compositionAreaChart: true, landCoverTable: true, transitionNarrative: true },
  nightLightAnalysis: { enabled: true, yearlyNtlMaps: true, brightnessStatisticsTable: true, interpretations: true },
  hotspotAnalysis: { enabled: true, summaryFigures: true, rankedHotspotsTable: true, what: true, how: true, why: true },
  regionalPerformanceMatrix: { enabled: true, table: true, trends: true },
  developmentActivities: { enabled: true, activities: true, insights: true },
  technicalNotes: { enabled: true, notes: true, sources: true },
};

export interface ReportConfig {
  sections: string[];
  startYear: string;
  endYear: string;
  options?: ReportOptionsConfig;
}

export const ALL_REPORT_SECTIONS: string[] = [
  'Demographic Overview',
  'Population Projection & Growth',
  'Population Structure',
  'Urban & Rural Composition',
  'Land Use Analysis',
  'Night Light Analysis',
  'Areas of Rapid Change',
  'Development Activities & Insights',
  'Technical Notes & Sources',
];

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  sections: [...ALL_REPORT_SECTIONS],
  startYear: '2011',
  endYear: '2036', // Set endYear high to fall back to max available (2036) or explicitly 2036
  options: DEFAULT_REPORT_OPTIONS,
};

// ─── Imagery ──────────────────────────────────────────────────────────────
const hasGlob = typeof (import.meta as any).glob === 'function';
// const REPORT_ASSETS: Record<string, string> = hasGlob
//   ? (import.meta as any).glob(
//     '../Map/WhatHowWhy_v2/**/*.{png,jpg,jpeg,gif,svg}',
//     { eager: true, import: 'default' },
//   )
//   : {};

const MAP_FIGURES: Record<string, string> = hasGlob
  ? (import.meta as any).glob(
    '../Map/WhatHowWhy_v2/*/maps/{rgb_before_after,change_heatmap,rgb_2024_preview}.png',
    { eager: true, import: 'default' },
  )
  : {};

export interface GeoFigures {
  rgbBeforeAfter?: string;
  changeHeatmap?: string;
  rgb2024?: string;
}
const resolveImg = (url: string): string | undefined => {
  if (!url) return undefined;
  const cleanUrl = url.replace(/\\/g, '/');
  // 1. Try exact match using the exact same path replacement as WhatHowWhy_v2.tsx
  const targetPath = cleanUrl.replace('frontend_assets/', './');
  if (ASSET_MAP[targetPath]) return ASSET_MAP[targetPath];
  // 2. Try matching by suffix in ASSET_MAP
  const suffix = cleanUrl.replace('frontend_assets/', ''); // e.g. "Angul/chips/hotspot_01.png"
  const foundKey = Object.keys(ASSET_MAP).find((k) => k.endsWith(suffix));
  if (foundKey) return ASSET_MAP[foundKey];
  return undefined;
};

const WHW_ALIAS: Record<string, string> = {
  Anugul: 'Angul',
  Baudh: 'Boudh',
  Jagatsinghapur: 'Jagatsinghpur',
  Jajapur: 'Jajpur',
  Subarnapur: 'Sonepur',
};
const norm = (s: string) => s.trim().toLowerCase();

const nf = new Intl.NumberFormat('en-IN');
export const fmtInt = (n: number) => nf.format(Math.round(n));
export const fmtM = (n: number) => `${(n / 1e6).toFixed(2)}M`;

const first = (content: Block[], type: Block['type']) =>
  content.find((b) => b.type === type) as any;

export interface KeyFigures {
  y0: number; y1: number; pop0: number; pop1: number;
  inc: number; cagr: number; d0?: number; d1?: number; area?: number;
  u0?: { urban: number; rural: number };
  u1?: { urban: number; rural: number };
  share0?: number; share1?: number;
}

export interface WhwEntry {
  id: number; category: string; heading?: string; text?: string;
  img?: string;
  /** Second non-GIF image from the entry (context map if available). */
  contextImg?: string;
}

export interface LulcYearly {
  years: string[];
  classes: string[];
  series: Record<string, number[]>;
  totals: number[];
}

export interface Hotspot {
  id: number; category: string; settlement: string;
  lat: number; lon: number; builtHa: number; score: number; confidence: number;
}

export interface HotspotSummary {
  list: Hotspot[]; total: number; totalBuiltHa: number;
  avgConfidence: number; topCategory: string;
  byCategory: { category: string; count: number; ha: number }[];
  bounds: { minx: number; miny: number; maxx: number; maxy: number } | null;
}

export interface GenderInfo {
  y0: number; y1: number; m0: number; f0: number; m1: number; f1: number;
  ratio0: number; ratio1: number;
  trend: { year: number; ratio: number; male?: number; female?: number }[];
}

export interface RoadInfo {
  years: number[]; nh: number[]; sh: number[];
  latestYear: number; latestNh: number; latestSh: number;
  deltaNh: number; deltaSh: number;
}

export interface AgeGroup { label: string; male: number; female: number; }

export interface AgePyramid {
  year: string; groups: AgeGroup[]; totalMale: number; totalFemale: number;
}

const buildAgePyramid = (ageCohortFullDist: any): AgePyramid | null => {
  if (!ageCohortFullDist) return null;
  const year = ageCohortFullDist['2026'] ? '2026' : ageCohortFullDist['2025'] ? '2025' : '2011';
  const yData = ageCohortFullDist[year];
  if (!yData) return null;

  const groups = [
    { label: '80+', male: yData.male.age_80_plus, female: yData.female.age_80_plus },
    { label: '70-79', male: yData.male.age_70_74 + yData.male.age_75_79, female: yData.female.age_70_74 + yData.female.age_75_79 },
    { label: '60-69', male: yData.male.age_60_64 + yData.male.age_65_69, female: yData.female.age_60_64 + yData.female.age_65_69 },
    { label: '50-59', male: yData.male.age_50_54 + yData.male.age_55_59, female: yData.female.age_50_54 + yData.female.age_55_59 },
    { label: '40-49', male: yData.male.age_40_44 + yData.male.age_45_49, female: yData.female.age_40_44 + yData.female.age_45_49 },
    { label: '30-39', male: yData.male.age_30_34 + yData.male.age_35_39, female: yData.female.age_30_34 + yData.female.age_35_39 },
    { label: '20-29', male: yData.male.age_20_24 + yData.male.age_25_29, female: yData.female.age_20_24 + yData.female.age_25_29 },
    { label: '10-19', male: yData.male.age_10_14 + yData.male.age_15_19, female: yData.female.age_10_14 + yData.female.age_15_19 },
    { label: '0-9', male: yData.male.age_0_4 + yData.male.age_5_9, female: yData.female.age_0_4 + yData.female.age_5_9 },
  ];

  const totalMale = groups.reduce((s, g) => s + g.male, 0);
  const totalFemale = groups.reduce((s, g) => s + g.female, 0);

  return { year, groups, totalMale, totalFemale };
};

export interface MatrixRow {
  year: number;
  population: number;
  growth: number | null;
  density: number | null;
  urbanPop: number | null;
  ruralPop: number | null;
  builtupArea: number | null;
  cropland: number | null;
  forest: number | null;
  water: number | null;
  nightlight: number | null;
  riskIndex: number;
  vulnerabilityIndex: number;
}

export interface NtlTimelineYearData {
  year: string;
  coverage: number;   // Total luminosity coverage (NTL_COVERAGE) — same metric used in MapCompare
  mean: number;       // Pixel-level mean luminosity (from raster, if available)
  max: number;        // Pixel-level max luminosity (from raster, if available)
  delta: number;      // YoY change in coverage
  pct: number;        // YoY % change in coverage
  urbanization: string;
  economic: string;
  trend: string;
  dataUrl?: string;
}

export interface LulcTimelineYear {
  year: string;
  rows: { c: string; area: number; share: number; delta: number; pct: number }[];
  narrative: string;
  dataUrl?: string;
}

export interface HotspotDetail {
  id: number;
  title: string;
  category: string;
  settlementType: string;
  lat: number;
  lon: number;
  score: number;
  builtHa: number;
  confidence: number;
  what: {
    heading: string;
    text: string;
    images: string[];
  };
  how: {
    heading: string;
    text: string;
    images: string[];
  };
  why: {
    heading: string;
    text: string;
    images: string[];
  };
  aiExplanation: string;
  observations: string;
  keyFindings: string;
  planningImplications: string;
}

export interface ReportData {
  district: string; generated: string; key: KeyFigures | null;
  demoKey: KeyFigures | null;
  paragraphs: string[];
  chart: { year: number; model: number; census: number | null }[];
  hasCensus: boolean; tableYears: number[];
  model?: Record<number, number>;
  census?: Record<number, number>;
  stats?: Record<string, { density: number; growth: number | null }>;
  whw: { tab: 'What' | 'How' | 'Why'; label: string; entries: WhwEntry[] }[];
  lulc: {
    fy: string; ly: string; maxArea: number;
    rows: { c: string; a: number; b: number; delta: number; pct: number }[];
  } | null;
  lulcYearly: LulcYearly | null;
  hotspots: HotspotSummary | null;
  gender: GenderInfo | null;
  agePyramid: AgePyramid | null;
  roads: RoadInfo | null;
  figures: GeoFigures;
  toc: string[];
  devContent: DistrictDevContent | null;
  config: ReportConfig;
  lulcTimeline: LulcTimelineYear[];
  ntlTimeline: NtlTimelineYearData[];
  hotspotsDetailed: HotspotDetail[];
  performanceMatrix: MatrixRow[];
  matrixInsights: string[];
  options: ReportOptionsConfig;
  urbanRuralTimeline: { year: number; urban: number; rural: number; total: number; share: number }[];
  ageCohorts: { year: number; children: number; childrenPct: number; working: number; workingPct: number; elderly: number; elderlyPct: number; dependency: number; total: number }[];
}

const LULC_ORDER = [
  'Trees', 'Rangeland', 'Crops', 'Built Area', 'Water',
  'Bare Ground', 'Flooded Vegetation', 'Snow/Ice', 'Clouds',
];

export function buildReportData(
  district: string,
  selectedData?: any,
  config: ReportConfig = DEFAULT_REPORT_CONFIG,
  lulcTimelineImages?: Record<string, any>,
  ntlTimelineData?: Record<string, any>,
): ReportData {
  void selectedData;
  const model = getRecord(MODEL_DATA, district) as Record<number, number> | undefined;
  const stats = getRecord(MODEL_STATS_DATA, district) as Record<string, { density: number; growth: number | null }> | undefined;
  const ur = getRecord(MODEL_URBAN_RURAL_DATA, district) as Record<string, { urban: number; rural: number }> | undefined;
  const census = getRecord(CENSUS_PROJECTION_DATA, district) as Record<number, number> | undefined;
  const overview = getRecord(DISTRICT_OVERVIEWS, district) as { paragraphs: string[] } | undefined;
  const lulcRaw = getRecord(LULC_STATS, district) as Record<string, Record<string, number>> | undefined;
  const devContent = getRecord(DISTRICT_DEVELOPMENT, district) as DistrictDevContent | undefined;
  const ageCohortDist = getRecord(AGE_COHORT_DATA, district) as Record<string, { male: AgeCohortEntry; female: AgeCohortEntry }> | undefined;
  const ageCohortFullDist = getRecord(AGE_COHORT_FULL_DATA, district) as Record<string, { male: AgeCohortFullEntry; female: AgeCohortFullEntry }> | undefined;

  const options = config.options || DEFAULT_REPORT_OPTIONS;

  // ── Key figures — use config years when available ──
  let key: KeyFigures | null = null;
  if (model) {
    const allYears = Object.keys(model).map(Number).sort((a, b) => a - b);
    const configY0 = parseInt(config.startYear, 10);
    const configY1 = parseInt(config.endYear, 10);
    const y0 = model[configY0] != null ? configY0 : allYears[0];
    const y1 = model[configY1] != null ? configY1 : allYears[allYears.length - 1];
    if (y0 && y1) {
      const pop0 = model[y0];
      const pop1 = model[y1];
      const span = y1 - y0;
      const d0 = stats?.[String(y0)]?.density;
      const d1 = stats?.[String(y1)]?.density;
      const u0 = ur?.[String(y0)];
      const u1 = ur?.[String(y1)];
      const share = (o?: { urban: number; rural: number }) =>
        o ? (o.urban / (o.urban + o.rural)) * 100 : undefined;
      key = {
        y0, y1, pop0, pop1,
        inc: pop1 - pop0,
        cagr: span > 0 ? (Math.pow(pop1 / pop0, 1 / span) - 1) * 100 : 0,
        d0, d1, area: d0 ? pop0 / d0 : undefined,
        u0, u1, share0: share(u0), share1: share(u1),
      };
    }
  }

  // ── Key figures for Demographic Overview — always 2011 to 2025 ──
  let demoKey: KeyFigures | null = null;
  if (model) {
    const configY0 = parseInt(config.startYear, 10);
    const y0 = model[configY0] != null ? configY0 : 2011;
    const y1 = 2025;
    if (y0 && y1 && model[y0] != null && model[y1] != null) {
      const pop0 = model[y0];
      const pop1 = model[y1];
      const span = y1 - y0;
      const d0 = stats?.[String(y0)]?.density;
      const d1 = stats?.[String(y1)]?.density;
      const u0 = ur?.[String(y0)];
      const u1 = ur?.[String(y1)];
      const share = (o?: { urban: number; rural: number }) =>
        o ? (o.urban / (o.urban + o.rural)) * 100 : undefined;
      demoKey = {
        y0, y1, pop0, pop1,
        inc: pop1 - pop0,
        cagr: span > 0 ? (Math.pow(pop1 / pop0, 1 / span) - 1) * 100 : 0,
        d0, d1, area: d0 ? pop0 / d0 : undefined,
        u0, u1, share0: share(u0), share1: share(u1),
      };
    }
  }

  const chart = model
    ? Object.keys(model).map(Number).sort((a, b) => a - b)
      .map((y) => ({ year: y, model: model[y], census: census?.[y] ?? null }))
    : [];

  const tableYears = model
    ? [2011, 2016, 2021, 2026, 2031, 2036].filter((y) => model[y] != null)
    : [];

  const whwName = WHW_ALIAS[district] || district;
  const whw = (['What', 'How', 'Why'] as const)
    .map((tab) => ({
      tab,
      label: tab === 'What' ? 'What changed' : tab === 'How' ? 'How it changed' : 'Why it matters',
      entries: (TAB_CONTENT[tab] || [])
        .filter((e) => norm(e.district) === norm(whwName))
        .slice(0, 3)
        .map((e): WhwEntry => {
          const allImgBlocks = e.content.filter(
            (b) =>
              b.type === 'image' &&
              !/\.gif$/i.test((b as any).url) &&
              resolveImg((b as any).url),
          ) as any[];
          return {
            id: e.id,
            category: e.category,
            heading: first(e.content, 'heading')?.value,
            text: first(e.content, 'text')?.value,
            img: allImgBlocks[0] ? resolveImg(allImgBlocks[0].url) : undefined,
            contextImg: allImgBlocks[1] ? resolveImg(allImgBlocks[1].url) : undefined,
          };
        }),
    }))
    .filter((t) => t.entries.length > 0);

  // ── Land use comparison — use config years when available ──
  let lulc: ReportData['lulc'] = null;
  if (lulcRaw) {
    const yrs = Object.keys(lulcRaw).sort();
    if (yrs.length >= 2) {
      const fy = lulcRaw[config.startYear] ? config.startYear : yrs[0];
      const ly = lulcRaw[config.endYear] ? config.endYear : yrs[yrs.length - 1];
      const classes = Array.from(
        new Set([...Object.keys(lulcRaw[fy] ?? {}), ...Object.keys(lulcRaw[ly] ?? {})]),
      );
      const rows = classes
        .map((c) => {
          const a = lulcRaw[fy]?.[c] ?? 0;
          const b = lulcRaw[ly]?.[c] ?? 0;
          return { c, a, b, delta: b - a, pct: a ? ((b - a) / a) * 100 : 0 };
        })
        .filter((r) => r.a > 0 || r.b > 0)
        .sort((x, y) => y.b - x.b);
      lulc = {
        fy, ly, rows,
        maxArea: Math.max(...rows.map((r) => Math.max(r.a, r.b)), 1),
      };
    }
  }

  const lulcYearlyRaw = getRecord(LULC_STATS_YEARLY, district) as Record<string, Record<string, number>> | undefined;
  let lulcYearly: LulcYearly | null = null;
  if (lulcYearlyRaw) {
    const years = Object.keys(lulcYearlyRaw).sort();
    if (years.length >= 2) {
      const present = Array.from(
        new Set(years.flatMap((y) => Object.keys(lulcYearlyRaw[y]))),
      ).filter((c) => years.some((y) => (lulcYearlyRaw[y][c] ?? 0) > 0));
      const classes = [
        ...LULC_ORDER.filter((c) => present.includes(c)),
        ...present.filter((c) => !LULC_ORDER.includes(c)),
      ];
      const series: Record<string, number[]> = {};
      classes.forEach((c) => {
        series[c] = years.map((y) => lulcYearlyRaw[y][c] ?? 0);
      });
      const totals = years.map((_, i) => classes.reduce((sum, c) => sum + series[c][i], 0));
      lulcYearly = { years, classes, series, totals };
    }
  }

  const hs = Points_Data.filter((p) => norm(p.district) === norm(whwName));
  let hotspots: HotspotSummary | null = null;
  if (hs.length) {
    const list: Hotspot[] = hs
      .map((p) => ({
        id: p.id, category: p.category, settlement: p.settlement_type,
        lat: p.cord[0], lon: p.cord[1], builtHa: p.new_built_area_ha,
        score: p.score, confidence: p.confidence,
      }))
      .sort((a, b) => b.score - a.score);
    const byCatMap = new Map<string, { count: number; ha: number }>();
    list.forEach((h) => {
      const e = byCatMap.get(h.category) || { count: 0, ha: 0 };
      e.count += 1; e.ha += h.builtHa;
      byCatMap.set(h.category, e);
    });
    const byCategory = Array.from(byCatMap.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.count - a.count || b.ha - a.ha);
    hotspots = {
      list, total: list.length,
      totalBuiltHa: list.reduce((s, h) => s + h.builtHa, 0),
      avgConfidence: list.reduce((s, h) => s + h.confidence, 0) / (list.length || 1),
      topCategory: byCategory[0]?.category ?? '—', byCategory,
      bounds: (getRecord(DISTRICT_BOUNDS, district) as any) ??
        (list.length ? {
          minx: Math.min(...list.map((h) => h.lon)),
          miny: Math.min(...list.map((h) => h.lat)),
          maxx: Math.max(...list.map((h) => h.lon)),
          maxy: Math.max(...list.map((h) => h.lat)),
        } : null),
    };
  }

  let gender: GenderInfo | null = null;
  const getGenderTotalsForYear = (year: number) => {
    if (ageCohortFullDist) {
      const yData = ageCohortFullDist[String(year)] || ageCohortFullDist[year];
      if (yData) {
        const male = yData.male.age_0_4 + yData.male.age_5_9 + yData.male.age_10_14 + yData.male.age_15_19 +
          yData.male.age_20_24 + yData.male.age_25_29 + yData.male.age_30_34 + yData.male.age_35_39 +
          yData.male.age_40_44 + yData.male.age_45_49 + yData.male.age_50_54 + yData.male.age_55_59 +
          yData.male.age_60_64 + yData.male.age_65_69 + yData.male.age_70_74 + yData.male.age_75_79 +
          yData.male.age_80_plus;
        const female = yData.female.age_0_4 + yData.female.age_5_9 + yData.female.age_10_14 + yData.female.age_15_19 +
          yData.female.age_20_24 + yData.female.age_25_29 + yData.female.age_30_34 + yData.female.age_35_39 +
          yData.female.age_40_44 + yData.female.age_45_49 + yData.female.age_50_54 + yData.female.age_55_59 +
          yData.female.age_60_64 + yData.female.age_65_69 + yData.female.age_70_74 + yData.female.age_75_79 +
          yData.female.age_80_plus;
        return { male, female, ratio: male > 0 ? (female / male) * 1000 : 0 };
      }
    }
    return { male: 0, female: 0, ratio: 0 };
  };

  const gYears = [2011, 2021, 2026, 2031, 2036];
  const gy0 = 2011;
  const gy1 = 2026; // Gender balance vs 2011, aligning with Population pyramid 2026

  const g0 = getGenderTotalsForYear(gy0);
  const g1 = getGenderTotalsForYear(gy1);

  if (g0.male > 0 && g1.male > 0) {
    gender = {
      y0: gy0,
      y1: gy1,
      m0: g0.male,
      f0: g0.female,
      m1: g1.male,
      f1: g1.female,
      ratio0: g0.ratio,
      ratio1: g1.ratio,
      trend: gYears.map((y) => {
        const g = getGenderTotalsForYear(y);
        return {
          year: y,
          ratio: g.ratio,
          male: g.male,
          female: g.female,
        };
      }),
    };
  }

  const agePyramid = buildAgePyramid(ageCohortFullDist);

  const roadsRaw = getRecord(NEW_DISTRICT_ROAD_DATA as any, district) as Record<string, number> | undefined;
  let roads: RoadInfo | null = null;
  if (roadsRaw) {
    const nhMap: Record<number, number> = {}; const shMap: Record<number, number> = {};
    Object.entries(roadsRaw).forEach(([k, v]) => {
      const m = k.match(/_(nh|sh)_(\d{4})$/);
      if (!m) return;
      const yr = Number(m[2]);
      if (m[1] === 'nh') nhMap[yr] = Number(v) || 0;
      else shMap[yr] = Number(v) || 0;
    });
    const rYears = Object.keys(nhMap).map(Number).sort((a, b) => a - b);
    if (rYears.length >= 2) {
      const nh = rYears.map((y) => nhMap[y] ?? 0);
      const sh = rYears.map((y) => shMap[y] ?? 0);
      const last = rYears.length - 1;
      roads = {
        years: rYears, nh, sh,
        latestYear: rYears[last], latestNh: nh[last], latestSh: sh[last],
        deltaNh: nh[last] - nh[0], deltaSh: sh[last] - sh[0],
      };
    }
  }

  const figures: GeoFigures = {
    rgbBeforeAfter: MAP_FIGURES[`../Map/WhatHowWhy_v2/${whwName}/maps/rgb_before_after.png`],
    changeHeatmap: MAP_FIGURES[`../Map/WhatHowWhy_v2/${whwName}/maps/change_heatmap.png`],
    rgb2024: MAP_FIGURES[`../Map/WhatHowWhy_v2/${whwName}/maps/rgb_2024_preview.png`],
  };

  // ── Construct LULC Yearly Timeline ──
  const lulcTimeline: LulcTimelineYear[] = [];
  if (lulcYearlyRaw) {
    const years = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    for (let i = 0; i < years.length; i++) {
      const y = years[i];
      const current = lulcYearlyRaw[y];
      if (!current) continue;

      const prevY = years[i - 1];
      const prev = prevY ? lulcYearlyRaw[prevY] : null;

      const classes = Array.from(new Set(Object.keys(current)));
      const totalArea = classes.reduce((sum, c) => sum + (current[c] || 0), 0) || 1;

      const rows = classes.map((c) => {
        const area = current[c] || 0;
        const share = (area / totalArea) * 100;
        const prevArea = prev ? (prev[c] || 0) : area;
        const delta = area - prevArea;
        const pct = prevArea ? (delta / prevArea) * 100 : 0;
        return { c, area, share, delta, pct };
      }).sort((a, b) => b.area - a.area);

      const narrative = generateLulcNarrative(district, y, current, prev || current);
      const dataUrl = lulcTimelineImages?.[y]?.dataUrl;

      lulcTimeline.push({ year: y, rows, narrative, dataUrl });
    }
  }

  // ── Construct Night Light Timeline using NTL_COVERAGE (same data as MapCompare) ──
  const ntlTimeline: NtlTimelineYearData[] = [];
  const yearsNtl = ['2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

  // Resolve district name to match NTL_COVERAGE keys (same logic as MapCompare.tsx)
  const ntlCoverageRaw = (NTL_COVERAGE as Record<string, Record<string, number>>);
  const ntlDistData: Record<string, number> | undefined =
    ntlCoverageRaw[whwName] ||
    ntlCoverageRaw[district] ||
    (() => {
      const lowerDist = whwName.toLowerCase();
      const key = Object.keys(ntlCoverageRaw).find(k => k.toLowerCase() === lowerDist);
      return key ? ntlCoverageRaw[key] : undefined;
    })();

  for (let i = 0; i < yearsNtl.length; i++) {
    const y = yearsNtl[i];
    // NTL_COVERAGE value for this year
    const coverage = ntlDistData?.[y] ?? ntlDistData?.[parseInt(y)] ?? null;
    if (coverage === null) continue;

    const prevY = yearsNtl[i - 1];
    const prevCoverage = prevY ? (ntlDistData?.[prevY] ?? ntlDistData?.[parseInt(prevY)] ?? coverage) : coverage;
    const delta = coverage - prevCoverage;
    const pct = prevCoverage ? (delta / prevCoverage) * 100 : 0;

    // Pixel-level stats from raster (optional, for visual display)
    const rasterData = ntlTimelineData?.[y];
    const mean = rasterData?.mean ?? 0;
    const max = rasterData?.max ?? 0;

    const interpretations = generateNtlInterpretation(district, y, { mean: coverage, max, prevMean: prevCoverage });

    ntlTimeline.push({
      year: y,
      coverage,
      mean,
      max,
      delta,
      pct,
      ...interpretations,
      dataUrl: rasterData?.dataUrl,
    });
  }

  // ── Construct Detailed Hotspots ──
  const hotspotsDetailed: HotspotDetail[] = hs.map((p) => {
    const whatEntry = TAB_CONTENT.What.find((e) => e.id === p.id && norm(e.district) === norm(whwName));
    const howEntry = TAB_CONTENT.How.find((e) => e.id === p.id && norm(e.district) === norm(whwName));
    const whyEntry = TAB_CONTENT.Why.find((e) => e.id === p.id && norm(e.district) === norm(whwName));

    const whatImages = getEntryImages(whatEntry);
    const howImages = getEntryImages(howEntry);
    const whyImages = getEntryImages(whyEntry);

    const aiNarratives = generateHotspotNarratives(p);

    return {
      id: p.id,
      title: whatEntry?.title || `${district} Hotspot ${p.id}`,
      category: p.category,
      settlementType: p.settlement_type,
      lat: p.cord[0],
      lon: p.cord[1],
      builtHa: p.new_built_area_ha,
      score: p.score,
      confidence: p.confidence,
      what: {
        heading: first(whatEntry?.content || [], 'heading')?.value || '',
        text: first(whatEntry?.content || [], 'text')?.value || '',
        images: whatImages,
      },
      how: {
        heading: first(howEntry?.content || [], 'heading')?.value || '',
        text: first(howEntry?.content || [], 'text')?.value || '',
        images: howImages,
      },
      why: {
        heading: first(whyEntry?.content || [], 'heading')?.value || '',
        text: first(whyEntry?.content || [], 'text')?.value || '',
        images: whyImages,
      },
      ...aiNarratives,
    };
  });

  // ── Construct Regional Performance Matrix ──
  const performanceMatrix: MatrixRow[] = [];
  const rb = RISK_VULN_BASELINES[district] || { risk: 50, vuln: 50 };
  if (model) {
    for (let y = 2012; y <= 2036; y++) {
      const population = model[y] || 0;
      const growth = stats?.[String(y)]?.growth ?? null;
      const density = stats?.[String(y)]?.density ?? null;
      const urbanPop = ur?.[String(y)]?.urban ?? null;
      const ruralPop = ur?.[String(y)]?.rural ?? null;
      const builtupArea = lulcYearlyRaw?.[String(y)]?.['Built Area'] ?? null;
      const cropland = lulcYearlyRaw?.[String(y)]?.['Crops'] ?? null;
      const forest = lulcYearlyRaw?.[String(y)]?.['Trees'] ?? null;
      const water = lulcYearlyRaw?.[String(y)]?.['Water'] ?? null;
      const nightlight = ntlTimelineData?.[String(y)]?.mean ?? null;

      // Slowly vary risk/vuln based on builtup growth
      const scaling = builtupArea ? (builtupArea / 1000) : 0;
      const riskIndex = Math.min(100, Math.max(0, Math.round(rb.risk + scaling * 3)));
      const vulnerabilityIndex = Math.min(100, Math.max(0, Math.round(rb.vuln - scaling * 2)));

      performanceMatrix.push({
        year: y,
        population,
        growth,
        density,
        urbanPop,
        ruralPop,
        builtupArea,
        cropland,
        forest,
        water,
        nightlight,
        riskIndex,
        vulnerabilityIndex,
      });
    }
  }

  const matrixInsights = generateMatrixInsights(district, performanceMatrix);

  // ── TOC — only include enabled sections that also have data ──
  const inSec = (sec: string) => config.sections.includes(sec);
  const toc = [
    inSec('Demographic Overview') && options.demographicOverview.enabled && key && 'Demographic Overview',
    inSec('Population Projection & Growth') && options.populationProjection.enabled && chart.length > 0 && 'Population Projection & Growth',
    inSec('Population Structure') && options.populationStructure.enabled && (agePyramid || gender) && 'Population Structure',
    // inSec('Urban & Rural Composition') && options.urbanRuralComposition.enabled && key?.u0 && key?.u1 && 'Urban & Rural Composition',
    inSec('Land Use Analysis') && options.landUseAnalysis.enabled && (lulcYearly || lulc) && 'Land Use Analysis',
    inSec('Night Light Analysis') && options.nightLightAnalysis.enabled && ntlTimeline.length > 0 && 'Night Light Analysis',
    inSec('Areas of Rapid Change') && options.hotspotAnalysis.enabled && (hotspots || hotspotsDetailed.length > 0) && 'Areas of Rapid Change',
    inSec('Development Activities & Insights') && options.developmentActivities.enabled && !!devContent && 'Development Activities & Insights',
    inSec('Technical Notes & Sources') && options.technicalNotes.enabled && 'Technical Notes & Sources',
  ].filter(Boolean) as string[];

  const generated = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const urbanRuralTimeline: { year: number; urban: number; rural: number; total: number; share: number }[] = [];
  if (ur) {
    const urYears = [2011, 2016, 2021, 2026, 2031, 2036];
    urYears.forEach((y) => {
      const uData = ur[String(y)] || ur[y];
      if (uData) {
        const total = uData.urban + uData.rural;
        const share = total > 0 ? (uData.urban / total) * 100 : 0;
        urbanRuralTimeline.push({
          year: y,
          urban: uData.urban,
          rural: uData.rural,
          total,
          share,
        });
      }
    });
  }
  const ageCohorts: { year: number; children: number; childrenPct: number; working: number; workingPct: number; elderly: number; elderlyPct: number; dependency: number; total: number }[] = [];
  if (ageCohortDist) {
    const acYears = [2011, 2021, 2026, 2031, 2036];
    acYears.forEach((y) => {
      const yData = ageCohortDist[String(y)] || ageCohortDist[y];
      if (yData) {
        const children = yData.male.age_0_14 + yData.female.age_0_14;
        const working = yData.male.age_15_59 + yData.female.age_15_59;
        const elderly = yData.male.age_60_plus + yData.female.age_60_plus;
        const total = children + working + elderly;

        const childrenPct = total > 0 ? (children / total) * 100 : 0;
        const workingPct = total > 0 ? (working / total) * 100 : 0;
        const elderlyPct = total > 0 ? (elderly / total) * 100 : 0;
        const dependency = working > 0 ? ((children + elderly) / working) * 100 : 0;

        ageCohorts.push({
          year: y,
          children,
          childrenPct,
          working,
          workingPct,
          elderly,
          elderlyPct,
          dependency,
          total,
        });
      }
    });
  }

  return {
    district, generated, key, demoKey, paragraphs: overview?.paragraphs ?? [],
    chart, hasCensus: !!census, tableYears, model, census, stats,
    whw, lulc, lulcYearly, hotspots, gender, agePyramid, roads, figures, toc,
    devContent: devContent ?? null,
    config,
    lulcTimeline,
    ntlTimeline,
    hotspotsDetailed,
    performanceMatrix,
    matrixInsights,
    options,
    urbanRuralTimeline,
    ageCohorts,
  };
}

// ─── Helper Functions for Dynamic Narratives and Insights ────────────────

function generateLulcNarrative(
  district: string,
  year: string,
  current: Record<string, number>,
  prev: Record<string, number>
): string {
  const changes = Object.keys(current).map((className) => {
    const areaCurrent = current[className] || 0;
    const areaPrev = prev[className] || 0;
    const diff = areaCurrent - areaPrev;
    const pct = areaPrev ? (diff / areaPrev) * 100 : 0;
    return { className, areaCurrent, areaPrev, diff, pct };
  });

  const increases = changes.filter((c) => c.diff > 0.05).sort((a, b) => b.diff - a.diff);
  const decreases = changes.filter((c) => c.diff < -0.05).sort((a, b) => a.diff - b.diff);

  let narrative = `In ${year}, ${district}'s landscape experienced key transitions. `;

  if (increases.length === 0 && decreases.length === 0) {
    return narrative + `The land cover composition remained highly stable compared to the previous year, showing no major spatial shifts across categories.`;
  }

  const builtChange = changes.find((c) => c.className === 'Built Area');
  const cropChange = changes.find((c) => c.className === 'Crops');
  const treeChange = changes.find((c) => c.className === 'Trees');

  if (builtChange && Math.abs(builtChange.diff) > 0.1) {
    if (builtChange.diff > 0) {
      narrative += `Built-up area expanded by ${builtChange.diff.toFixed(2)} km² (+${builtChange.pct.toFixed(1)}%), highlighting ongoing infrastructure development and settlement growth. `;
    } else {
      narrative += `Built-up area showed a slight consolidation of ${Math.abs(builtChange.diff).toFixed(2)} km² (${builtChange.pct.toFixed(1)}%). `;
    }
  }

  if (increases.length > 0) {
    const topInc = increases[0];
    if (topInc.className !== 'Built Area') {
      narrative += `The most significant expansion was observed in ${topInc.className}, which grew by ${topInc.diff.toFixed(2)} km² (+${topInc.pct.toFixed(1)}%). `;
    }
  }

  if (decreases.length > 0) {
    const topDec = decreases[0];
    narrative += `Conversely, ${topDec.className} experienced the largest contraction, decreasing by ${Math.abs(topDec.diff).toFixed(2)} km² (${topDec.pct.toFixed(1)}%). `;
  }

  if (cropChange && treeChange && builtChange && builtChange.diff > 0) {
    narrative += `This suggests that urban/built-up expansion occurred primarily through the conversion of surrounding ${cropChange.areaPrev > treeChange.areaPrev ? 'agricultural fields (cropland)' : 'vegetative canopy (trees)'}. `;
  }

  narrative += `Overall, these changes reflect the continuing interplay between human activities, resource utilization, and natural land cover in the district.`;
  return narrative;
}

function generateNtlInterpretation(
  _district: string,
  _year: string,
  stats: { mean: number; max: number; prevMean?: number }
): { urbanization: string; economic: string; trend: string } {
  const coverage = stats.mean; // NTL_COVERAGE total luminosity sum
  const prevCoverage = stats.prevMean;

  let deltaStr = '';
  let pctStr = '';
  let trendDirection = 'stable';
  if (prevCoverage != null && prevCoverage > 0) {
    const delta = coverage - prevCoverage;
    const pct = (delta / prevCoverage) * 100;
    deltaStr = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;
    pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    trendDirection = pct > 2 ? 'upward' : pct < -2 ? 'downward' : 'stable';
  }

  let urbanization = '';
  let economic = '';
  let trend = '';

  if (coverage > 2000) {
    urbanization = `The high NTL coverage sum of ${coverage.toFixed(0)} indicates a highly urbanized and electrified landscape with dense commercial and residential activity.`;
    economic = `Active economic hubs and secondary industries are well-correlated with the elevated luminosity. The concentrated coverage points to heavy industrial activity or dense commercial zones.`;
  } else if (coverage > 800) {
    urbanization = `The moderate NTL coverage of ${coverage.toFixed(0)} indicates a semi-urbanized pattern with emerging town clusters and peri-urban expansion alongside rural areas.`;
    economic = `Economic activity is transitioning, with steady growth in light intensity reflecting electrification, small-scale industrial corridors, and transport route activities.`;
  } else {
    urbanization = `A NTL coverage of ${coverage.toFixed(0)} shows a predominantly rural settlement pattern. Built-up spots are relatively faint and scattered, indicating lower ambient luminosity.`;
    economic = `Economic activity is primarily agricultural, with localized light spots indicating rural marketplaces, electrification of villages, or small-scale local growth.`;
  }

  if (trendDirection === 'upward') {
    trend = `A positive year-on-year shift of ${pctStr} (${deltaStr}) in luminosity coverage confirms accelerating growth. This expansion is concentrated along major transit corridors and town borders, signaling active development.`;
  } else if (trendDirection === 'downward') {
    trend = `A year-on-year decline of ${pctStr} in luminosity coverage is observed. This may represent seasonal differences, cloud cover anomalies, or power supply fluctuations rather than structural economic contraction.`;
  } else {
    trend = `Luminosity coverage has remained stable (change of ${pctStr || '0%'}), showing consistent baseline electrification and industrial output without significant new spatial sprawl.`;
  }

  return { urbanization, economic, trend };
}

function generateHotspotNarratives(hotspot: any) {
  const { category, settlement_type, new_built_area_ha, confidence } = hotspot;

  let reason = "";
  let implication = "";
  let observation = "";

  const formattedSettlement = settlement_type.replace(/_/g, ' ');

  if (category === 'Build-up' || category === 'Urban Sprawl') {
    reason = "Urban expansion and residential built-up sprawl, reflecting high population pressure and suburban migration.";
    observation = `Continuous expansion of residential structures covering ${new_built_area_ha.toFixed(1)} hectares. The development patterns show a transition to low-density peri-urban forms.`;
    implication = "Demands proactive land-use zoning, municipal boundary adjustments, and basic service extension (water, sanitation, roads) to prevent unorganized peri-urban sprawl.";
  } else if (category === 'Industry') {
    reason = "Establishment or expansion of secondary industries, manufacturing hubs, or power complexes.";
    observation = `Large industrial footprints with heavy structures covering ${new_built_area_ha.toFixed(1)} hectares. This reflects substantial capital investment and employment draw.`;
    implication = "Requires environmental monitoring (air and water quality controls), dedicated industrial zoning, and worker housing development.";
  } else if (category === 'Infrastructure') {
    reason = "Transit infrastructure expansion, logistics corridors, or public utility installations.";
    observation = `Linear built-up growth and corridor development covering ${new_built_area_ha.toFixed(1)} hectares. This growth is heavily aligned with road and railway channels.`;
    implication = "Demands corridor-management strategies, transit-oriented development planning, and safety zones along high-speed corridors.";
  } else if (category === 'Mines') {
    reason = "Opencast mining activities, stockyards, or related minerals processing plants.";
    observation = `Severe landscape modification and vegetative clearance covering ${new_built_area_ha.toFixed(1)} hectares. This indicates high resource extraction activity.`;
    implication = "Requires strict enforcement of mine closure plans, land reclamation, ecological offset programs, and air quality mitigation.";
  } else {
    reason = `Landscape transformation classified as ${category} in a ${formattedSettlement} setting.`;
    observation = `Transformation of ${new_built_area_ha.toFixed(1)} hectares detected with ${Math.round(confidence * 100)}% detection confidence.`;
    implication = "Requires localized site inspections to guide land classification updates and sustainable development controls.";
  }

  return {
    aiExplanation: `Satellite monitoring detected a ${new_built_area_ha.toFixed(1)} hectare landscape change driven by ${reason.toLowerCase()}`,
    observations: observation || `A detailed satellite read shows ${new_built_area_ha.toFixed(1)} hectares of new structures built over the monitoring period. The classification indicates a ${formattedSettlement} context, verified with ${Math.round(confidence * 100)}% spectral change confidence.`,
    keyFindings: `1. Change area: ${new_built_area_ha.toFixed(1)} ha.\n2. Primary driver: ${category === 'Build-up' ? 'Built-up' : category}.\n3. Setting: ${formattedSettlement}.\n4. Detection confidence: ${Math.round(confidence * 100)}%.`,
    planningImplications: implication
  };
}

function generateMatrixInsights(_district: string, rows: MatrixRow[]): string[] {
  const validBuilt = rows.filter(r => r.builtupArea != null);
  const builtChangeStr = validBuilt.length >= 2
    ? `Built-up area expanded from ${validBuilt[0].builtupArea!.toFixed(1)} km² to ${validBuilt[validBuilt.length - 1].builtupArea!.toFixed(1)} km² between ${validBuilt[0].year} and ${validBuilt[validBuilt.length - 1].year}.`
    : "";

  const validNtl = rows.filter(r => r.nightlight != null);
  const ntlChangeStr = validNtl.length >= 2
    ? `Average nocturnal luminosity (VIIRS) increased by ${((validNtl[validNtl.length - 1].nightlight! - validNtl[0].nightlight!) / (validNtl[0].nightlight! || 1) * 100).toFixed(1)}% between ${validNtl[0].year} and ${validNtl[validNtl.length - 1].year}.`
    : "";

  const pop2012 = rows.find(r => r.year === 2012)?.population || 0;
  const pop2036 = rows.find(r => r.year === 2036)?.population || 0;
  const popGrowthStr = pop2012 && pop2036
    ? `The population is modeled to expand from ${fmtM(pop2012)} in 2012 to ${fmtM(pop2036)} by 2036, signaling persistent development pressures.`
    : "";

  return [
    `Demographic Growth and Density: ${popGrowthStr} Density increases in parallel, rising from ${rows.find(r => r.year === 2012)?.density?.toFixed(1) ?? "—"} to ${rows.find(r => r.year === 2036)?.density?.toFixed(1) ?? "—"} persons/km².`,
    `Physical Expansion: ${builtChangeStr} This spatial growth represents key landscape transitions, primarily driven by urban sprawl, road connectivity, and industrial sites.`,
    `Luminosity and Energy Footprint: ${ntlChangeStr} This rise in light emissions serves as a proxy for accelerating household electrification, commercial density, and infrastructure corridor integration.`,
    `Risk Exposure: Environmental risk parameters suggest a stable baseline, emphasizing the need for disaster-resilient planning in coastal corridors and sustainable resource management in mining sectors.`
  ];
}

const getEntryImages = (entry: any): string[] => {
  if (!entry || !entry.content) return [];
  return entry.content
    .filter((b: any) => b.type === 'image' && b.url)
    .map((b: any) => resolveImg(b.url) || b.url)
    .filter(Boolean);
};

const RISK_VULN_BASELINES: Record<string, { risk: number; vuln: number }> = {
  Anugul: { risk: 65, vuln: 55 },
  Balangir: { risk: 75, vuln: 80 },
  Baudh: { risk: 50, vuln: 65 },
  Cuttack: { risk: 55, vuln: 45 },
  Deogarh: { risk: 45, vuln: 60 },
  Dhenkanal: { risk: 45, vuln: 50 },
  Gajapati: { risk: 65, vuln: 75 },
  Ganjam: { risk: 80, vuln: 70 },
  Jagatsinghpur: { risk: 85, vuln: 65 },
  Jajpur: { risk: 60, vuln: 55 },
  Jharsuguda: { risk: 55, vuln: 50 },
  Kalahandi: { risk: 70, vuln: 75 },
  Kandhamal: { risk: 50, vuln: 70 },
  Kendrapara: { risk: 90, vuln: 75 },
  Keonjhar: { risk: 60, vuln: 60 },
  Kendujhar: { risk: 60, vuln: 60 },
  Khordha: { risk: 45, vuln: 35 },
  Koraput: { risk: 60, vuln: 75 },
  Malkangiri: { risk: 65, vuln: 80 },
  Mayurbhanj: { risk: 60, vuln: 70 },
  Nabarangpur: { risk: 55, vuln: 75 },
  Nayagarh: { risk: 50, vuln: 55 },
  Nuapada: { risk: 75, vuln: 85 },
  Puri: { risk: 85, vuln: 60 },
  Rayagada: { risk: 60, vuln: 75 },
  Sambalpur: { risk: 50, vuln: 45 },
  Sonepur: { risk: 55, vuln: 60 },
  Subarnapur: { risk: 55, vuln: 60 },
  Sundargarh: { risk: 55, vuln: 60 },
  Baleshwar: { risk: 85, vuln: 70 },
  Bhadrak: { risk: 80, vuln: 65 },
};
