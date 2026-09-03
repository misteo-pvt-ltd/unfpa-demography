/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from 'pmtiles';
import {
  Layers,
  Map as MapIcon,
  Plus,
  Minus,
  Home,
  ChevronDown,
} from 'lucide-react';
import {
  LULC_STATS,
  DISTRICT_NAME_VARIANTS,
  ALLOWED_DISTRICTS,
} from '../../data/comparativeData';
import { cogProtocol } from '@geomatico/maplibre-cog-protocol';

// Set up PMTiles protocol
const protocol = new pmtiles.Protocol();

// Global guard for protocols
let protocolsAdded = false;

const PMTILES_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_district_pop_total_2036.pmtiles`;
const SUBDISTRICT_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_subdistrict_pop_total_2036.pmtiles`;

const LULC_LEGEND = [
  { label: 'Water', color: '#419BDF' },
  { label: 'Trees', color: '#397D49' },
  { label: 'Flooded Vegetation', color: '#7A87C6' },
  { label: 'Crops', color: '#E49635' },
  { label: 'Built Area', color: '#C4281B' },
  { label: 'Bare Ground', color: '#A59B8F' },
  { label: 'Rangeland', color: '#F0CF0E' },
];

interface MapLulcProps {
  selectedDistrict?: string;
  onDistrictSelect?: (district: string) => void;
}

const MAP_STYLES = {
  dark: {
    version: 8,
    glyphs: 'https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© CARTO',
      },
    },
    layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
  },
  grey: {
    version: 8,
    glyphs: 'https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
    sources: {
      'esri-grey': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© Esri',
      },
    },
    layers: [{ id: 'esri-grey-layer', type: 'raster', source: 'esri-grey' }],
  },
  satellite: {
    version: 8,
    glyphs: 'https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© Esri',
      },
    },
    layers: [
      { id: 'esri-satellite-layer', type: 'raster', source: 'esri-satellite' },
    ],
  },
};

const CATEGORIES = [
  'Water',
  'Trees',
  'Flooded Vegetation',
  'Crops',
  'Built Area',
  'Bare Ground',
  'Grass',
  'Rangeland',
];

