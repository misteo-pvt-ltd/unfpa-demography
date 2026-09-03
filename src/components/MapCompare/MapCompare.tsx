/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { COMPARE_TOOLTIPS } from '../../data/tooltipInfo';
import maplibregl from 'maplibre-gl';
import { PMTiles, Protocol as PMTilesProtocol } from 'pmtiles';
import { cogProtocol, locationValues, setColorFunction } from '@geomatico/maplibre-cog-protocol';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  COMPARATIVE_DATA,
  NEW_DISTRICT_ROAD_DATA,
} from '../../data/comparativeData';
import {
  DISTRICT_NAME_VARIANTS,
  DISTRICT_DEMOGRAPHICS,
  ALLOWED_DISTRICTS,
  LULC_STATS,
  LULC_STATS_YEARLY,
  MODEL_DATA,
  NTL_COVERAGE,
  CENSUS_PROJECTION_DATA,
} from '../../data/comparativeData';
import { MODEL_STATS_DATA } from '../../data/modelStats';
import basemapGrey from '../Map/BaseMap/basemap-grey';

const greyLayers = (basemapGrey.layers as any[]).map((layer) => ({
  ...layer,
  layout: {
    ...(layer.layout || {}),
    visibility: 'none',
  },
}));
const greyLayerIds = (basemapGrey.layers as any[]).map((l) => l.id);
import { Layers } from 'lucide-react';
// import {
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   Label,
// } from 'recharts';

const PMTILES_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_district_pop_total_2036.pmtiles`;
const SUBDISTRICT_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_subdistrict_pop_total_2036.pmtiles`;

const ODISHA_BOUNDS: maplibregl.LngLatBoundsLike = [
  [81.3883675665129118, 17.8124511673802353],
  [87.4770036487483651, 22.5674384683253209],
];

const basemapOptions: { id: 'grey' | 'satellite' | 'osm'; label: string }[] = [
  { id: 'grey', label: 'Grey Canvas' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'osm', label: 'OSM' },
];

// const LULC_RGBA: Record<number, number[]> = {
//   1: [65, 155, 223, 255], // Water (#419BDF)
//   2: [57, 125, 73, 255], // Trees (#397D49)
//   4: [122, 135, 198, 255], // Flooded vegetation (#7A87C6)
//   5: [228, 150, 53, 255], // Crops (#E49635)
//   6: [196, 40, 27, 255], // Built (#C4281B)
//   7: [196, 40, 27, 255], // Built (#C4281B)
//   8: [165, 155, 143, 255], // Bare (#A59B8F)
//   9: [240, 240, 240, 255], // Snow/Ice (#F0F0F0)
//   10: [255, 255, 255, 255], // Clouds (#FFFFFF)
//   11: [223, 195, 90, 255], // Rangeland (#DFC35A)
// };

const buildCategoricalParams = (
  targetValue: number,
  activeColor: string,
  defaultColor = '#f0f0f0',
) => {
  const colors = Array(12).fill(defaultColor);
  if (targetValue >= 0 && targetValue <= 11) {
    colors[targetValue] = activeColor;
  }
  return `#color:[${colors.map((c) => `"${c}"`).join(',')}],0,11,c`;
};

// Available quarters by year
export const LULC_QUARTERS = [
  '2018 q1',
  '2018 q2',
  '2018 q3',
  '2018 q4',
  '2019 q1',
  '2019 q2',
  '2019 q3',
  '2019 q4',
  '2020 q1',
  '2020 q2',
  '2020 q3',
  '2020 q4',
  '2021 q1',
  '2021 q2',
  '2021 q3',
  '2021 q4',
  '2022 q1',
  '2022 q2',
  '2022 q3',
  '2022 q4',
  '2023 q1',
  '2023 q2',
  '2023 q3',
  '2023 q4',
  '2024 q1',
  '2024 q2',
  '2024 q3',
  '2024 q4',
  '2025 q1',
  '2025 q2',
  '2025 q3',
  '2025 q4',
  '2026 q1',
];

export const NTL_QUARTERS = [
  ...Array.from({ length: 2026 - 2012 + 1 }, (_, i) => {
    const year = 2012 + i;
    const quarters = year === 2026 ? ['q1', 'q2'] : ['q1', 'q2', 'q3', 'q4'];
    return quarters.map((q) => `${year} ${q}`);
  }).flat(),
];


export const LULC_YEARS = [
  '2017',
  '2018',
  '2019',
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',
];

export const getDistrictConfig = (district: string, isQuarterly = false) => {
  const d = district === 'Odisha' ? 'Anugul' : district;
  const formattedDistrict = d.replace(/\s+/g, '').trim();

  const buildYearlyLulcUrls = () => {
    const urls: Record<string, string> = {};
    LULC_YEARS.forEach((year) => {
      urls[year] =
        `${import.meta.env.VITE_REACT_DATA_URL}/lulc_yearly/${formattedDistrict}/${formattedDistrict}_lulc_${year}.tif`;
    });
    return urls;
  };

  const buildQuarterlyUrls = (
    path: string,
    suffix: string,
    quartersList = LULC_QUARTERS,
  ) => {
    const urls: Record<string, string> = {};
    quartersList.forEach((qLabel) => {
      const [year, q] = qLabel.split(' ');
      urls[qLabel] =
        `${import.meta.env.VITE_REACT_DATA_URL}/${path}/${formattedDistrict}/${formattedDistrict}_${year}_${q}_${suffix}.tif`;
    });
    return urls;
  };

  const lulcUrls = isQuarterly
    ? buildQuarterlyUrls('lulc', 'lulc')
    : buildYearlyLulcUrls();
  const ntlUrls = buildQuarterlyUrls('ntl', 'ntl', NTL_QUARTERS);

  const builtupPixel = isQuarterly ? 6 : 7;
  const croplandPixel = isQuarterly ? 4 : 5;
  const forestPixel = isQuarterly ? 1 : 2;

  const buildYearlyUrls = (
    basePath: string,
    prefix: string,
    extension: string,
    startYear: number,
    endYear: number,
  ) => {
    const urls: Record<string, string> = {};
    for (let y = startYear; y <= endYear; y++) {
      urls[y.toString()] = `${basePath}/${prefix}_${y}.${extension}`;
    }
    return urls;
  };

  const roadUrls = buildYearlyUrls(
    `${import.meta.env.VITE_REACT_DATA_URL}/roads`,
    'district_0_roads',
    'pmtiles',
    2014,
    2025,
  );

  return {
    nightlight: {
      urls: ntlUrls,
      params: '',
    },
    roads: {
      urls: roadUrls,
      params:
        '#color:["#0868ac","#0868ac","#0868ac","#0868ac","#0868ac"],0,3000,c',
    },
    builtup: {
      urls: lulcUrls,
      params: buildCategoricalParams(builtupPixel, '#0868ac'),
      targetPixel: builtupPixel,
      type: 'dynamic_lulc',
    },
    cropland: {
      urls: lulcUrls,
      params: buildCategoricalParams(croplandPixel, '#0868ac'),
      targetPixel: croplandPixel,
      type: 'dynamic_lulc',
    },
    forest: {
      urls: lulcUrls,
      params: buildCategoricalParams(forestPixel, '#0868ac'),
      targetPixel: forestPixel,
      type: 'dynamic_lulc',
    },
  };
};

export const DATA_CONFIG = getDistrictConfig('Anugul');

// Helper to add protocol only once
let protocolsAdded = false;

const getLulcUrl = (district: string, timeLabel: string, isQuarterly = false) => {
  const d = district === 'Odisha' ? 'Anugul' : district;
  const formattedDistrict = d.replace(/\s+/g, '').trim();
  if (isQuarterly) {
    let year = '2018';
    let q = 'q1';
    if (timeLabel.includes(' ')) {
      [year, q] = timeLabel.split(' ');
    } else {
      year = timeLabel;
    }
    return `${import.meta.env.VITE_REACT_DATA_URL}/lulc/${formattedDistrict}/${formattedDistrict}_${year}_${q}_lulc.tif`;
  } else {
    const year = timeLabel.split(' ')[0];
    return `${import.meta.env.VITE_REACT_DATA_URL}/lulc_yearly/${formattedDistrict}/${formattedDistrict}_lulc_${year}.tif`;
  }
};

const getLulcName = (val: number, isQuarterly = true) => {
  if (isQuarterly) {
    const lulcMap: Record<number, string> = {
      1: 'Forest',
      4: 'Cropland',
      6: 'Builtup',
    };
    return lulcMap[val] || String(val);
  } else {
    const lulcMap: Record<number, string> = {
      1: 'Water',
      2: 'Trees',
      4: 'Flooded Vegetation',
      5: 'Crops',
      7: 'Built Area',
      8: 'Bare Ground',
      9: 'Snow/Ice',
      10: 'Clouds',
      11: 'Rangeland',
    };
    return lulcMap[val] || String(val);
  }
};

