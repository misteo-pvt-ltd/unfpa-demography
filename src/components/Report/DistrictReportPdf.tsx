/* eslint-disable jsx-a11y/alt-text */
/**
 * DistrictReportPdf — a UN-publication-style district profile, generated as a
 * true vector PDF via @react-pdf/renderer.
 *
 * Structure (modelled on UNFPA / UNDP report conventions):
 *   Cover            — photograph band, series label, title on deep navy
 *   Imprint          — copyright, disclaimer, credits
 *   Contents         — numbered chapters
 *   Chapters 01–06   — overview (headline figures + key messages), projection &
 *                      growth, structure, urban/rural, land use (with real LULC
 *                      COG rasters), hotspots (with landscape transformation)
 *   Technical Notes  — methodology and sources
 *   Back cover       — attribution
 *
 * Every figure and table is numbered and carries a source line.
 */
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Polyline,
  Polygon,
  Line,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  pdf,
} from '@react-pdf/renderer';
import {
  buildReportData,
  fmtInt,
  fmtM,
  ALL_REPORT_SECTIONS,
  type ReportData,
  // type LulcYearly,
  type AgePyramid,
  type GenderInfo,
  type ReportOptionsConfig,
  // type LulcTimelineYear,
  // type NtlTimelineYearData,
  type HotspotDetail,
} from './reportData';
import { captureDistrictMap } from './mapSnapshot';
import {
  renderLulcPair,
  renderLulcTimeline,
  renderNtlTimeline,
  type LulcRasterImage,
} from './lulcRaster';
import coverPhoto from '../../assets/images/report-cover-v2.jpg';
import unfpaLogo from '../../assets/images/unfpa.png';

const BRAND = 'Odisha Demographic & Data Intelligence Platform';
const SERIES = 'ODISHA DISTRICT PROFILES';
const YEAR = '2026';

// ─── Palette — UN institutional: deep navy + UNFPA orange + UN blue ───────
const C = {
  navy: '#0B2E4F',
  ink: '#12283F',
  body: '#3A4A5C',
  mute: '#8296A8',
  accent: '#F26522',
  accentSoft: '#FDEDE2',
  unblue: '#009EDB',
  line: '#D9E2EC',
  hair: '#EDF2F7',
  bg: '#F7FAFC',
  pos: '#1E7F4F',
  neg: '#C0392B',
  white: '#FFFFFF',
  // dark cover / back-cover tones
  night: '#0B2440',
  nightLine: '#27436B',
  nightText: '#C3D2E4',
  nightMute: '#7F97B4',
};

// ESRI land-cover palette — identical to the dashboard raster colormap
const LULC_COLORS: Record<string, string> = {
  Water: '#419BDF',
  Trees: '#397D49',
  'Flooded Vegetation': '#7A87C6',
  Crops: '#E49635',
  'Built Area': '#C4281B',
  'Bare Ground': '#A59B8F',
  'Snow/Ice': '#F0F0F0',
  Clouds: '#E8E8E8',
  Rangeland: '#DFC35A',
};
// const lulcColor = (c: string) => LULC_COLORS[c] || '#94A3B8';

const CATEGORY_COLORS: Record<string, string> = {
  'Build-up': '#64748B',
  Industry: '#7C3AED',
  Infrastructure: '#0EA5E9',
  'Urban Sprawl': '#F26522',
  Mines: '#B45309',
  Vegetation: '#16A34A',
};
const catColor = (c: string) => CATEGORY_COLORS[c] || '#94A3B8';
// display-only spelling fix; raw data value 'Build-up' must stay for color/category matching
const prettyCategory = (c: string) => c.replace(/\bBuild-up\b/g, 'Built-up');

const SECTION_DESCRIPTIONS: Record<string, string> = {
  'Demographic Overview': 'Key figures, narrative context and the district boundary.',
  'Population Projection & Growth': 'The modelled population trajectory to 2036, with year-on-year growth.',
  'Population Structure': 'Age composition and the evolving gender balance.',
  'Urban & Rural Composition': 'How the settlement balance shifts across the projection horizon.',
  'Land Use Analysis': 'Satellite-derived land-cover rasters, composition and change.',
  'Areas of Rapid Change': 'Built-up change hotspots, their drivers, and a closer landscape read.',
  'Road Infrastructure': 'Evolution of the national and state highway network.',
  'Technical Notes & Sources': 'How the figures are produced and where the data comes from.',
  'Night Light Analysis': 'Analysis of annual nocturnal luminosity (VIIRS) to identify patterns of urbanization, electrification, and economic development.',
  'Development Activities & Insights': 'Synthesis of ongoing infrastructure, urbanization, and land-use activities, along with forward-looking spatial implications.',
};

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.body,
  },
  darkPage: {
    padding: 0,
    backgroundColor: C.night,
    fontFamily: 'Helvetica',
    color: C.white,
  },
  lightPage: {
    paddingTop: 60,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.body,
    backgroundColor: '#FFFFFF',
  },
  kicker: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 1.8,
    color: C.accent,
    textTransform: 'uppercase',
  },
  // running header / footer
  runHead: {
    position: 'absolute',
    top: 26,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.7,
    borderBottomColor: C.line,
    paddingBottom: 5,
  },
  runHeadText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    letterSpacing: 1.2,
    color: C.mute,
  },
  footer: {
    position: 'absolute',
    bottom: 26,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 0.7,
    borderTopColor: C.line,
  },
  footerText: { fontSize: 7, color: C.mute },
  pageNo: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: C.navy },
  // chapter opener
  chapterRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  chapterNo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 40,
    color: C.accentSoft,
    lineHeight: 1,
    marginRight: 12,
  },
  chapterNoStroke: {
    position: 'absolute',
    left: 0,
    top: 0,
    fontFamily: 'Helvetica-Bold',
    fontSize: 40,
    color: C.accent,
    opacity: 0.28,
    lineHeight: 1,
  },
  chapterTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 17,
    color: C.navy,
    letterSpacing: -0.2,
  },
  chapterRule: { width: 34, height: 3, backgroundColor: C.accent, borderRadius: 1.5, marginTop: 6, marginBottom: 6 },
  chapterDesc: { fontSize: 9.5, color: C.mute, lineHeight: 1.5 },
  // figures
  figHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 },
  figKicker: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    letterSpacing: 1.2,
    color: C.accent,
    marginRight: 7,
  },
  figTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.navy },
  source: { fontFamily: 'Helvetica-Oblique', fontSize: 6.5, color: C.mute, marginTop: 5 },
  // panels
  panel: {
    borderWidth: 0.8,
    borderColor: C.line,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  callout: {
    backgroundColor: C.bg,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    borderRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  calloutText: { fontSize: 9, color: C.ink, lineHeight: 1.55 },
  // tiles
  tileRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    width: '31.5%',
    marginRight: '2.75%',
    marginBottom: 8,
    borderTopWidth: 2,
    borderTopColor: C.accent,
    backgroundColor: C.bg,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tileLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    letterSpacing: 0.7,
    color: C.mute,
    textTransform: 'uppercase',
  },
  tileValue: { fontFamily: 'Helvetica-Bold', fontSize: 16.5, marginTop: 2, color: C.navy },
  tileSub: { fontSize: 7.5, color: C.body, marginTop: 1 },
  // text
  para: { fontSize: 9.2, color: C.body, lineHeight: 1.6, marginBottom: 7, textAlign: 'justify' },
  // tables — booktabs style
  thead: {
    flexDirection: 'row',
    borderTopWidth: 1.4,
    borderTopColor: C.navy,
    borderBottomWidth: 0.7,
    borderBottomColor: C.navy,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 5,
    paddingHorizontal: 6,
    textAlign: 'right',
  },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.hair },
  trLast: { borderBottomWidth: 1.2, borderBottomColor: C.navy },
  td: { fontSize: 8.5, paddingVertical: 4.5, paddingHorizontal: 6, textAlign: 'right', color: C.body },
  tdL: { fontFamily: 'Helvetica-Bold', textAlign: 'left', color: C.ink },
  // landscape cards
  groupHead: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  groupPill: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 1,
    color: C.white,
    backgroundColor: C.navy,
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    marginBottom: 8,
    borderWidth: 0.8,
    borderColor: C.line,
    borderRadius: 6,
    padding: 8,
  },
  cardImg: { width: 146, height: 96, borderRadius: 4, objectFit: 'cover', marginRight: 10 },
  catPill: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    letterSpacing: 0.7,
    color: C.accent,
    backgroundColor: C.accentSoft,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  cardHeading: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.navy },
  cardText: { fontSize: 8.3, color: C.body, marginTop: 2, lineHeight: 1.5 },
  subHead: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 4 },
  subHeadBar: { width: 3.5, height: 13, backgroundColor: C.accent, borderRadius: 2, marginRight: 8 },
  subHeadTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11.5, color: C.navy },
  panelLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  devCard: {
    borderWidth: 0.8,
    borderColor: C.line,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  devCardTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.2,
    color: C.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  insightCardTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.2,
    color: C.navy,
    textTransform: 'uppercase',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  devCardText: {
    fontSize: 8.2,
    color: C.body,
    lineHeight: 1.5,
  },
  insightText: {
    fontSize: 8.2,
    color: C.body,
    lineHeight: 1.5,
    marginBottom: 6,
    textAlign: 'justify',
  },
});

// ─── Building blocks ──────────────────────────────────────────────────────
const Chapter = ({ no, title, desc }: { no: string; title: string; desc?: string }) => (
  <View style={{ marginBottom: 14 }}>
    <View style={s.chapterRow}>
      <View style={{ position: 'relative', marginRight: 12 }}>
        <Text style={s.chapterNo}>{no}</Text>
        <Text style={s.chapterNoStroke}>{no}</Text>
      </View>
      <View style={{ flex: 1, paddingTop: 4 }}>
        <Text style={s.chapterTitle}>{title}</Text>
        <View style={s.chapterRule} />
        {desc ? <Text style={s.chapterDesc}>{desc}</Text> : null}
      </View>
    </View>
  </View>
);