const MapLulc: React.FC<MapLulcProps> = ({
  selectedDistrict = 'Odisha',
  onDistrictSelect,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [baseMap, setBaseMap] = useState<'dark' | 'grey' | 'satellite'>('grey');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const accumulatedFeaturesRef = useRef<Map<string, any[]>>(new Map());

  const [selectedYearLulc, setSelectedYearLulc] = useState('2024');
  const [isYearDropdownOpenLulc, setIsYearDropdownOpenLulc] = useState(false);

  const stats =
    LULC_STATS[selectedDistrict] ||
    LULC_STATS['Odisha'] ||
    {};
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  // Registration logic
  useEffect(() => {
    if (!protocolsAdded) {
      try {
        maplibregl.addProtocol('pmtiles', protocol.tile);
        maplibregl.addProtocol('cog', cogProtocol);
        protocolsAdded = true;
      } catch (e) {
        console.warn('Protocols already added or error:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[baseMap] as any,
      center: [84.8035, 20.2376],
      zoom: 6.2,
      attributionControl: false,
    });

    const m = map.current;

    m.on('style.load', async () => {
      if (!m.getSource('district-source')) {
        m.addSource('district-source', {
          type: 'vector',
          url: `pmtiles://${PMTILES_URL}`,
        });
      }

      if (!m.getSource('subdistrict-source')) {
        m.addSource('subdistrict-source', {
          type: 'vector',
          url: `pmtiles://${SUBDISTRICT_URL}`,
        });
      }

      if (!m.getLayer('district-fill')) {
        m.addLayer({
          id: 'district-fill',
          type: 'fill',
          source: 'district-source',
          'source-layer': 'zcta',
          paint: {
            'fill-color': '#F96000',
            'fill-opacity': 0,
          },
        });
      }

      if (!m.getLayer('subdistrict-fill')) {
        m.addLayer({
          id: 'subdistrict-fill',
          type: 'fill',
          source: 'subdistrict-source',
          'source-layer': 'zcta',
          paint: {
            'fill-color': '#F96000',
            'fill-opacity': 0,
          },
        });

        m.addLayer({
          id: 'subdistrict-outline',
          type: 'line',
          source: 'subdistrict-source',
          'source-layer': 'zcta',
          paint: {
            'line-color': '#616161ff',
            'line-width': 0.8,
            'line-opacity': 0.9,
          },
        });
      }

      if (!m.getLayer('district-mask')) {
        m.addLayer({
          id: 'district-mask',
          type: 'fill',
          source: 'district-source',
          'source-layer': 'zcta',
          paint: {
            'fill-color': '#ffffffff',
            'fill-opacity': 0,
          },
        }); // Added before district-outline because it is next
      }

      if (!m.getLayer('district-outline')) {
        m.addLayer({
          id: 'district-outline',
          type: 'line',
          source: 'district-source',
          'source-layer': 'zcta',
          paint: {
            'line-color': [
              'case',
              [
                'any',
                ['==', ['get', 'district_name'], selectedDistrict],
                ['==', ['get', 'NAME'], selectedDistrict],
              ],
              '#F96000',
              '#000',
            ],
            'line-width': [
              'case',
              [
                'any',
                ['==', ['get', 'district_name'], selectedDistrict],
                ['==', ['get', 'NAME'], selectedDistrict],
              ],
              3,
              1,
            ],
            'line-opacity': 0.4,
          },
        });

        // Auto-fit to PMTiles Header
        try {
          const p = new pmtiles.PMTiles(PMTILES_URL);
          const header = await p.getHeader();
          if (header.minLon !== undefined) {
            const b: maplibregl.LngLatBoundsLike = [
              [header.minLon, header.minLat],
              [header.maxLon, header.maxLat],
            ];
            m.fitBounds(b, { padding: 40, duration: 0 });
          }
        } catch (err) {
          console.warn('Could not fit to PMTiles header', err);
        }

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'subdistrict-popup',
        });

        // Subdistrict Hover/Popup
        m.on('mousemove', 'subdistrict-fill', (e) => {
          const feature = e.features?.[0];
          if (feature) {
            m.getCanvas().style.cursor = 'pointer';
            const props = feature.properties;
            const subName =
              props?.subdistrict_name || props?.SUBDIST_NAM || 'Unknown Area';
            const distName = props?.district_name || props?.DIST_NAME || '';

            const content = `
                            <div style="padding: 6px 10px; font-family: sans-serif; min-width: 120px;">
                                <div style="font-size: 11px; font-weight: 800; color: #1a202c; text-transform: uppercase; margin-bottom: 2px;">${subName}</div>
                                ${distName ? `<div style="font-size: 9px; font-weight: 600; color: #718096;">District: ${distName}</div>` : ''}
                            </div>
                        `;
            popup.setLngLat(e.lngLat).setHTML(content).addTo(m);
          }
        });

        m.on('mouseleave', 'subdistrict-fill', () => {
          m.getCanvas().style.cursor = '';
          popup.remove();
        });

        // Click handler for updating selection (can use subdistrict layer since it has district info too)
        m.on('click', 'subdistrict-fill', (e) => {
          if (e.features?.[0]) {
            const feature = e.features[0];
            const rawName =
              feature.properties?.district_name ||
              feature.properties?.DIST_NAME ||
              feature.properties?.NAME ||
              feature.properties?.name;
            if (rawName) {
              const canonicalName = DISTRICT_NAME_VARIANTS[rawName] || rawName;
              if (!ALLOWED_DISTRICTS.includes(canonicalName)) return;
              onDistrictSelect?.(canonicalName);
            }
          }
        });
      }

      setIsStyleLoaded(true);
      m.on('idle', () => setIsLoading(false));
    });

    m.on('sourcedata', (e) => {
      if (e.sourceId === 'district-source' && e.isSourceLoaded) {
        const features = m.querySourceFeatures('district-source', {
          sourceLayer: 'zcta',
        });
        let hasChanges = false;
        features.forEach((f: any) => {
          const rawName =
            f.properties?.district_name ||
            f.properties?.NAME ||
            f.properties?.name;
          if (rawName) {
            const canonicalName = (
              DISTRICT_NAME_VARIANTS[rawName] || rawName
            ).toLowerCase();
            if (!accumulatedFeaturesRef.current.has(canonicalName)) {
              accumulatedFeaturesRef.current.set(canonicalName, []);
            }
            const existing = accumulatedFeaturesRef.current.get(canonicalName)!;
            // Avoid duplicates (simplified check using first coordinate)
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

    return () => {
      m.remove();
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (m) {
      m.setStyle(MAP_STYLES[baseMap] as any);
      setIsStyleLoaded(false);
    }
  }, [baseMap]);

  // Zoom to district logic
  useEffect(() => {
    const m = map.current;
    if (!m || !isStyleLoaded) return;

    const isOdisha =
      !selectedDistrict ||
      selectedDistrict === 'Odisha' ||
      selectedDistrict === 'All Districts';

    if (m.getLayer('district-outline')) {
      m.setPaintProperty(
        'district-outline',
        'line-color',
        isOdisha
          ? '#000'
          : [
            'case',
            [
              'any',
              ['==', ['get', 'district_name'], selectedDistrict],
              ['==', ['get', 'NAME'], selectedDistrict],
            ],
            '#F96000',
            '#000',
          ],
      );
      m.setPaintProperty(
        'district-outline',
        'line-width',
        isOdisha
          ? 1
          : [
            'case',
            [
              'any',
              ['==', ['get', 'district_name'], selectedDistrict],
              ['==', ['get', 'NAME'], selectedDistrict],
            ],
            3,
            1,
          ],
      );
      m.setPaintProperty(
        'district-outline',
        'line-opacity',
        isOdisha ? 0.2 : 0.8,
      );
    }

    if (m.getLayer('district-mask')) {
      const getMaskColor = () => {
        if (baseMap === 'dark') return '#212121';
        if (baseMap === 'satellite') return '#000000';
        return '#ffffffff';
      };
      m.setPaintProperty('district-mask', 'fill-color', getMaskColor());
      m.setPaintProperty(
        'district-mask',
        'fill-opacity',
        isOdisha
          ? 0
          : [
            'case',
            [
              'any',
              ['==', ['get', 'district_name'], selectedDistrict],
              ['==', ['get', 'NAME'], selectedDistrict],
            ],
            0,
            1.0,
          ],
      );
    }

    const lookupKey = selectedDistrict.toLowerCase();
    let features: any[] = [];

    if (!selectedDistrict || lookupKey === 'odisha') {
      accumulatedFeaturesRef.current.forEach((list) => features.push(...list));
    } else {
      features = accumulatedFeaturesRef.current.get(lookupKey) || [];
    }

    if (features && features.length > 0) {
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
        m.fitBounds(bounds, { padding: 80, duration: 1500, essential: true });
      }
    }
  }, [selectedDistrict, isStyleLoaded, cacheVersion, baseMap]);

  // COG Layer update
  useEffect(() => {
    const m = map.current;
    if (!m || !isStyleLoaded) return;

    // Categorical color fragment: 1=Water, 2=Trees, 3=Empty, 4=Flooded, 5=Crops, 6=Empty, 7=Built, 8=Bare, 9=Snow, 10=Cloud, 11=Rangeland
    const colors = [
      '#419BDF',
      '#397D49',
      '#000000',
      '#7A87C6',
      '#E49635',
      '#000000',
      '#C4281B',
      '#A59B8F',
      '#000000',
      '#000000',
      '#F0CF0E',
    ];
    const params = `#color:["${colors.join('","')}"],1,11,c`;
    const yearUrl = `cog://${import.meta.env.VITE_REACT_DATA_URL}/lulc/odisha_lulc_${selectedYearLulc}.tif${params}`;

    if (m.getSource('lulc-cog')) {
      if (m.getLayer('lulc-layer')) m.removeLayer('lulc-layer');
      m.removeSource('lulc-cog');
    }

    m.addSource('lulc-cog', {
      type: 'raster',
      url: yearUrl,
      tileSize: 128,
    });

    m.addLayer(
      {
        id: 'lulc-layer',
        type: 'raster',
        source: 'lulc-cog',
        paint: {
          'raster-opacity': 0.8,
          'raster-fade-duration': 300,
        },
      },
      'subdistrict-outline',
    );
  }, [selectedYearLulc, isStyleLoaded]);

  const basemapOptions = [
    { id: 'grey', label: 'Grey (Default)' },
    { id: 'dark', label: 'Dark Mode' },
    { id: 'satellite', label: 'Satellite' },
  ];

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <MapIcon className="w-6 h-6 text-black" />
            Land Use Change Analysis - {selectedDistrict}
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Analyze temporal shifts in landscape categories.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-4 shrink-0 transition-all bg-gray-50/50 p-1.5 px-3 rounded-lg border border-gray-100">
          <div className="relative flex items-center gap-2 group">
            <div
              onClick={() => setIsYearDropdownOpenLulc(!isYearDropdownOpenLulc)}
              className="px-4 py-1.5 text-[12px] font-black tracking-wide bg-white text-gray-600 border border-gray-400 rounded-md transition-all min-w-[70px] flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400"
            >
              <span className="font-mono">{selectedYearLulc}</span>
            </div>
            <button
              onClick={() => setIsYearDropdownOpenLulc(!isYearDropdownOpenLulc)}
              className="text-[#f64e24] transition-all hover:scale-110"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${isYearDropdownOpenLulc ? 'rotate-180' : ''}`}
                strokeWidth={2.5}
              />
            </button>

            {isYearDropdownOpenLulc && (
              <>
                <div
                  className="fixed inset-0 z-[190]"
                  onClick={() => setIsYearDropdownOpenLulc(false)}
                />
                <div className="absolute right-0 top-full mt-3 bg-white rounded-md shadow-xl border border-gray-100 p-3 z-[200] animate-in fade-in slide-in-from-top-2 min-w-[120px] transition-all">
                  {[...years].reverse().map((y) => (
                    <button
                      key={y}
                      onClick={() => {
                        setSelectedYearLulc(y.toString());
                        setIsYearDropdownOpenLulc(false);
                      }}
                      className="w-full px-2 py-3 text-left transition-all hover:bg-gray-50/50 group/item flex items-center justify-between rounded"
                    >
                      <span
                        className={`text-xs font-bold tracking-wider border-b-2 pb-0.5 transition-all ${selectedYearLulc === y.toString() ? 'text-[#F96000] border-orange-400' : 'text-gray-600 border-gray-400'}`}
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

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Map Part (60%) */}
        <div className="w-full lg:w-[40%] h-[500px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
              <div className="loading-spinner"></div>
            </div>
          )}

          {/* Basemap Toggle Dropdown */}
          <div className="absolute top-4 right-4 z-20">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-white/90 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-orange-500 transition-all active:scale-90"
                title="Change Basemap"
              >
                <Layers className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {basemapOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setBaseMap(option.id as any);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-[11px] font-bold transition-colors flex items-center justify-between ${baseMap === option.id
                        ? 'text-gray-600 hover:bg-gray-50'
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

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
            <button
              onClick={() => {
                onDistrictSelect?.('Odisha');
                map.current?.easeTo({ center: [84.8035, 20.2376], zoom: 6 });
              }}
              className="bg-white/70 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-[#F96000] transition-all"
              title="Reset View"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => map.current?.zoomIn()}
              className="bg-white/70 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-[#F96000] transition-all"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => map.current?.zoomOut()}
              className="bg-white/70 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-[#F96000] transition-all"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-100 max-w-[180px]">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              LULC
            </div>
            <div className="space-y-1.5">
              {LULC_LEGEND.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] font-bold text-gray-700">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card Part (40%) - TABLE */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4 overflow-hidden">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm overflow-x-auto h-full">
            <div className="text-sm font-bold text-gray-800 mb-4 tracking-tight">
              Selected Region - {selectedDistrict}
            </div>
            <div className="overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <th className="p-2 text-[10px] font-bold text-gray-500 uppercase">
                      Category
                    </th>
                    {years.map((y) => (
                      <th
                        key={y}
                        className="p-2 text-[10px] font-bold text-gray-500 uppercase text-center border-l border-gray-100"
                      >
                        {y} (sq.km)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat) => (
                    <tr
                      key={cat}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-2 text-[10px] font-bold text-gray-700">
                        {cat}
                      </td>
                      {years.map((y) => {
                        const val = stats[y.toString()]?.[cat] || 0;
                        const prevVal = stats[(y - 1).toString()]?.[cat];
                        const growth = prevVal
                          ? ((val - prevVal) / prevVal) * 100
                          : null;

                        return (
                          <td
                            key={y}
                            className="p-2 text-center border-l border-gray-50"
                          >
                            <div className="text-[10px] font-bold text-gray-900">
                              {val.toFixed(1)}
                            </div>
                            {growth !== null && (
                              <div
                                className={`text-[8px] font-black ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}
                              >
                                {growth >= 0 ? '+' : ''}
                                {growth.toFixed(1)}%
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapLulc;