const getDisplayData = (
  layerKey: string,
  val: string | number,
  side: 'left' | 'right' = 'left',
) => {
  const lulcColors: Record<string, string> = {
    builtup: side === 'right' ? '#ED022A' : '#0868ac',
    cropland: side === 'right' ? '#ED022A' : '#0868ac',
    forest: side === 'right' ? '#ED022A' : '#0868ac',
    nightlight: side === 'right' ? '#ED022A' : '#0868ac',
    roads: side === 'right' ? '#ED022A' : '#0868ac',
  };

  return {
    label: String(val) + '%',
    percent: Number(val) || 0,
    color: lulcColors[layerKey] || (side === 'right' ? '#ED022A' : '#0868ac'),
  };
};

// ─── Helper: get road length from NEW_DISTRICT_ROAD_DATA ──────────────────────
// district: e.g. "Anugul", year: e.g. "2015"
// Key format inside each district object: "Anugul_nh_2015" and "Anugul_sh_2015"
const getRoadLength = (district: string, year: string): { nh: number; sh: number } | null => {
  if (!district || district === 'Odisha') {
    // State-level: sum all districts for that year
    let nhTotal = 0;
    let shTotal = 0;
    let found = false;
    for (const [distName, distData] of Object.entries(NEW_DISTRICT_ROAD_DATA)) {
      const nhKey = `${distName}_nh_${year}` as keyof typeof distData;
      const shKey = `${distName}_sh_${year}` as keyof typeof distData;
      const nhVal = distData[nhKey];
      const shVal = distData[shKey];
      if (nhVal !== undefined && nhVal !== null) {
        nhTotal += nhVal as number;
        found = true;
      }
      if (shVal !== undefined && shVal !== null) {
        shTotal += shVal as number;
        found = true;
      }
    }
    return found ? { nh: nhTotal, sh: shTotal } : null;
  }

  const distData = (NEW_DISTRICT_ROAD_DATA as any)[district];
  if (!distData) return null;
  const nhKey = `${district}_nh_${year}`;
  const shKey = `${district}_sh_${year}`;
  const nhVal = distData[nhKey];
  const shVal = distData[shKey];
  if (nhVal === undefined && shVal === undefined) return null;

  return {
    nh: nhVal !== undefined && nhVal !== null ? (nhVal as number) : 0,
    sh: shVal !== undefined && shVal !== null ? (shVal as number) : 0,
  };
};

const ROAD_CATEGORIES = [
  {
    label: 'National Highway',
    values: ['trunk', 'primary', 'trunk_link', 'primary_link'],
    color: '#ED022A',
    width: 2.5,
  },
  {
    label: 'State Highway',
    values: ['secondary', 'secondary_link'],
    color: '#0868ac',
    width: 2.0,
  },
];

// const NTL_CLASSES = [
//   { label: '< 5', min: 0, max: 5, color: '#000000' },
//   { label: '5 - 25', min: 5, max: 25, color: '#48485d' },
//   { label: '26 - 80', min: 26, max: 80, color: '#f6eaaf' },
//   { label: '> 80', min: 80, max: 9999, color: '#fe0000' },
//   { label: 'No Data', noData: true, color: '#b44ef1' },
// ];
const NTL_CLASSES = [
  { label: 'Very Low Intensity', min: 0, max: 5, color: '#000000' },
  { label: 'Low Intensity', min: 5, max: 25, color: '#48485d' },
  { label: 'High Intensity', min: 26, max: 80, color: '#f6eaaf' },
  { label: 'Very High Intensity', min: 80, max: 9999, color: '#fe0000' },
  // { label: 'No Data', noData: true, color: '#b44ef1' },
];

interface MapCompareProps {
  targetBounds?: maplibregl.LngLatBoundsLike;
  targetDistrict?: string;
  onDistrictSelect?: (district: string) => void;
  activeLayer?: string;
  activeLulcPixel?: number | null;
  year1?: string;
  year2?: string;
  resetTrigger?: number;
  viewMode?: 'map' | 'compare' | 'change_analysis';
  onMapClick?: (lngLat: maplibregl.LngLat) => void;
  isQuarterly?: boolean;
}

export const formatLulcLabel = (y: string | number, isQuarterly = false) => {
  console.log(isQuarterly);
  const val = String(y);
  if (val.includes('q')) {
    const [year, q] = val.split(' ');
    const monthMap: Record<string, string> = {
      q1: 'March',
      q2: 'June',
      q3: 'September',
      q4: 'December',
    };
    return `${monthMap[q]} - ${year}`;
  }
  return val;
};