const FigureHead = ({ no, title }: { no: number; title: string }) => (
  <View style={s.figHead}>
    <Text style={s.figKicker}>FIGURE {no}</Text>
    <Text style={s.figTitle}>{title}</Text>
  </View>
);

const TableHead = ({ no, title }: { no: number; title: string }) => (
  <View style={s.figHead}>
    <Text style={s.figKicker}>TABLE {no}</Text>
    <Text style={s.figTitle}>{title}</Text>
  </View>
);

const Source = ({ children }: { children: string }) => (
  <Text style={s.source}>Source: {children}</Text>
);

const LegendDot = ({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
    <View
      style={{
        width: 14,
        height: dashed ? 0 : 3,
        borderRadius: 2,
        backgroundColor: dashed ? undefined : color,
        borderTopWidth: dashed ? 1.4 : 0,
        borderTopColor: color,
        borderStyle: dashed ? 'dashed' : 'solid',
        marginRight: 6,
      }}
    />
    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.body }}>{label}</Text>
  </View>
);

const SwatchLegend = ({ items }: { items: { label: string; color: string }[] }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
    {items.map((it) => (
      <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 3 }}>
        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: it.color, marginRight: 4 }} />
        <Text style={{ fontSize: 6.8, color: C.body }}>{it.label}</Text>
      </View>
    ))}
  </View>
);

// ─── Charts (SVG) ─────────────────────────────────────────────────────────
const ProjectionChart = ({ data }: { data: ReportData }) => {
  const W = 483;
  const H = 190;
  const padL = 40;
  const padR = 10;
  const padT = 10;
  const padB = 18;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const pts = data.chart;
  const years = pts.map((p) => p.year);
  const minYr = Math.min(...years);
  const maxYr = Math.max(...years);
  const vals = pts.flatMap((p) => [p.model, p.census]).filter((v): v is number => v != null);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const pad = (maxV - minV) * 0.08 || 1;
  const lo = minV - pad;
  const hi = maxV + pad;

  const sx = (yr: number) => padL + ((yr - minYr) / (maxYr - minYr || 1)) * plotW;
  const sy = (v: number) => padT + (1 - (v - lo) / (hi - lo || 1)) * plotH;

  const modelPts = pts.map((p) => `${sx(p.year)},${sy(p.model)}`).join(' ');
  const areaPts = `${sx(pts[0].year)},${padT + plotH} ${modelPts} ${sx(pts[pts.length - 1].year)},${padT + plotH}`;
  const censusPts = pts
    .filter((p) => p.census != null)
    .map((p) => `${sx(p.year)},${sy(p.census as number)}`)
    .join(' ');

  const gridN = 4;
  const grid = Array.from({ length: gridN + 1 }, (_, i) => lo + ((hi - lo) / gridN) * i);
  const xTicks = [2011, 2016, 2021, 2026, 2031, 2036].filter((y) => y >= minYr && y <= maxYr);

  return (
    <Svg width={W} height={H}>
      {grid.map((g, i) => (
        <Line key={`g${i}`} x1={padL} y1={sy(g)} x2={W - padR} y2={sy(g)} stroke={C.hair} strokeWidth={1} />
      ))}
      {grid.map((g, i) => (
        <SvgText key={`gl${i}`} x={padL - 5} y={sy(g) + 3} textAnchor="end" style={{ fontSize: 7, fill: C.mute }}>
          {`${(g / 1e6).toFixed(1)}M`}
        </SvgText>
      ))}
      <Polygon points={areaPts} fill={C.accent} fillOpacity={0.1} />
      <Polyline points={modelPts} fill="none" stroke={C.accent} strokeWidth={2.2} />
      {data.hasCensus && censusPts ? (
        <Polyline points={censusPts} fill="none" stroke={C.unblue} strokeWidth={1.6} strokeDasharray="4 3" />
      ) : null}
      {xTicks.map((yr) => (
        <SvgText key={`x${yr}`} x={sx(yr)} y={H - 5} textAnchor="middle" style={{ fontSize: 7, fill: C.mute }}>
          {String(yr)}
        </SvgText>
      ))}
    </Svg>
  );
};


const AgePyramidChart = ({ pyramid }: { pyramid: AgePyramid }) => {
  const maxV = Math.max(...pyramid.groups.flatMap((g) => [g.male, g.female]), 1);
  const total = pyramid.totalMale + pyramid.totalFemale || 1;
  return (
    <View>
      {pyramid.groups.map((g) => (
        <View key={g.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3.5 }}>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Text style={{ fontSize: 5.6, color: C.mute, marginRight: 3 }}>
              {((g.male / total) * 100).toFixed(1)}%
            </Text>
            <View
              style={{
                width: `${Math.max((g.male / maxV) * 82, 0.6)}%`,
                height: 9.5,
                backgroundColor: C.unblue,
                borderTopLeftRadius: 2,
                borderBottomLeftRadius: 2,
              }}
            />
          </View>
          <Text style={{ width: 32, fontSize: 6.4, textAlign: 'center', color: C.body, fontFamily: 'Helvetica-Bold' }}>
            {g.label}
          </Text>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: `${Math.max((g.female / maxV) * 82, 0.6)}%`,
                height: 9.5,
                backgroundColor: C.accent,
                borderTopRightRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
            <Text style={{ fontSize: 5.6, color: C.mute, marginLeft: 3 }}>
              {((g.female / total) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      ))}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 7,
          borderTopWidth: 0.7,
          borderTopColor: C.hair,
          paddingTop: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: C.unblue, marginRight: 4 }} />
          <Text style={{ fontSize: 7.2, color: C.body, fontFamily: 'Helvetica-Bold' }}>
            Male {fmtM(pyramid.totalMale)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 7.2, color: C.body, fontFamily: 'Helvetica-Bold', marginRight: 4 }}>
            Female {fmtM(pyramid.totalFemale)}
          </Text>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: C.accent }} />
        </View>
      </View>
    </View>
  );
};

const SexRatioTrend = ({ gender }: { gender: GenderInfo }) => {
  const W = 156;
  const H = 56;
  const pad = 8;
  const padB = 14;
  const vals = gender.trend.map((t) => t.ratio);
  const lo = Math.min(...vals) - 2;
  const hi = Math.max(...vals) + 2;
  const sx = (i: number) => pad + (i / (gender.trend.length - 1 || 1)) * (W - 2 * pad);
  const sy = (v: number) => pad + (1 - (v - lo) / (hi - lo || 1)) * (H - pad - padB);
  const pts = gender.trend.map((t, i) => `${sx(i)},${sy(t.ratio)}`).join(' ');
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={C.accent} strokeWidth={1.8} />
      {gender.trend.map((t, i) => (
        <Circle key={t.year} cx={sx(i)} cy={sy(t.ratio)} r={1.8} fill={C.accent} />
      ))}
      <SvgText x={pad} y={H - 3} style={{ fontSize: 6.4, fill: C.mute }}>
        {String(gender.trend[0].year)}
      </SvgText>
      <SvgText x={W - pad} y={H - 3} textAnchor="end" style={{ fontSize: 6.4, fill: C.mute }}>
        {String(gender.trend[gender.trend.length - 1].year)}
      </SvgText>
    </Svg>
  );
};

// const UrbanRuralBars = ({ rows }: { rows: { yr: number; u: number; r: number }[] }) => (
//   <View style={{ marginTop: 2 }}>
//     {rows.map((row) => {
//       const total = row.u + row.r || 1;
//       const up = (row.u / total) * 100;
//       return (
//         <View key={row.yr} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
//           <Text style={{ width: 32, fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.navy }}>{row.yr}</Text>
//           <View
//             style={{
//               flex: 1,
//               flexDirection: 'row',
//               height: 20,
//               borderRadius: 4,
//               overflow: 'hidden',
//             }}
//           >
//             <View style={{ width: `${up}%`, backgroundColor: C.accent, justifyContent: 'center', paddingLeft: 6 }}>
//               <Text style={{ fontSize: 7.2, color: '#fff', fontFamily: 'Helvetica-Bold' }}>
//                 Urban {up.toFixed(1)}%
//               </Text>
//             </View>
//             <View
//               style={{
//                 flex: 1,
//                 backgroundColor: '#DCE6F0',
//                 justifyContent: 'center',
//                 alignItems: 'flex-end',
//                 paddingRight: 6,
//               }}
//             >
//               <Text style={{ fontSize: 7.2, color: C.navy, fontFamily: 'Helvetica-Bold' }}>
//                 Rural {(100 - up).toFixed(1)}%
//               </Text>
//             </View>
//           </View>
//         </View>
//       );
//     })}
//   </View>
// );

/*
const LulcStackedArea = ({ data }: { data: LulcYearly }) => {
  const { years, classes, series, totals } = data;
  const W = 483;
  const H = 180;
  const padL = 42;
  const padR = 10;
  const padT = 8;
  const padB = 16;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxTotal = Math.max(...totals, 1);
  const sx = (i: number) => padL + (i / (years.length - 1 || 1)) * plotW;
  const sy = (v: number) => padT + (1 - v / maxTotal) * plotH;

  const cum = years.map(() => 0);
  const polys = classes.map((c) => {
    const bottomPts = years.map((_, i) => `${sx(i)},${sy(cum[i])}`);
    years.forEach((_, i) => {
      cum[i] += series[c][i];
    });
    const topPts = years.map((_, i) => `${sx(i)},${sy(cum[i])}`);
    return { c, points: [...topPts, ...bottomPts.reverse()].join(' ') };
  });

  const gridN = 4;
  const grid = Array.from({ length: gridN + 1 }, (_, i) => (maxTotal / gridN) * i);
  const step = years.length > 7 ? 2 : 1;

  return (
    <Svg width={W} height={H}>
      {grid.map((g, i) => (
        <Line key={`g${i}`} x1={padL} y1={sy(g)} x2={W - padR} y2={sy(g)} stroke={C.hair} strokeWidth={1} />
      ))}
      {grid.map((g, i) => (
        <SvgText key={`gl${i}`} x={padL - 5} y={sy(g) + 3} textAnchor="end" style={{ fontSize: 6.8, fill: C.mute }}>
          {`${Math.round(g / 1000)}k`}
        </SvgText>
      ))}
      {polys.map((p) => (
        <Polygon key={p.c} points={p.points} fill={lulcColor(p.c)} fillOpacity={0.92} />
      ))}
      {years.map((y, i) =>
        i % step === 0 || i === years.length - 1 ? (
          <SvgText key={`x${y}`} x={sx(i)} y={H - 4} textAnchor="middle" style={{ fontSize: 6.8, fill: C.mute }}>
            {y}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
};
*/

