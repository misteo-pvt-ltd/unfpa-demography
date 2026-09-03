/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import {
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Home,
  Satellite,
  Calendar,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../ui/tooltip';

// const InfoTooltip = ({
//   text,
//   position = 'top',
//   // source,
// }: {
//   text: string;
//   position?: 'top' | 'bottom';
//   source?: string;
// }) => (
//   <span className="group/info relative inline-block ml-2 align-middle z-[100]">
//     <Info className="w-4 h-4 text-gray-400 group-hover/info:text-[#F96000] transition-colors cursor-help" />
//     <span
//       className={`absolute left-1/2 -translate-x-1/2 w-48 px-1 hidden group-hover/info:flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 pointer-events-none z-[200] 
//             ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
//     >
//       <span className="bg-white/98 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-gray-100 w-full block whitespace-normal text-center">
//         <span className="text-[10px] text-gray-700 leading-relaxed font-semibold block">
//           {text}
//         </span>
//         {position === 'top' ? (
//           <span className="absolute top-[calc(100%-6px)] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 shadow-sm block"></span>
//         ) : (
//           <span className="absolute bottom-[calc(100%-6px)] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45 shadow-sm block"></span>
//         )}
//       </span>
//     </span>
//   </span>
// );
import * as pmtiles from 'pmtiles';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';

// NEW: Eagerly glob all images/gifs in the subdirectories so Vite bundles them.
// We map the "frontend_assets/" prefix from frontend_data.ts back to the local folders.
export const ASSET_MAP: Record<string, string> = (import.meta as any).glob(
  './**/*.{png,jpg,jpeg,gif,svg}',
  { eager: true, import: 'default' },
);

// CHANGED: pull TAB_CONTENT + Points_Data from the auto-generated file backed
// by the satellite pipeline, so every modal carries the actual measurements
// (new built-up area, conversion sources, nearby drivers, confidence).
// Adjust the relative path to wherever you drop frontend_data.ts.
import { TAB_CONTENT, Points_Data } from './frontend_data';

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

// Set up PMTiles protocol
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const isPointInDistrict = (pointCoords: [number, number], features: any[]) => {
  const pt = point(pointCoords);

  return features.some((feature) => {
    try {
      return booleanPointInPolygon(pt, feature);
    } catch {
      return false;
    }
  });
};

// -----------------------------------------------------------
// EOX Sentinel-2 Cloudless WMTS (free, no API key needed)
// -----------------------------------------------------------

const EOX_BASE = 'https://tiles.maps.eox.at/wmts/1.0.0';

const YEAR_LAYER_MAP: Record<string, { layer: string; label: string }> = {
  '2018': { layer: 's2cloudless-2018_3857', label: '2018' },
  '2019': { layer: 's2cloudless-2019_3857', label: '2019' },
  '2020': { layer: 's2cloudless-2020_3857', label: '2020' },
  '2021': { layer: 's2cloudless-2021_3857', label: '2021' },
  '2022': { layer: 's2cloudless-2022_3857', label: '2022' },
  '2023': { layer: 's2cloudless-2023_3857', label: '2023' },
  '2024': { layer: 's2cloudless-2024_3857', label: '2024' },
  '2025': { layer: 's2cloudless-2024_3857', label: '2025' },
  '2026': { layer: 's2cloudless-2024_3857', label: '2026' },
};

const YEARS = Object.keys(YEAR_LAYER_MAP);
const PMTILES_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_district_pop_total_2036.pmtiles`;

const ODISHA_CENTER: [number, number] = [84.8, 20.5];
const ODISHA_BOUNDS: maplibregl.LngLatBoundsLike = [
  [81.3883, 17.8124],
  [87.477, 22.5674],
];

const CATEGORY_COLOR: Record<string, string> = {
  'Urban Sprawl': '#F76000',
  'New Settlement': '#F59E0B',
  'Build-up': '#EF4444',
  Industry: '#3B82F6',
  Infrastructure: '#10B981',
  Mines: '#7C3AED',
  Vegetation: '#65A30D',
};

const HOTSPOT_DESCRIPTIONS: Record<string, string> = {
  'Urban Sprawl':
    'Outward expansion of existing urban areas into surrounding rural or semi-urban land, often driven by population growth and migration.',
  'New Settlement':
    'Emergence of entirely new residential or mixed-use clusters in previously undeveloped areas, indicating fresh habitation pressure.',
  'Build-up':
    'General increase in built-up surface cover — rooftops, paved surfaces, and structures — within an area, reflecting densification or new construction.',
  Industry:
    'Establishment or expansion of industrial facilities such as factories, warehouses, or processing units contributing to economic land conversion.',
  Infrastructure:
    'Development of roads, railways, power lines, or other physical infrastructure that enables connectivity and further settlement.',
  Mines:
    'Active or expanding mining operations — open-cast pits, quarries, or extraction sites — leading to significant surface disturbance.',
  Vegetation:
    'Notable gain in green cover including plantations, afforestation zones, or natural regrowth — a positive land-use change indicator.',
};

interface WhatHowWhy_v2Props {
  targetDistrict?: string;
  targetBounds?: any;
}

export const WhatHowWhy_v2: React.FC<WhatHowWhy_v2Props> = ({
  targetDistrict = 'Odisha',
  targetBounds,
}) => {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const accumulatedFeaturesRef = useRef<Map<string, any[]>>(new Map());
  const playIntervalRef = useRef<any>(null);
  const [pmtilesBounds, setPmtilesBounds] =
    useState<maplibregl.LngLatBoundsLike | null>(null);

  /** States for Points_Data */
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [lastSelectedPoint, setLastSelectedPoint] = useState<number | null>(
    null,
  );
  const [activeModalTab, setActiveModalTab] = useState<'What' | 'How' | 'Why'>(
    'What',
  );
  const prePointClickState = useRef<{ center: any; zoom: number } | null>(null);

  const getTileUrl = (year: string) => {
    const { layer } = YEAR_LAYER_MAP[year];
    return `${EOX_BASE}/${layer}/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg`;
  };

  const switchLayer = useCallback((year: string) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    YEARS.forEach((y) => {
      if (map.getLayer(`s2-${y}`)) {
        map.setLayoutProperty(
          `s2-${y}`,
          'visibility',
          y === year ? 'visible' : 'none',
        );
      }
    });
  }, []);

  const filteredPoints = React.useMemo(() => {
    if (!targetDistrict || targetDistrict.toLowerCase() === 'odisha') {
      return Points_Data;
    }

    const target = targetDistrict.toLowerCase();

    const direct = Points_Data.filter(
      (p: any) =>
        (p.district || '').toLowerCase() === target ||
        (p.district || '').toLowerCase().startsWith(target.slice(0, 4)),
    );
    if (direct.length > 0) return direct;

    const districtFeatures = accumulatedFeaturesRef.current.get(target) || [];
    if (!districtFeatures.length) return [];

    return Points_Data.filter((p: any) =>
      isPointInDistrict([p.cord[1], p.cord[0]], districtFeatures),
    );
  }, [targetDistrict, cacheVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('points-source')) return;

    const geojson = {
      type: 'FeatureCollection' as const,
      features: filteredPoints.map((item: any) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [item.cord[1], item.cord[0]],
        },
        properties: {
          id: item.id,
          category: item.category || 'Build-up',
        },
      })),
    };

    (map.getSource('points-source') as maplibregl.GeoJSONSource).setData(
      geojson,
    );
  }, [filteredPoints]);

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    if (selectedPoint !== null) return;

    const map = mapRef.current;

    if (targetBounds) {
      map.fitBounds(targetBounds, {
        padding: 80,
        duration: 1500,
        essential: true,
      });
      return;
    }

    const lookupKey = targetDistrict.toLowerCase();
    let features: any[] = [];

    if (lookupKey === 'odisha') {
      const bounds = pmtilesBounds || ODISHA_BOUNDS;
      map.fitBounds(bounds, { padding: 40, duration: 1500, essential: true });
      return;
    }

    features = accumulatedFeaturesRef.current.get(lookupKey) || [];

    if (features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      const extend = (coords: any) => {
        if (typeof coords[0] === 'number')
          bounds.extend(coords as [number, number]);
        else coords.forEach(extend);
      };
      features.forEach((f: any) => {
        const geo = f.geometry as any;
        if (geo.coordinates) extend(geo.coordinates);
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 40, duration: 1500, essential: true });
      }
    } else {
      const bounds = pmtilesBounds || ODISHA_BOUNDS;
      map.fitBounds(bounds, { padding: 40, duration: 1500, essential: true });
    }
  }, [targetDistrict, targetBounds, isLoaded, cacheVersion, pmtilesBounds]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
        sources: {},
        layers: [],
      },
      center: ODISHA_CENTER,
      zoom: 6.2,
      minZoom: 5,
      maxZoom: 14,
      maxBounds: [
        [79.277344, 16.232218],
        [90.0, 24.058806],
      ],
      attributionControl: false,
    });

    map.scrollZoom.enable();

    map.on('load', async () => {
      map.addLayer({
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#1a2535' },
      });

      YEARS.forEach((year) => {
        map.addSource(`s2-source-${year}`, {
          type: 'raster',
          tiles: [getTileUrl(year)],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 14,
          bounds: [79.0, 16.5, 90.0, 24.5],
          attribution: `Sentinel-2 cloudless by <a href="https://eox.at">EOX</a> (CC BY-NC-SA 4.0)`,
        });

        map.addLayer({
          id: `s2-${year}`,
          type: 'raster',
          source: `s2-source-${year}`,
          layout: { visibility: year === '2024' ? 'visible' : 'none' },
          paint: {
            'raster-opacity': 1,
            'raster-fade-duration': 400,
          },
        });
      });

      map.addSource('district-source-sentinel', {
        type: 'vector',
        url: `pmtiles://${PMTILES_URL}`,
      });

      map.addLayer({
        id: 'district-outline-sentinel',
        type: 'line',
        source: 'district-source-sentinel',
        'source-layer': 'zcta',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-opacity': 0.8,
        },
      });

      /** ADDING POINTS — initial geojson honours the category-colour map */
      const pointsGeoJSON = {
        type: 'FeatureCollection' as const,
        features: Points_Data.map((item: any) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [item.cord[1], item.cord[0]],
          },
          properties: {
            id: item.id,
            category: item.category || 'Build-up',
          },
        })),
      };

      map.addSource('points-source', {
        type: 'geojson',
        data: pointsGeoJSON,
      });

      // --- MAIN POINT LAYER --- (colour by category)
      map.addLayer({
        id: 'points-layer',
        type: 'circle',
        source: 'points-source',
        paint: {
          'circle-radius': 7,
          'circle-color': [
            'match',
            ['get', 'category'],
            'Urban Sprawl',
            CATEGORY_COLOR['Urban Sprawl'],
            'New Settlement',
            CATEGORY_COLOR['New Settlement'],
            'Build-up',
            CATEGORY_COLOR['Build-up'],
            'Industry',
            CATEGORY_COLOR['Industry'],
            'Infrastructure',
            CATEGORY_COLOR['Infrastructure'],
            'Mines',
            CATEGORY_COLOR['Mines'],
            'Vegetation',
            CATEGORY_COLOR['Vegetation'],
            /* default */ '#F76000',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      // --- HIGHLIGHT LAYER ---
      map.addLayer({
        id: 'points-layer-highlight',
        type: 'circle',
        source: 'points-source',
        paint: {
          'circle-radius': 6,
          'circle-color': 'transparent',
          'circle-stroke-width': 4,
          'circle-stroke-color': '#0868ac',
        },
        filter: ['==', 'id', -999],
      });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'map-tooltip',
      });

      const showPointTooltip = (e: any) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const pointId = Number(feature.properties.id);
        const pointData = Points_Data.find((p: any) => p.id === pointId);
        if (!pointData) return;

        const meta = TAB_CONTENT.What.find((item: any) => item.id === pointId);
        const rawTitle = meta?.title || '';
        const cleanTitle = rawTitle.split(':')[0];

        map.getCanvas().style.cursor = 'pointer';

        const lat = pointData.cord[0].toFixed(4);
        const lng = pointData.cord[1].toFixed(4);

        const built = (pointData as any).new_built_area_ha;
        const conf = (pointData as any).confidence;
        const builtRow =
          built !== undefined && built !== null && Number(built) > 0
            ? `<div style="font-size:10px;font-weight:600;color:#2d3748;">
                 <span style="color:#718096;text-transform:uppercase;letter-spacing:0.04em;">New built-up: </span>
                 ${Number(built).toFixed(1)} ha
               </div>`
            : '';
        const confRow =
          conf !== undefined && conf !== null
            ? `<div style="font-size:10px;font-weight:600;color:#2d3748;">
                 <span style="color:#718096;text-transform:uppercase;letter-spacing:0.04em;">Confidence: </span>
                 ${Math.round(Number(conf) * 100)}%
               </div>`
            : '';
        const districtRow = (pointData as any).district || targetDistrict;

        const content = `
          <div style="
            padding: 10px 12px;
            min-width: 190px;
            font-family: system-ui;
            display: flex;
            flex-direction: column;
            gap: 6px;
          ">
            <div style="
              font-size: 12px;
              font-weight: 800;
              color: ${CATEGORY_COLOR[meta?.category || 'Build-up'] || '#F76000'};
              text-transform: uppercase;
              letter-spacing: 0.05em;
            ">
              ${meta?.category || 'Observation'}
            </div>

            <div style="
              font-size: 11px;
              font-weight: 700;
              color: #1a202c;
              line-height: 1.3;
            ">
              ${cleanTitle || ''}
            </div>

            <div style="
              font-size: 9px;
              font-weight: 600;
              color: #718096;
              text-transform: uppercase;
            ">
              ${districtRow}
            </div>

            <div style="width: 100%; height: 1px; background: #e2e8f0; margin: 2px 0;"></div>

            ${builtRow}
            ${confRow}

            <div style="
              font-size: 10px;
              font-weight: 600;
              color: #2d3748;
            ">
              ${lat}° N, ${lng}° E
            </div>
          </div>
        `;

        popup
          .setLngLat([pointData.cord[1], pointData.cord[0]])
          .setHTML(content)
          .addTo(map);
      };

      const hideTooltip = () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      };

      map.on('mousemove', 'points-layer', showPointTooltip);
      map.on('mouseleave', 'points-layer', hideTooltip);

      try {
        const p = new pmtiles.PMTiles(PMTILES_URL);
        const header = await p.getHeader();
        if (header.minLon !== undefined) {
          const b: maplibregl.LngLatBoundsLike = [
            [header.minLon, header.minLat],
            [header.maxLon, header.maxLat],
          ];
          setPmtilesBounds(b);
          map.fitBounds(b, { padding: 40, duration: 0 });
        } else {
          map.fitBounds(ODISHA_BOUNDS, { padding: 40, duration: 0 });
        }
      } catch (err) {
        console.warn('Could not fit to PMTiles header', err);
        map.fitBounds(ODISHA_BOUNDS, { padding: 40, duration: 0 });
      }

      setIsLoaded(true);
    });

    map.on('click', 'points-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties;
        if (props) {
          setSelectedPoint(Number(props.id));
          setActiveModalTab('What');
        }
      }
    });

    map.on('mouseenter', 'points-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'points-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('sourcedata', (e) => {
      if (e.sourceId === 'district-source-sentinel' && e.isSourceLoaded) {
        const features = map.querySourceFeatures('district-source-sentinel', {
          sourceLayer: 'zcta',
        });
        let hasChanges = false;
        features.forEach((f: any) => {
          const rawName =
            f.properties?.district_name ||
            f.properties?.NAME ||
            f.properties?.name;
          if (rawName) {
            const canonicalName = rawName.toLowerCase();
            if (!accumulatedFeaturesRef.current.has(canonicalName)) {
              accumulatedFeaturesRef.current.set(canonicalName, []);
            }
            const existing = accumulatedFeaturesRef.current.get(canonicalName)!;
            const coords = (f.geometry as any).coordinates
              ?.toString()
              .substring(0, 100);
            if (
              !existing.some(
                (ef: any) =>
                  (ef.geometry as any).coordinates
                    ?.toString()
                    .substring(0, 100) === coords,
              )
            ) {
              existing.push(f);
              hasChanges = true;
            }
          }
        });
        if (hasChanges) setCacheVersion((v) => v + 1);
      }
    });

    mapRef.current = map;

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Playback Logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setSelectedYear((prev: string) => {
          const currentIndex = YEARS.indexOf(prev);
          const nextIndex = (currentIndex + 1) % YEARS.length;
          return YEARS[nextIndex];
        });
      }, 2000);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying]);

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = pmtilesBounds || ODISHA_BOUNDS;
    map.fitBounds(bounds, { padding: 40, duration: 1500, essential: true });
  };

  useEffect(() => {
    if (!isLoaded) return;
    switchLayer(selectedYear);
  }, [selectedYear, isLoaded, switchLayer]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (map.getLayer('points-layer-highlight')) {
      map.setFilter('points-layer-highlight', [
        '==',
        'id',
        selectedPoint !== null ? selectedPoint : -999,
      ]);
    }

    if (selectedPoint !== null && selectedPoint !== lastSelectedPoint) {
      if (prePointClickState.current === null) {
        prePointClickState.current = {
          center: map.getCenter(),
          zoom: map.getZoom(),
        };
      }

      const point = Points_Data.find((p: any) => p.id === selectedPoint);
      if (point && point.cord) {
        map.flyTo({
          center: [point.cord[1], point.cord[0]],
          zoom: 14,
          duration: 1500,
          padding: { right: window.innerWidth * 0.35 } as any,
        });
      }

      setLastSelectedPoint(selectedPoint);
    } else if (selectedPoint === null) {
      setLastSelectedPoint(null);
    }
  }, [selectedPoint, lastSelectedPoint]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Satellite className="w-6 h-6" />
            Hotspot Analysis
            {/* <InfoTooltip text="Identification of spatial clusters and hotspots." position="top" /> */}
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 font-medium leading-relaxed">
            Analyze what changed, how it changed, and why using high-resolution
            Sentinel-2 data.
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-4 shrink-0 transition-all bg-gray-50/50 p-1.5 px-3 rounded-lg border border-gray-100">
          <div className="relative flex items-center gap-1.5 group">
            <div
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="px-4 py-1.5 text-[12px] font-black tracking-wide bg-white text-gray-600 border border-gray-400 rounded-md transition-all min-w-17.5 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400"
            >
              <span className="font-mono">{selectedYear}</span>
            </div>
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="text-[#f64e24] transition-all hover:scale-110"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>

            {isYearDropdownOpen && (
              <>
                <div
                  className={`fixed inset-0 ${isImagePreviewOpen ? 'z-30' : 'z-190'
                    }`}
                  onClick={() => setIsYearDropdownOpen(false)}
                />
                <div
                  className={`absolute right-0 top-full mt-3 bg-white rounded-md shadow-xl border border-gray-100 p-3 ${isImagePreviewOpen ? 'z-30' : 'z-200'
                    } animate-in fade-in slide-in-from-top-2 min-w-30 transition-all`}
                >
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      onClick={() => {
                        setSelectedYear(y);
                        setIsYearDropdownOpen(false);
                      }}
                      className="w-full px-2 py-3 text-left transition-all hover:bg-gray-50/50 group/item flex items-center justify-between rounded"
                    >
                      <span
                        className={`text-xs font-bold tracking-wider border-b-2 pb-0.5 transition-all ${selectedYear === y ? 'text-gray-600 border-gray-400' : 'text-gray-600 border-gray-400'}`}
                      >
                        {y}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl h-150 relative">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Playback Controls & Timeline */}
        {isLoaded && (
          <div
            className={`absolute bottom-6 ${isImagePreviewOpen ? 'z-30' : 'z-40'
              } w-[90%] md:w-150 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-2xl flex items-center gap-6 group transition-all duration-300
              ${selectedPoint
                ? 'left-[40%] -translate-x-[50%] md:left-[38%] lg:left-[35%]'
                : 'left-1/2 -translate-x-1/2'
              }
            `}
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#F76000] text-white shadow-lg hover:bg-orange-600 transition-all active:scale-95 shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">
                  Select Year
                </span>
                <span className="text-lg font-black text-white tracking-widest font-mono">
                  {selectedYear}
                </span>
              </div>

              <div className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden flex items-center">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#F76000] transition-all duration-300"
                  style={{
                    width: `${(YEARS.indexOf(selectedYear) / (YEARS.length - 1)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={YEARS.length - 1}
                  step="1"
                  value={YEARS.indexOf(selectedYear)}
                  onChange={(e) => {
                    const year = YEARS[parseInt(e.target.value)];
                    setSelectedYear(year);
                    setIsPlaying(false);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>

              <div className="flex justify-between px-0.5 mt-1">
                {YEARS.map((y) => (
                  <div
                    key={y}
                    className={`w-0.5 h-1 rounded-full transition-all ${selectedYear === y ? 'bg-white scale-150' : 'bg-white/20'}`}
                    title={y}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedYear(YEARS[0]);
                setIsPlaying(false);
              }}
              className="p-2 text-white/40 hover:text-white transition-colors"
              title="Reset to 2017"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Custom Controls */}
        <div
          className={`absolute bottom-5 right-5 flex flex-col gap-2 ${isImagePreviewOpen ? 'z-40' : 'z-60'
            }`}
        >
          <button
            onClick={handleResetView}
            className="bg-white/70 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-primary hover:border-primary transition-all active:scale-90"
            title="Reset View"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="bg-white/70 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-primary hover:border-primary transition-all active:scale-90"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="bg-white/70 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-primary hover:border-primary transition-all active:scale-90"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Hotspot Analysis Legend */}
        {isLoaded && (
          <div
            className={`absolute bottom-5 left-5 ${isImagePreviewOpen ? 'z-30' : 'z-50'} bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg px-4 py-3 w-[188px]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                Hotspot Analysis
              </span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(CATEGORY_COLOR).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] font-medium text-gray-700 flex-1 leading-none">
                    {label}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-[#F76000] transition-colors shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="max-w-[200px]">
                      <p className="text-[11px] leading-relaxed">
                        {HOTSPOT_DESCRIPTIONS[label]}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-[#F96000] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-white/60 uppercase tracking-widest">
                Loading Sentinel Imagery...
              </p>
            </div>
          </div>
        )}

        {selectedPoint && (
          <div
            className={`absolute top-0 right-0 h-full w-full md:w-[45%] lg:w-[35%] bg-white border-l border-gray-200 shadow-2xl ${isImagePreviewOpen ? 'z-40' : 'z-150'
              } flex flex-col overflow-hidden animate-in slide-in-from-right duration-300`}
          >
            {/* Header Tabs & Close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center flex-1 mr-4">
                {(['What', 'How', 'Why'] as const).map((tab, index) => (
                  <div
                    key={tab}
                    className="flex-1 flex items-center justify-center relative"
                  >
                    <button
                      onClick={() => setActiveModalTab(tab)}
                      className="flex items-center cursor-pointer justify-center space-x-3 py-2 w-full transition-all group"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all duration-300 ${activeModalTab === tab
                          ? 'bg-[#F76000] border-[#F76000] text-white'
                          : 'bg-gray-100 border-gray-200 text-gray-700 group-hover:border-gray-400 group-hover:text-gray-600'
                          }`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`text-[11px] font-black uppercase tracking-widest transition-colors ${activeModalTab === tab
                          ? 'text-black'
                          : 'text-gray-400 group-hover:text-gray-600'
                          }`}
                      >
                        {tab}
                      </span>
                    </button>
                    {index < 2 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-gray-600 z-10">
                        <ChevronRight className="w-4 h-4" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setSelectedPoint(null);
                  if (prePointClickState.current && mapRef.current) {
                    mapRef.current.flyTo({
                      center: prePointClickState.current.center,
                      zoom: prePointClickState.current.zoom,
                      duration: 1500,
                      padding: { right: 0 } as any,
                    });
                  }
                  prePointClickState.current = null;
                }}
                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 hover:bg-orange-100 hover:text-[#F76000] text-gray-400 rounded-full transition-colors group shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="flex flex-col flex-1 overflow-y-auto p-5 custom-scrollbar">
              {(() => {
                const currentContent = (TAB_CONTENT as any)[
                  activeModalTab
                ]?.find((c: any) => c.id === selectedPoint);
                if (!currentContent)
                  return (
                    <p className="text-gray-400 p-4">
                      No data available for this point.
                    </p>
                  );

                return (
                  <div className="flex flex-col w-full text-gray-800">
                    {/* NEW: category badge above the title */}
                    {currentContent.category && (
                      <div className="mb-3">
                        <span
                          className="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                          style={{
                            color:
                              CATEGORY_COLOR[currentContent.category] ||
                              '#F76000',
                            background: `${CATEGORY_COLOR[currentContent.category] || '#F76000'}1A`,
                          }}
                        >
                          {currentContent.category}
                        </span>
                      </div>
                    )}

                    <h3 className="text-lg font-black text-gray-900 mb-2 tracking-tight leading-tight uppercase font-mono">
                      {currentContent.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2 font-mono">
                      <Calendar
                        className="w-3.5 h-3.5 text-[#F76000]"
                        strokeWidth={2.5}
                      />
                      <span>{currentContent.place}</span>
                      {/* NEW: district + settlement type alongside the date */}
                      {currentContent.district && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>{currentContent.district}</span>
                        </>
                      )}
                    </div>

                    <div className="w-full h-px bg-gray-100 my-4" />

                    {currentContent.content ? (
                      currentContent.content.map((block: any, idx: number) => {
                        if (block.type === 'heading') {
                          return (
                            <h4
                              key={idx}
                              className="text-sm font-black text-gray-900 mb-3 mt-2 border-l-4 border-[#F76000] pl-2"
                            >
                              {block.value}
                            </h4>
                          );
                        } else if (block.type === 'text') {
                          return (
                            <div
                              key={idx}
                              className="text-[13px] leading-relaxed text-gray-600 mb-6 bg-gray-50/30 p-3 rounded-lg"
                            >
                              {block.value}
                            </div>
                          );
                        } else if (block.type === 'image') {
                          const imageUrl = (() => {
                            const targetPath = block.url.replace(
                              'frontend_assets/',
                              './',
                            );
                            return ASSET_MAP[targetPath] || block.url;
                          })();
                          const isGif = block.url.toLowerCase().endsWith('.gif');
                          return (
                            <div key={idx} className="mb-6">
                              <Dialog onOpenChange={setIsImagePreviewOpen}>
                                <DialogTrigger asChild>
                                  <div className="relative w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm cursor-zoom-in group">
                                    <img
                                      src={imageUrl}
                                      alt=""
                                      className={`w-full transition-transform duration-500 group-hover:scale-105 ${activeModalTab === 'Why'
                                        ? 'h-100'
                                        : 'h-70'
                                        }`}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                  </div>
                                </DialogTrigger>
                                <DialogContent
                                  className={`border-none p-0 shadow-none overflow-hidden flex items-center justify-center outline-none translate-x-[-50%] translate-y-[-50%] ${isGif
                                    ? 'max-w-[95vw] w-full max-h-[95vh] h-fit bg-white rounded-lg'
                                    : 'max-w-[95vw] max-h-[95vh] w-fit h-fit sm:max-w-none bg-transparent'
                                    }`}
                                >
                                  <DialogTitle className="sr-only">
                                    {isGif ? 'GIF Preview' : 'Image Preview'}
                                  </DialogTitle>
                                  <DialogDescription className="sr-only">
                                    Expanded view of{' '}
                                    {block.desc || 'hotspot asset'}
                                  </DialogDescription>
                                  <img
                                    src={imageUrl}
                                    alt=""
                                    className={`object-contain block ${isGif
                                      ? 'w-full h-auto max-h-[90vh] rounded-none'
                                      : 'max-h-[90vh] max-w-[90vw] w-auto h-auto rounded-lg shadow-2xl'
                                      }`}
                                  />
                                </DialogContent>
                              </Dialog>
                              {block.desc && (
                                <p className="text-[10px] text-gray-500 italic mt-2">
                                  {block.desc}
                                </p>
                              )}
                            </div>
                          );
                        }
                        // NEW: stat tiles
                        else if (block.type === 'stats') {
                          return (
                            <div
                              key={idx}
                              className="grid grid-cols-2 gap-2 mb-6"
                            >
                              {block.items.map((s: any, i: number) => (
                                <div
                                  key={i}
                                  className="rounded-lg border border-gray-100 p-3 bg-gray-50/50"
                                >
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    {s.label}
                                  </div>
                                  <div className="text-sm font-black text-gray-900 mt-1">
                                    {s.value}
                                    {s.unit ? (
                                      <span className="text-[10px] font-bold text-gray-400 ml-1">
                                        {s.unit}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        // NEW: titled list (drivers / sources / nearby features)
                        else if (block.type === 'list') {
                          return (
                            <div key={idx} className="mb-6">
                              {block.title && (
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                  {block.title}
                                </div>
                              )}
                              <ul className="flex flex-col gap-1.5">
                                {block.items.map((it: any, i: number) => (
                                  <li
                                    key={i}
                                    className="flex justify-between items-start gap-3 text-[12px] text-gray-700 border-b border-gray-100 pb-1.5"
                                  >
                                    <span className="font-bold leading-snug">
                                      {it.label}
                                    </span>
                                    {it.sublabel && (
                                      <span className="text-gray-400 font-mono text-[11px] shrink-0 text-right">
                                        {it.sublabel}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        // NEW: confidence / coverage meter
                        else if (block.type === 'meter') {
                          const max = block.max || 1;
                          const pct = Math.min(
                            100,
                            Math.round((block.value / max) * 100),
                          );
                          return (
                            <div key={idx} className="mb-6">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                                <span>{block.label}</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${pct}%`,
                                    background: block.color || '#F76000',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })
                    ) : (
                      <div className="text-[13px] leading-relaxed text-gray-600">
                        {currentContent.desc}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
