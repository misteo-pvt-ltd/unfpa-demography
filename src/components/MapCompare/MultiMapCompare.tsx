/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol as PMTilesProtocol, PMTiles } from 'pmtiles';
import {
  cogProtocol,
  setColorFunction,
} from '@geomatico/maplibre-cog-protocol';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Plus,
  X,
  ChevronDown,
  Layers,
  Map as MapIcon,
  Calendar,
  Info,
  MapPin,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MULTI_TOOLTIPS } from '../../data/tooltipInfo';
import {
  DISTRICT_NAME_VARIANTS,
  ALLOWED_DISTRICTS,
  getDistrictBounds,
} from '../../data/comparativeData';
import { AGE_COHORT_DATA } from '../../data/ageCohortData';
import smodClasses from './ghsl_smod_classes.json';
import basemapGrey from '../Map/BaseMap/basemap-grey';

const greyLayers = (basemapGrey.layers as any[]).map((layer) => ({
  ...layer,
  layout: {
    ...(layer.layout || {}),
    visibility: 'visible',
  },
}));
const greyLayerIds = (basemapGrey.layers as any[]).map((l) => l.id);

const SettlementTooltip = () => {
  return (
    <div className="flex flex-col gap-4 p-1 max-w-[320px]">
      <div>
        <h4 className="text-[12px] font-bold text-gray-900 mb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F76000]" />
          Source
        </h4>
        <p className="text-[10px] leading-relaxed text-gray-600">
          The Global Human Settlement Layer (GHS-SMOD) provides a specialized
          classification of human settlements.
        </p>
      </div>

      <div>
        <h4 className="text-[12px] font-bold text-gray-900 mb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F76000]" />
          Settlement Types
        </h4>
        <p className="text-[10px] leading-relaxed text-gray-600 mb-2">
          Data is calculated in 1km² blocks using satellite-derived building
          footprints and census data.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
          {Object.entries(smodClasses.classes).map(([key, info]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm border border-gray-100 shrink-0"
                style={{ backgroundColor: info.color }}
              />
              <span className="text-[10px] text-gray-500 font-medium leading-none">
                {info.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 space-y-2">
        <p className="text-[10px] leading-relaxed text-gray-600 ">
          <span className="font-medium text-gray-900">
            Urban centre (or high density cluster)
          </span>{' '}
          : Consists of contiguous grid cells with a density of at least 1500
          inhabitants per km2. An urban centre has population of at least
          50,000. Gaps in this cluster are filled and edges are smoothed. If
          needed, cells that are 50% built-up can be added.
        </p>

        <p className="text-[10px] leading-relaxed text-gray-600 ">
          <span className="font-medium text-gray-900">
            Urban cluster (or moderate density clusters)
          </span>{' '}
          : Consists of contiguous grid cells with a density of at least 300
          inhabitants per km2 and has a population of at least 5000 in the
          cluster (The urban centres are subsets of the corresponding urban
          clusters).
        </p>

        <p className="text-[10px] leading-relaxed text-gray-600 ">
          <span className="font-medium text-gray-900">
            Rural grid cells (mostly low density cells)
          </span>{' '}
          : Cells that do not belong to an urban cluster. Most of these will
          have a density below 300 inhabitants per km2. Some rural cells will
          have a higher density, but they are not part of cluster with a large
          enough population size to be classified as an urban cluster.
        </p>
      </div>
    </div>
  );
};

// Protocols setup
let protocolsAdded = false;

interface MapConfig {
  id: string;
  year: string;
  layer: string;
  basemap: 'grey' | 'satellite' | 'osm';
  district: string;
  ageCohortSub?: '0_14' | '15_59' | '60_plus';
}

interface MultiMapCompareProps {
  targetBounds?: any;
  activeLayer?: string;
  selectedDistrict?: string;
  onDistrictSelect?: (district: string) => void;
}

const PMTILES_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_district_pop_total_2036.pmtiles`;
const SUBDISTRICT_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_subdistrict_pop_total_2036.pmtiles`;

const PC_MOSAIC_REGISTER =
  'https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register';
const PC_TILE_BASE =
  'https://planetarycomputer.microsoft.com/api/data/v1/mosaic/tiles';
const PC_RENDER_PARAMS =
  'assets=B04&assets=B03&assets=B02&color_formula=Gamma%20RGB%203.2%20Saturation%200.8%20Sigmoidal%20RGB%2025%200.35&collection=sentinel-2-l2a&format=png';

const SENTINEL_DATE_MAP: any = {
  '01-01-2026': '2026-01-01/2026-01-31',
  '01-12-2025': '2025-12-01/2025-12-31',
  '01-11-2025': '2025-11-01/2025-11-30',
};
const MONTHLY_DATES = Object.keys(SENTINEL_DATE_MAP);

const BASE_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}`;
const NTL_QUARTER_LABEL_MAP: Record<string, string> = {
  March: 'q1',
  June: 'q2',
  September: 'q3',
  December: 'q4',
};

const NTL_QUARTER_MONTHS = ['March', 'June', 'September', 'December'];
const NTL_YEARS = Array.from({ length: 2026 - 2012 + 1 }, (_, i) =>
  (2012 + i).toString(),
);

const NTL_YEAR_OPTIONS: string[] = NTL_YEARS.flatMap((year) => {
  const months = year === '2026' ? ['March', 'June'] : NTL_QUARTER_MONTHS;
  return months.map((month) => `${year} ${month}`);
});

const buildNtlUrl = (yearLabel: string, district: string): string => {
  const [year, month] = yearLabel.split(' ');
  const quarter = NTL_QUARTER_LABEL_MAP[month] || 'q1';
  const districtName = district || 'Anugul';
  return `${BASE_URL}/ntl/${districtName}/${districtName}_${year}_${quarter}_ntl.tif`;
};

const generateYears = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());

const buildYearlyUrls = (
  basePath: string,
  prefix: string,
  extension: string,
  years: string[],
) => {
  return Object.fromEntries(
    years.map((year) => [year, `${basePath}/${prefix}_${year}.${extension}`]),
  );
};

const GHSL_YEARS = ['2010', '2015', '2020', '2025', '2030'];
const GHSL_CLASSES: any = {
  '11': { label: 'Very low density rural', color: '#d9d9b3' },
  '12': { label: 'Low density rural', color: '#cccc66' },
  '13': { label: 'Rural cluster', color: '#a3a347' },
  '21': { label: 'Suburban / peri-urban', color: '#ffaa00' },
  '22': { label: 'Semi-dense urban cluster', color: '#ff5500' },
  '23': { label: 'Dense urban cluster', color: '#cc0000' },
  '30': { label: 'Urban centre', color: '#660000' },
};

const AGE_COHORT_YEARS = ['2001', '2011', '2021', '2026', '2031', '2036'];
const POP_DENSITY_YEARS = generateYears(2011, 2036);
const AGE_COHORT_SUBS = [
  { id: '0_14', label: '0–14 Yrs' },
  { id: '15_59', label: '15–59 Yrs' },
  { id: '60_plus', label: '60+ Yrs' },
];

const getDistrictVariants = (target: string): string[] => {
  if (!target) return [];
  const t = target.toLowerCase().trim();

  if (t === 'angul' || t === 'anugul') {
    return ['Angul', 'Anugul', 'ANGUL', 'ANUGUL'];
  }
  if (t === 'balangir' || t === 'bolangir') {
    return ['Balangir', 'Bolangir', 'BALANGIR', 'BOLANGIR'];
  }
  if (t === 'balasore' || t === 'baleswar' || t === 'baleshwar') {
    return ['Balasore', 'Baleswar', 'Baleshwar', 'BALASORE', 'BALESWAR', 'BALESHWAR'];
  }
  if (t === 'bargarh' || t === 'baragarh') {
    return ['Bargarh', 'Baragarh', 'BARGARH', 'BARAGARH'];
  }
  if (t === 'bhadrak') {
    return ['Bhadrak', 'BHADRAK'];
  }
  if (t === 'boudh' || t === 'baudh') {
    return ['Boudh', 'Baudh', 'BOUDH', 'BAUDH'];
  }
  if (t === 'cuttack') {
    return ['Cuttack', 'CUTTACK'];
  }
  if (t === 'deogarh' || t === 'debagarh') {
    return ['Deogarh', 'Debagarh', 'DEOGARH', 'DEBAGARH'];
  }
  if (t === 'dhenkanal') {
    return ['Dhenkanal', 'DHENKANAL'];
  }
  if (t === 'gajapati') {
    return ['Gajapati', 'GAJAPATI'];
  }
  if (t === 'ganjam') {
    return ['Ganjam', 'GANJAM'];
  }
  if (t === 'jagatsinghpur' || t === 'jagatsinghapur') {
    return ['Jagatsinghpur', 'Jagatsinghapur', 'JAGATSINGHPUR', 'JAGATSINGHAPUR'];
  }
  if (t === 'jajpur' || t === 'jajapura') {
    return ['Jajpur', 'Jajapura', 'JAJPUR', 'JAJAPURA'];
  }
  if (t === 'jharsuguda') {
    return ['Jharsuguda', 'JHARSUGUDA'];
  }
  if (t === 'kalahandi') {
    return ['Kalahandi', 'KALAHANDI'];
  }
  if (t === 'kandhamal') {
    return ['Kandhamal', 'KANDHAMAL'];
  }
  if (t === 'kendrapara') {
    return ['Kendrapara', 'KENDRAPARA'];
  }
  if (t === 'kendujhar' || t === 'keonjhar') {
    return ['Kendujhar', 'Keonjhar', 'KENDUJHAR', 'KEONJHAR'];
  }
  if (t === 'khordha' || t === 'khurda') {
    return ['Khordha', 'Khurda', 'KHORDHA', 'KHURDA'];
  }
  if (t === 'koraput') {
    return ['Koraput', 'KORAPUT'];
  }
  if (t === 'malkangiri') {
    return ['Malkangiri', 'MALKANGIRI'];
  }
  if (t === 'mayurbhanj') {
    return ['Mayurbhanj', 'MAYURBHANJ'];
  }
  if (t === 'nabarangpur' || t === 'nabrangpur') {
    return ['Nabarangpur', 'Nabrangpur', 'NABARANGPUR', 'NABRANGPUR'];
  }
  if (t === 'nayagarh') {
    return ['Nayagarh', 'NAYAGARH'];
  }
  if (t === 'nuapada') {
    return ['Nuapada', 'NUAPADA'];
  }
  if (t === 'puri') {
    return ['Puri', 'PURI'];
  }
  if (t === 'rayagada') {
    return ['Rayagada', 'RAYAGADA'];
  }
  if (t === 'sambalpur') {
    return ['Sambalpur', 'SAMBALPUR'];
  }
  if (t === 'sonepur' || t === 'subarnapur') {
    return ['Sonepur', 'Subarnapur', 'SONEPUR', 'SUBARNAPUR'];
  }
  if (t === 'sundargarh' || t === 'sundergarh') {
    return ['Sundargarh', 'Sundergarh', 'SUNDARGARH', 'SUNDERGARH'];
  }

  return [target, target.toUpperCase(), target.toLowerCase()];
};

const getAgeCohortDistrictName = (name: string): string => {
  if (!name) return name;
  const norm = name.trim().toLowerCase();
  if (norm === 'anugul' || norm === 'angul') return 'Anugul';
  if (norm === 'boudh' || norm === 'baudh') return 'Baudh';
  if (norm === 'deogarh' || norm === 'debagarh') return 'Debagarh';
  if (norm === 'nabarangpur' || norm === 'nabarangapur') return 'Nabarangpur';
  if (norm === 'sonepur' || norm === 'subarnapur') return 'Subarnapur';

  const keys = Object.keys(AGE_COHORT_DATA);
  const found = keys.find((k) => k.toLowerCase() === norm);
  return found || name;
};

const buildGhslUrl = (year: string, district: string): string => {
  const districtName = district || 'Anugul';
  return `${BASE_URL}/ghsl_cog/${districtName}/${year}.tif`;
};

const buildBuiltupUrl = (year: string, district: string): string => {
  const d = district === 'Odisha' ? 'Anugul' : district;
  const formattedDistrict = d.replace(/\s+/g, '').trim();
  return `${import.meta.env.VITE_REACT_DATA_URL}/lulc_yearly/${formattedDistrict}/${formattedDistrict}_lulc_${year}.tif`;
};

const YEARS = {
  roads: generateYears(2014, 2025),
  builtup: generateYears(2017, 2025),
};

const LAYER_CONFIGS: any = {
  nightlight: {
    label: 'Nightlight',
    urls: Object.fromEntries(NTL_YEAR_OPTIONS.map((opt) => [opt, ''])),
    params:
      '#color:["#000000", "#48485d", "#f6eaaf", "#fe0000"],0,60,c',
    type: 'raster',
    isNightlight: true,
  },

  roads: {
    label: 'Road Network',
    urls: buildYearlyUrls(
      `${BASE_URL}/roads`,
      'district_0_roads',
      'pmtiles',
      YEARS.roads,
    ),
    params: '',
    type: 'vector',
  },

  builtup: {
    label: 'Built-up Area',
    urls: Object.fromEntries(YEARS.builtup.map((y) => [y, ''])),
    params: '7,7',
    type: 'raster',
  },

  ghsl: {
    label: 'Settlement',
    urls: Object.fromEntries(GHSL_YEARS.map((y) => [y, ''])),
    type: 'raster',
    isGhsl: true,
  },

  age_cohort: {
    label: 'Age Cohort',
    urls: Object.fromEntries(AGE_COHORT_YEARS.map((y) => [y, ''])),
    type: 'choropleth',
    isAgeCohort: true,
  },

  pop_density: {
    label: 'Population Density',
    urls: Object.fromEntries(POP_DENSITY_YEARS.map((y) => [y, ''])),
    type: 'choropleth',
    isPopDensity: true,
  },
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

const BASE_MAP_STYLE: any = {
  version: 8,
  sprite: (basemapGrey as any).sprite,
  glyphs: (basemapGrey as any).glyphs,
  sources: {
    ...(basemapGrey.sources as any),
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar',
    },
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [
    ...greyLayers,
    {
      id: 'base-satellite',
      type: 'raster',
      source: 'esri-satellite',
      layout: { visibility: 'none' },
    },
    {
      id: 'base-osm',
      type: 'raster',
      source: 'osm',
      layout: { visibility: 'none' },
    },
  ],
};

const getEffectiveStyle = () => BASE_MAP_STYLE;

const sharedInitialBoundsRef: { current: maplibregl.LngLatBoundsLike | null } =
  { current: null };
let initialBoundsFetchStarted = false;

export const MultiMapCompare: React.FC<MultiMapCompareProps> = ({
  targetBounds,
  activeLayer: propActiveLayer,
  selectedDistrict,
  onDistrictSelect,
}) => {
  const defaultDistrict = selectedDistrict || 'Anugul';

  const [mapConfigs, setMapConfigs] = useState<MapConfig[]>([
    {
      id: 'map-1',
      year:
        propActiveLayer === 'nightlight'
          ? '2012 March'
          : propActiveLayer === 'age_cohort'
            ? '2026'
            : '2017',
      layer: propActiveLayer || 'builtup',
      basemap: 'grey',
      district: defaultDistrict,
      ageCohortSub: '0_14',
    },
    {
      id: 'map-2',
      year:
        propActiveLayer === 'nightlight'
          ? '2026 June'
          : propActiveLayer === 'age_cohort'
            ? '2036'
            : '2025',
      layer: propActiveLayer || 'builtup',
      basemap: 'grey',
      district: defaultDistrict,
      ageCohortSub: '0_14',
    },
  ]);

  const [isAddingMap, setIsAddingMap] = useState(false);
  const [pendingConfig, setPendingConfig] = useState({
    layer: propActiveLayer || 'builtup',
    year: propActiveLayer === 'age_cohort' ? '2026' : '2024',
    district: defaultDistrict,
    ageCohortSub: '0_14' as '0_14' | '15_59' | '60_plus',
  });

  const mapInstances = useRef<Map<string, maplibregl.Map>>(new Map());
  const isSyncing = useRef(false);
  const mapConfigsRef = useRef(mapConfigs);

  useEffect(() => {
    mapConfigsRef.current = mapConfigs;
  }, [mapConfigs]);

  useEffect(() => {
    if (!protocolsAdded) {
      try {
        maplibregl.addProtocol('cog', cogProtocol);
        const pmtilesProtocol = new PMTilesProtocol();
        maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
      } catch (e) {
        console.log('e', e);
      }
      protocolsAdded = true;
    }
    if (!initialBoundsFetchStarted) {
      initialBoundsFetchStarted = true;
      const p = new PMTiles(PMTILES_URL);
      p.getHeader()
        .then((header) => {
          if (header.minLon !== undefined) {
            sharedInitialBoundsRef.current = [
              [header.minLon, header.minLat],
              [header.maxLon, header.maxLat],
            ];
          }
        })
        .catch(() => { });
    }
  }, []);

  // Update pending district default when parent selectedDistrict prop changes initially
  useEffect(() => {
    if (selectedDistrict) {
      setPendingConfig((prev) => ({ ...prev, district: selectedDistrict }));
    }
  }, [selectedDistrict]);

  // Update all map districts when parent selectedDistrict changes
  useEffect(() => {
    if (selectedDistrict) {
      setMapConfigs((prevConfigs) => {
        return prevConfigs.map((cfg) => {
          return { ...cfg, district: selectedDistrict };
        });
      });
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (!targetBounds || mapInstances.current.size === 0) return;
    const options: any = { padding: 40, duration: 1200 };
    mapInstances.current.forEach((map) => {
      map.fitBounds(targetBounds, options);
    });
  }, [targetBounds]);

  const syncMaps = (sourceId: string) => {
    if (isSyncing.current) return;

    const sourceMap = mapInstances.current.get(sourceId);
    if (!sourceMap) return;

    const sourceConfig = mapConfigsRef.current.find((c) => c.id === sourceId);
    const sourceDistrict = sourceConfig?.district || selectedDistrict;

    const center = sourceMap.getCenter();
    const zoom = sourceMap.getZoom();
    const bearing = sourceMap.getBearing();
    const pitch = sourceMap.getPitch();

    const matchingMaps: maplibregl.Map[] = [];
    mapInstances.current.forEach((map: maplibregl.Map, id: string) => {
      if (id !== sourceId) {
        const targetConfig = mapConfigsRef.current.find((c) => c.id === id);
        const targetDistrict = targetConfig?.district || selectedDistrict;

        // Sync view only if target map shares the SAME district as source map
        if (targetDistrict === sourceDistrict) {
          matchingMaps.push(map);
        }
      }
    });

    if (matchingMaps.length > 0) {
      isSyncing.current = true;
      matchingMaps.forEach((map) => {
        map.jumpTo({ center, zoom, bearing, pitch });
      });
      isSyncing.current = false;
    }
  };

  const addMap = () => {
    if (mapConfigs.length >= 3) return;
    setIsAddingMap(true);
  };

  const confirmAddMap = () => {
    const newId = `map-${Date.now()}`;
    setMapConfigs((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, { ...pendingConfig, id: newId, basemap: 'grey' }];
    });
    setIsAddingMap(false);
  };

  const removeMap = (id: string) => {
    setMapConfigs((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((m: MapConfig) => m.id !== id);
    });
    mapInstances.current.delete(id);
  };

  const updateConfig = (id: string, updates: Partial<MapConfig>) => {
    setMapConfigs((prev) =>
      prev.map((m: MapConfig) => (m.id === id ? { ...m, ...updates } : m)),
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <MapIcon className="w-6 h-6" />
            Comparative Analysis - Splitview
            {/* <InfoTooltip text="Compare different metrics side-by-side." position="top" /> */}
          </h3>
          <p className="text-[13px] text-gray-500 mt-1 font-medium leading-relaxed">
            Simultaneously visualize and compare spatio-temporal demographic
            shifts, land use patterns, and infrastructure development across
            multiple interactive map panels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addMap}
            disabled={mapConfigs.length >= 3}
            className="flex items-center gap-2 px-6 py-3 bg-[#F96000] text-white rounded-xl font-black text-xs shadow-sm hover:bg-[#e85900] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Add Map
          </button>
        </div>
      </div>

      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-0 custom-scrollbar">
        {mapConfigs.map((config, idx) => (
          <div
            key={`${config.id}-${config.district}`}
            className="min-w-[450px] flex-1"
          >
            <MapItem
              config={config}
              panelIndex={idx}
              selectedDistrict={selectedDistrict}
              onRemove={() => removeMap(config.id)}
              onUpdate={(updates) => updateConfig(config.id, updates)}
              onDistrictSelect={idx === 0 ? onDistrictSelect : undefined}
              onMapLoad={(map: maplibregl.Map) => {
                mapInstances.current.set(config.id, map);
                map.on('move', () => syncMaps(config.id));

                const distBounds = getDistrictBounds(config.district);
                if (distBounds) {
                  map.fitBounds(distBounds, { padding: 40, duration: 0 });
                } else if (targetBounds) {
                  map.fitBounds(targetBounds, { padding: 40, duration: 0 });
                } else if (sharedInitialBoundsRef.current) {
                  map.fitBounds(sharedInitialBoundsRef.current, {
                    padding: 40,
                    duration: 0,
                  });
                }
              }}
            />
          </div>
        ))}

        {isAddingMap && (
          <div className="min-w-[450px] max-w-[450px] h-[600px] bg-white rounded-2xl border-2 border-dashed border-orange-100 p-8 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-2">
              <Plus className="w-8 h-8 text-[#F96000]" strokeWidth={2.5} />
            </div>

            <div className="w-full space-y-4">
              {/* Select District Dropdown */}
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0868ac] mb-2 block">
                  Select District
                </label>
                <div className="relative">
                  <select
                    value={pendingConfig.district}
                    onChange={(e) =>
                      setPendingConfig({
                        ...pendingConfig,
                        district: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-black text-gray-700 focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {ALLOWED_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                </div>
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0868ac] mb-2 block">
                  Choose Data Layer
                </label>
                <div className="relative">
                  <select
                    value={pendingConfig.layer}
                    onChange={(e) => {
                      const layer = e.target.value;
                      const defaultYear =
                        layer === 'nightlight'
                          ? '2026 June'
                          : layer === 'age_cohort' || layer === 'pop_density'
                            ? '2026'
                            : pendingConfig.year.includes(' ')
                              ? '2024'
                              : pendingConfig.year;

                      setPendingConfig({ ...pendingConfig, layer, year: defaultYear });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-black text-gray-700 focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {Object.entries(LAYER_CONFIGS).map(([id, cfg]: any) => (
                      <option key={id} value={id}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                </div>
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#0868ac] mb-2 block">
                  Date
                </label>
                <div className="relative">
                  <select
                    value={pendingConfig.year}
                    onChange={(e) =>
                      setPendingConfig({
                        ...pendingConfig,
                        year: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-black text-gray-700 focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {pendingConfig.layer === 'degree_urbanization'
                      ? MONTHLY_DATES.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))
                      : pendingConfig.layer === 'nightlight'
                        ? NTL_YEAR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))
                        : pendingConfig.layer === 'ghsl'
                          ? GHSL_YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))
                          : pendingConfig.layer === 'age_cohort'
                            ? AGE_COHORT_YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))
                            : pendingConfig.layer === 'pop_density'
                              ? POP_DENSITY_YEARS.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))
                              : Object.keys(
                                LAYER_CONFIGS[pendingConfig.layer]?.urls || {},
                              ).map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                  </select>
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setIsAddingMap(false)}
                className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddMap}
                className="flex-[2] py-3.5 px-4 bg-[#F96000] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-[#e85900] transition-all"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MapItem = ({
  config,
  panelIndex,
  selectedDistrict,
  onRemove,
  onUpdate,
  onMapLoad,
  onDistrictSelect,
}: {
  config: MapConfig;
  panelIndex: number;
  selectedDistrict?: string;
  onRemove: () => void;
  onUpdate: (updates: Partial<MapConfig>) => void;
  onMapLoad: (map: maplibregl.Map) => void;
  onDistrictSelect?: (district: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Keep a ref to the latest config so event listeners (registered once) always
  // read the current layer / year / district without stale closure captures.
  const configRef = useRef<MapConfig>(config);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const [isBasemapOpen, setIsBasemapOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const NTL_CLASSES = [
    { label: 'Very Low Intensity', min: 0, max: 5, color: '#000000' },
    { label: 'Low Intensity', min: 5, max: 25, color: '#48485d' },
    { label: 'High Intensity', min: 26, max: 50, color: '#f6eaaf' },
    { label: 'Very High Intensity', min: 50, max: 9999, color: '#fe0000' },
  ];

  const panelColors = ['#0868ac', '#FF0000', '#F96000'];
  const activeColor = panelColors[panelIndex % panelColors.length];

  const currentDistrict = config.district || selectedDistrict || 'Anugul';

  // Sync configRef on every render so stale-closure handlers read the latest value
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getEffectiveStyle(),
      center: [85.0985, 20.9517],
      zoom: 6,
      attributionControl: false,
    });

    map.on('load', async () => {
      mapRef.current = map;
      if (!sharedInitialBoundsRef.current) {
        try {
          const p = new PMTiles(PMTILES_URL);
          const header = await p.getHeader();
          if (header.minLon !== undefined) {
            sharedInitialBoundsRef.current = [
              [header.minLon, header.minLat],
              [header.maxLon, header.maxLat],
            ];
          }
        } catch (e) {
          console.log('e', e);
        }
      }
      if (config.basemap !== 'grey') {
        greyLayerIds.forEach((id) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', 'none');
          }
        });
      }
      map.setLayoutProperty(
        'base-satellite',
        'visibility',
        config.basemap === 'satellite' ? 'visible' : 'none',
      );
      map.setLayoutProperty(
        'base-osm',
        'visibility',
        config.basemap === 'osm' ? 'visible' : 'none',
      );

      onMapLoad(map);
      await refreshMapContent(true);
      map.on('idle', () => setIsLoading(false));
    });

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) {
      const isGreyVisible = config.basemap === 'grey';
      greyLayerIds.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', isGreyVisible ? 'visible' : 'none');
        }
      });
      map.setLayoutProperty(
        'base-satellite',
        'visibility',
        config.basemap === 'satellite' ? 'visible' : 'none',
      );
      map.setLayoutProperty(
        'base-osm',
        'visibility',
        config.basemap === 'osm' ? 'visible' : 'none',
      );
    }
  }, [config.basemap]);

  useEffect(() => {
    applyMaskStatus();
    if (mapRef.current && currentDistrict) {
      const bounds = getDistrictBounds(currentDistrict);
      if (bounds) {
        mapRef.current.fitBounds(bounds, { padding: 40, duration: 800 });
      }
    }
  }, [currentDistrict, config.basemap]);

  const applyMaskStatus = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer('districts-mask')) return;
    const getMaskColor = () => {
      if (config.basemap === 'satellite') return '#000000';
      return '#ffffffff';
    };

    map.setPaintProperty('districts-mask', 'fill-color', getMaskColor());
    map.setPaintProperty('districts-mask', 'fill-opacity', 0);

    if (map.getLayer('selected-district-outline')) {
      map.setFilter('selected-district-outline', [
        'any',
        ['==', ['get', 'district_name'], currentDistrict],
        ['==', ['get', 'DIST_NAME'], currentDistrict],
        ['==', ['get', 'District'], currentDistrict],
        ['==', ['get', 'NAME'], currentDistrict],
        ['==', ['get', 'name'], currentDistrict],
        ['==', ['get', 'district'], currentDistrict],
      ]);
    }
  };

  useEffect(() => {
    const currentLayerConfig = LAYER_CONFIGS[config.layer];
    if (currentLayerConfig) {
      const availableYears = Object.keys(currentLayerConfig.urls);

      if (config.layer === 'nightlight') {
        if (!NTL_YEAR_OPTIONS.includes(config.year)) {
          onUpdate({ year: '2026 June' });
          return;
        }
      } else if (config.layer === 'pop_density') {
        if (!POP_DENSITY_YEARS.includes(config.year)) {
          onUpdate({ year: '2026' });
          return;
        }
      } else if (config.layer === 'age_cohort') {
        if (!AGE_COHORT_YEARS.includes(config.year)) {
          onUpdate({ year: '2026' });
          return;
        }
      } else {
        if (!availableYears.includes(config.year)) {
          const fallbackYear =
            availableYears[availableYears.length - 1] || '2024';
          onUpdate({ year: fallbackYear });
          return;
        }
      }
    }
    refreshMapContent();
  }, [config.year, config.layer, config.district, config.ageCohortSub]);

  const refreshMapContent = async (force = false) => {
    setIsLoading(true);
    const map = mapRef.current;
    if (!map) return;
    if (!force && !map.isStyleLoaded()) return;

    const layersToClean = [
      'data-layer',
      'pop-density-layer',
      'districts-mask',
      'districts-outline',
      'selected-district-outline',
      'subdistrict-outline',
    ];
    const sourcesToClean = [
      'data-source',
      'pop-density-source',
      'districts-source',
      'subdistrict-source',
    ];

    try {
      layersToClean.forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      sourcesToClean.forEach((id) => {
        if (map.getSource(id)) map.removeSource(id);
      });

      await addDataOverlay(map);
      addVectorOutlines(map);
    } catch (err) {
      console.error('Error refreshing map content:', err);
      setTimeout(() => {
        if (mapRef.current && mapRef.current.isStyleLoaded()) {
          refreshMapContent();
        }
      }, 500);
    }
  };

  const addVectorOutlines = (map: maplibregl.Map) => {
    if (!map.getSource('districts-source')) {
      map.addSource('districts-source', {
        type: 'vector',
        url: `pmtiles://${PMTILES_URL}`,
      });

      map.addLayer({
        id: 'districts-mask',
        type: 'fill',
        source: 'districts-source',
        'source-layer': 'zcta',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0,
        },
      });

      // Separate popup instances for age cohort and population density layers
      const ageCohortPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'district-popup',
      });

      const popDensityPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'district-popup',
      });

      // Age cohort popup — only shown for age_cohort layer, uses districts-mask
      // Uses configRef.current so it always reads the CURRENT layer, not the stale closure value.
      map.on('mousemove', 'districts-mask', (e) => {
        const liveConfig = configRef.current;
        if (liveConfig.layer !== 'age_cohort') {
          ageCohortPopup.remove();
          return;
        }
        const feature = e.features?.[0];
        if (feature) {
          const props = feature.properties as any;
          const rawName =
            props.district_name ||
            props.DIST_NAME ||
            props.District ||
            props.NAME ||
            props.name ||
            props.district;
          const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;

          const currentYear = liveConfig.year || '2026';
          const currentSub = liveConfig.ageCohortSub || '0_14';
          const normalizedDist = getAgeCohortDistrictName(name);
          const yearData = AGE_COHORT_DATA[normalizedDist]?.[currentYear];

          if (yearData) {
            const formatNum = (v: number) => (v || 0).toLocaleString();
            const cohortLabels: Record<string, string> = {
              '0_14': '0 – 14 Yrs',
              '15_59': '15 – 59 Yrs',
              '60_plus': '60+ Yrs',
            };

            const maleVal =
              currentSub === '0_14'
                ? yearData.male.age_0_14
                : currentSub === '15_59'
                  ? yearData.male.age_15_59
                  : yearData.male.age_60_plus;

            const femaleVal =
              currentSub === '0_14'
                ? yearData.female.age_0_14
                : currentSub === '15_59'
                  ? yearData.female.age_15_59
                  : yearData.female.age_60_plus;

            const content = `
              <div style="padding: 10px; font-family: 'Inter', sans-serif; min-width: 170px; border-radius: 12px;">
                  <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.025em;">${name}</div>
                  <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Age ${cohortLabels[currentSub]}  ·  ${currentYear}</div>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="font-size: 10px; color: #4a5568;">Male:</span>
                          <span style="font-size: 10px; font-weight: 700; color: #F96000;">${formatNum(maleVal)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="font-size: 10px; color: #4a5568;">Female:</span>
                          <span style="font-size: 10px; font-weight: 700; color: #F96000;">${formatNum(femaleVal)}</span>
                      </div>
                      <div style="border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 4px; display: flex; justify-content: space-between; align-items: center;">
                          <span style="font-size: 10px; color: #0f172a; font-weight: 800;">Total:</span>
                          <span style="font-size: 10px; font-weight: 900; color: #0868ac;">${formatNum(maleVal + femaleVal)}</span>
                      </div>
                  </div>
              </div>
            `;
            ageCohortPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
          } else {
            ageCohortPopup.remove();
          }
        }
      });

      // Population density popup — only shown for pop_density layer, uses pop-density-layer
      // Uses configRef.current so it always reads the CURRENT layer, not the stale closure value.
      map.on('mousemove', 'pop-density-layer', (e) => {
        const liveConfig = configRef.current;
        if (liveConfig.layer !== 'pop_density') {
          popDensityPopup.remove();
          return;
        }
        const feature = e.features?.[0];
        if (feature) {
          const props = feature.properties as any;
          const currentYear = liveConfig.year || '2026';
          const liveDistrict = liveConfig.district || selectedDistrict || 'Anugul';
          const subName =
            props.TEHSIL ||
            props.SUB_DIST ||
            props.subdistrict_name ||
            props.NAME ||
            props.name ||
            'Subdistrict';
          const distRaw =
            props.district_name ||
            props.DIST_NAME ||
            props.District ||
            props.NAME ||
            props.district ||
            '';
          const distName = DISTRICT_NAME_VARIANTS[distRaw] || distRaw;

          const densityVal = props[`density_${currentYear}`];
          const numVal =
            densityVal !== undefined && densityVal !== null
              ? Math.round(parseFloat(densityVal))
              : null;

          const hasTarget = liveDistrict && liveDistrict !== 'All Districts' && liveDistrict !== 'Odisha';
          if (hasTarget) {
            const targetVariants = getDistrictVariants(liveDistrict).map((v) => v.toLowerCase());
            const rawLower = (distRaw || '').trim().toLowerCase();
            const canonLower = (distName || '').trim().toLowerCase();
            const districtNorm = rawLower.replace(/\s+/g, '').replace(/-/g, '');
            const targetNorms = targetVariants.map((v) => v.replace(/\s+/g, '').replace(/-/g, ''));
            if (
              !targetVariants.includes(rawLower) &&
              !targetVariants.includes(canonLower) &&
              !targetNorms.includes(districtNorm)
            ) {
              popDensityPopup.remove();
              return;
            }
          }

          const content = `
            <div style="padding: 10px; font-family: 'Inter', sans-serif; min-width: 170px; border-radius: 12px;">
                <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">${subName}</div>
                ${distName ? `<div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">${distName} District  ·  ${currentYear}</div>` : `<div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Year: ${currentYear}</div>`}
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 10px; color: #4a5568; font-weight: 700;">Pop Density:</span>
                    <span style="font-size: 11px; font-weight: 900; color: #0868ac;">${numVal !== null ? `${numVal.toLocaleString()} / km²` : 'N/A'}</span>
                </div>
            </div>
          `;
          popDensityPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
        }
      });

      map.on('mouseleave', 'pop-density-layer', () => {
        popDensityPopup.remove();
      });

      map.on('mouseleave', 'districts-mask', () => {
        ageCohortPopup.remove();
      });

      map.on('click', 'districts-mask', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties as any;
          const rawName =
            props.district_name ||
            props.DIST_NAME ||
            props.District ||
            props.NAME ||
            props.name ||
            props.district;
          const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;
          onUpdate({ district: name });
          onDistrictSelect?.(name);
        }
      });

      map.on('mouseenter', 'districts-mask', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      applyMaskStatus();

      map.addLayer({
        id: 'districts-outline',
        type: 'line',
        source: 'districts-source',
        'source-layer': 'zcta',
        paint: {
          'line-color': '#000000',
          'line-width': 0.8,
          'line-opacity': 0.5,
        },
      });

      // Highlighted boundary for selected district
      map.addLayer({
        id: 'selected-district-outline',
        type: 'line',
        source: 'districts-source',
        'source-layer': 'zcta',
        paint: {
          'line-color': '#F96000',
          'line-width': 2.5,
          'line-opacity': 1.0,
        },
        filter: [
          'any',
          ['==', ['get', 'district_name'], currentDistrict],
          ['==', ['get', 'DIST_NAME'], currentDistrict],
          ['==', ['get', 'District'], currentDistrict],
          ['==', ['get', 'NAME'], currentDistrict],
          ['==', ['get', 'name'], currentDistrict],
          ['==', ['get', 'district'], currentDistrict],
        ],
      });
    } else if (map.getLayer('selected-district-outline')) {
      map.setFilter('selected-district-outline', [
        'any',
        ['==', ['get', 'district_name'], currentDistrict],
        ['==', ['get', 'DIST_NAME'], currentDistrict],
        ['==', ['get', 'District'], currentDistrict],
        ['==', ['get', 'NAME'], currentDistrict],
        ['==', ['get', 'name'], currentDistrict],
        ['==', ['get', 'district'], currentDistrict],
      ]);
    }

    const subNameExpr = [
      'coalesce',
      ['get', 'district_name'],
      ['get', 'DIST_NAME'],
      ['get', 'District'],
      ['get', 'NAME'],
      ['get', 'name'],
      ['get', 'district'],
    ];

    const hasSubTarget = currentDistrict && currentDistrict !== 'All Districts' && currentDistrict !== 'Odisha';
    const subLineOpacityExpr: any = hasSubTarget
      ? ['match', subNameExpr, getDistrictVariants(currentDistrict), 0.8, 0.0]
      : 0.8;

    if (!map.getSource('subdistrict-source')) {
      map.addSource('subdistrict-source', {
        type: 'vector',
        url: `pmtiles://${SUBDISTRICT_URL}`,
      });
      map.addLayer({
        id: 'subdistrict-outline',
        type: 'line',
        source: 'subdistrict-source',
        'source-layer': 'zcta',
        layout: {
          visibility: config.layer === 'age_cohort' ? 'none' : 'visible',
        },
        paint: {
          'line-color': '#989898ff',
          'line-width': 0.9,
          'line-opacity': subLineOpacityExpr,
        },
      });
    } else if (map.getLayer('subdistrict-outline')) {
      map.setLayoutProperty(
        'subdistrict-outline',
        'visibility',
        config.layer === 'age_cohort' ? 'none' : 'visible',
      );
      map.setPaintProperty(
        'subdistrict-outline',
        'line-opacity',
        subLineOpacityExpr,
      );
    }
  };

  const addDataOverlay = async (map: maplibregl.Map) => {
    const sourceId = 'data-source';
    const layerId = 'data-layer';

    const currentConfig = LAYER_CONFIGS[config.layer];
    if (!currentConfig) return;

    const yearKey = config.year;

    if (config.layer === 'pop_density') {
      const year = config.year || '2026';
      const scaleValues = [0, 200, 400, 800, 2000];

      const densityColorExp = [
        'step',
        ['coalesce', ['to-number', ['get', `density_${year}`]], 0],
        '#f0f9e8',
        scaleValues[1],
        '#bae4bc',
        scaleValues[2],
        '#7bccc4',
        scaleValues[3],
        '#43a2ca',
        scaleValues[4],
        '#0868ac',
      ];

      const nameExpr = [
        'coalesce',
        ['get', 'district_name'],
        ['get', 'DIST_NAME'],
        ['get', 'District'],
        ['get', 'NAME'],
        ['get', 'name'],
        ['get', 'district'],
      ];

      const hasTarget = currentDistrict && currentDistrict !== 'All Districts' && currentDistrict !== 'Odisha';
      const fillOpacityExpr: any = hasTarget
        ? ['match', nameExpr, getDistrictVariants(currentDistrict), 0.85, 0.0]
        : 0.85;

      const popSourceId = 'pop-density-source';
      const popLayerId = 'pop-density-layer';

      map.addSource(popSourceId, {
        type: 'vector',
        url: `pmtiles://${SUBDISTRICT_URL}`,
      });

      map.addLayer({
        id: popLayerId,
        type: 'fill',
        source: popSourceId,
        'source-layer': 'zcta',
        paint: {
          'fill-color': densityColorExp as any,
          'fill-opacity': fillOpacityExpr,
          'fill-outline-color': '#ffffff',
        },
      });
      return;
    }

    if (config.layer === 'age_cohort') {
      const currentSub = config.ageCohortSub || '0_14';
      const year = config.year || '2026';

      const scaleValues =
        currentSub === '0_14'
          ? [0, 180000, 290000, 400000, 515000]
          : currentSub === '15_59'
            ? [0, 465000, 805000, 1090000, 1430000]
            : [0, 90000, 150000, 210000, 290000];

      const nameExpr = [
        'coalesce',
        ['get', 'district_name'],
        ['get', 'DIST_NAME'],
        ['get', 'District'],
        ['get', 'NAME'],
        ['get', 'name'],
        ['get', 'district'],
      ];

      const valueMatch: any[] = ['match', nameExpr];
      const valueMatchLabels = new Set<string>();

      ALLOWED_DISTRICTS.forEach((distName) => {
        const key = getAgeCohortDistrictName(distName);
        const yearData = AGE_COHORT_DATA[key]?.[year];
        let val = 0;
        if (yearData) {
          if (currentSub === '0_14') {
            val = (yearData.male.age_0_14 || 0) + (yearData.female.age_0_14 || 0);
          } else if (currentSub === '15_59') {
            val = (yearData.male.age_15_59 || 0) + (yearData.female.age_15_59 || 0);
          } else {
            val = (yearData.male.age_60_plus || 0) + (yearData.female.age_60_plus || 0);
          }
        }

        const pushLabel = (label: string, value: number) => {
          if (!valueMatchLabels.has(label)) {
            valueMatchLabels.add(label);
            valueMatch.push(label, value);
          }
        };

        pushLabel(distName, val);
        pushLabel(distName.toUpperCase(), val);

        Object.keys(DISTRICT_NAME_VARIANTS).forEach((variantKey) => {
          if (DISTRICT_NAME_VARIANTS[variantKey] === distName) {
            pushLabel(variantKey, val);
            pushLabel(variantKey.toUpperCase(), val);
          }
        });
      });

      valueMatch.push(0);

      const districtColorExp = [
        'step',
        valueMatch,
        '#f0f9e8',
        scaleValues[1],
        '#bae4bc',
        scaleValues[2],
        '#7bccc4',
        scaleValues[3],
        '#43a2ca',
        scaleValues[4],
        '#0868ac',
      ];

      map.addSource(sourceId, {
        type: 'vector',
        url: `pmtiles://${PMTILES_URL}`,
      });

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        'source-layer': 'zcta',
        paint: {
          'fill-color': districtColorExp as any,
          'fill-opacity': 0.8,
          'fill-outline-color': '#ffffff',
        },
      });
      return;
    }

    if (MONTHLY_DATES.includes(yearKey) || currentConfig.type === 'sentinel') {
      const timeRange =
        SENTINEL_DATE_MAP[yearKey] ||
        currentConfig.urls[yearKey] ||
        (Object.values(currentConfig.urls)[0] as string);
      if (!timeRange) return;

      const [startDate, endDate] = timeRange.split('/');
      const body = {
        collections: ['sentinel-2-l2a'],
        datetime: `${startDate}T00:00:00Z/${endDate}T23:59:59Z`,
        query: { 'eo:cloud_cover': { lt: 20 } },
      };

      try {
        const resp = await fetch(PC_MOSAIC_REGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        if (data.searchid) {
          const tileUrl = `${PC_TILE_BASE}/${data.searchid}/WebMercatorQuad/{z}/{x}/{y}@2x.png?${PC_RENDER_PARAMS}`;
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
          });
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: { 'raster-opacity': 1 },
          });
        }
      } catch (err) {
        console.error('Sentinel mosaic error', err);
      }
      return;
    }

    if (currentConfig.type === 'raster') {
      let rasterParams = currentConfig.params;
      let url: string;

      if (config.layer === 'nightlight') {
        url = buildNtlUrl(yearKey, currentDistrict) + `?panel=${config.id}`;
        rasterParams = '';
        setColorFunction(url, (pixel: any, color: any, metadata: any) => {
          const val = pixel[0];
          if (val === metadata.noData || val < 0) {
            color.set([0, 0, 0, 0]);
            return;
          }
          if (val <= 0.8) {
            color.set([0, 0, 0, 255]);
          } else if (val <= 5) {
            color.set([72, 72, 93, 255]);
          } else if (val <= 28) {
            color.set([246, 234, 175, 255]);
          } else {
            color.set([254, 0, 0, 255]);
          }
        });
      } else if (config.layer === 'ghsl') {
        url = buildGhslUrl(yearKey, currentDistrict) + `?panel=${config.id}`;
        rasterParams = '';

        setColorFunction(url, (pixel: any, color: any) => {
          const val = pixel[0];
          const cls = GHSL_CLASSES[val.toString()];
          if (cls) {
            const hex = cls.color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            color.set([r, g, b, 255]);
          } else {
            color.set([0, 0, 0, 0]);
          }
        });
      } else if (config.layer === 'builtup') {
        url = buildBuiltupUrl(yearKey, currentDistrict) + `?panel=${config.id}`;
        rasterParams = '';

        const hex = activeColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const rgba = [r, g, b, 255];

        setColorFunction(url, (pixel: any, color: any, metadata: any) => {
          const val = pixel[0];
          if (val === metadata.noData || val < 0 || val > 11) {
            color.set([0, 0, 0, 0]);
            return;
          }
          if (val === 7) {
            color.set(rgba);
          } else {
            color.set([0, 0, 0, 0]);
          }
        });
      } else {
        url =
          currentConfig.urls[yearKey] ||
          (Object.values(currentConfig.urls)[0] as string);
        const valRange = currentConfig.params || '1,1';
        rasterParams = `#color:["${activeColor}","${activeColor}"],${valRange}`;
      }

      map.addSource(sourceId, {
        type: 'raster',
        url: `cog://${url}${rasterParams}`,
        tileSize: 256,
      });
      const paintProps: any = { 'raster-opacity': 1 };
      if (
        config.layer === 'nightlight' ||
        config.layer === 'ghsl' ||
        config.layer === 'builtup'
      ) {
        paintProps['raster-resampling'] = 'linear';
      }

      map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: paintProps,
      });
    } else {
      const url =
        currentConfig.urls[yearKey] ||
        (Object.values(currentConfig.urls)[0] as string);
      const httpUrl = url.replace('pmtiles://', '');
      try {
        const p = new PMTiles(httpUrl);
        const metadata = (await p.getMetadata()) as any;
        let sourceLayerName = 'layer';
        if (metadata?.vector_layers?.[0]?.id)
          sourceLayerName = metadata.vector_layers[0].id;

        map.addSource(sourceId, {
          type: 'vector',
          url: `pmtiles://${httpUrl}`,
        });

        if (config.layer === 'roads') {
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            'source-layer': sourceLayerName,
            filter: [
              'any',
              [
                'in',
                ['get', 'highway'],
                ['literal', ['trunk', 'primary', 'trunk_link', 'primary_link']],
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
          });
        } else {
          map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            'source-layer': sourceLayerName,
            paint: {
              'fill-color': activeColor,
              'fill-opacity': 0.1,
              'fill-outline-color': '#ffffff',
            },
          });
        }
      } catch (e) {
        console.error('Vector load error', e);
      }
    }
  };

  const getYearOptions = (): string[] => {
    if (config.layer === 'nightlight') return NTL_YEAR_OPTIONS;
    if (config.layer === 'age_cohort') return AGE_COHORT_YEARS;
    if (config.layer === 'pop_density') return POP_DENSITY_YEARS;
    return Object.keys(LAYER_CONFIGS[config.layer]?.urls || {});
  };

  return (
    <div className="relative h-[600px] 2xl:h-[750px] bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden group shadow-sm transition-all hover:shadow-md">
      <div ref={containerRef} className="w-full h-full" />

      {isLoading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Overlay Navigation - TOP */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
        <div className="flex flex-wrap gap-2 pointer-events-auto">
          {/* District Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsDistrictOpen(!isDistrictOpen);
                setIsBasemapOpen(false);
                setIsYearOpen(false);
                setIsLayerOpen(false);
              }}
              className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 hover:border-orange-500 transition-all font-black"
            >
              <MapPin className="w-3.5 h-3.5 text-[#F96000]" />
              <span className="text-[11px] text-gray-700 tracking-tight font-bold">
                {currentDistrict}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-gray-400 transition-transform ${isDistrictOpen ? 'rotate-180' : ''}`}
                strokeWidth={3}
              />
            </button>
            {isDistrictOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-[150] animate-in fade-in slide-in-from-top-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                {ALLOWED_DISTRICTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      onUpdate({ district: d });
                      onDistrictSelect?.(d);
                      setIsDistrictOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-colors ${currentDistrict === d
                      ? 'bg-orange-50 text-[#F96000]'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Basemap Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsBasemapOpen(!isBasemapOpen);
                setIsDistrictOpen(false);
                setIsYearOpen(false);
                setIsLayerOpen(false);
              }}
              className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 hover:border-orange-500 transition-all"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black text-gray-700 tracking-tighter uppercase">
                {config.basemap}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-gray-400 transition-transform ${isBasemapOpen ? 'rotate-180' : ''}`}
                strokeWidth={3}
              />
            </button>
            {isBasemapOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-[150] animate-in fade-in slide-in-from-top-2">
                {[
                  { id: 'grey', label: 'Grey Canvas' },
                  { id: 'satellite', label: 'Satellite' },
                  { id: 'osm', label: 'OSM' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onUpdate({ basemap: item.id as any });
                      setIsBasemapOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-[11px] font-black uppercase rounded-lg transition-colors ${config.basemap === item.id ? 'bg-orange-50 text-[#F96000]' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year / Quarter Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsYearOpen(!isYearOpen);
                setIsDistrictOpen(false);
                setIsBasemapOpen(false);
                setIsLayerOpen(false);
              }}
              className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 hover:border-orange-500 transition-all font-black"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[11px] text-gray-700 font-mono tracking-tighter">
                {config.year}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`}
                strokeWidth={3}
              />
            </button>
            {isYearOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-[150] animate-in fade-in slide-in-from-top-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {getYearOptions().map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      onUpdate({ year: y });
                      setIsYearOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-[11px] font-black rounded-lg transition-colors font-mono ${config.year === y ? 'bg-orange-50 text-[#F96000]' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layer Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLayerOpen(!isLayerOpen);
                setIsDistrictOpen(false);
                setIsYearOpen(false);
                setIsBasemapOpen(false);
              }}
              className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 hover:border-orange-500 transition-all font-black"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[11px] text-gray-700 tracking-tighter uppercase">
                {LAYER_CONFIGS[config.layer]?.label}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-gray-400 transition-transform ${isLayerOpen ? 'rotate-180' : ''}`}
                strokeWidth={3}
              />
            </button>
            {isLayerOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-[150] animate-in fade-in slide-in-from-top-2">
                {Object.keys(LAYER_CONFIGS).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      const nextYear =
                        key === 'nightlight'
                          ? '2026 June'
                          : key === 'age_cohort'
                            ? '2026'
                            : config.year.includes(' ')
                              ? '2024'
                              : config.year;

                      onUpdate({
                        layer: key,
                        year: nextYear,
                      });
                      setIsLayerOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-[11px] font-black uppercase tracking-tight rounded-lg transition-colors ${config.layer === key ? 'bg-orange-50 text-[#F96000]' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {LAYER_CONFIGS[key].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={onRemove}
            className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-lg border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>
      </div>

      {config.layer === 'nightlight' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-[120] w-[170px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                Nightlight Intensity
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                <span className="text-gray-700">Unit : </span>nW·cm⁻²·sr⁻¹
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12} className="max-w-[200px]">
                <p className="text-[11px] leading-relaxed">
                  {MULTI_TOOLTIPS.nightlight.content}
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

      {config.layer === 'ghsl' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-[120] w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                Settlement
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                Source: GHS-SMOD R2023A
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={18} className="max-w-[340px] p-4">
                <SettlementTooltip />
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-1">
            {Object.entries(GHSL_CLASSES).map(([val, cls]: any) => (
              <div key={val} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm border border-gray-100 flex-shrink-0"
                  style={{ backgroundColor: cls.color }}
                />
                <span className="text-[9px] font-medium text-gray-600 leading-tight">
                  {cls.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.layer === 'roads' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-[120] w-[180px]">
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
                  {MULTI_TOOLTIPS.roads.content}
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
          </div>
        </div>
      )}

      {config.layer === 'builtup' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-[120] w-[160px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
              Built-up Area
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12} className="max-w-[200px] z-[99999]">
                <p className="text-[11px] leading-relaxed">
                  {MULTI_TOOLTIPS.builtup.content}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-200"
              style={{ backgroundColor: activeColor }}
            />
            <span className="text-[10px] font-medium text-gray-700">
              Developed Area
            </span>
          </div>
        </div>
      )}

      {config.layer === 'age_cohort' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-[120] w-[210px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                Age Cohort
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                Year: {config.year || '2026'}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12} className="max-w-[200px] z-[99999]">
                <p className="text-[11px] leading-relaxed">
                  Population Projections using Bayesian Method.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex rounded-lg bg-gray-100 p-1 mb-2.5 gap-1">
            {AGE_COHORT_SUBS.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onUpdate({ ageCohortSub: sub.id as any })}
                className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${(config.ageCohortSub || '0_14') === sub.id
                  ? 'bg-white text-[#F96000] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {(config.ageCohortSub === '15_59'
              ? [
                { label: '< 465k', color: '#f0f9e8' },
                { label: '465k - 805k', color: '#bae4bc' },
                { label: '805k - 1.09M', color: '#7bccc4' },
                { label: '1.09M - 1.43M', color: '#43a2ca' },
                { label: '> 1.43M', color: '#0868ac' },
              ]
              : config.ageCohortSub === '60_plus'
                ? [
                  { label: '< 90k', color: '#f0f9e8' },
                  { label: '90k - 150k', color: '#bae4bc' },
                  { label: '150k - 210k', color: '#7bccc4' },
                  { label: '210k - 290k', color: '#43a2ca' },
                  { label: '> 290k', color: '#0868ac' },
                ]
                : [
                  { label: '< 180k', color: '#f0f9e8' },
                  { label: '180k - 290k', color: '#bae4bc' },
                  { label: '290k - 400k', color: '#7bccc4' },
                  { label: '400k - 515k', color: '#43a2ca' },
                  { label: '> 515k', color: '#0868ac' },
                ]
            ).map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm border border-gray-200 shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {config.layer === 'pop_density' && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-[120] w-[210px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                Population Density
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                Year: {config.year || '2026'}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={12} className="max-w-[200px] z-[99999]">
                <p className="text-[11px] leading-relaxed">
                  Subdistrict-level population density (persons per km²).
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-1">
            {[
              { label: '0 - 200 P / sq.km', color: '#f0f9e8' },
              { label: '200 - 400 P / sq.km', color: '#bae4bc' },
              { label: '400 - 800 P / sq.km', color: '#7bccc4' },
              { label: '800 - 2K P / sq.km', color: '#43a2ca' },
              { label: '> 2K P / sq.km', color: '#0868ac' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm border border-gray-200 shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