// const DeltaRow = ({
//   label,
//   value,
//   sub,
//   color,
// }: {
//   label: string;
//   value: string;
//   sub?: string;
//   color?: string;
// }) => (
//   <View style={{ borderBottomWidth: 0.6, borderBottomColor: C.hair, paddingVertical: 7 }}>
//     <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.mute, textTransform: 'uppercase', letterSpacing: 0.5 }}>
//       {label}
//     </Text>
//     <Text style={{ fontSize: 15, fontFamily: 'Helvetica-Bold', color: color || C.navy, marginTop: 1 }}>{value}</Text>
//     {sub ? <Text style={{ fontSize: 7.3, color: C.body }}>{sub}</Text> : null}
//   </View>
// );

// At-a-glance big number — laid out strictly three per row
const Headline = ({
  value,
  label,
  sub,
  last,
}: {
  value: string;
  label: string;
  sub?: string;
  last?: boolean;
}) => (
  <View style={{ width: '31.3%', marginRight: last ? 0 : '3.05%', marginBottom: 22 }}>
    <View style={{ width: 26, height: 3, backgroundColor: C.accent, borderRadius: 1.5, marginBottom: 8 }} />
    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 27, color: C.navy, letterSpacing: -0.5 }}>{value}</Text>
    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.ink, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6 }}>
      {label}
    </Text>
    {sub ? <Text style={{ fontSize: 7.5, color: C.mute, marginTop: 2, lineHeight: 1.4 }}>{sub}</Text> : null}
  </View>
);

// ─── Timeline and Enhanced Components ─────────────────────────────────────

// one clean map card per year — navy year band + the year's LULC raster
// const LulcTimelineTile = ({ yr }: { yr: LulcTimelineYear }) => (
//   <View
//     // no flex here: flex-basis 0 collapses the tile to zero height in Yoga,
//     // and overflow:hidden then clips the band and raster entirely
//     style={{
//       borderWidth: 0.8,
//       borderColor: C.line,
//       borderRadius: 8,
//       overflow: 'hidden',
//       backgroundColor: '#fff',
//     }}
//   >
//     <View style={{ backgroundColor: C.navy, paddingVertical: 3.5 }}>
//       <Text style={{ color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'center', letterSpacing: 1 }}>
//         {yr.year}
//       </Text>
//     </View>
//     <View style={{ height: 112, backgroundColor: C.bg, padding: 4, justifyContent: 'center', alignItems: 'center' }}>
//       {yr.dataUrl ? (
//         <Image src={yr.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
//       ) : (
//         <Text style={{ fontSize: 7, color: C.mute }}>raster unavailable</Text>
//       )}
//     </View>
//   </View>
// );

// chunk years into rows of three so page breaks fall between rows
const chunk3 = <T,>(arr: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 3) out.push(arr.slice(i, i + 3));
  return out;
};

/*
const NtlYearCard = ({ yr }: { yr: NtlTimelineYearData }) => {
  return (
    <View style={[s.panel, { marginTop: 10, padding: 8 }]} wrap={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.7, borderBottomColor: C.line, paddingBottom: 4, marginBottom: 6 }}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.navy }}>{yr.year} Night Light Luminosity Profile</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {yr.dataUrl ? (
          <View style={{ width: 100, height: 100, marginRight: 10, borderColor: C.line, borderWidth: 0.6, borderRadius: 4, padding: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}>
            <Image src={yr.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 5 }}>
          <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: 4, padding: 4 }}>
            <Text style={{ flex: 1.4, fontSize: 7.2, color: C.body }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>NTL Coverage: </Text>
              {yr.coverage.toFixed(2)}
            </Text>
            <Text style={{ flex: 1.3, fontSize: 7.2, color: C.body }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>YoY Change: </Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: yr.delta >= 0 ? C.pos : C.neg }}>
                {yr.delta >= 0 ? '+' : ''}{yr.delta.toFixed(2)} ({yr.pct >= 0 ? '+' : ''}{yr.pct.toFixed(1)}%)
              </Text>
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 7.5, color: C.body, lineHeight: 1.4 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: C.navy }}>Urbanization context: </Text>
              {yr.urbanization}
            </Text>
            <Text style={{ fontSize: 7.5, color: C.body, lineHeight: 1.4 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: C.navy }}>Economic footprint: </Text>
              {yr.economic}
            </Text>
            <Text style={{ fontSize: 7.5, color: C.body, lineHeight: 1.4 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: C.navy }}>Growth trend: </Text>
              {yr.trend}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
*/