export default function MapCompare({
  targetBounds,
  targetDistrict,
  onDistrictSelect,
  activeLayer = 'builtup',
  activeLulcPixel,
  year1,
  year2,
  resetTrigger,
  viewMode = 'map',
  onMapClick,
  isQuarterly = false,
}: MapCompareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftMapRef = useRef<HTMLDivElement>(null);
  const rightMapRef = useRef<HTMLDivElement>(null);

  const odishaCenter: [number, number] = [85.0985, 20.9517];
  const initialZoom = 6;
  const initialBoundsRef = useRef<maplibregl.LngLatBoundsLike | null>(
    ODISHA_BOUNDS,
  );

  const leftMapObj = useRef<maplibregl.Map | null>(null);
  const rightMapObj = useRef<maplibregl.Map | null>(null);
  const leftMarkerRef = useRef<maplibregl.Marker | null>(null);
  const rightMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [basemap, setBasemap] = useState<'grey' | 'satellite' | 'osm'>('grey');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Odisha');
  const [selectedLngLat, setSelectedLngLat] =
    useState<maplibregl.LngLat | null>(null);
  const [lulcY1Val, setLulcY1Val] = useState<number | null>(null);
  const [lulcY2Val, setLulcY2Val] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDifference, setShowDifference] = useState(false);

  const layerInfoRef = useRef({
    currentLayerKey: '',
    y1: '',
    y2: '',
    rawUrl1: '',
    rawUrl2: '',
    isQuarterly: false,
  });
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    setSelectedLngLat(null);
    setShowDifference(false);
  }, [activeLayer, activeLulcPixel, viewMode]);

  useEffect(() => {
    if (selectedLngLat && viewMode !== 'change_analysis') {
      if (leftMapObj.current && !leftMarkerRef.current) {
        leftMarkerRef.current = new maplibregl.Marker({ color: '#ff0000ff' })
          .setLngLat(selectedLngLat)
          .addTo(leftMapObj.current);
      } else if (leftMarkerRef.current) {
        leftMarkerRef.current.setLngLat(selectedLngLat);
      }

      if (rightMapObj.current && !rightMarkerRef.current) {
        rightMarkerRef.current = new maplibregl.Marker({ color: '#ff0000ff' })
          .setLngLat(selectedLngLat)
          .addTo(rightMapObj.current);
      } else if (rightMarkerRef.current) {
        rightMarkerRef.current.setLngLat(selectedLngLat);
      }
    } else {
      if (leftMarkerRef.current) {
        leftMarkerRef.current.remove();
        leftMarkerRef.current = null;
      }
      if (rightMarkerRef.current) {
        rightMarkerRef.current.remove();
        rightMarkerRef.current = null;
      }
    }
  }, [selectedLngLat, viewMode]);

  useEffect(() => {
    if (targetDistrict) {
      setSelectedDistrict(targetDistrict);
      setSelectedLngLat(null);
    }
  }, [targetDistrict]);

  let resolvedLayerKey = activeLayer || 'builtup';

  if (
    resolvedLayerKey === 'nightlight_medium' ||
    resolvedLayerKey === 'nightlight_low'
  ) {
    resolvedLayerKey = 'nightlight';
  }

  const currentDistrict = targetDistrict || selectedDistrict || 'Anugul';
  const dynamicConfig = getDistrictConfig(currentDistrict, isQuarterly);

  const currentLayerKey = dynamicConfig[
    resolvedLayerKey as keyof typeof dynamicConfig
  ]
    ? resolvedLayerKey
    : 'builtup';

  const config: any =
    dynamicConfig[currentLayerKey as keyof typeof dynamicConfig];

  const availableYears = Object.keys(config.urls).sort();

  let y1 = year1;
  if (!y1 || !config.urls[y1]) y1 = availableYears[0];

  let y2 = year2;
  if (!y2 || !config.urls[y2]) y2 = availableYears[availableYears.length - 1];

  const getLayerUrl = (year: string, side: 'left' | 'right' = 'left', isDiffMode = false) => {
    let baseUrl = config.urls[year];
    if (!baseUrl) return '';

    // Create unique URL for protocol caching and namespacing
    let uniqueBaseUrl = baseUrl.includes('?')
      ? `${baseUrl}&view=compare&side=${side}`
      : `${baseUrl}?view=compare&side=${side}`;

    if (isDiffMode) {
      uniqueBaseUrl += '&mode=diff';
    } else if (side === 'right' && showDifference) {
      // Add a param to force reload and unique setColorFunction for right map in diff mode
      uniqueBaseUrl += '&diff=true';
    }

    if (currentLayerKey === 'urbansprawl' || currentLayerKey === 'roads') {
      return `pmtiles://${uniqueBaseUrl}`;
    }

    if (config.type === 'sentinel') {
      return uniqueBaseUrl;
    }

    if (config.type === 'dynamic_lulc' || currentLayerKey === 'nightlight') {
      // Use setColorFunction for LULC layers and nightlight
      return `cog://${uniqueBaseUrl}`;
    }

    let params = config.params || '';
    if (side === 'right') {
      params = params.replace(
        /#color:\["[^\]]+"\]/,
        '#color:["#ED022A","#ED022A"]',
      );
    }

    return `cog://${uniqueBaseUrl}${params}`;
  };

  const leftUrl = getLayerUrl(y1, 'left');
  const rightUrl = getLayerUrl(y2, 'right');

  const urlsRef = useRef({ left: leftUrl, right: rightUrl });
  useEffect(() => {
    urlsRef.current = { left: leftUrl, right: rightUrl };
    layerInfoRef.current = {
      currentLayerKey,
      y1,
      y2,
      rawUrl1: config?.urls[y1] || '',
      rawUrl2: config?.urls[y2] || '',
      isQuarterly,
    };
  }, [leftUrl, rightUrl, currentLayerKey, y1, y2, config, isQuarterly]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (viewMode === 'compare') {
          setDividerX(width / 2);
        } else if (viewMode === 'map' || viewMode === 'change_analysis') {
          setDividerX(0);
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [viewMode]);

  const [dividerX, setDividerX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!protocolsAdded) {
      try {
        if (!maplibregl.addProtocol.toString().includes('cog')) {
          maplibregl.addProtocol('cog', cogProtocol);
        }
        const pmtilesProtocol = new PMTilesProtocol();
        maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
      } catch (e) {
        console.log('e', e);
      }
      protocolsAdded = true;
    }
  }, []);

  const handleMapClick = async (
    e: maplibregl.MapMouseEvent & { lngLat: maplibregl.LngLat },
    mapInstance: maplibregl.Map,
  ) => {
    const { lngLat } = e;
    const side = mapInstance === leftMapObj.current ? 'left' : 'right';

    let districtName = 'Odisha';
    const vectorFeatures = mapInstance.queryRenderedFeatures(e.point, {
      layers: ['vector-fill-' + side],
    });

    if (vectorFeatures.length > 0 && vectorFeatures[0].properties) {
      const feature = vectorFeatures[0];
      const props = feature.properties;
      const rawName =
        props.district_name ||
        props.DIST_NAME ||
        props.District ||
        props.NAME ||
        props.name ||
        props.district ||
        'Odisha';
      districtName = DISTRICT_NAME_VARIANTS[rawName] || rawName;

      if (
        districtName !== 'Odisha' &&
        !ALLOWED_DISTRICTS.includes(districtName)
      )
        return;

      if (!(COMPARATIVE_DATA as any)[districtName]) {
        districtName = 'Odisha';
      }
    }

    setSelectedDistrict(districtName);
    setSelectedLngLat(lngLat);
    onDistrictSelect?.(districtName);
    onMapClick?.(lngLat);

    setLulcY1Val(null);
    setLulcY2Val(null);
    setIsLoading(true);
    const zoom = Math.round(mapInstance.getZoom());

    const currentY1 = layerInfoRef.current.y1 || '2018';
    const currentY2 = layerInfoRef.current.y2 || '2024';
    const currentIsQuarterly = layerInfoRef.current.isQuarterly ?? false;

    try {
      locationValues(
        getLulcUrl(districtName, currentY1, currentIsQuarterly),
        { latitude: lngLat.lat, longitude: lngLat.lng },
        zoom,
      )
        .then((vals) => {
          if (vals && vals.length > 0 && !isNaN(vals[0]))
            setLulcY1Val(vals[0]);
        })
        .catch((e) => console.error(`Error fetching ${currentY1} LULC`, e));
    } catch (e) {
      console.error(e);
    }

    try {
      locationValues(
        getLulcUrl(districtName, currentY2, currentIsQuarterly),
        { latitude: lngLat.lat, longitude: lngLat.lng },
        zoom,
      )
        .then((vals) => {
          if (vals && vals.length > 0 && !isNaN(vals[0]))
            setLulcY2Val(vals[0]);
        })
        .catch((e) => console.error(`Error fetching ${currentY2} LULC`, e));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetView = () => {
    if (initialBoundsRef.current) {
      const options: any = { padding: 20, duration: 1200 };
      leftMapObj.current?.fitBounds(initialBoundsRef.current, options);
    } else {
      leftMapObj.current?.flyTo({ center: odishaCenter, zoom: initialZoom });
    }
  };

  const setupSubdistrictLayer = async (
    map: maplibregl.Map,
    side: 'left' | 'right',
  ) => {
    const sourceId = `subdistrict-source-${side}`;
    const layerId = `subdistrict-outline-${side}`;
    const fillId = `subdistrict-fill-${side}`;

    if (map.getSource(sourceId)) return;

    map.addSource(sourceId, {
      type: 'vector',
      url: `pmtiles://${SUBDISTRICT_URL}`,
    });

    try {
      if (!map.getSource(sourceId)) return;

      map.addLayer({
        id: fillId,
        type: 'fill',
        source: sourceId,
        'source-layer': 'zcta',
        paint: { 'fill-color': 'transparent', 'fill-opacity': 0 },
      });

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        'source-layer': 'zcta',
        paint: {
          'line-color': '#F96000',
          'line-width': 0.8,
          'line-opacity': 0.8,
        },
      });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'subdistrict-popup',
      });

      map.on('mousemove', fillId, (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          const sdtname =
            feature.properties.subdistrict_name ||
            feature.properties.SUBDIST_NAM ||
            feature.properties.sdtname ||
            'N/A';
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="padding: 4px 8px; font-weight: bold; font-size: 11px; color: #333;">${sdtname}</div>`,
            )
            .addTo(map);
        }
      });

      map.on('mouseleave', fillId, () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    } catch (e) {
      console.error('Error setting up subdistrict layer', e);
    }
  };

  const updateMainLayer = async (
    map: maplibregl.Map,
    side: 'left' | 'right',
    url: string,
    type: 'raster' | 'vector',
    activeLayerKey: string,
  ) => {
    const sourceId = `main-source-${side}`;
    const layerId = `main-layer-${side}`;
    const leftDiffSourceId = `main-source-left-diff`;
    const leftDiffLayerId = `main-layer-left-diff`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
    if (map.getLayer(leftDiffLayerId)) {
      map.removeLayer(leftDiffLayerId);
    }
    if (map.getSource(leftDiffSourceId)) {
      map.removeSource(leftDiffSourceId);
    }

    if (activeLayerKey === 'sentinel2') {
      map.addSource(sourceId, {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        attribution: 'Sentinel-2 cloudless by EOX (CC BY-NC-SA 4.0)',
      });
      map.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': 1, 'raster-fade-duration': 300 },
          minzoom: 0,
          maxzoom: 22,
        },
        map.getLayer('vector-fill-' + side) ? 'vector-fill-' + side : undefined,
      );
      setIsLoading(true);
    } else if (type === 'raster') {
      if (activeLayerKey === 'builtup' || activeLayerKey === 'cropland' || activeLayerKey === 'forest' || activeLayerKey === 'dynamic_lulc') {
        const pureUrl = url.replace('cog://', '');
        const targetPixel = config.targetPixel;
        const isDiffActive = url.includes('diff=true') || url.includes('mode=diff');

        // Determine color based on side and mode
        let rgba = [8, 104, 172, 255]; // Default Blue #0868ac (Reference)
        if (side === 'right') {
          if (showDifference && isDiffActive) {
            rgba = [34, 197, 94, 255]; // Green #22c55e (Expansion)
          } else if (!showDifference) {
            rgba = [237, 2, 42, 255]; // Red #ED022A (Comparison)
          }
        }

        setColorFunction(pureUrl, (pixel: any, color: any, metadata: any) => {
          const val = pixel[0];
          if (val === metadata.noData || val < 0 || val > 11) {
            color.set([0, 0, 0, 0]);
            return;
          }

          if (val === targetPixel) {
            color.set(rgba);
          } else {
            color.set([0, 0, 0, 0]);
          }
        });
      } else if (activeLayerKey === 'nightlight') {
        const pureUrl = url.replace('cog://', '');
        setColorFunction(pureUrl, (pixel: any, color: any, metadata: any) => {
          const val = pixel[0];
          if (val === metadata.noData || val < 0) {
            color.set([0, 0, 0, 0]);
            return;
          }
          if (val <= 0.8) {
            color.set([0, 0, 0, 255]); // #000000
          } else if (val <= 5) {
            color.set([72, 72, 93, 255]); // #48485D
          } else if (val <= 28) {
            color.set([246, 234, 175, 255]); // #F6EAAF
          } else {
            color.set([254, 0, 0, 255]); // #FE0000
          }
        });
      }

      map.addSource(sourceId, {
        type: 'raster',
        url: url,
        tileSize: 256,
      });
      const paintProps: any = { 'raster-opacity': 1 };
      if (activeLayerKey === 'builtup' || activeLayerKey === 'cropland' || activeLayerKey === 'forest' || activeLayerKey === 'dynamic_lulc') {
        paintProps['raster-resampling'] = 'linear';
      }

      map.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: paintProps,
          minzoom: 0,
          maxzoom: 22,
        },
        map.getLayer('vector-fill-' + side) ? 'vector-fill-' + side : undefined,
      );

      // Handle raster difference overlay for LULC
      if (side === 'right' && showDifference && (activeLayerKey === 'builtup' || activeLayerKey === 'cropland')) {
        const leftDiffUrl = getLayerUrl(layerInfoRef.current.y1, 'left', true);
        const pureLeftUrl = leftDiffUrl.replace('cog://', '');
        const targetPixel = config.targetPixel;
        const rgba = [8, 104, 172, 255]; // Blue for reference state (Old)

        setColorFunction(pureLeftUrl, (pixel: any, color: any, metadata: any) => {
          const val = pixel[0];
          if (val === metadata.noData || val !== targetPixel) {
            color.set([0, 0, 0, 0]);
            return;
          }
          color.set(rgba);
        });

        map.addSource(leftDiffSourceId, {
          type: 'raster',
          url: leftDiffUrl,
          tileSize: 256,
        });
        map.addLayer(
          {
            id: leftDiffLayerId,
            type: 'raster',
            source: leftDiffSourceId,
            paint: { 'raster-opacity': 1, 'raster-resampling': 'linear' },
            minzoom: 0,
            maxzoom: 22,
          },
          map.getLayer('vector-fill-' + side) ? 'vector-fill-' + side : undefined,
        );
      }
      setIsLoading(true);
    } else {
      map.addSource(sourceId, {
        type: 'vector',
        url: url,
      });
      setIsLoading(true);

      const httpUrl = url.replace('pmtiles://', '');
      try {
        const p = new PMTiles(httpUrl);
        const metadata = (await p.getMetadata()) as any;

        let sourceLayerName = 'layer';
        if (
          metadata &&
          metadata.vector_layers &&
          metadata.vector_layers.length > 0
        ) {
          sourceLayerName = metadata.vector_layers[0].id;
        }

        if (map.getSource(sourceId)) {
          if (activeLayerKey === 'roads') {
            const isDiffMode = side === 'right' && showDifference;

            map.addLayer(
              {
                id: layerId,
                type: 'line',
                source: sourceId,
                'source-layer': 'zcta',
                filter: [
                  'any',
                  [
                    'in',
                    ['get', 'highway'],
                    [
                      'literal',
                      ['trunk', 'primary', 'trunk_link', 'primary_link'],
                    ],
                  ],
                  [
                    'in',
                    ['get', 'highway'],
                    ['literal', ['secondary', 'secondary_link']],
                  ],
                ],
                paint: {
                  'line-color': isDiffMode ? '#22c55e' : [
                    'match',
                    ['get', 'highway'],
                    ['trunk', 'primary', 'trunk_link', 'primary_link'],
                    '#ED022A',
                    ['secondary', 'secondary_link'],
                    '#0868ac',
                    '#94a3b8',
                  ],
                  'line-width': [
                    'match',
                    ['get', 'highway'],
                    ['trunk', 'primary'],
                    isDiffMode ? 3.5 : 2.5,
                    ['secondary'],
                    isDiffMode ? 3 : 2,
                    1,
                  ],
                  ...(isDiffMode && { 'line-dasharray': [1, 2] }),
                },
                minzoom: 0,
                maxzoom: 22,
              },
              map.getLayer('vector-fill-' + side)
                ? 'vector-fill-' + side
                : undefined,
            );

            if (isDiffMode && urlsRef.current.left) {
              map.addSource(leftDiffSourceId, {
                type: 'vector',
                url: urlsRef.current.left,
              });
              map.addLayer(
                {
                  id: leftDiffLayerId,
                  type: 'line',
                  source: leftDiffSourceId,
                  'source-layer': 'zcta',
                  filter: [
                    'any',
                    [
                      'in',
                      ['get', 'highway'],
                      [
                        'literal',
                        ['trunk', 'primary', 'trunk_link', 'primary_link'],
                      ],
                    ],
                    [
                      'in',
                      ['get', 'highway'],
                      ['literal', ['secondary', 'secondary_link']],
                    ],
                  ],
                  paint: {
                    'line-color': [
                      'match',
                      ['get', 'highway'],
                      ['trunk', 'primary', 'trunk_link', 'primary_link'],
                      '#ED022A',
                      ['secondary', 'secondary_link'],
                      '#0868ac',
                      '#94a3b8',
                    ],
                    'line-width': [
                      'match',
                      ['get', 'highway'],
                      ['trunk', 'primary'],
                      2.5,
                      ['secondary'],
                      2,
                      1,
                    ],
                  },
                  minzoom: 0,
                  maxzoom: 22,
                },
                map.getLayer('vector-fill-' + side)
                  ? 'vector-fill-' + side
                  : undefined,
              );
            }
          } else {
            map.addLayer(
              {
                id: layerId,
                type: 'fill',
                source: sourceId,
                'source-layer': sourceLayerName,
                paint: {
                  'fill-color': side === 'right' ? '#ED022A' : '#0868ac',
                  'fill-opacity': 0.6,
                  'fill-outline-color': '#ffffff',
                },
                minzoom: 0,
                maxzoom: 22,
              },
              map.getLayer('vector-fill-' + side)
                ? 'vector-fill-' + side
                : undefined,
            );
          }
        }
      } catch (e) {
        console.error('Failed to load vector metadata', e);
      }
    }
  };

  const [mapsLoadedCount, setMapsLoadedCount] = useState(0);

  useEffect(() => {
    if (leftMapObj.current) leftMapObj.current.remove();
    if (rightMapObj.current) rightMapObj.current.remove();

    const satelliteStyle = {
      version: 8,
      sources: {
        ...(basemapGrey.sources as any),
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri, Maxar, Earthstar Geographics',
        },
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        ...greyLayers.map((layer) => ({
          ...layer,
          layout: {
            ...(layer.layout || {}),
            visibility: basemap === 'grey' ? 'visible' : 'none',
          },
        })),
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 22,
          layout: { visibility: basemap === 'satellite' ? 'visible' : 'none' },
        },
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 22,
          layout: { visibility: basemap === 'osm' ? 'visible' : 'none' },
        },
      ],
    } as maplibregl.StyleSpecification;

    const fetchMetadata = async () => {
      try {
        const p = new PMTiles(PMTILES_URL);
        const header = await p.getHeader();
        if (header.minLon !== undefined) {
          const bounds: maplibregl.LngLatBoundsLike = [
            [header.minLon, header.minLat],
            [header.maxLon, header.maxLat],
          ];
          initialBoundsRef.current = bounds;
          if (leftMapObj.current)
            leftMapObj.current.fitBounds(initialBoundsRef.current, {
              duration: 0,
              padding: 40,
            });
          if (rightMapObj.current)
            rightMapObj.current.fitBounds(initialBoundsRef.current, {
              duration: 0,
              padding: 40,
            });
        }
      } catch (e) {
        console.error('Failed to fetch PMTiles header', e);
      }
    };
    fetchMetadata();

    if (leftMapRef.current) {
      leftMapObj.current = new maplibregl.Map({
        container: leftMapRef.current,
        style: satelliteStyle,
        center: odishaCenter,
        zoom: 7.5,
        attributionControl: false,
      });

      leftMapObj.current.on('load', () => {
        leftMapObj.current?.resize();

        if (targetBounds) {
          leftMapObj.current?.fitBounds(targetBounds, {
            duration: 0,
            padding: 40,
          });
        } else if (initialBoundsRef.current) {
          leftMapObj.current?.fitBounds(initialBoundsRef.current, {
            duration: 0,
            padding: 40,
          });
        }

        updateMainLayer(
          leftMapObj.current!,
          'left',
          urlsRef.current.left,
          ['urbansprawl', 'roads'].includes(currentLayerKey)
            ? 'vector'
            : 'raster',
          currentLayerKey,
        );

        if (!leftMapObj.current?.getSource('leftVector')) {
          leftMapObj.current?.addSource('leftVector', {
            type: 'vector',
            url: `pmtiles://${PMTILES_URL}`,
          });

          leftMapObj.current?.addLayer({
            id: 'vector-fill-left',
            type: 'fill',
            source: 'leftVector',
            'source-layer': 'zcta',
            paint: { 'fill-color': 'transparent', 'fill-opacity': 0 },
          });

          leftMapObj.current?.addLayer({
            id: 'vector-outline-left',
            type: 'line',
            source: 'leftVector',
            'source-layer': 'zcta',
            paint: {
              'line-color': '#686868ff',
              'line-width': 2,
            },
          });

          leftMapObj.current?.addLayer({
            id: 'vector-outline-highlight-left',
            type: 'line',
            source: 'leftVector',
            'source-layer': 'zcta',
            paint: {
              'line-color': '#F96000',
              'line-width': 1.5,
              'line-opacity': 0,
            },
            filter: ['==', 'fid', ''],
          });

          leftMapObj.current?.on('click', (e) => {
            if (
              viewModeRef.current === 'compare' ||
              viewModeRef.current === 'map'
            ) {
              handleMapClick(e, leftMapObj.current!);
            }
          });
          leftMapObj.current?.on('mouseenter', 'vector-fill-left', () => {
            if (
              leftMapObj.current &&
              (viewMode === 'compare' || viewMode === 'map')
            )
              leftMapObj.current.getCanvas().style.cursor = 'pointer';
          });
          leftMapObj.current?.on('mouseleave', 'vector-fill-left', () => {
            if (leftMapObj.current)
              leftMapObj.current.getCanvas().style.cursor = '';
          });
        }

        setupSubdistrictLayer(leftMapObj.current!, 'left');

        leftMapObj.current?.resize();
        setMapsLoadedCount((prev) => prev + 1);
      });

      leftMapObj.current.on('idle', () => setIsLoading(false));
    }

    if (rightMapRef.current) {
      rightMapObj.current = new maplibregl.Map({
        container: rightMapRef.current,
        style: satelliteStyle,
        center: odishaCenter,
        zoom: 7.5,
        attributionControl: false,
      });

      rightMapObj.current.on('load', () => {
        rightMapObj.current?.resize();

        if (targetBounds) {
          rightMapObj.current?.fitBounds(targetBounds, {
            duration: 0,
            padding: 40,
          });
        } else if (initialBoundsRef.current) {
          rightMapObj.current?.fitBounds(initialBoundsRef.current, {
            duration: 0,
            padding: 40,
          });
        }

        updateMainLayer(
          rightMapObj.current!,
          'right',
          urlsRef.current.right,
          ['urbansprawl', 'roads'].includes(currentLayerKey)
            ? 'vector'
            : 'raster',
          currentLayerKey,
        );

        if (!rightMapObj.current?.getSource('rightVector')) {
          rightMapObj.current?.addSource('rightVector', {
            type: 'vector',
            url: `pmtiles://${PMTILES_URL}`,
          });

          rightMapObj.current?.addLayer({
            id: 'vector-fill-right',
            type: 'fill',
            source: 'rightVector',
            'source-layer': 'zcta',
            paint: { 'fill-color': 'transparent', 'fill-opacity': 0 },
          });

          rightMapObj.current?.addLayer({
            id: 'vector-outline-right',
            type: 'line',
            source: 'rightVector',
            'source-layer': 'zcta',
            paint: {
              'line-color': '#686868ff',
              'line-width': 2,
            },
          });

          rightMapObj.current?.addLayer({
            id: 'vector-outline-highlight-right',
            type: 'line',
            source: 'rightVector',
            'source-layer': 'zcta',
            paint: {
              'line-color': '#F96000',
              'line-width': 1.5,
              'line-opacity': 0,
            },
            filter: ['==', 'fid', ''],
          });

          rightMapObj.current?.on('click', (e) => {
            handleMapClick(e, rightMapObj.current!);
          });
          rightMapObj.current?.on('mousemove', 'vector-fill-right', (e) => {
            const feature = e.features?.[0];
            const rawName =
              feature?.properties?.district_name ||
              feature?.properties?.DIST_NAME ||
              feature?.properties?.District ||
              feature?.properties?.NAME ||
              feature?.properties?.name ||
              feature?.properties?.district;
            const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;
            if (ALLOWED_DISTRICTS.includes(name)) {
              if (rightMapObj.current)
                rightMapObj.current.getCanvas().style.cursor = 'pointer';
            } else {
              if (rightMapObj.current)
                rightMapObj.current.getCanvas().style.cursor = '';
            }
          });
          rightMapObj.current?.on('mouseleave', 'vector-fill-right', () => {
            if (rightMapObj.current)
              rightMapObj.current.getCanvas().style.cursor = '';
          });
        }

        setupSubdistrictLayer(rightMapObj.current!, 'right');

        rightMapObj.current?.resize();
        setMapsLoadedCount((prev) => prev + 1);
      });

      rightMapObj.current.on('idle', () => setIsLoading(false));
    }

    let isSyncing = false;
    const syncMaps = (a: maplibregl.Map, b: maplibregl.Map) => {
      const onMove = () => {
        if (isSyncing) return;
        isSyncing = true;
        b.jumpTo({
          center: a.getCenter(),
          zoom: a.getZoom(),
          bearing: a.getBearing(),
          pitch: a.getPitch(),
        });
        isSyncing = false;
      };
      a.on('move', onMove);
    };

    if (leftMapObj.current && rightMapObj.current) {
      syncMaps(leftMapObj.current, rightMapObj.current);
      syncMaps(rightMapObj.current, leftMapObj.current);
    }


    return () => {
      try {
        if (leftMapObj.current) {
          leftMapObj.current.remove();
          leftMapObj.current = null;
        }
      } catch (e) {
        console.warn('Left map cleanup error', e);
      }

      try {
        if (rightMapObj.current) {
          rightMapObj.current.remove();
          rightMapObj.current = null;
        }
      } catch (e) {
        console.warn('Right map cleanup error', e);
      }
    };
  }, []);

  useEffect(() => {
    if (!leftMapObj.current || !rightMapObj.current) return;

    const isSentinel = currentLayerKey === 'sentinel2';
    const type = isSentinel
      ? 'raster'
      : ['urbansprawl', 'roads'].includes(currentLayerKey)
        ? 'vector'
        : 'raster';

    const lUrl =
      viewMode === 'map' || viewMode === 'change_analysis' ? rightUrl : leftUrl;

    updateMainLayer(leftMapObj.current, 'left', lUrl, type, currentLayerKey);
    updateMainLayer(
      rightMapObj.current,
      'right',
      rightUrl,
      type,
      currentLayerKey,
    );
  }, [leftUrl, rightUrl, currentLayerKey, activeLulcPixel, viewMode, showDifference]);

  useEffect(() => {
    if (!leftMapObj.current) return;

    if (targetBounds) {
      const options: any = { padding: 40, duration: 1200 };
      leftMapObj.current.fitBounds(targetBounds, options);
    } else {
      handleResetView();
    }
  }, [targetBounds, resetTrigger, mapsLoadedCount]);

  useEffect(() => {
    if (mapsLoadedCount < 2) return;

    const mapsToHighlight = [
      { map: leftMapObj.current, idx: 'left' },
      { map: rightMapObj.current, idx: 'right' },
    ];

    mapsToHighlight.forEach(({ map, idx }) => {
      if (!map || !map.getLayer(`vector-outline-highlight-${idx}`)) return;

      if (selectedDistrict === 'Odisha') {
        map.setPaintProperty(
          `vector-outline-highlight-${idx}`,
          'line-opacity',
          0,
        );
        map.setFilter(`vector-outline-highlight-${idx}`, ['==', 'fid', '']);
      } else {
        const highlightCondition = [
          'any',
          ['==', ['get', 'district_name'], selectedDistrict],
          ['==', ['get', 'DIST_NAME'], selectedDistrict],
          ['==', ['get', 'District'], selectedDistrict],
          ['==', ['get', 'NAME'], selectedDistrict],
          ['==', ['get', 'name'], selectedDistrict],
          ['==', ['get', 'district'], selectedDistrict],
          [
            '==',
            ['get', 'district_name'],
            Object.keys(DISTRICT_NAME_VARIANTS).find(
              (k) => DISTRICT_NAME_VARIANTS[k] === selectedDistrict,
            ) || selectedDistrict,
          ],
        ];

        map.setPaintProperty(
          `vector-outline-highlight-${idx}`,
          'line-opacity',
          1,
        );
        map.setFilter(
          `vector-outline-highlight-${idx}`,
          highlightCondition as any,
        );
        if (map.getLayer(`vector-outline-highlight-${idx}`)) {
          map.moveLayer(`vector-outline-highlight-${idx}`);
        }
      }
    });
  }, [selectedDistrict, mapsLoadedCount]);

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX =
        'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        setDividerX(x);
      }
    };
    const stop = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', stop);
      window.addEventListener('touchmove', move);
      window.addEventListener('touchend', stop);
    }

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', stop);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!leftMapObj.current || !rightMapObj.current) return;

    leftMapObj.current.resize();
    rightMapObj.current.resize();
  }, [dividerX, viewMode]);

  // ─── Data processing ──────────────────────────────────────────────────────────
  const compData =
    (COMPARATIVE_DATA as any)[selectedDistrict] ||
    (COMPARATIVE_DATA as any)['Odisha'];
  const layerData = compData[currentLayerKey] || { val1: 0, val2: 0 };
  const randLow = layerData.val1;
  const randHigh = layerData.val2;

  const getDistrictArea = (dist: string) => {
    if (dist === 'Odisha') return 155707;
    return 5190;
  };

  const yearKey1 = parseInt(y1);
  const yearKey2 = parseInt(y2);
  let totalPop1 = 0;
  let totalPop2 = 0;

  const findPop = (dist: string, year: number) => {
    const cleanDist = dist.trim();

    // 1. Try to find in MODEL_DATA first
    let distData = (MODEL_DATA as any)[cleanDist];
    if (!distData) {
      const canonical = DISTRICT_NAME_VARIANTS[cleanDist];
      if (canonical) distData = (MODEL_DATA as any)[canonical];
    }
    if (!distData) {
      const variant = Object.keys(DISTRICT_NAME_VARIANTS).find(
        (k) => DISTRICT_NAME_VARIANTS[k] === cleanDist
      );
      if (variant) distData = (MODEL_DATA as any)[variant];
    }
    if (!distData) {
      const lowerName = cleanDist.toLowerCase();
      const foundKey = Object.keys(MODEL_DATA).find(
        (k) => k.toLowerCase() === lowerName
      );
      if (foundKey) distData = (MODEL_DATA as any)[foundKey];
    }

    // 2. Fallback to CENSUS_PROJECTION_DATA if not found in MODEL_DATA
    if (!distData) {
      distData = (CENSUS_PROJECTION_DATA as any)[cleanDist];
      if (!distData) {
        const canonical = DISTRICT_NAME_VARIANTS[cleanDist];
        if (canonical) distData = (CENSUS_PROJECTION_DATA as any)[canonical];
      }
      if (!distData) {
        const variant = Object.keys(DISTRICT_NAME_VARIANTS).find(
          (k) => DISTRICT_NAME_VARIANTS[k] === cleanDist
        );
        if (variant) distData = (CENSUS_PROJECTION_DATA as any)[variant];
      }
      if (!distData) {
        const lowerName = cleanDist.toLowerCase();
        const foundKey = Object.keys(CENSUS_PROJECTION_DATA).find(
          (k) => k.toLowerCase() === lowerName
        );
        if (foundKey) distData = (CENSUS_PROJECTION_DATA as any)[foundKey];
      }
    }

    // 3. Fallback to DISTRICT_DEMOGRAPHICS if still not found
    if (!distData) {
      let demoData = (DISTRICT_DEMOGRAPHICS as any)[cleanDist];
      if (!demoData) {
        const canonical = DISTRICT_NAME_VARIANTS[cleanDist];
        if (canonical) demoData = (DISTRICT_DEMOGRAPHICS as any)[canonical];
      }
      if (!demoData) {
        const variant = Object.keys(DISTRICT_NAME_VARIANTS).find(
          (k) => DISTRICT_NAME_VARIANTS[k] === cleanDist
        );
        if (variant) demoData = (DISTRICT_DEMOGRAPHICS as any)[variant];
      }
      if (demoData) {
        const demoYear = demoData[year] || demoData[year.toString()];
        if (demoYear) {
          return demoYear.male + demoYear.female;
        }
        const availableYears = Object.keys(demoData)
          .map(Number)
          .filter((y) => !isNaN(y))
          .sort((a, b) => a - b);
        if (availableYears.length > 0) {
          const closestYr = availableYears.reduce((prev, curr) =>
            Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
          );
          const closestData = demoData[closestYr] || demoData[closestYr.toString()];
          return closestData ? closestData.male + closestData.female : 0;
        }
      }
      return 0;
    }

    if (distData[year] !== undefined) {
      return distData[year];
    }
    if (distData[year.toString()] !== undefined) {
      return distData[year.toString()];
    }

    const availableYears = Object.keys(distData)
      .map(Number)
      .filter((y) => !isNaN(y))
      .sort((a, b) => a - b);

    if (availableYears.length === 0) return 0;

    const closest = availableYears.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    );

    return distData[closest] || distData[closest.toString()] || 0;
  };

  const findModelStats = (dist: string, year: number) => {
    const cleanDist = dist.trim();
    let distData = (MODEL_STATS_DATA as any)[cleanDist];
    if (!distData) {
      const canonical = DISTRICT_NAME_VARIANTS[cleanDist];
      if (canonical) distData = (MODEL_STATS_DATA as any)[canonical];
    }
    if (!distData) {
      const variant = Object.keys(DISTRICT_NAME_VARIANTS).find(
        (k) => DISTRICT_NAME_VARIANTS[k] === cleanDist
      );
      if (variant) distData = (MODEL_STATS_DATA as any)[variant];
    }
    if (!distData) {
      const lowerName = cleanDist.toLowerCase();
      const foundKey = Object.keys(MODEL_STATS_DATA).find(
        (k) => k.toLowerCase() === lowerName
      );
      if (foundKey) distData = (MODEL_STATS_DATA as any)[foundKey];
    }

    if (!distData) return { density: 0, growth: null };

    if (distData[year] !== undefined) {
      return distData[year];
    }
    if (distData[year.toString()] !== undefined) {
      return distData[year.toString()];
    }

    const availableYears = Object.keys(distData)
      .map(Number)
      .filter((y) => !isNaN(y))
      .sort((a, b) => a - b);

    if (availableYears.length === 0) return { density: 0, growth: null };

    const closest = availableYears.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    );

    return distData[closest] || distData[closest.toString()] || { density: 0, growth: null };
  };

  const getNtlCoverage = (dist: string, timeLabel: string) => {
    const yearStr = timeLabel.split(' ')[0];
    const year = parseInt(yearStr);
    if (isNaN(year)) return null;

    const cleanDist = dist.trim();
    if (cleanDist === 'Odisha') {
      let sum = 0;
      let hasData = false;
      Object.entries(NTL_COVERAGE).forEach(([dName, dData]: [string, any]) => {
        if (dName === 'Odisha') return;
        let val = dData[yearStr];
        if (val === undefined) {
          const availableYears = Object.keys(dData)
            .map(Number)
            .filter((y) => !isNaN(y))
            .sort((a, b) => a - b);
          if (availableYears.length > 0) {
            const closestYr = availableYears.reduce((prev, curr) =>
              Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
            );
            val = dData[closestYr.toString()];
          }
        }
        if (val !== undefined && val !== null) {
          sum += val;
          hasData = true;
        }
      });
      return hasData ? sum : null;
    }

    let distData = (NTL_COVERAGE as any)[cleanDist];
    if (!distData) {
      const canonical = DISTRICT_NAME_VARIANTS[cleanDist];
      if (canonical) distData = (NTL_COVERAGE as any)[canonical];
    }
    if (!distData) {
      const variant = Object.keys(DISTRICT_NAME_VARIANTS).find(
        (k) => DISTRICT_NAME_VARIANTS[k] === cleanDist
      );
      if (variant) distData = (NTL_COVERAGE as any)[variant];
    }
    if (!distData) {
      const lowerName = cleanDist.toLowerCase();
      const foundKey = Object.keys(NTL_COVERAGE).find(
        (k) => k.toLowerCase() === lowerName
      );
      if (foundKey) distData = (NTL_COVERAGE as any)[foundKey];
    }

    if (!distData) return null;

    if (distData[yearStr] !== undefined) {
      return distData[yearStr];
    }

    const availableYears = Object.keys(distData)
      .map(Number)
      .filter((y) => !isNaN(y))
      .sort((a, b) => a - b);

    if (availableYears.length === 0) return null;

    const closest = availableYears.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    );

    return distData[closest.toString()] || null;
  };

  totalPop1 = findPop(selectedDistrict, yearKey1);
  totalPop2 = findPop(selectedDistrict, yearKey2);

  const popOldM = (totalPop1 / 1000000).toFixed(2);
  const popNewM = (totalPop2 / 1000000).toFixed(2);

  const stats1 = findModelStats(selectedDistrict, yearKey1);
  const stats2 = findModelStats(selectedDistrict, yearKey2);

  const densityOld = stats1.density ? stats1.density.toFixed(1) : '—';
  const growthOld = stats1.growth !== null ? stats1.growth.toFixed(2) : null;

  const densityNew = stats2.density ? stats2.density.toFixed(1) : '—';
  const growthNew = stats2.growth !== null ? stats2.growth.toFixed(2) : null;

  const d1 = getDisplayData(currentLayerKey, randLow || 0, 'left');
  const d2 = getDisplayData(currentLayerKey, randHigh || 0, 'right');
  const layerNameStr =
    currentLayerKey === 'nightlight' ? 'Night Lights' : currentLayerKey;
  const areaKm2 = getDistrictArea(selectedDistrict);

  const lulcStatMap: Record<string, string> = {
    builtup: 'Built Area',
    cropland: 'Crops',
    forest: 'Trees',
  };

  const getLulcStat = (dist: string, year: string, layerKey: string) => {
    const category = lulcStatMap[layerKey];
    if (!category) return null;

    const distData =
      LULC_STATS_YEARLY[dist] ||
      (DISTRICT_NAME_VARIANTS[dist] &&
        LULC_STATS_YEARLY[DISTRICT_NAME_VARIANTS[dist]]) ||
      LULC_STATS['Odisha'];
    if (!distData) return null;

    const yearData = distData[year];
    if (!yearData) return null;

    const val = yearData[category];
    if (val === undefined || val === null) return null;

    const totalArea = getDistrictArea(dist);
    if (val < 110 && dist !== 'Odisha') {
      return { sqKm: (totalArea * val) / 100, percent: val };
    }

    return { sqKm: val, percent: (val / totalArea) * 100 };
  };

  // ─── Determine if roads layer is active ──────────────────────────────────────
  const isRoadsLayer = currentLayerKey === 'roads';
  const isNtlLayer = currentLayerKey === 'nightlight';

  // ─── Road length data from NEW_DISTRICT_ROAD_DATA ────────────────────────────
  const roadLen1 = isRoadsLayer ? getRoadLength(selectedDistrict, y1) : null;
  const roadLen2 = isRoadsLayer ? getRoadLength(selectedDistrict, y2) : null;

  // ─── NTL coverage data from NTL_COVERAGE ─────────────────────────────────────
  const ntl1 = isNtlLayer ? getNtlCoverage(selectedDistrict, y1) : null;
  const ntl2 = isNtlLayer ? getNtlCoverage(selectedDistrict, y2) : null;

  // ─── LULC stats (only used for non-roads, non-NTL layers) ────────────────────
  const lulc1 = !isRoadsLayer && !isNtlLayer
    ? getLulcStat(selectedDistrict, y1, currentLayerKey)
    : null;
  const lulc2 = !isRoadsLayer && !isNtlLayer
    ? getLulcStat(selectedDistrict, y2, currentLayerKey)
    : null;

  // ─── Displayed values ────────────────────────────────────────────────────────
  const activeAreaOld = isRoadsLayer
    ? roadLen1 !== null
      ? `NH: ${roadLen1.nh.toFixed(1)} | SH: ${roadLen1.sh.toFixed(1)}`
      : '—'
    : isNtlLayer
      ? ntl1 !== null
        ? ntl1.toFixed(0)
        : '—'
      : lulc1
        ? lulc1.sqKm.toFixed(0)
        : (areaKm2 * (Number(randLow) / 100)).toFixed(0);

  const activeAreaNew = isRoadsLayer
    ? roadLen2 !== null
      ? `NH: ${roadLen2.nh.toFixed(1)} | SH: ${roadLen2.sh.toFixed(1)}`
      : '—'
    : isNtlLayer
      ? ntl2 !== null
        ? ntl2.toFixed(0)
        : '—'
      : lulc2
        ? lulc2.sqKm.toFixed(0)
        : (areaKm2 * (Number(randHigh) / 100)).toFixed(0);

  const activePercentOld = isRoadsLayer
    ? null
    : isNtlLayer
      ? ntl1 !== null
        ? ((ntl1 / areaKm2) * 100).toFixed(1)
        : null
      : lulc1
        ? lulc1.percent.toFixed(1)
        : d1?.percent || 0;

  const activePercentNew = isRoadsLayer
    ? null
    : isNtlLayer
      ? ntl2 !== null
        ? ((ntl2 / areaKm2) * 100).toFixed(1)
        : null
      : lulc2
        ? lulc2.percent.toFixed(1)
        : d2?.percent || 0;

  // ─── % change calculation ─────────────────────────────────────────────────────
  const prevVal = isRoadsLayer
    ? (roadLen1 ? (roadLen1.nh + roadLen1.sh) : 0)
    : isNtlLayer
      ? ntl1 || 0
      : lulc1
        ? lulc1.sqKm
        : randLow || 0;
  const currVal = isRoadsLayer
    ? (roadLen2 ? (roadLen2.nh + roadLen2.sh) : 0)
    : isNtlLayer
      ? ntl2 || 0
      : lulc2
        ? lulc2.sqKm
        : randHigh || 0;
  const change = prevVal > 0 ? ((currVal - prevVal) / prevVal) * 100 : 0;
  const isPos = change >= 0;

  const nhPrev = roadLen1?.nh || 0;
  const nhCurr = roadLen2?.nh || 0;
  const nhChange = nhPrev > 0 ? ((nhCurr - nhPrev) / nhPrev) * 100 : 0;
  const isNhPos = nhChange >= 0;

  const shPrev = roadLen1?.sh || 0;
  const shCurr = roadLen2?.sh || 0;
  const shChange = shPrev > 0 ? ((shCurr - shPrev) / shPrev) * 100 : 0;
  const isShPos = shChange >= 0;

  // Handle Basemap Visibility
  useEffect(() => {
    if (!leftMapObj.current || !rightMapObj.current || mapsLoadedCount < 2)
      return;

    [leftMapObj.current, rightMapObj.current].forEach((map) => {
      const showBasemaps = currentLayerKey !== 'sentinel2';
      const isGreyVisible = showBasemaps && basemap === 'grey';
      greyLayerIds.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(
            id,
            'visibility',
            isGreyVisible ? 'visible' : 'none',
          );
        }
      });
      if (map.getLayer('esri-satellite-layer')) {
        map.setLayoutProperty(
          'esri-satellite-layer',
          'visibility',
          showBasemaps && basemap === 'satellite' ? 'visible' : 'none',
        );
      }
      if (map.getLayer('osm-layer')) {
        map.setLayoutProperty(
          'osm-layer',
          'visibility',
          showBasemaps && basemap === 'osm' ? 'visible' : 'none',
        );
      }
    });
  }, [basemap, mapsLoadedCount]);

  return (
    <div className="w-full h-full">
      {/* Map Area */}
      <div className="relative w-full overflow-hidden">
        <div
          ref={containerRef}
          className="relative w-full h-[600px] 2xl:h-[750px] overflow-hidden select-none rounded-lg"
        >
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
              <div className="loading-spinner"></div>
            </div>
          )}

          {/* LEFT LABEL */}
          {viewMode === 'compare' && (
            <div className="absolute top-4 left-4 z-40 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-md text-sm font-medium shadow border border-white/30 uppercase font-mono tracking-wider">
              {formatLulcLabel(y1, isQuarterly)}
            </div>
          )}

          {/* RIGHT LABEL */}
          {(viewMode === 'compare' || viewMode === 'map') && (
            <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
              <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-md text-sm font-medium shadow border border-white/30 uppercase font-mono tracking-wider">
                {viewMode === 'map' ? '2024' : formatLulcLabel(y2, isQuarterly)}
              </div>
            </div>
          )}

          {/* ROADS LEGEND — bottom-left */}
          {activeLayer === 'roads' && (
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-40 w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                  Road Network
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={12} className="max-w-[200px]">
                    <p className="text-[11px] leading-relaxed">
                      {COMPARE_TOOLTIPS.roads.content}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-1.5">
                {ROAD_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[10px] font-medium text-gray-700">
                      {cat.label}
                    </span>
                  </div>
                ))}
                {showDifference && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-0 border-t-2 border-dotted border-[#22c55e]"
                    />
                    <span className="text-[10px] font-medium text-gray-700">
                      Changes
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NIGHTLIGHT LEGEND — bottom-left */}
          {activeLayer === 'nightlight' && (
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-40 w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                  Night Light Intensity
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={12} className="max-w-[200px]">
                    <p className="text-[11px] leading-relaxed">
                      {COMPARE_TOOLTIPS.nightlight.content}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-1.5">
                {NTL_CLASSES.map((cls) => (
                  <div key={cls.label} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm border border-gray-200"
                      style={{ backgroundColor: cls.color }}
                    />
                    <span className="text-[10px] font-medium text-gray-700">
                      {cls.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LULC LEGEND — bottom-left */}
          {(activeLayer === 'builtup' ||
            activeLayer === 'cropland' ||
            activeLayer === 'forest' ||
            activeLayer === 'lulc') && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-40 w-[180px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                    {activeLayer === 'builtup'
                      ? 'Built Area'
                      : activeLayer === 'cropland'
                        ? 'Crops'
                        : activeLayer === 'forest'
                          ? 'Trees'
                          : 'Land Use'}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={12} className="max-w-[200px]">
                      <p className="text-[11px] leading-relaxed">
                        {activeLayer === 'builtup'
                          ? COMPARE_TOOLTIPS.builtup.content
                          : activeLayer === 'cropland'
                            ? COMPARE_TOOLTIPS.cropland.content
                            : activeLayer === 'forest'
                              ? COMPARE_TOOLTIPS.forest.content
                              : COMPARE_TOOLTIPS.lulc.content}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm border border-gray-200"
                      style={{ backgroundColor: '#0868ac' }}
                    />
                    <span className="text-[10px] font-medium text-gray-700">
                      Reference State
                    </span>
                  </div>
                  {!showDifference && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm border border-gray-200"
                        style={{ backgroundColor: '#ED022A' }}
                      />
                      <span className="text-[10px] font-medium text-gray-700">
                        Comparison State
                      </span>
                    </div>
                  )}
                  {showDifference && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm border border-gray-200"
                        style={{ backgroundColor: '#22c55e' }}
                      />
                      <span className="text-[10px] font-medium text-gray-700">
                        Changes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* LEFT MAP */}
          <div
            ref={leftMapRef}
            className="relative w-full h-[600px] 2xl:h-[750px] overflow-hidden select-none"
          />

          {/* RIGHT MAP (clipped by slider) */}
          <div
            ref={rightMapRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              clipPath: `inset(0 0 0 ${dividerX}px)`,
              pointerEvents: viewMode === 'compare' ? 'auto' : 'none',
              overflow: 'hidden',
              display: viewMode === 'change_analysis' ? 'none' : 'block',
            }}
          />

          {/* Divider Handle */}
          {dividerX !== null && viewMode === 'compare' && (
            <div
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
              className="absolute top-0 bottom-0 w-1 bg-[#F58220] z-20 flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform active:scale-110"
              style={{ left: `${dividerX}px`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute w-8 h-8 rounded-full bg-[#F58220] border-[3px] border-white shadow-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    transform="rotate(90 12 12)"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* ─── LEFT SIDE PANEL ─────────────────────────────────────────────── */}
          {viewMode === 'compare' && (
            <div className="absolute top-0 bottom-0 left-0 w-70 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex flex-col pt-20 pb-4 px-6 z-30 pointer-events-none">
              <div className="text-white mt-4">
                {/* Population */}
                <div className="text-gray-200 text-xs tracking-wider uppercase mb-1">
                  TOTAL POPULATION
                </div>
                <div className="text-2xl font-bold mb-2">
                  <span className="font-mono">{popOldM}</span>{' '}
                  <span className="text-sm font-normal">M</span>
                </div>

                {/* Population Density */}
                <div className="text-gray-200 text-xs tracking-wider uppercase mb-1 mt-3">
                  POPULATION DENSITY
                </div>
                <div className="text-xl font-bold mb-1">
                  <span className="font-mono">{densityOld}</span>{' '}
                  <span className="text-xs font-normal text-gray-300">/ km²</span>
                </div>
                {growthOld !== null && (
                  <div className="text-xs text-gray-300 font-light mb-3">
                    Growth: <span className="font-mono font-medium">{growthOld}%</span>
                  </div>
                )}

                {/* Layer label */}
                {!isRoadsLayer && (
                  <div className="text-xs text-gray-100 mb-2">
                    {`${layerNameStr.toLowerCase()} coverage`}
                  </div>
                )}

                {/* Main metric */}
                {!isRoadsLayer ? (
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold">
                      <span className="font-mono">{activeAreaOld} </span>
                      <span className="text-sm font-normal">km.sq.</span>
                    </span>
                    {activePercentOld !== null && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span className="text-xl font-bold font-mono">
                          {activePercentOld}%
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mb-3 mt-1">
                    <div>
                      <div className="text-xs text-gray-100 mb-0.5">National Highway</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold font-mono text-white">{roadLen1?.nh?.toFixed(1) || '—'}</span>
                        <span className="text-sm font-normal text-white">km</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-100 mb-0.5">State Highway</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold font-mono text-white">{roadLen1?.sh?.toFixed(1) || '—'}</span>
                        <span className="text-sm font-normal text-white">km</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress bar — only for non-roads layers */}
                {!isRoadsLayer && (
                  <div className="w-3/4 h-1.5 bg-gray-600/50 rounded-full mb-1">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                      style={{
                        width: `${Math.min(Number(activePercentOld) || 0, 100)}%`,
                        backgroundColor: '#dcfce7',
                      }}
                    ></div>
                  </div>
                )}

                {/* Clicked coordinate + LULC value */}
                {selectedLngLat ? (
                  <div className="w-full flex flex-col items-start mt-1">
                    <div className="border-t border-white/20 my-4 w-full"></div>
                    <div className="text-xs text-white mb-2 tracking-wide font-light font-mono">
                      {Math.abs(selectedLngLat.lng).toFixed(2)}{' '}
                      {selectedLngLat.lng >= 0 ? 'E' : 'W'},{' '}
                      {Math.abs(selectedLngLat.lat).toFixed(2)}{' '}
                      {selectedLngLat.lat >= 0 ? 'N' : 'S'}
                    </div>
                    <div className="flex flex-col text-left uppercase text-[13px] mt-2 bg-black/30 p-2.5 rounded border border-white/10 w-auto">
                      <span className="font-medium text-gray-200">
                        {lulcY1Val !== null
                          ? getLulcName(lulcY1Val, isQuarterly)
                          : ''}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 w-full mt-4"></div>
                )}
              </div>
            </div>
          )}

          {/* ─── RIGHT SIDE PANEL ────────────────────────────────────────────── */}
          {(viewMode === 'compare' || viewMode === 'map') && (
            <div className="absolute top-0 bottom-0 right-0 w-70 bg-gradient-to-l from-black/70 via-black/30 to-transparent flex flex-col pt-20 pb-4 px-6 z-30 pointer-events-none items-end text-right">
              <div className="text-white mt-4 flex flex-col items-end w-full">
                {/* Population */}
                <div className="text-gray-200 text-xs tracking-wider uppercase mb-1">
                  TOTAL POPULATION
                </div>
                <div className="text-2xl font-bold mb-2">
                  <span className="font-mono">{popNewM}</span>{' '}
                  <span className="text-sm font-normal">M</span>
                </div>

                {/* Population Density */}
                <div className="text-gray-200 text-xs tracking-wider uppercase mb-1 mt-3">
                  POPULATION DENSITY
                </div>
                <div className="text-xl font-bold mb-1">
                  <span className="font-mono">{densityNew}</span>{' '}
                  <span className="text-xs font-normal text-gray-300">/ km²</span>
                </div>
                {growthNew !== null && (
                  <div className="text-xs text-gray-300 font-light mb-3">
                    Growth: <span className="font-mono font-medium">{growthNew}%</span>
                  </div>
                )}

                {/* Layer label */}
                {!isRoadsLayer && (
                  <div className="text-xs text-gray-100 mb-2">
                    {`${layerNameStr.toLowerCase()} coverage`}
                  </div>
                )}

                {/* Main metric */}
                {!isRoadsLayer ? (
                  <>
                    <div className="flex items-baseline justify-end gap-2 mb-3 w-full">
                      <span className="text-xl font-bold">
                        <span className="font-mono">{activeAreaNew}</span>{' '}
                        <span className="text-sm font-normal">km.sq.</span>
                      </span>
                      {activePercentNew !== null && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span className="text-xl font-bold font-mono">
                            {activePercentNew}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress bar — only for non-roads layers */}
                    <div className="w-3/4 h-1.5 bg-gray-600/50 rounded-full mb-3 flex justify-end">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        style={{
                          width: `${Math.min(Number(activePercentNew) || 0, 100)}%`,
                          backgroundColor: '#dcfce7',
                        }}
                      ></div>
                    </div>

                    {/* % change badge */}
                    <div className="flex justify-end mb-3">
                      <span
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-black tracking-wide shadow-sm ${isPos
                          ? 'bg-white/20 text-[#a7f3d0] border border-[#a7f3d0]/30'
                          : 'bg-white/20 text-red-300 border border-red-300/30'
                          }`}
                      >
                        {isPos ? (
                          <ArrowUpRight className="w-4 h-4" strokeWidth={3} />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" strokeWidth={3} />
                        )}
                        {Math.abs(change).toFixed(1)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 mb-3 mt-1 w-full items-end">
                    <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-100 mb-0.5">National Highway</div>
                      <div className="flex items-center gap-3">

                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-bold font-mono text-white}`}>
                            {(roadLen2?.nh?.toFixed(1) || '—')}
                          </span>
                          <span className="text-sm font-normal text-white">km</span>
                          {/* Percentage Change for NH */}
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-black tracking-wide shadow-sm ${isNhPos ? 'bg-white/20 text-[#a7f3d0] border border-[#a7f3d0]/30' : 'bg-white/20 text-red-300 border border-red-300/30'}`}>
                            {isNhPos ? <ArrowUpRight className="w-3 h-3" strokeWidth={3} /> : <ArrowDownRight className="w-3 h-3" strokeWidth={3} />}
                            {Math.abs(nhChange).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-100 mb-0.5">State Highway</div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-bold font-mono text-white}`}>
                            {(roadLen2?.sh?.toFixed(1) || '—')}
                          </span>
                          <span className="text-sm font-normal text-white">km</span>
                          {/* Percentage Change for SH */}
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-black tracking-wide shadow-sm ${isShPos ? 'bg-white/20 text-[#a7f3d0] border border-[#a7f3d0]/30' : 'bg-white/20 text-red-300 border border-red-300/30'}`}>
                            {isShPos ? <ArrowUpRight className="w-3 h-3" strokeWidth={3} /> : <ArrowDownRight className="w-3 h-3" strokeWidth={3} />}
                            {Math.abs(shChange).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clicked coordinate + LULC value */}
                {selectedLngLat ? (
                  <div className="w-full flex flex-col items-end mt-1">
                    <div className="border-t border-white/20 my-4 w-full"></div>
                    <div className="text-xs text-white mb-2 tracking-wide font-light text-right font-mono">
                      {Math.abs(selectedLngLat.lng).toFixed(2)}{' '}
                      {selectedLngLat.lng >= 0 ? 'E' : 'W'},{' '}
                      {Math.abs(selectedLngLat.lat).toFixed(2)}{' '}
                      {selectedLngLat.lat >= 0 ? 'N' : 'S'}
                    </div>
                    <div className="flex flex-col text-right uppercase text-[13px] mt-2 bg-black/30 p-2.5 rounded border border-white/10 w-auto">
                      <span className="font-medium text-gray-200">
                        {lulcY2Val !== null
                          ? getLulcName(lulcY2Val, isQuarterly)
                          : ''}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 w-full mt-4"></div>
                )}
              </div>
            </div>
          )}

          {/* Basemap Toggle - Bottom Right */}
          {currentLayerKey !== 'sentinel2' && (
            <div className="absolute bottom-4 right-4 z-40 flex flex-row items-end gap-2">
              {(activeLayer === 'roads' || activeLayer === 'builtup' || activeLayer === 'cropland') && (
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showChanges"
                    checked={showDifference}
                    onChange={() => setShowDifference(!showDifference)}
                    className="w-4 h-5 rounded border-gray-300 accent-[#F96000] focus:ring-[#F96000] cursor-pointer"
                  />
                  <label htmlFor="showChanges" className="text-[10px] font-black text-gray-700 uppercase tracking-wider cursor-pointer select-none">
                    Show changes
                  </label>
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-white/90 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-[#F96000] hover:border-[#F96000] transition-all active:scale-90"
                  title="Change Basemap"
                >
                  <Layers className="w-4 h-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-40 bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {basemapOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setBasemap(option.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-[11px] font-black transition-colors flex items-center justify-between ${basemap === option.id
                          ? 'bg-orange-50'
                          : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