const HotspotDetailCard = ({ hs, no }: { hs: HotspotDetail; no: number }) => {
  return (
    <View style={[s.panel, { marginTop: 12, padding: 10 }]} wrap={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.navy, paddingBottom: 4, marginBottom: 6 }}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.navy }}>
          Hotspot {no}: {hs.title}
        </Text>
        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.accent }}>
          {prettyCategory(hs.category).toUpperCase()} · {hs.settlementType.toUpperCase()}
        </Text>
      </View>

      {/* Stats metadata */}
      <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: 4, padding: 5, marginBottom: 6 }}>
        <Text style={{ flex: 1.2, fontSize: 7.3, color: C.body }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>Coordinates: </Text>
          {hs.lat.toFixed(4)}, {hs.lon.toFixed(4)}
        </Text>
        {hs.builtHa > 0 ? (
          <Text style={{ flex: 1, fontSize: 7.3, color: C.body }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>Built Area: </Text>
            {hs.builtHa.toFixed(1)} ha
          </Text>
        ) : null}
        <Text style={{ flex: 1, fontSize: 7.3, color: C.body }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>Confidence: </Text>
          {Math.round(hs.confidence * 100)}%
        </Text>
        <Text style={{ flex: 1, fontSize: 7.3, color: C.body }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', color: C.ink }}>Change Score: </Text>
          {Math.round(hs.score)}
        </Text>
      </View>

      {/* Explanations columns */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 7.3, fontFamily: 'Helvetica-Bold', color: C.accent, textTransform: 'uppercase', marginBottom: 2 }}>What changed</Text>
          <Text style={{ fontSize: 8, color: C.body, lineHeight: 1.45, textAlign: 'justify' }}>{hs.what.text}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 7.3, fontFamily: 'Helvetica-Bold', color: C.accent, textTransform: 'uppercase', marginBottom: 2 }}>How it changed</Text>
          <Text style={{ fontSize: 8, color: C.body, lineHeight: 1.45, textAlign: 'justify' }}>{hs.how.text}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 7.3, fontFamily: 'Helvetica-Bold', color: C.accent, textTransform: 'uppercase', marginBottom: 2 }}>Why it matters</Text>
          <Text style={{ fontSize: 8, color: C.body, lineHeight: 1.45, textAlign: 'justify' }}>{hs.why.text || hs.aiExplanation}</Text>
        </View>
      </View>

      {/* Images block — WHAT / HOW / WHY from WhatHowWhy_v2 */}
      {(hs.what.images[0] || hs.why.images[0]) ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 6.8, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Satellite Evidence</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {hs.what.images[0] ? (
              <View style={{ flex: 1, borderWidth: 0.6, borderColor: C.line, borderRadius: 4, overflow: 'hidden' }}>
                <Image src={hs.what.images[0]} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                <View style={{ backgroundColor: C.accentSoft, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'center' }}>WHAT Changed (Satellite Chip)</Text>
                </View>
              </View>
            ) : null}
            {hs.why.images[0] ? (
              <View style={{ flex: 1, borderWidth: 0.6, borderColor: C.line, borderRadius: 4, overflow: 'hidden' }}>
                {/* contain, not cover: context maps carry labels/legend that must stay visible */}
                <Image src={hs.why.images[0]} style={{ width: '100%', height: 100, objectFit: 'contain', backgroundColor: '#fff' }} />
                <View style={{ backgroundColor: '#EDF5ED', paddingVertical: 3 }}>
                  <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.pos, textAlign: 'center' }}>WHY It Matters (Context Map)</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* AI Observations and Planning Implications */}
      <View style={{ borderTopWidth: 0.6, borderTopColor: C.hair, marginTop: 8, paddingTop: 6, flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1.2 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase' }}>Observations & Key Findings</Text>
          <Text style={{ fontSize: 7.6, color: C.body, marginTop: 2, lineHeight: 1.4 }}>{hs.observations}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase' }}>Planning Implications</Text>
          <Text style={{ fontSize: 7.6, color: C.body, marginTop: 2, lineHeight: 1.4 }}>{hs.planningImplications}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Document ─────────────────────────────────────────────────────────────
export function DistrictReportDocument({
  data,
  mapImage,
  // lulcBefore,
  // lulcAfter,
}: {
  data: ReportData;
  mapImage?: string;
  lulcBefore?: LulcRasterImage;
  lulcAfter?: LulcRasterImage;
}) {
  const {
    district,
    generated,
    key,
    paragraphs,
    whw,
    lulc,
    lulcYearly,
    hotspots,
    gender,
    agePyramid,
    figures,
    toc,
    lulcTimeline,
    ntlTimeline,
    hotspotsDetailed,
    options,
    devContent,
    urbanRuralTimeline,
    ageCohorts,
  } = data;

  const secNo = (title: string) => String(toc.indexOf(title) + 1).padStart(2, '0');

  // deterministic figure / table numbering based on what exists
  const figOrder = (
    [
      options.populationProjection.enabled && options.populationProjection.populationChart && data.chart.length > 0 && 'projection',
      options.populationStructure.enabled && options.populationStructure.populationPyramid && agePyramid && 'pyramid',
      options.populationStructure.enabled && options.populationStructure.genderDistribution && gender && 'gender',
      options.urbanRuralComposition.enabled && options.urbanRuralComposition.urbanRuralChart && key?.u0 && key?.u1 && 'urban',
      // options.landUseAnalysis.enabled && options.landUseAnalysis.compositionAreaChart && lulcYearly && 'stacked',
      options.hotspotAnalysis.enabled && options.hotspotAnalysis.summaryFigures && whw.length > 0 && figures.rgbBeforeAfter && 'space',
      options.nightLightAnalysis.enabled && options.nightLightAnalysis.yearlyNtlMaps && ntlTimeline.length > 0 && 'nightlight',
    ] as (string | false | null | undefined)[]
  ).filter(Boolean) as string[];
  const fig = (k: string) => figOrder.indexOf(k) + 1;

  const tblOrder = (
    [
      options.populationProjection.enabled && options.populationProjection.growthTable && data.tableYears.length > 0 && 'projection',
      options.populationStructure.enabled && ageCohorts && ageCohorts.length > 0 && 'cohort_table',
      options.populationStructure.enabled && gender && 'gender_table',
      options.urbanRuralComposition.enabled && urbanRuralTimeline && urbanRuralTimeline.length > 0 && 'urban_table',
      options.landUseAnalysis.enabled && options.landUseAnalysis.landCoverTable && lulcYearly && 'lulc',
      // options.landUseAnalysis.enabled && options.landUseAnalysis.yearlyTimelineMaps && lulcTimeline.length > 0 && 'lulcTimeline',
      options.hotspotAnalysis.enabled && options.hotspotAnalysis.rankedHotspotsTable && hotspots && 'hotspots',
    ] as (string | false | null | undefined)[]
  ).filter(Boolean) as string[];
  const tbl = (k: string) => tblOrder.indexOf(k) + 1;

  // projection-chapter window: census anchor (2011) to the projection
  // horizon (2036), independent of the report's config start/end years
  const projWin = (() => {
    if (!data.model) return null;
    const ys = Object.keys(data.model).map(Number).sort((a, b) => a - b);
    if (!ys.length) return null;
    const y0 = data.model[2011] != null ? 2011 : ys[0];
    const y1 = data.model[2036] != null ? 2036 : ys[ys.length - 1];
    if (y1 <= y0) return null;
    const p0 = data.model[y0];
    const p1 = data.model[y1];
    return {
      y0,
      y1,
      p0,
      p1,
      inc: p1 - p0,
      cagr: (Math.pow(p1 / p0, 1 / (y1 - y0)) - 1) * 100,
    };
  })();

  // key messages for At a Glance
  const messages: string[] = [];
  if (key) {
    messages.push(
      `${district}'s population is projected to grow from ${fmtM(key.pop0)} in ${key.y0} to ${fmtM(key.pop1)} by ${key.y1}, an addition of ${fmtM(key.inc)} residents at ${key.cagr.toFixed(2)}% compound annual growth.`,
    );
    if (key.share0 != null && key.share1 != null && key.u0 && key.u1) {
      messages.push(
        `The urban share rises from ${key.share0.toFixed(1)}% to ${key.share1.toFixed(1)}%, adding ${fmtInt(key.u1.urban - key.u0.urban)} urban residents over the projection horizon.`,
      );
    }
  }
  if (hotspots) {
    messages.push(
      `Satellite change detection identifies ${hotspots.total} built-up hotspots adding ${fmtInt(hotspots.totalBuiltHa)} ha of new built area (2016–2024); the leading driver is ${prettyCategory(hotspots.topCategory).toLowerCase()}.`,
    );
  }
  if (lulc) {
    const built = lulc.rows.find((r) => /built/i.test(r.c));
    if (built) {
      messages.push(
        `Built area expanded from ${built.a.toFixed(0)} km² to ${built.b.toFixed(0)} km² between ${lulc.fy} and ${lulc.ly} (${built.pct >= 0 ? '+' : ''}${built.pct.toFixed(0)}%).`,
      );
    }
  }

  const runningHeader = (
    <View style={s.runHead} fixed>
      <Text style={s.runHeadText}>
        {district.toUpperCase()} · DISTRICT PROFILE {YEAR}
      </Text>
      <Text style={[s.runHeadText, { letterSpacing: 0.5 }]}>{BRAND}</Text>
    </View>
  );

  const runningFooter = (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        {SERIES} · {district}
      </Text>
      <Text style={s.pageNo} render={({ pageNumber }) => String(pageNumber)} />
    </View>
  );

  return (
    <Document title={`${district} District Profile ${YEAR}`} author={BRAND}>
      {/* ═══════════════ COVER ═══════════════ */}
      <Page size="A4" style={s.darkPage}>
        {/* photograph below the masthead band — pre-cropped to this exact aspect */}
        <View style={{ position: 'absolute', top: 66, left: 0, width: 595, height: 420 }}>
          <Image src={coverPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </View>
        {/* blend the photo into the navy title block */}
        <Svg width={595} height={142} style={{ position: 'absolute', top: 345, left: 0 }}>
          <Defs>
            <LinearGradient id="coverFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.night} stopOpacity={0} />
              <Stop offset="1" stopColor={C.night} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={595} height={142} fill="url(#coverFade)" />
        </Svg>
        {/* white masthead band with the UNFPA logo — UN publication convention */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 66,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 3,
            borderBottomColor: C.accent,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 44,
          }}
        >
          <Image src={unfpaLogo} style={{ width: 88, height: 30, objectFit: 'contain' }} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8.5, letterSpacing: 1.8, color: C.navy }}>
              {SERIES}
            </Text>
            <Text style={{ fontSize: 7, color: C.mute, marginTop: 2 }}>{BRAND}</Text>
          </View>
        </View>

        {/* title block on navy */}
        <View style={{ flex: 1, paddingTop: 496, paddingHorizontal: 44, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 26, height: 3, backgroundColor: C.accent, borderRadius: 1.5, marginRight: 9 }} />
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, letterSpacing: 3, color: C.accent }}>
              DISTRICT PROFILE
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Helvetica-Bold',
              fontSize: 56,
              color: C.white,
              letterSpacing: -1,
              lineHeight: 1.02,
              marginTop: 12,
            }}
          >
            {district}
          </Text>
          <Text style={{ fontSize: 10.5, color: C.nightText, marginTop: 12, lineHeight: 1.5 }}>
            A district profile of population dynamics, land-use change and landscape transformation
          </Text>

          <View style={{ flexGrow: 1 }} />

          {/* bottom bar */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: C.nightLine,
              paddingTop: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 7.5, color: C.nightMute }}>
              v01 | {generated.split(' ').slice(1).join(' ')}
            </Text>
          </View>
        </View>
      </Page>

      {/* ═══════════════ IMPRINT ═══════════════ */}
      <Page size="A4" style={s.lightPage}>
        <View style={{ flexGrow: 1 }} />
        <View style={{ maxWidth: 380 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.navy, marginBottom: 6 }}>
            {SERIES} · {district}
          </Text>
          <Text style={{ fontSize: 8, color: C.body, lineHeight: 1.65, marginBottom: 10 }}>
            The designations employed and the presentation of material in this publication do not
            imply the expression of any opinion whatsoever concerning the legal status of any
            country, territory, city or area or of its authorities, or concerning the delimitation
            of frontiers or boundaries. Figures are model-based estimates and may differ from
            official statistics; for planning-grade numbers, consult the primary sources listed in
            the technical notes.
          </Text>
          <Text style={{ fontSize: 7.5, color: C.mute, lineHeight: 1.6 }}>
            © {YEAR} {BRAND}.{'\n'}
            Cover photograph: UNFPA in Odisha.{'\n'}
            Generated {generated}.
          </Text>
        </View>
      </Page>

      {/* ═══════════════ CONTENTS ═══════════════ */}
      <Page size="A4" style={s.page}>
        {runningHeader}
        <View style={{ marginTop: 6 }}>
          <Text style={s.kicker}>{SERIES}</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 26, color: C.navy, marginTop: 6 }}>Contents</Text>
          <View style={{ width: 44, height: 3.5, backgroundColor: C.accent, borderRadius: 2, marginTop: 8, marginBottom: 20 }} />

          {toc.map((t, i) => (
            <View
              key={t}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: 10,
                borderBottomWidth: 0.7,
                borderBottomColor: C.hair,
              }}
            >
              <Text style={{ width: 40, fontFamily: 'Helvetica-Bold', fontSize: 15, color: C.accent }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.navy }}>{t}</Text>
                {SECTION_DESCRIPTIONS[t] ? (
                  <Text style={{ fontSize: 8.5, color: C.mute, marginTop: 2 }}>{SECTION_DESCRIPTIONS[t]}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        {runningFooter}
      </Page>

      {/* ═══════════════ CHAPTERS ═══════════════ */}
      <Page size="A4" style={s.page}>
        {runningHeader}

        {/* 01 Demographic Overview */}
        {options.demographicOverview.enabled && key ? (
          <View style={{ marginTop: 12 }}>
            <Chapter
              no={secNo('Demographic Overview')}
              title="Demographic Overview"
              desc={SECTION_DESCRIPTIONS['Demographic Overview']}
            />
            {options.demographicOverview.keyStatistics ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                {(
                  [
                    { value: fmtM(key.pop1), label: `Population, ${key.y1}`, sub: `Up from ${fmtM(key.pop0)} in ${key.y0}` },
                    { value: `+${fmtM(key.inc)}`, label: 'Residents added', sub: `${key.y0}–${key.y1} · ${key.cagr.toFixed(2)}% CAGR` },
                    key.share1 != null && {
                      value: `${key.share1.toFixed(1)}%`,
                      label: `Urban share, ${key.y1}`,
                      sub: key.share0 != null ? `Up from ${key.share0.toFixed(1)}% in ${key.y0}` : undefined,
                    },
                    key.d1 != null && {
                      value: String(Math.round(key.d1)),
                      label: `Density /km², ${key.y1}`,
                      sub: key.d0 != null ? `Up from ${Math.round(key.d0)} in ${key.y0}` : undefined,
                    },
                    hotspots && {
                      value: `${fmtInt(hotspots.totalBuiltHa)} ha`,
                      label: 'New built-up area',
                      sub: `Across ${hotspots.total} hotspots, 2016–2024`,
                    },
                    hotspots && {
                      value: prettyCategory(hotspots.topCategory),
                      label: 'Top change driver',
                      sub: 'Most frequent hotspot category',
                    },
                  ].filter(Boolean) as { value: string; label: string; sub?: string }[]
                ).map((h, i) => (
                  <Headline key={h.label} {...h} last={i % 3 === 2} />
                ))}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              {options.demographicOverview.summaryNarrative ? (
                <View style={{ flex: 1.4, paddingRight: (options.demographicOverview.districtBoundary && mapImage) ? 12 : 0 }}>
                  {paragraphs.map((p, i) => (
                    <Text key={i} style={s.para}>
                      {p}
                    </Text>
                  ))}
                </View>
              ) : null}
              {options.demographicOverview.districtBoundary && mapImage ? (
                <View style={{ width: 192 }}>
                  <View style={[s.panel, { padding: 7 }]}>
                    <Text style={s.panelLabel}>District boundary</Text>
                    <View style={{ height: 174, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, borderRadius: 5 }}>
                      <Image src={mapImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </View>
                    <Text style={s.source}>Platform boundary tiles; population choropleth basemap.</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 02 Population Projection & Growth */}
        {options.populationProjection.enabled && data.chart.length > 0 ? (
          <View style={{ marginTop: 24 }} wrap={false} break>
            <Chapter
              no={secNo('Population Projection & Growth')}
              title="Population Projection & Growth"
              desc={SECTION_DESCRIPTIONS['Population Projection & Growth']}
            />
            {options.populationProjection.populationNarrative && projWin ? (
              <Text style={s.para}>
                District populations are estimated annually from satellite-derived features by
                models trained on Census of India 2011 ground truth, and extended forward with
                district-level growth modelling. On this basis, {district}'s population grows from{' '}
                {fmtM(projWin.p0)} in {projWin.y0} to a projected {fmtM(projWin.p1)} by{' '}
                {projWin.y1}, an addition of {fmtM(projWin.inc)} residents at a compound annual
                growth rate of {projWin.cagr.toFixed(2)}%.
              </Text>
            ) : null}
            {options.populationProjection.populationChart ? (
              <View style={[s.panel, { marginTop: 2 }]}>
                <FigureHead
                  no={fig('projection')}
                  title={`Population trajectory, ${projWin ? `${projWin.y0}–${projWin.y1}` : key ? `${key.y0}–${key.y1}` : ''}`}
                />
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <LegendDot color={C.accent} label="Model" />
                  {data.hasCensus ? <LegendDot color={C.unblue} dashed label="Census projection" /> : null}
                </View>
                <ProjectionChart data={data} />
                <Source>Platform ML estimates anchored to Census of India 2011; census-based projection for comparison.</Source>
              </View>
            ) : null}

            {options.populationProjection.growthTable && data.tableYears.length ? (
              <View style={{ marginTop: 14 }}>
                <TableHead no={tbl('projection')} title="Population, density and growth at five-year intervals" />
                <View style={s.thead}>
                  <Text style={[s.th, { flex: 1, textAlign: 'left' }]}>Year</Text>
                  <Text style={[s.th, { flex: 1.6 }]}>Population</Text>
                  <Text style={[s.th, { flex: 1.2 }]}>Density /km²</Text>
                  <Text style={[s.th, { flex: 1.1 }]}>YoY growth</Text>
                </View>
                {data.tableYears.map((y, i, arr) => (
                  <View key={y} style={[s.tr, ...(i === arr.length - 1 ? [s.trLast] : [])]}>
                    <Text style={[s.td, s.tdL, { flex: 1 }]}>{y}</Text>
                    <Text style={[s.td, { flex: 1.6 }]}>{data.model ? fmtInt(data.model[y]) : '–'}</Text>
                    <Text style={[s.td, { flex: 1.2 }]}>{data.stats?.[String(y)]?.density != null ? data.stats[String(y)].density.toFixed(1) : '–'}</Text>
                    <Text style={[s.td, { flex: 1.1 }]}>{data.stats?.[String(y)]?.growth != null ? `${data.stats[String(y)].growth!.toFixed(2)}%` : '–'}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 03 Population Structure */}
        {options.populationStructure.enabled && (agePyramid || gender) ? (
          <View style={{ marginTop: 24 }} wrap={false} break>
            <Chapter
              no={secNo('Population Structure')}
              title="Population Structure"
              desc={SECTION_DESCRIPTIONS['Population Structure']}
            />
            <View style={{ flexDirection: 'row' }}>
              {options.populationStructure.populationPyramid && agePyramid ? (
                <View style={[s.panel, { flex: 1.5, marginRight: (options.populationStructure.genderDistribution && gender) ? 12 : 0 }]}>
                  <FigureHead no={fig('pyramid')} title={`Population pyramid, ${agePyramid.year}`} />
                  <AgePyramidChart pyramid={agePyramid} />
                  <Source>Population Projections using Bayesian Method.</Source>
                </View>
              ) : null}
              {options.populationStructure.genderDistribution && gender ? (
                <View style={[s.panel, { flex: 1 }]}>
                  <FigureHead no={fig('gender')} title="Gender balance" />
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 25, color: C.navy }}>
                      {Math.round(gender.ratio1)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: gender.ratio1 >= gender.ratio0 ? '#E7F3EC' : '#FBEAEA',
                        borderRadius: 3,
                        paddingVertical: 2,
                        paddingHorizontal: 6,
                        marginLeft: 8,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 7.2,
                          fontFamily: 'Helvetica-Bold',
                          color: gender.ratio1 >= gender.ratio0 ? C.pos : C.neg,
                        }}
                      >
                        {gender.ratio1 >= gender.ratio0 ? '+' : ''}
                        {(gender.ratio1 - gender.ratio0).toFixed(0)} vs {gender.y0}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 7.3, color: C.body, marginBottom: 8 }}>
                    females per 1,000 males by {gender.y1}
                  </Text>
                  <SexRatioTrend gender={gender} />
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', height: 13, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${(gender.m1 / (gender.m1 + gender.f1)) * 100}%`, backgroundColor: C.unblue }} />
                      <View style={{ flex: 1, backgroundColor: C.accent }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 6.8, color: C.body, fontFamily: 'Helvetica-Bold' }}>
                        Male {fmtM(gender.m1)}
                      </Text>
                      <Text style={{ fontSize: 6.8, color: C.body, fontFamily: 'Helvetica-Bold' }}>
                        Female {fmtM(gender.f1)}
                      </Text>
                    </View>
                  </View>
                  <Source>Population Projections using Bayesian Method.</Source>
                </View>
              ) : null}
            </View>
            {options.populationStructure.ageComposition && (
              <Text style={[s.para, { marginTop: 10 }]}>
                The cohort dynamics indicate an ongoing demographic transition. The narrowing base of the pyramid reflects declining birth rates, while the expanding middle cohorts represent a growing demographic window. SEX RATIO tracks females per 1000 males; higher values denote positive female balance.
              </Text>
            )}

            {ageCohorts && ageCohorts.length > 0 ? (
              <View style={{ marginTop: 12 }} wrap={false}>
                <TableHead no={tbl('cohort_table')} title="Age cohort distribution and dependency trends at five-year intervals" />
                <View style={s.thead}>
                  <Text style={[s.th, { flex: 1, textAlign: 'left' }]}>Year</Text>
                  <Text style={[s.th, { flex: 1.8 }]}>0–14 Pop (Youth)</Text>
                  <Text style={[s.th, { flex: 1.8 }]}>15–59 Pop (Active)</Text>
                  <Text style={[s.th, { flex: 1.8 }]}>60+ Pop (Aging)</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Dependency Ratio (%)</Text>
                </View>
                {ageCohorts.map((ac, idx, arr) => (
                  <View key={ac.year} style={[s.tr, ...(idx === arr.length - 1 ? [s.trLast] : [])]}>
                    <Text style={[s.td, s.tdL, { flex: 1 }]}>{ac.year}</Text>
                    <Text style={[s.td, { flex: 1.8 }]}>{fmtInt(ac.children)} ({ac.childrenPct.toFixed(1)}%)</Text>
                    <Text style={[s.td, { flex: 1.8 }]}>{fmtInt(ac.working)} ({ac.workingPct.toFixed(1)}%)</Text>
                    <Text style={[s.td, { flex: 1.8 }]}>{fmtInt(ac.elderly)} ({ac.elderlyPct.toFixed(1)}%)</Text>
                    <Text style={[s.td, { flex: 1.5, fontFamily: 'Helvetica-Bold', color: C.accent }]}>{ac.dependency.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {gender ? (
              <View style={{ marginTop: 12 }} wrap={false}>
                <TableHead no={tbl('gender_table')} title="Gender balance and sex ratio trend at five-year intervals" />
                <View style={s.thead}>
                  <Text style={[s.th, { flex: 1, textAlign: 'left' }]}>Year</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Male population</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Female population</Text>
                  <Text style={[s.th, { flex: 1.8 }]}>Sex ratio (females/1k males)</Text>
                </View>
                {gender.trend.map((t, idx, arr) => (
                  <View key={t.year} style={[s.tr, ...(idx === arr.length - 1 ? [s.trLast] : [])]}>
                    <Text style={[s.td, s.tdL, { flex: 1 }]}>{t.year}</Text>
                    <Text style={[s.td, { flex: 1.5 }]}>{t.male ? fmtInt(t.male) : '—'}</Text>
                    <Text style={[s.td, { flex: 1.5 }]}>{t.female ? fmtInt(t.female) : '—'}</Text>
                    <Text style={[s.td, { flex: 1.8, fontFamily: 'Helvetica-Bold', color: C.navy }]}>{t.ratio.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 04 Urban & Rural (Commented Out) */}
        {/*
        {options.urbanRuralComposition.enabled && key?.u0 && key?.u1 ? (
          <View style={{ marginTop: 24 }} wrap={false}>
            <Chapter
              no={secNo('Urban & Rural Composition')}
              title="Urban & Rural Composition"
              desc={SECTION_DESCRIPTIONS['Urban & Rural Composition']}
            />
            <View style={{ flexDirection: 'row' }}>
              {options.urbanRuralComposition.urbanRuralChart ? (
                <View style={[s.panel, { flex: 1.55, marginRight: (options.urbanRuralComposition.urbanRuralStatsTable) ? 12 : 0, justifyContent: 'center' }]}>
                  <FigureHead no={fig('urban')} title="Urban share of population" />
                  <UrbanRuralBars
                    rows={[
                      { yr: key.y0, u: key.u0.urban, r: key.u0.rural },
                      { yr: key.y1, u: key.u1.urban, r: key.u1.rural },
                    ]}
                  />
                  <Source>Modelled urban/rural split.</Source>
                </View>
              ) : null}
              {options.urbanRuralComposition.urbanRuralStatsTable ? (
                <View style={[s.panel, { flex: 1, paddingVertical: 4 }]}>
                  <DeltaRow
                    label={`Urban, ${key.y0} - ${key.y1}`}
                    value={`+${fmtInt(key.u1.urban - key.u0.urban)}`}
                    sub={`${fmtInt(key.u0.urban)} to ${fmtInt(key.u1.urban)}`}
                    color={C.accent}
                  />
                  <DeltaRow
                    label={`Rural, ${key.y0} - ${key.y1}`}
                    value={`${key.u1.rural - key.u0.rural >= 0 ? '+' : ''}${fmtInt(key.u1.rural - key.u0.rural)}`}
                    sub={`${fmtInt(key.u0.rural)} to ${fmtInt(key.u1.rural)}`}
                  />
                  <DeltaRow
                    label="Urban share shift"
                    value={key.share0 != null && key.share1 != null ? `+${(key.share1 - key.share0).toFixed(1)} pts` : '–'}
                    sub={
                      key.share0 != null && key.share1 != null
                        ? `${key.share0.toFixed(1)}% to ${key.share1.toFixed(1)}%`
                        : undefined
                    }
                    color={C.accent}
                  />
                </View>
              ) : null}
            </View>
            {options.urbanRuralComposition.urbanRuralNarrative ? (
              <View style={[s.callout, { marginTop: 10 }]}>
                <Text style={s.calloutText}>
                  Urban population grows by {fmtInt(key.u1.urban - key.u0.urban)} over the horizon
                  {key.share0 != null && key.share1 != null
                    ? `, lifting the urban share by ${(key.share1 - key.share0).toFixed(1)} percentage points, a structural shift that concentrates service-delivery demand in towns and peri-urban belts.`
                    : '.'}
                </Text>
              </View>
            ) : null}

            {urbanRuralTimeline && urbanRuralTimeline.length > 0 ? (
              <View style={{ marginTop: 12 }} wrap={false}>
                <TableHead no={tbl('urban_table')} title="Urban and rural population composition at five-year intervals" />
                <View style={s.thead}>
                  <Text style={[s.th, { flex: 1, textAlign: 'left' }]}>Year</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Urban population</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Rural population</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Total population</Text>
                  <Text style={[s.th, { flex: 1.2 }]}>Urban share (%)</Text>
                </View>
                {urbanRuralTimeline.map((item, idx, arr) => (
                  <View key={item.year} style={[s.tr, ...(idx === arr.length - 1 ? [s.trLast] : [])]}>
                    <Text style={[s.td, s.tdL, { flex: 1 }]}>{item.year}</Text>
                    <Text style={[s.td, { flex: 1.5 }]}>{fmtInt(item.urban)}</Text>
                    <Text style={[s.td, { flex: 1.5 }]}>{fmtInt(item.rural)}</Text>
                    <Text style={[s.td, { flex: 1.5 }]}>{fmtInt(item.total)}</Text>
                    <Text style={[s.td, { flex: 1.2, fontFamily: 'Helvetica-Bold', color: C.accent }]}>{item.share.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
        */}

        {/* 05 Land Use Analysis */}
        {options.landUseAnalysis.enabled && (lulcYearly || lulc || lulcTimeline.length > 0) ? (
          <View style={{ marginTop: 24 }} break>
            <Chapter
              no={secNo('Land Use Analysis')}
              title="Land Use Analysis"
              desc={SECTION_DESCRIPTIONS['Land Use Analysis']}
            />

            <Text style={s.para}>
              The land use and land cover (LULC) dynamics are monitored using the ESRI 10-metre Annual Land Cover dataset (Sentinel-2), representing classifications of water, trees, flooded vegetation, crops, built area, bare ground, and rangeland. Tracking class-wise area changes over annual increments from 2017 to 2025 reveals structural shifts, resource consumption pathways, and developmental footprints.
            </Text>

            {/* {options.landUseAnalysis.compositionAreaChart && lulcYearly ? (
              <View style={[s.panel, { marginTop: 12 }]} wrap={false}>
                <FigureHead no={fig('stacked')} title="Land-cover composition over time (km²)" />
                <LulcStackedArea data={lulcYearly} />
                <SwatchLegend items={lulcYearly.classes.map((c) => ({ label: c, color: lulcColor(c) }))} />
                <Source>ESRI 10 m Annual Land Cover, district statistics.</Source>
              </View>
            ) : null} */}

            {/* Annual land cover maps — one card per year, change table below */}
            {options.landUseAnalysis.yearlyTimelineMaps && lulcTimeline.length > 0 ? (
              <View style={{ marginTop: 14 }}>
                <View style={s.subHead}>
                  <View style={s.subHeadBar} />
                  <Text style={s.subHeadTitle}>
                    Annual Land Cover Timeline ({lulcTimeline[0].year}–
                    {lulcTimeline[lulcTimeline.length - 1].year})
                  </Text>
                  <View style={{ flex: 1, height: 0.8, backgroundColor: C.line, marginLeft: 10 }} />
                </View>
                <Text style={{ fontSize: 8.5, color: C.mute, marginBottom: 8 }}>
                  Classified land cover for each year, rendered from the annual 10 m rasters.
                </Text>

                {/* 3x3 grid of maps, three per row */}
                {chunk3(lulcTimeline).map((row, ri) => (
                  <View key={ri} style={{ flexDirection: 'row', marginBottom: 8 }} wrap={false}>
                    {row.map((yr, i) => (
                      <View
                        key={yr.year}
                        style={{
                          flex: 1,
                          height: 120, // Explicit height to prevent collapse
                          marginLeft: i > 0 ? 8 : 0,
                          borderWidth: 0.8,
                          borderColor: C.line,
                          borderRadius: 6,
                          overflow: 'hidden',
                          backgroundColor: '#fff',
                        }}
                      >
                        <View style={{ backgroundColor: C.navy, paddingVertical: 3.5 }}>
                          <Text style={{ color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'center', letterSpacing: 1 }}>
                            {yr.year}
                          </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: C.bg, padding: 4, justifyContent: 'center', alignItems: 'center' }}>
                          {yr.dataUrl ? (
                            <Image src={yr.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <Text style={{ fontSize: 7, color: C.mute }}>raster unavailable</Text>
                          )}
                        </View>
                      </View>
                    ))}
                    {row.length < 3
                      ? Array.from({ length: 3 - row.length }, (_, i) => (
                        <View key={`sp${i}`} style={{ flex: 1, marginLeft: 8 }} />
                      ))
                      : null}
                  </View>
                ))}

                <SwatchLegend
                  items={Object.entries(LULC_COLORS)
                    .filter(([c]) => !/snow|cloud/i.test(c))
                    .map(([label, color]) => ({ label, color }))}
                />
              </View>
            ) : null}

            {options.landUseAnalysis.landCoverTable && lulcYearly ? (
              <View style={{ marginTop: 14 }} wrap={false}>
                <TableHead no={tbl('lulc')} title="Class-wise area (km²)" />
                {/* Header row */}
                <View style={[s.thead, { borderTopColor: C.navy, borderTopWidth: 1.2 }]}>
                  <Text style={[s.th, { width: '14%', textAlign: 'left', fontSize: 6 }]}>Class</Text>
                  {lulcYearly.years.map((y) => (
                    <Text key={y} style={[s.th, { flex: 1, fontSize: 5.8 }]}>{y}</Text>
                  ))}
                </View>
                {/* Data rows */}
                {lulcYearly.classes.map((cls, ci, carr) => {
                  const isBuilt = /built/i.test(cls);
                  const vals = lulcYearly.series[cls] || [];
                  return (
                    <View key={cls} style={[s.tr, ...(ci === carr.length - 1 ? [s.trLast] : [])]}>
                      <Text style={[s.td, s.tdL, { width: '14%', fontSize: 6.5, color: C.ink }]}>{cls}</Text>
                      {vals.map((v, vi) => {
                        const prev = vi > 0 ? vals[vi - 1] : v;
                        const isLast = vi === vals.length - 1;
                        const growth = prev > 0 ? ((v - prev) / prev) * 100 : 0;
                        return (
                          <Text
                            key={vi}
                            style={[s.td, {
                              flex: 1, fontSize: 6.2,
                              color: isLast && isBuilt ? C.accent : isLast && growth > 3 ? C.pos : isLast && growth < -3 ? C.neg : C.body,
                              fontFamily: isLast ? 'Helvetica-Bold' : 'Helvetica',
                            }]}
                          >
                            {v > 0 ? v.toFixed(1) : '—'}
                          </Text>
                        );
                      })}
                    </View>
                  );
                })}
                <Source>ESRI 10 m Annual Land Cover (Sentinel-2), district statistics 2017–2025.</Source>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 06 Night Light Analysis */}
        {options.nightLightAnalysis.enabled && ntlTimeline.length > 0 ? (
          <View style={{ marginTop: 24 }} break>
            <Chapter
              no={secNo('Night Light Analysis')}
              title="Night Light Analysis"
              desc={SECTION_DESCRIPTIONS['Night Light Analysis']}
            />
            {options.nightLightAnalysis.yearlyNtlMaps ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy, marginBottom: 2 }}>
                  Night Light Profiles (2012–2026)
                </Text>
                <Text style={{ fontSize: 8, color: C.mute, marginBottom: 6 }}>
                  Alternate years shown.
                </Text>
                {/* maps grid, alternate years only, three per row */}
                {chunk3(ntlTimeline.filter((yr) => Number(yr.year) % 2 === 0)).map((row, ri) => (
                  <View key={ri} style={{ flexDirection: 'row', marginBottom: 8 }} wrap={false}>
                    {row.map((yr, i) => (
                      <View
                        key={yr.year}
                        style={{
                          flex: 1,
                          // Explicit height to prevent collapse; 112 (not 120) so the section
                          // does not fill the page exactly: an exactly-full page makes the
                          // next section's break emit a blank page.
                          height: 112,
                          marginLeft: i > 0 ? 8 : 0,
                          borderWidth: 0.8,
                          borderColor: C.line,
                          borderRadius: 6,
                          overflow: 'hidden',
                          backgroundColor: '#fff',
                        }}
                      >
                        <View style={{ backgroundColor: C.navy, paddingVertical: 3.5 }}>
                          <Text style={{ color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8, textAlign: 'center', letterSpacing: 1 }}>
                            {yr.year}
                          </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#020617', padding: 4, justifyContent: 'center', alignItems: 'center' }}>
                          {yr.dataUrl ? (
                            <Image src={yr.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <Text style={{ fontSize: 7, color: C.mute }}>raster unavailable</Text>
                          )}
                        </View>
                      </View>
                    ))}
                    {row.length < 3
                      ? Array.from({ length: 3 - row.length }, (_, i) => (
                        <View key={`sp${i}`} style={{ flex: 1, marginLeft: 8 }} />
                      ))
                      : null}
                  </View>
                ))}
              </View>
            ) : null}

            {options.nightLightAnalysis.brightnessStatisticsTable ? (
              <View style={[s.panel, { padding: 8, marginTop: 14 }]} wrap={false}>
                <FigureHead no={fig('nightlight')} title="Nocturnal luminosity growth profile (VIIRS), 2012–2026" />
                <View style={{ flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: C.line, paddingBottom: 3, marginBottom: 4 }}>
                  <Text style={{ flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy }}>Year</Text>
                  <Text style={{ flex: 1.8, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'right' }}>NTL Coverage (sum)</Text>
                  <Text style={{ flex: 1.5, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'right' }}>YoY Change</Text>
                  <Text style={{ flex: 1.5, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'right' }}>YoY Change (%)</Text>
                </View>
                {ntlTimeline.filter((yr) => Number(yr.year) % 2 === 0).map((yr) => (
                  <View key={yr.year} style={{ flexDirection: 'row', paddingVertical: 2, borderBottomWidth: 0.4, borderBottomColor: C.hair }}>
                    <Text style={{ flex: 1, fontSize: 7, color: C.ink, fontFamily: 'Helvetica-Bold' }}>{yr.year}</Text>
                    <Text style={{ flex: 1.8, fontSize: 7, color: C.body, textAlign: 'right' }}>{yr.coverage.toFixed(2)}</Text>
                    <Text style={{ flex: 1.5, fontSize: 7, color: yr.delta >= 0 ? C.pos : C.neg, fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>
                      {yr.delta >= 0 ? '+' : ''}{yr.delta.toFixed(2)}
                    </Text>
                    <Text style={{ flex: 1.5, fontSize: 7, color: yr.delta >= 0 ? C.pos : C.neg, fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>
                      {yr.pct >= 0 ? '+' : ''}{yr.pct.toFixed(1)}%
                    </Text>
                  </View>
                ))}
                <Source>VIIRS Night-time Day/Night Band (DNB) composites — total luminosity coverage aggregated annually per district (same data as MapCompare dashboard).</Source>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 07 Areas of Rapid Change */}
        {options.hotspotAnalysis.enabled && (hotspots || hotspotsDetailed.length > 0) ? (
          <View style={{ marginTop: 24 }} break>
            <Chapter
              no={secNo('Areas of Rapid Change')}
              title="Areas of Rapid Change"
              desc={SECTION_DESCRIPTIONS['Areas of Rapid Change']}
            />
            {options.hotspotAnalysis.summaryFigures && hotspots ? (
              <Text style={[s.para, { marginTop: 6 }]}>
                Using Sentinel-2 temporal stacks, we identify one-square-kilometre cells experiencing rapid built-up transitions. Over the monitoring horizon, built-up surfaces in {district} expanded by {fmtInt(hotspots.totalBuiltHa)} hectares, primarily concentrated in {prettyCategory(hotspots.topCategory).toLowerCase()} developments.
              </Text>
            ) : null}

            {options.hotspotAnalysis.rankedHotspotsTable && hotspots ? (
              <View style={{ marginTop: 14 }} wrap={false}>
                <TableHead no={tbl('hotspots')} title="Top change hotspots ranked by spectral change score" />
                <View style={s.thead}>
                  <Text style={[s.th, { flex: 0.8, textAlign: 'left' }]}>ID</Text>
                  <Text style={[s.th, { flex: 1.8, textAlign: 'left' }]}>Category</Text>
                  <Text style={[s.th, { flex: 2.2, textAlign: 'left' }]}>Settlement setting</Text>
                  <Text style={[s.th, { flex: 1.2 }]}>New built (ha)</Text>
                  <Text style={[s.th, { flex: 1 }]}>Score</Text>
                  <Text style={[s.th, { flex: 1 }]}>Conf.</Text>
                </View>
                {hotspots.list.slice(0, 5).map((h, i, arr) => (
                  <View key={h.id} style={[s.tr, ...(i === arr.length - 1 ? [s.trLast] : [])]}>
                    <Text style={[s.td, s.tdL, { flex: 0.8 }]}>{String(h.id).padStart(2, '0')}</Text>
                    <View style={{ flex: 1.8, flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: catColor(h.category), marginRight: 5 }} />
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ink }}>{prettyCategory(h.category)}</Text>
                    </View>
                    <Text style={[s.td, { flex: 2.2, color: C.body, textTransform: 'capitalize' }]}>{h.settlement.replace(/_/g, ' ')}</Text>
                    <Text style={[s.td, { flex: 1.2 }]}>{h.builtHa.toFixed(1)}</Text>
                    <Text style={[s.td, { flex: 1 }]}>{Math.round(h.score)}</Text>
                    <Text style={[s.td, { flex: 1, color: C.mute }]}>{Math.round(h.confidence * 100)}%</Text>
                  </View>
                ))}
                <Source>Platform hotspot ranking; Sentinel-2 change detection.</Source>
              </View>
            ) : null}

            {/* Detailed Hotspots Grid */}
            {hotspotsDetailed.length > 0 ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.navy, marginBottom: 4 }}>
                  Detailed Analysis of Major Growth Hotspots
                </Text>
                {hotspotsDetailed.slice(0, 5).map((hs, idx) => (
                  <HotspotDetailCard key={hs.id} hs={hs} no={idx + 1} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 09 Development Activities & Insights */}
        {options.developmentActivities.enabled && devContent ? (
          <View style={{ marginTop: 24 }} break>
            <Chapter
              no={secNo('Development Activities & Insights')}
              title="Development Activities & Insights"
              desc={SECTION_DESCRIPTIONS['Development Activities & Insights']}
            />
            {options.developmentActivities.activities && devContent.activities ? (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.navy, textTransform: 'uppercase', marginBottom: 6 }}>Key Development Activities</Text>
                {devContent.activities.map((card) => (
                  <View key={card.title} style={s.devCard} wrap={false}>
                    <Text style={s.devCardTitle}>{card.title}</Text>
                    <Text style={s.devCardText}>{card.text}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {options.developmentActivities.insights && devContent.insights ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.navy, textTransform: 'uppercase', marginBottom: 6 }}>Planning Insights & Strategy</Text>
                {devContent.insightsIntro ? (
                  <Text style={[s.para, { marginBottom: 8 }]}>{devContent.insightsIntro}</Text>
                ) : null}
                {devContent.insights.map((card) => (
                  <View key={card.title} style={s.devCard} wrap={false}>
                    <Text style={s.insightCardTitle}>{card.title}</Text>
                    <Text style={s.devCardText}>{card.text}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {runningFooter}
      </Page>

      {/* ═══════════════ TECHNICAL NOTES ═══════════════ */}
      <Page size="A4" style={s.page}>
        {runningHeader}
        <Chapter
          no={secNo('Technical Notes & Sources')}
          title="Technical Notes & Sources"
          desc={SECTION_DESCRIPTIONS['Technical Notes & Sources']}
        />

        <Text style={[s.para, { marginBottom: 14 }]}>
          This annex explains how every figure in this profile is produced, defines the
          abbreviations used throughout, and lists the primary data sources. All indicators are
          generated through one reproducible pipeline applied uniformly to every district of
          Odisha, so profiles remain directly comparable across the series.
        </Text>

        {/* A. Technical notes — one note per analytical chapter */}
        {options.technicalNotes.notes ? (
          <>
            <View style={s.subHead}>
              <View style={s.subHeadBar} />
              <Text style={s.subHeadTitle}>Technical notes</Text>
              <View style={{ flex: 1, height: 0.8, backgroundColor: C.line, marginLeft: 10 }} />
            </View>
            {(
              [
                {
                  n: '1.',
                  t: 'Population estimation, 2011-2025',
                  b: 'Annual district populations are estimated by machine-learning models (CatBoost and LightGBM) trained on Census of India 2011 ground truth, using satellite-derived features for each year: spectral indices (NDVI, NDBI and related), land surface temperature, VIIRS night-light radiance and land-cover class areas, reduced to per-district values by zonal statistics. Models are validated with leave-one-out and spatially blocked splits; the best 2021 score is R² = 0.91, with back-tests for 2012-2020 holding R² between 0.77 and 0.92.',
                },
                {
                  n: '2.',
                  t: 'Population projection, 2026-2036',
                  b: 'A log-linear growth model is fitted to the most recent estimated years of each district and applied geometrically to 2036, reconciled with the state aggregate. WorldPop and UNFPA series are reserved strictly for independent validation and never enter the models; the projected series agrees with these references to within ±5%. CAGR, density and the urban/rural split are computed from the combined 2011-2036 series.',
                },
                {
                  n: '3.',
                  t: 'Population structure',
                  b: 'The age-sex composition uses the modelled single-year age and sex distribution, aggregated to ten-year cohorts. The sex ratio is expressed as females per 1,000 males across the full 2011-2036 horizon. Unless stated otherwise, the population pyramid refers to 2025.',
                },
                {
                  n: '4.',
                  t: 'Land use and land cover (LULC)',
                  b: 'Land-cover statistics, the annual timeline cards and the raster maps derive from the ESRI 10 m Annual Land Cover product, which classifies Copernicus Sentinel-2 imagery into nine classes. All statistics are computed within the district boundary. Rasters in this profile are rendered directly from the same COG files that serve the online platform, with an identical class palette, so print matches screen exactly.',
                },
                {
                  n: '5.',
                  t: 'Night-time lights (NTL)',
                  b: 'The luminosity analysis uses VIIRS DNB radiance composites clipped to the district. Night-light intensity is among the strongest single predictors of population (r = 0.79 at district level). Mean and maximum radiance are reported per year, with year-on-year change as an indicator of electrification and settlement intensification. Radiance can saturate over dense urban cores and under-detect low-intensity rural lighting.',
                },
                {
                  n: '6.',
                  t: 'Built-up change hotspots',
                  b: 'Hotspots are one-square-kilometre cells ranked by a spectral change score, a standardised z-score of change computed from Sentinel-2 imagery between 2016 and 2024. Each hotspot carries the extent of newly built-up area, its dominant land-cover transition, a probable driver category (urban sprawl, industry, mining or infrastructure) attributed from a curated driver registry and OpenStreetMap features, and a confidence estimate, documented with before-and-after imagery.',
                },
                {
                  n: '7.',
                  t: 'Development activities and insights',
                  b: 'The development narratives combine the satellite change detections above with curated district context (major projects, infrastructure programmes and economic drivers). They are qualitative interpretations intended for orientation, not statements of official project status.',
                },
              ] as { n: string; t: string; b: string }[]
            ).map((m) => (
              <View key={m.t} style={{ marginBottom: 11 }} wrap={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.accent, marginRight: 7 }}>
                    {m.n}
                  </Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.navy }}>{m.t}</Text>
                </View>
                <Text style={{ fontSize: 8.7, color: C.body, lineHeight: 1.6, textAlign: 'justify' }}>{m.b}</Text>
              </View>
            ))}
          </>
        ) : null}

        {/* B. Abbreviations glossary */}
        <View style={s.subHead} wrap={false}>
          <View style={s.subHeadBar} />
          <Text style={s.subHeadTitle}>Abbreviations & terms</Text>
          <View style={{ flex: 1, height: 0.8, backgroundColor: C.line, marginLeft: 10 }} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 4 }} wrap={false}>
          {(() => {
            const GLOSSARY: [string, string][] = [
              ['CAGR', 'Compound Annual Growth Rate, the constant yearly growth rate over a period'],
              ['COG', 'Cloud-Optimized GeoTIFF, a raster format streamed efficiently over the web'],
              ['DEGURBA', 'Degree of Urbanisation, the UN standard settlement classification'],
              ['DNB', 'Day/Night Band, the low-light sensor band of VIIRS'],
              ['GADM', 'Database of Global Administrative Areas (boundary dataset)'],
              ['GHS-SMOD', 'Global Human Settlement Model settlement layer (European Commission JRC)'],
              ['ha', 'Hectare, 10,000 m² (0.01 km²)'],
              ['L2A', 'Sentinel-2 processing level: atmospherically corrected surface reflectance'],
              ['LST', 'Land Surface Temperature, derived from satellite thermal bands'],
              ['LULC', 'Land Use / Land Cover, the classification of what covers the land surface'],
              ['NDBI', 'Normalized Difference Built-up Index, a spectral measure of built surfaces'],
              ['NDVI', 'Normalized Difference Vegetation Index, a spectral measure of vegetation'],
              ['NTL', 'Night-Time Lights, satellite-measured night light radiance'],
              ['OSM', 'OpenStreetMap, the open collaborative map of infrastructure and places'],
              ['UNFPA', 'United Nations Population Fund'],
              ['VIIRS', 'Visible Infrared Imaging Radiometer Suite, the NOAA/NASA satellite sensor'],
              ['WorldPop', 'University of Southampton programme producing gridded population datasets'],
              ['z-score', 'A standardised measure of how far a value deviates from the average'],
            ];
            const half = Math.ceil(GLOSSARY.length / 2);
            const cols = [GLOSSARY.slice(0, half), GLOSSARY.slice(half)];
            return cols.map((col, ci) => (
              <View key={ci} style={{ flex: 1, marginLeft: ci > 0 ? 14 : 0 }}>
                {col.map(([term, def]) => (
                  <View key={term} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <Text style={{ width: 52, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy }}>
                      {term}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 8, color: C.body, lineHeight: 1.45 }}>{def}</Text>
                  </View>
                ))}
              </View>
            ));
          })()}
        </View>

        {/* C. Data sources table */}
        {options.technicalNotes.sources ? (
          <View style={{ marginTop: 14 }} wrap={false}>
            <View style={s.subHead}>
              <View style={s.subHeadBar} />
              <Text style={s.subHeadTitle}>Data sources</Text>
              <View style={{ flex: 1, height: 0.8, backgroundColor: C.line, marginLeft: 10 }} />
            </View>
            <View style={[s.thead, { marginTop: 4 }]}>
              <Text style={[s.th, { flex: 1.5, textAlign: 'left' }]}>Source</Text>
              <Text style={[s.th, { flex: 1.6, textAlign: 'left' }]}>Provider</Text>
              <Text style={[s.th, { flex: 2.1, textAlign: 'left' }]}>Used for</Text>
            </View>
            {(
              [
                ['Census of India 2011', 'Office of the Registrar General & Census Commissioner, India', 'Ground truth for model training; anchor for the full 2011-2036 series'],
                ['Landsat 5/7/8 imagery', 'USGS / NASA', 'Annual spectral indices and LST as features for the ML estimation models'],
                ['Sentinel-2 L2A imagery', 'ESA Copernicus', 'Land-use change detection, hotspot ranking and before/after imagery'],
                ['VIIRS Nighttime Lights (DNB)', 'NOAA / NASA', 'Settlement-intensity proxy; one of the strongest population predictors (r = 0.79)'],
                ['ESRI 10 m Annual Land Cover', 'Esri Living Atlas', 'LULC classes, model features, transition and built-expansion analysis'],
                ['GHS-SMOD Settlement Model', 'European Commission JRC', 'Degree-of-Urbanisation settlement layers across five epochs'],
                ['OpenStreetMap infrastructure', 'OpenStreetMap contributors', 'Roads, mines, plants and settlements used to attribute hotspot drivers'],
                ['GADM v4.1 boundaries', 'GADM', 'Analysis units for zonal statistics, aggregation and mapping'],
                ['WorldPop R2025A', 'WorldPop, University of Southampton', 'Independent validation of population levels and growth trends'],
                ['UNFPA population projections', 'United Nations Population Fund', 'Independent validation of the estimated and predicted series'],
              ] as [string, string, string][]
            ).map(([src, prov, use], i, arr) => (
              <View key={src} style={[s.tr, ...(i === arr.length - 1 ? [s.trLast] : [])]}>
                <Text style={[s.td, s.tdL, { flex: 1.5 }]}>{src}</Text>
                <Text style={[s.td, { flex: 1.6, textAlign: 'left', color: C.body }]}>{prov}</Text>
                <Text style={[s.td, { flex: 2.1, textAlign: 'left', color: C.body }]}>{use}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={{ fontSize: 7.3, color: C.mute, marginTop: 14, lineHeight: 1.55 }}>
          Figures in this profile are model-based estimates generated on {generated} by the {BRAND}. They may
          differ from official statistics; for planning-grade numbers, consult the primary sources listed above.
        </Text>
        {runningFooter}
      </Page>

      {/* ═══════════════ BACK COVER ═══════════════ */}
      <Page size="A4" style={s.darkPage}>
        <View style={{ flex: 1, padding: 44 }}>
          <View style={{ flexGrow: 1 }} />
          <View>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 6,
                paddingVertical: 9,
                paddingHorizontal: 12,
                alignSelf: 'flex-start',
                marginBottom: 20,
              }}
            >
              <Image src={unfpaLogo} style={{ width: 92, height: 30, objectFit: 'contain' }} />
            </View>
            <View style={{ width: 44, height: 4, backgroundColor: C.accent, borderRadius: 2, marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 17, color: C.white, lineHeight: 1.35, maxWidth: 400 }}>
              {BRAND}
            </Text>
            <Text style={{ fontSize: 9.5, color: C.nightText, marginTop: 12, maxWidth: 400, lineHeight: 1.65 }}>
              Bringing population projections, satellite-derived land-cover analysis and
              infrastructure trends together for every district of Odisha, on screen and on paper.
            </Text>
          </View>
          <View style={{ flexGrow: 2 }} />
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: C.nightLine,
              paddingTop: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 7.5, color: C.nightMute }}>
              {SERIES} · {district} · {YEAR}
            </Text>
            <Text style={{ fontSize: 7.5, color: C.nightMute }}>Generated {generated}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── One-click download ──────────────────────────────────────────────────
export async function downloadDistrictReport(
  district: string,
  selectedData?: any,
  options?: ReportOptionsConfig
) {
  const [mapImage, lulcPair, lulcTimelineImages, ntlTimelineData] = await Promise.all([
    captureDistrictMap(),
    renderLulcPair(district),
    renderLulcTimeline(district),
    // only even years render in the maps grid; skip fetching the rest
    renderNtlTimeline(district, ['2012', '2014', '2016', '2018', '2020', '2022', '2024', '2026']),
  ]);

  const data = buildReportData(
    district,
    selectedData,
    {
      sections: [...ALL_REPORT_SECTIONS],
      startYear: '2017',
      // key figures (Demographic Overview, At a Glance) reference this year
      endYear: '2026',
      options,
    },
    lulcTimelineImages,
    ntlTimelineData
  );

  const blob = await pdf(
    <DistrictReportDocument
      data={data}
      mapImage={mapImage}
      lulcBefore={lulcPair.before}
      lulcAfter={lulcPair.after}
    />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${district.replace(/\s+/g, '_')}_District_Profile_${YEAR}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default DistrictReportDocument;
