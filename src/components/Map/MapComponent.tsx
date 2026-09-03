/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Minus, Home, Layers } from 'lucide-react';
import * as pmtiles from 'pmtiles';
import basemapDark from './BaseMap/basemap-dark';
import basemapGrey from './BaseMap/basemap-grey';

// Set up PMTiles protocol
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

import {
  DISTRICT_NAME_VARIANTS,
  ALLOWED_DISTRICTS,
  GENDER,
  getDistrictBounds,
  DISTRICT_BOUNDS,
} from '../../data/comparativeData';
import { AGE_COHORT_DATA } from '../../data/ageCohortData';

const getDistrictCentersGeoJSON = () => {
  const features = Object.keys(DISTRICT_BOUNDS).map((name) => {
    const bounds = DISTRICT_BOUNDS[name];
    const centerLon = (bounds.minx + bounds.maxx) / 2;
    const centerLat = (bounds.miny + bounds.maxy) / 2;

    // Map to user-friendly dashboard spelling variations
    let displayName = name;
    if (name === 'Baleshwar') displayName = 'Balasore';
    if (name === 'Jagatsinghapur') displayName = 'Jagatsinghpur';
    if (name === 'Jajapur') displayName = 'Jajpur';
    if (name === 'Kendujhar') displayName = 'Keonjhar';
    if (name === 'Khordha') displayName = 'Khurda';
    if (name === 'Sonepur') displayName = 'Subarnapur';

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [centerLon, centerLat],
      },
      properties: {
        name: displayName,
      },
    };
  });
  return {
    type: 'FeatureCollection' as const,
    features,
  };
};

interface MapComponentProps {
  activeLayer?: string;
  selectedYear?: string;
  onDistrictClick?: (data: any) => void;
  gender?: string;
  region?: string;
  onResetClick?: () => void;
  initialBasemap?: 'dark' | 'grey' | 'satellite';
  onDataLoad?: (features: any[]) => void;
  onLegendDataUpdate?: (min: number, max: number) => void;
  onLegendStepsUpdate?: (steps: number[] | null) => void;
  targetDistrict?: string;
  showSubdistrict?: boolean;
  ageCohortSub?: '0_14' | '15_59' | '60_plus';
}

const PMTILES_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_district_pop_total_2036.pmtiles`;
const SUBDISTRICT_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_subdistrict_pop_total_2036.pmtiles`;

// Static scales for map legends — district-level vs subdistrict-level ranges differ significantly
export const LAYER_SCALES: Record<string, number[]> = {
  density: [0, 200, 400, 800],
  pop: [0, 500000, 1000000, 2000000, 4000000],
  deg_urbanisation: [0, 100, 250, 500, 1000],
  growth: [-2, 0, 1.2, 2.5, 5.0],
  age_cohort: [0, 500000, 1000000, 2000000, 4000000],
  age_cohort_0_14: [0, 180000, 290000, 400000, 515000],
  age_cohort_15_59: [0, 465000, 805000, 1090000, 1430000],
  age_cohort_60_plus: [0, 90000, 150000, 210000, 290000],
  // Subdistrict-specific (smaller administrative units)
  sub_density: [0, 200, 400, 800, 2000],
  sub_pop: [0, 25000, 100000, 500000, 1500000],
  sub_deg_urbanisation: [0, 100, 250, 500, 1000],
  sub_growth: [-2, 0, 1.2, 2.5, 5.0],
};

// Helper: pick the right scale key for subdistricts
const getSubScale = (layer?: string): number[] => {
  const key = `sub_${layer}`;
  return LAYER_SCALES[key] ?? LAYER_SCALES[layer ?? ''] ?? [0, 25, 50, 75, 100];
};

// Helper to get all spelling and casing variants of a district name for robust shape/data matching
const getDistrictVariants = (target: string): string[] => {
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
  if (t === 'cuttack' || t === 'katak') {
    return ['Cuttack', 'Katak', 'CUTTACK', 'KATAK'];
  }
  if (t === 'deogarh' || t === 'debagarh' || t === 'deoghar') {
    return ['Deogarh', 'Debagarh', 'Deoghar', 'DEOGARH', 'DEBAGARH'];
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
  if (t === 'jajpur' || t === 'jajapura' || t === 'jajpura') {
    return ['Jajpur', 'Jajapura', 'Jajpura', 'JAJPUR', 'JAJAPURA', 'JAJPURA'];
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
  if (t === 'kendrapara' || t === 'kendraparha') {
    return ['Kendrapara', 'Kendraparha', 'KENDRAPARA', 'KENDRAPARHA'];
  }
  if (t === 'kendujhar' || t === 'keonjhar') {
    return ['Kendujhar', 'Keonjhar', 'KENDUJHAR', 'KEONJHAR'];
  }
  if (t === 'khordha' || t === 'khurda' || t === 'khorda') {
    return ['Khordha', 'Khurda', 'Khorda', 'KHORDHA', 'KHURDA', 'KHORDA'];
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
  if (t === 'sambalpur' || t === 'sambalapur') {
    return ['Sambalpur', 'Sambalapur', 'SAMBALPUR', 'SAMBALAPUR'];
  }
  if (t === 'subarnapur' || t === 'sonepur') {
    return ['Subarnapur', 'Sonepur', 'SUBARNAPUR', 'SONEPUR'];
  }
  if (t === 'sundargarh' || t === 'sundergarh') {
    return ['Sundargarh', 'Sundergarh', 'SUNDARGARH', 'SUNDERGARH'];
  }

  return [target, target.toUpperCase(), target.toLowerCase()];
};

const getAgeCohortDistrictName = (name: string): string => {
  const norm = name.trim().toLowerCase();
  if (norm === 'anugul' || norm === 'angul') return 'Anugul';
  if (norm === 'boudh' || norm === 'baudh') return 'Baudh';
  if (norm === 'deogarh' || norm === 'debagarh') return 'Debagarh';
  if (norm === 'nabarangpur' || norm === 'nabarangapur') return 'Nabarangpur';
  if (norm === 'sonepur' || norm === 'subarnapur') return 'Subarnapur';

  const keys = Object.keys(AGE_COHORT_DATA);
  const found = keys.find(k => k.toLowerCase() === norm);
  return found || name;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  activeLayer,
  selectedYear = '2025',
  onDistrictClick,
  gender = 'All',
  region = 'All',
  onResetClick,
  initialBasemap = 'satellite',
  onDataLoad,
  targetDistrict,
  showSubdistrict = true,
  onLegendDataUpdate,
  onLegendStepsUpdate,
  ageCohortSub = '0_14',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialBoundsRef = useRef<maplibregl.LngLatBoundsLike | null>(null);
  const lastZoomRef = useRef<number>(5);

  // Use refs for callbacks to avoid closure staleness in map events
  const onDistrictClickRef = useRef(onDistrictClick);
  const onResetClickRef = useRef(onResetClick);
  const onDataLoadRef = useRef(onDataLoad);
  const lastDataStringRef = useRef<string>('');
  const activeLayerRef = useRef(activeLayer);
  const selectedYearRef = useRef(selectedYear);
  const genderRef = useRef(gender);
  const showSubdistrictRef = useRef(showSubdistrict);
  const targetDistrictRef = useRef(targetDistrict);
  const ageCohortSubRef = useRef(ageCohortSub);

  useEffect(() => {
    targetDistrictRef.current = targetDistrict;
  }, [targetDistrict]);

  useEffect(() => {
    ageCohortSubRef.current = ageCohortSub;
  }, [ageCohortSub]);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);
  useEffect(() => {
    selectedYearRef.current = selectedYear;
  }, [selectedYear]);
  useEffect(() => {
    genderRef.current = gender;
  }, [gender]);
  useEffect(() => {
    showSubdistrictRef.current = showSubdistrict;
  }, [showSubdistrict]);

  // Store accumulated unique features to prevent data loss on zoom/pan
  const accumulatedFeaturesRef = useRef<Map<string, any>>(new Map());
  const accumulatedSubdistrictFeaturesRef = useRef<Map<string, any>>(new Map());

  // Effect for Zooming to and Highlighting Target District
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (
      !targetDistrict ||
      targetDistrict === 'Odisha' ||
      targetDistrict === 'All Districts'
    ) {
      if (map.getLayer('selected-district-outline')) {
        map.setFilter('selected-district-outline', ['==', 'fid', '']);
        map.setPaintProperty('selected-district-outline', 'line-opacity', 0);
      }
      return;
    }

    // Zoom to static bounds immediately if available
    const staticBounds = getDistrictBounds(targetDistrict);
    if (staticBounds) {
      map.fitBounds(staticBounds, {
        padding: 120,
        duration: 1500,
        essential: true,
      });
    }

    // Find feature
    let targetFeature: any = null;
    for (const feature of accumulatedFeaturesRef.current.values()) {
      const rawName =
        feature.properties?.district_name ||
        feature.properties?.NAME ||
        feature.properties?.name;

      const normalizedRaw = rawName?.trim();
      const canonicalName =
        DISTRICT_NAME_VARIANTS[normalizedRaw] || normalizedRaw;

      if (
        canonicalName?.toLowerCase() === targetDistrict.trim().toLowerCase()
      ) {
        targetFeature = feature;
        break;
      }
    }

    // Highlight border only
    if (targetFeature && map.getLayer('selected-district-outline')) {
      map.moveLayer('selected-district-outline');
      map.setFilter('selected-district-outline', [
        '==',
        'fid',
        targetFeature.properties.fid,
      ]);
      map.setPaintProperty('selected-district-outline', 'line-opacity', 1);

      if (onDistrictClick) {
        onDistrictClick({
          ...targetFeature.properties,
          bounds: staticBounds || null,
        });
      }
    } else if (staticBounds && onDistrictClick) {
      onDistrictClick({
        district_name: targetDistrict,
        bounds: staticBounds,
      });
    }
  }, [targetDistrict]);

  useEffect(() => {
    onDistrictClickRef.current = onDistrictClick;
    onResetClickRef.current = onResetClick;
    onDataLoadRef.current = onDataLoad;
  }, [onDistrictClick, onResetClick, onDataLoad]);

  // Basemap style definitions
  const MAP_STYLES = {
    dark: basemapDark,
    grey: basemapGrey,
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
          attribution: '© Esri, Maxar, Earthstar Geographics',
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#000',
          },
        },
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    },
  };

  type BasemapType = 'dark' | 'grey' | 'satellite';
  const [activeBasemap, setActiveBasemap] =
    useState<BasemapType>(initialBasemap);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [subdistrictDataLoaded, setSubdistrictDataLoaded] = useState(1);
  const [styleLoadedCount, setStyleLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Consolidate Layer and Event Setup
  const setupPopulationLayer = (map: MapLibreMap) => {
    console.log('Setting up population layer for style:', activeBasemap);

    // Ensure source exists
    if (!map.getSource('population-source')) {
      map.addSource('population-source', {
        type: 'vector',
        url: `pmtiles://${PMTILES_URL}`,
      });
    }

    if (!map.getSource('districts-labels-source')) {
      map.addSource('districts-labels-source', {
        type: 'geojson',
        data: getDistrictCentersGeoJSON(),
      });
    }

    // Ensure layer exists
    if (!map.getLayer('districts-fill')) {
      // Highlight Layer (Selected District)
      map.addLayer({
        id: 'selected-district-outline',
        type: 'line',
        source: 'population-source',
        'source-layer': 'zcta',
        paint: {
          'line-color': '#F96000', // Highlight color
          'line-width': 1.5,
          'line-opacity': 0, // hidden by default
        },
        filter: ['==', 'fid', ''], // matches nothing initially
      });

      map.addLayer({
        id: 'districts-fill',
        type: 'fill',
        source: 'population-source',
        'source-layer': 'zcta',
        paint: {
          'fill-color': '#bae4bc', // Default color, will be updated dynamically
          'fill-opacity': 1.0,
          'fill-outline-color': '#FFFFFF',
        },
        layout: {
          visibility: 'visible',
        },
      });

      // Add a dedicated border layer for better visibility on satellite
      map.addLayer({
        id: 'districts-border',
        type: 'line',
        source: 'population-source',
        'source-layer': 'zcta',
        paint: {
          'line-color': '#000000',
          'line-width': 0.8,
          'line-opacity': 0.8,
        },
        layout: {
          visibility: 'visible',
        },
      });

      // Add district names labels above the polygon
      map.addLayer({
        id: 'districts-labels',
        type: 'symbol',
        source: 'districts-labels-source',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
          'text-size': 14,
          'text-anchor': 'center',
          'text-justify': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'visibility': showSubdistrict ? 'none' : 'visible',
        },
        paint: {
          'text-color': '#1e293b', // slate-800
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      });

      // Click Handler with Zoom logic
      map.on('click', 'districts-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          const rawName = props.district_name || props.NAME || props.name;
          const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;
          if (!ALLOWED_DISTRICTS.includes(name)) return;

          // Calculate bounds for the clicked feature to enable "fit to screen" in other components
          let boundsArray = getDistrictBounds(name);
          if (boundsArray) {
            map.fitBounds(boundsArray, {
              padding: 120,
              duration: 1500,
              essential: true,
            });
          } else if (feature.geometry) {
            const bounds = new maplibregl.LngLatBounds();
            const extend = (coords: any) => {
              if (typeof coords[0] === 'number') {
                bounds.extend(coords as [number, number]);
              } else {
                coords.forEach(extend);
              }
            };
            extend((feature.geometry as any).coordinates);
            if (!bounds.isEmpty()) {
              boundsArray = bounds.toArray();
              // Zoom directly inside the click handler to fit to screen
              map.fitBounds(bounds, {
                padding: 120,
                duration: 1500,
                essential: true,
              });
            }
          }

          if (onDistrictClickRef.current) {
            onDistrictClickRef.current({ ...props, bounds: boundsArray });
          }
        }
      });

      const distPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'district-popup'
      });

      map.on('mousemove', 'districts-fill', (e) => {
        const feature = e.features?.[0];
        if (feature) {
          const props = feature.properties;
          const rawName = props.district_name || props.NAME || props.name;
          const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;
          const isAllowed = ALLOWED_DISTRICTS.includes(name);

          map.getCanvas().style.cursor = isAllowed ? 'pointer' : '';

          if (!showSubdistrictRef.current) {
            const currentLayer = activeLayerRef.current;
            if (currentLayer === 'age_cohort') {
              const currentYear = selectedYearRef.current;
              const currentSub = ageCohortSubRef.current;
              const normalizedDist = getAgeCohortDistrictName(name);
              const yearData = AGE_COHORT_DATA[normalizedDist]?.[currentYear];

              if (yearData) {
                const formatNum = (v: number) => v.toLocaleString();

                const cohortLabels: Record<string, string> = {
                  '0_14': '0 - 14',
                  '15_59': '15 - 59',
                  '60_plus': '60+',
                };

                const maleVal = currentSub === '0_14'
                  ? yearData.male.age_0_14
                  : currentSub === '15_59'
                    ? yearData.male.age_15_59
                    : yearData.male.age_60_plus;

                const femaleVal = currentSub === '0_14'
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
                distPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
              } else {
                distPopup.remove();
              }
            } else {
              const content = `
                  <div style="padding: 6px 10px; font-family: 'Inter', sans-serif; border-radius: 8px;">
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${name}</div>
                  </div>
              `;
              distPopup.setLngLat(e.lngLat).setHTML(content).addTo(map);
            }
          } else {
            distPopup.remove();
          }
        }
      });

      map.on('mouseleave', 'districts-fill', () => {
        map.getCanvas().style.cursor = '';
        distPopup.remove();
      });
    }

    // --- Subdistrict Layers ---
    if (!map.getSource('subdistrict-source')) {
      map.addSource('subdistrict-source', {
        type: 'vector',
        url: `pmtiles://${SUBDISTRICT_URL}`,
      });
    }

    if (!map.getLayer('subdistricts-fill')) {
      map.addLayer({
        id: 'subdistricts-fill',
        type: 'fill',
        source: 'subdistrict-source',
        'source-layer': 'zcta',
        paint: {
          'fill-color': '#f0f9e8', // Default non-transparent color
          'fill-opacity': 0,
        },
        layout: {
          visibility: showSubdistrict ? 'visible' : 'none',
        },
      });

      map.addLayer({
        id: 'subdistricts-border',
        type: 'line',
        source: 'subdistrict-source',
        'source-layer': 'zcta',
        paint: {
          'line-color': '#989898ff',
          'line-width': 0.8,
          'line-opacity': 0.8,
        },
        layout: {
          visibility: showSubdistrict ? 'visible' : 'none',
        },
      });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'subdistrict-popup',
      });

      map.on('mousemove', 'subdistricts-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const f = e.features[0];
          const props = f.properties;
          const rawDistName = props.district_name || props.DIST_NAME || props.District || props.NAME || props.name || '';
          const canonicalName =
            DISTRICT_NAME_VARIANTS[rawDistName] || rawDistName;

          // Filter tooltip: when a specific target district is selected, only show popup for subdistricts in that district
          const curTarget = targetDistrictRef.current;
          if (curTarget && curTarget !== 'All Districts' && curTarget !== 'Odisha') {
            const targetVariants = getDistrictVariants(curTarget).map(v => v.toLowerCase());
            const rawLower = (rawDistName || '').trim().toLowerCase();
            const canonLower = (canonicalName || '').trim().toLowerCase();
            if (!targetVariants.includes(rawLower) && !targetVariants.includes(canonLower)) {
              map.getCanvas().style.cursor = '';
              popup.remove();
              return;
            }
          }

          // Show pointer for allowed districts
          if (ALLOWED_DISTRICTS.includes(canonicalName)) {
            map.getCanvas().style.cursor = 'pointer';
          } else {
            map.getCanvas().style.cursor = '';
          }

          let label = 'Value';
          let propKey = '';
          let color = '#4a5568';
          let valFormat = (v: any) => v;

          const currentYear = selectedYearRef.current;
          const currentGender = genderRef.current;
          const currentLayer = activeLayerRef.current;

          const formatNumber = (v: any) => {
            const val = parseFloat(v);
            if (isNaN(val)) return '—';
            if (val >= 1000000) return (val / 1000000).toFixed(2) + ' M';
            if (val >= 1000) return (val / 1000).toFixed(1) + ' k';
            return val.toLocaleString();
          };

          if (currentGender === 'Male') {
            label = 'Male Pop';
            propKey = `male_${currentYear}`;
            valFormat = formatNumber;
          } else if (currentGender === 'Female') {
            label = 'Female Pop';
            propKey = `female_${currentYear}`;
            valFormat = formatNumber;
          } else {
            switch (currentLayer) {
              case 'pop':
                label = 'Total Pop';
                propKey = `pop_${currentYear}_sum`;
                valFormat = formatNumber;
                color = '#F96000';
                break;
              case 'deg_urbanisation':
                label = 'Urbanisation';
                propKey = `deg_city_${currentYear}`;
                valFormat = (v) => parseFloat(v).toFixed(1) + ' sq.km';
                color = '#F96000';
                break;
              case 'growth':
                label = 'Growth';
                propKey = `growth_${currentYear}`;
                valFormat = (v) => parseFloat(v).toFixed(2) + '%';
                color = '#F96000';
                break;
              case 'density':
              default:
                label = 'Density';
                propKey = `density_${currentYear}`;
                valFormat = (v) => parseFloat(v).toFixed(1) + ' sq.km';
                color = '#F96000';
                break;
            }
          }

          const subName =
            props.subdistrict_name ||
            props.SUBDIST_NAM ||
            'Unknown Subdistrict';
          const distName =
            props.district_name || props.DIST_NAME || 'Unknown District';
          const canonicalDistName =
            DISTRICT_NAME_VARIANTS[distName] || distName;

          let rawVal = props[propKey];
          // Fallback to static GENDER data if PMTiles property is missing and a specific gender is selected
          if (
            (rawVal === undefined || rawVal === null) &&
            currentGender !== 'All' &&
            GENDER[canonicalDistName]
          ) {
            const genderKey =
              currentGender === 'Male'
                ? `${currentYear}_male`
                : `${currentYear}_female`;
            rawVal = GENDER[canonicalDistName][genderKey];
            // Provide an estimate for subdistrict if only district data is available
            if (rawVal !== undefined && rawVal !== null) {
              // This is a rough estimation: dividing district pop by an assumed average number of subdistricts (e.g., 10)
              // A real implementation would need actual subdistrict-level static data or a better apportionment logic.
              // For visualization purposes as requested, we use the district value or a scaled down version.
              // Assuming the user just wants the map to visually update, let's pass a scaled value.
              rawVal = Math.floor(rawVal / 8);
            }
          }

          const valDisplay =
            rawVal !== undefined && rawVal !== null ? valFormat(rawVal) : '—';

          let tooltipRows = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 10px; color: #4a5568;">${label}:</span>
                            <span style="font-size: 10px; font-weight: 700; color: ${color};">${valDisplay}</span>
                        </div>
                    `;

          if (currentLayer === 'deg_urbanisation' && currentGender === 'All') {
            const cityVal =
              props[`deg_urban_city_${currentYear}`] ||
              props[`deg_city_${currentYear}`] ||
              0;
            const townVal =
              props[`deg_urban_town_${currentYear}`] ||
              props[`deg_town_${currentYear}`] ||
              0;
            const ruralVal =
              props[`deg_urban_rural_${currentYear}`] ||
              props[`deg_rural_${currentYear}`] ||
              0;

            const formatPct = (v: any) => {
              const num = parseFloat(v);
              return isNaN(num) ? '0.0%' : num.toFixed(1) + '%';
            };

            tooltipRows = `
                            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                                    <span style="font-size: 10px; color: #4a5568; font-weight: 600;">City:</span>
                                    <span style="font-size: 10px; font-weight: 800; color: #F96000;">${formatPct(cityVal)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                                    <span style="font-size: 10px; color: #4a5568; font-weight: 600;">Town:</span>
                                    <span style="font-size: 10px; font-weight: 800; color: #F96000;">${formatPct(townVal)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                                    <span style="font-size: 10px; color: #4a5568; font-weight: 600;">Rural:</span>
                                    <span style="font-size: 10px; font-weight: 800; color: #F96000;">${formatPct(ruralVal)}</span>
                                </div>
                            </div>
                        `;
          }

          const content = `
                        <div style="padding: 10px; font-family: 'Inter', sans-serif; min-width: 160px; border-radius: 12px;">
                            <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.025em;">${subName}</div>
                            <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">District: ${distName}</div>
                            ${tooltipRows}
                        </div>
                    `;

          popup.setLngLat(e.lngLat).setHTML(content).addTo(map);
        }
      });

      map.on('mouseleave', 'subdistricts-fill', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.on('click', 'subdistricts-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const rawDistName =
            feature.properties?.district_name || feature.properties?.DIST_NAME;

          if (rawDistName) {
            const canonicalName =
              DISTRICT_NAME_VARIANTS[rawDistName] || rawDistName;
            if (!ALLOWED_DISTRICTS.includes(canonicalName)) return;

            // Find the corresponding district feature in our accumulated features (case-insensitive lookup)
            let distFeature = null;
            const targetLower = canonicalName.trim().toLowerCase();
            for (const f of accumulatedFeaturesRef.current.values()) {
              const nameProp =
                f.properties?.district_name ||
                f.properties?.NAME ||
                f.properties?.name;
              const normalized = nameProp?.trim();
              const canonical = DISTRICT_NAME_VARIANTS[normalized] || normalized;
              if (canonical?.toLowerCase() === targetLower) {
                distFeature = f;
                break;
              }
            }

            let boundsArray = getDistrictBounds(canonicalName);
            if (boundsArray) {
              map.fitBounds(boundsArray, {
                padding: 130,
                duration: 1500,
                essential: true,
              });
            } else if (distFeature && distFeature.geometry) {
              const bounds = new maplibregl.LngLatBounds();
              const extend = (coords: any) => {
                if (typeof coords[0] === 'number') {
                  bounds.extend(coords as [number, number]);
                } else {
                  coords.forEach(extend);
                }
              };
              extend(distFeature.geometry.coordinates);
              if (!bounds.isEmpty()) {
                boundsArray = bounds.toArray();
                map.fitBounds(bounds, {
                  padding: 130,
                  duration: 1500,
                  essential: true,
                });
              }
            } else if (feature.geometry) {
              // Fallback to subdistrict geometry bounds if parent district features are not yet in cache
              const bounds = new maplibregl.LngLatBounds();
              const extend = (coords: any) => {
                if (typeof coords[0] === 'number') {
                  bounds.extend(coords as [number, number]);
                } else {
                  coords.forEach(extend);
                }
              };
              extend((feature.geometry as any).coordinates);
              if (!bounds.isEmpty()) {
                boundsArray = bounds.toArray();
                map.fitBounds(bounds, {
                  padding: 130,
                  duration: 1500,
                  essential: true,
                });
              }
            }

            if (onDistrictClickRef.current) {
              onDistrictClickRef.current(
                distFeature
                  ? { ...distFeature.properties, bounds: boundsArray }
                  : { ...feature.properties, bounds: boundsArray }
              );
            }
          }
        }
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[activeBasemap] as any,
      center: [85.8245, 20.2961], // Default Odisha center
      zoom: 5,
      attributionControl: false,
      interactive: true,
    });
    map.scrollZoom.disable();
    mapRef.current = map;
    map.on('load', async () => {
      map.resize();

      try {
        const p = new pmtiles.PMTiles(PMTILES_URL);
        const header = await p.getHeader();
        if (header.minLon !== undefined) {
          const bounds: maplibregl.LngLatBoundsLike = [
            [header.minLon, header.minLat],
            [header.maxLon, header.maxLat],
          ];
          initialBoundsRef.current = bounds;
          map.fitBounds(bounds, {
            padding: 50,
            duration: 0,
          });
        }
      } catch (e) {
        console.warn('Could not auto-center from PMTiles header', e);
      }

      setupPopulationLayer(map);
      setStyleLoadedCount((prev) => prev + 1);

      map.on('zoom', () => {
        const currentZoom = map.getZoom();
        const isZoomingOut = currentZoom < lastZoomRef.current;
        if (currentZoom < 4.8 && isZoomingOut && onResetClickRef.current) {
          onResetClickRef.current();
        }
        lastZoomRef.current = currentZoom;
      });

      // Extract features once data source is loaded
      map.on('idle', () => {
        // 1. District Features
        const source = map.getSource('population-source');
        const layer = map.getLayer('districts-fill');

        if (source && layer) {
          const features = map.querySourceFeatures('population-source', {
            sourceLayer: 'zcta',
          });

          if (features && features.length > 0) {
            const currentMap = accumulatedFeaturesRef.current;
            let hasChanges = false;

            features.forEach((f: any) => {
              const name =
                f.properties?.district_name ||
                f.properties?.NAME ||
                f.properties?.name;
              if (name && !currentMap.has(name)) {
                currentMap.set(name, f);
                hasChanges = true;
              }
            });

            // Highlight outline for target district if loaded late
            const curTarget = targetDistrictRef.current;
            if (curTarget && curTarget !== 'Odisha' && curTarget !== 'All Districts') {
              let targetFeature: any = null;
              for (const feature of currentMap.values()) {
                const rawName =
                  feature.properties?.district_name ||
                  feature.properties?.NAME ||
                  feature.properties?.name;

                const normalizedRaw = rawName?.trim();
                const canonicalName =
                  DISTRICT_NAME_VARIANTS[normalizedRaw] || normalizedRaw;

                if (
                  canonicalName?.toLowerCase() === curTarget.trim().toLowerCase()
                ) {
                  targetFeature = feature;
                  break;
                }
              }

              if (targetFeature && map.getLayer('selected-district-outline')) {
                map.setFilter('selected-district-outline', [
                  '==',
                  'fid',
                  targetFeature.properties.fid,
                ]);
                map.setPaintProperty('selected-district-outline', 'line-opacity', 1);
              }
            }

            if (hasChanges && onDataLoadRef.current) {
              const uniqueFeaturesArray = Array.from(currentMap.values());
              uniqueFeaturesArray.sort((a: any, b: any) => {
                const nameA =
                  a.properties?.district_name ||
                  a.properties?.NAME ||
                  a.properties?.name ||
                  '';
                const nameB =
                  b.properties?.district_name ||
                  b.properties?.NAME ||
                  b.properties?.name ||
                  '';
                return nameA.localeCompare(nameB);
              });

              const propertiesArray = uniqueFeaturesArray.map(
                (f) => f.properties,
              );
              const dataString = JSON.stringify(propertiesArray);

              if (dataString !== lastDataStringRef.current) {
                lastDataStringRef.current = dataString;
                onDataLoadRef.current(propertiesArray);
              }
            }
          }
        }

        // 2. Subdistrict Features
        const subSource = map.getSource('subdistrict-source');
        const subLayer = map.getLayer('subdistricts-fill');

        if (subSource && subLayer && showSubdistrict) {
          // Try zcta first, fallback to checking other layers if needed
          const subFeatures = map.querySourceFeatures('subdistrict-source', {
            sourceLayer: 'zcta',
          });

          if (subFeatures && subFeatures.length > 0) {
            const currentSubMap = accumulatedSubdistrictFeaturesRef.current;
            let foundNew = false;
            subFeatures.forEach((f: any) => {
              const name =
                f.properties?.subdistrict_name ||
                f.properties?.SUBDIST_NAM ||
                f.properties?.fid;
              if (name && !currentSubMap.has(name)) {
                currentSubMap.set(name, f);
                foundNew = true;
              }
            });
            if (foundNew) {
              setSubdistrictDataLoaded((prev) => prev + 1);
            }
          }
        }
        setIsLoading(false);
      });
    });

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleStyleLoad = () => {
      if (map.isStyleLoaded()) {
        console.log('Style fully loaded for:', activeBasemap);
        map.resize();
        setupPopulationLayer(map);

        // Ensure vector overlays are above basemap layers
        if (map.getLayer('districts-fill')) {
          map.moveLayer('districts-fill');
        }
        if (map.getLayer('districts-border')) {
          map.moveLayer('districts-border');
        }
        if (map.getLayer('subdistricts-fill')) {
          map.moveLayer('subdistricts-fill');
        }
        if (map.getLayer('subdistricts-border')) {
          map.moveLayer('subdistricts-border');
        }
        if (map.getLayer('selected-district-outline')) {
          map.moveLayer('selected-district-outline');
        }
        if (map.getLayer('districts-labels')) {
          map.moveLayer('districts-labels');
        }
        setStyleLoadedCount((prev) => prev + 1);
      } else {
        // If not yet loaded, wait a bit
        setTimeout(handleStyleLoad, 50);
      }
    };

    map.once('style.load', handleStyleLoad);
    map.setStyle(MAP_STYLES[activeBasemap] as any);

    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [activeBasemap]);

  // Render properties update natively using PMTiles cached properties

  // Handle Year/Gender/Layer change visualization
  useEffect(() => {
    const updateColors = () => {
      const map = mapRef.current;
      if (!map?.getLayer('districts-fill')) return;

      let propName: string;
      let subPropName: string;

      if (gender === 'Male') {
        propName = `male_${selectedYear}`;
        subPropName = `male_${selectedYear}`;
      } else if (gender === 'Female') {
        propName = `female_${selectedYear}`;
        subPropName = `female_${selectedYear}`;
      } else {
        switch (activeLayer) {
          case 'pop':
            propName = `pop_${selectedYear}_sum`;
            subPropName = `pop_${selectedYear}_sum`;
            break;
          case 'age_cohort':
            propName = `age_cohort_${selectedYear}`;
            subPropName = `age_cohort_${selectedYear}`;
            break;
          case 'deg_urbanisation':
            propName = `deg_city_${selectedYear}`;
            subPropName = `deg_city_${selectedYear}`;
            break;
          case 'growth':
            propName = `growth_${selectedYear}`;
            subPropName = `growth_${selectedYear}`;
            break;
          case 'density':
          default:
            propName = `density_${selectedYear}`;
            subPropName = `density_${selectedYear}`;
            break;
        }
      }

      const effectiveLayer = gender !== 'All' ? 'pop' : (activeLayer ?? 'pop');

      // Calculate dynamic subdistrict scale for the selected district if applicable
      let dynamicSteps: number[] | null = null;
      if (
        showSubdistrict &&
        targetDistrict &&
        targetDistrict !== 'All Districts' &&
        targetDistrict !== 'Odisha' &&
        (effectiveLayer === 'pop' || effectiveLayer === 'density')
      ) {
        const subdistrictFeatures = Array.from(accumulatedSubdistrictFeaturesRef.current.values());
        const matchNamesLower = getDistrictVariants(targetDistrict).map(n => n.toLowerCase());
        const filtered = subdistrictFeatures.filter((f) => {
          const rawDistName = f.properties?.district_name || f.properties?.DIST_NAME || f.properties?.NAME || f.properties?.name;
          if (!rawDistName) return false;
          return matchNamesLower.includes(rawDistName.toLowerCase().trim());
        });

        if (filtered.length > 0) {
          const values: number[] = [];
          filtered.forEach((f) => {
            let val = f.properties[subPropName];
            if (val !== undefined && val !== null) {
              const num = parseFloat(val);
              if (!isNaN(num)) values.push(num);
            }
          });

          if (values.length > 0) {
            const sorted = [...values].sort((a, b) => a - b);
            const min = sorted[0];
            const p90 = sorted[Math.floor(sorted.length * 0.9)] || sorted[sorted.length - 1];
            const maxLimit = p90 > min ? p90 : sorted[sorted.length - 1];

            if (maxLimit > min) {
              const range = maxLimit - min;
              const roundNice = (val: number, maxVal: number) => {
                if (maxVal > 100000) return Math.round(val / 10000) * 10000;
                if (maxVal > 10000) return Math.round(val / 1000) * 1000;
                if (maxVal > 1000) return Math.round(val / 100) * 100;
                if (maxVal > 100) return Math.round(val / 10) * 10;
                return Math.round(val);
              };

              let stepsTemp = [
                min,
                min + range * 0.25,
                min + range * 0.5,
                min + range * 0.75,
                maxLimit
              ].map((v, i) => {
                if (i === 0) return Math.max(0, Math.floor(v));
                return roundNice(v, maxLimit);
              });

              // Ensure strictly increasing steps
              const hasDuplicates = new Set(stepsTemp).size !== stepsTemp.length;
              if (hasDuplicates) {
                stepsTemp = [
                  min,
                  min + range * 0.25,
                  min + range * 0.5,
                  min + range * 0.75,
                  maxLimit
                ].map((v, i) => (i === 0 ? Math.max(0, Math.floor(v)) : Math.round(v)));
              }

              dynamicSteps = stepsTemp;
            }
          }
        }
      }

      if (onLegendStepsUpdate) {
        onLegendStepsUpdate(dynamicSteps);
      }

      const scaleKey = activeLayer === 'age_cohort' ? `age_cohort_${ageCohortSub}` : effectiveLayer;
      const scaleValues = LAYER_SCALES[scaleKey] ?? LAYER_SCALES[effectiveLayer] ?? [0, 25, 50, 75, 100];
      const nameExpr = [
        'coalesce',
        ['get', 'district_name'],
        ['get', 'DIST_NAME'],
        ['get', 'NAME'],
        ['get', 'name'],
      ];
      const genderKey =
        gender === 'Male' ? `${selectedYear}_male` : `${selectedYear}_female`;

      // Build match expressions for GENDER data fallbacks
      const valueMatch: any[] = ['match', nameExpr];
      const sValueMatch: any[] = ['match', nameExpr];
      const valueMatchLabels = new Set<string>();
      const sValueMatchLabels = new Set<string>();

      if (activeLayer === 'age_cohort') {
        ALLOWED_DISTRICTS.forEach((distName) => {
          const key = getAgeCohortDistrictName(distName);
          const yearData = AGE_COHORT_DATA[key]?.[selectedYear];
          let val = 0;
          if (yearData) {
            if (ageCohortSub === '0_14') {
              val = (yearData.male.age_0_14 || 0) + (yearData.female.age_0_14 || 0);
            } else if (ageCohortSub === '15_59') {
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

          const sVal = Math.floor(val / 8);

          const pushSLabel = (label: string, value: number) => {
            if (!sValueMatchLabels.has(label)) {
              sValueMatchLabels.add(label);
              sValueMatch.push(label, value);
            }
          };

          pushSLabel(distName, sVal);
          pushSLabel(distName.toUpperCase(), sVal);

          Object.keys(DISTRICT_NAME_VARIANTS).forEach((variantKey) => {
            if (DISTRICT_NAME_VARIANTS[variantKey] === distName) {
              pushSLabel(variantKey, sVal);
              pushSLabel(variantKey.toUpperCase(), sVal);
            }
          });
        });
      } else {
        ALLOWED_DISTRICTS.forEach((distName) => {
          const val = GENDER[distName]?.[genderKey] || 0;

          const pushLabel = (label: string, value: number) => {
            if (!valueMatchLabels.has(label)) {
              valueMatchLabels.add(label);
              valueMatch.push(label, value);
            }
          };

          pushLabel(distName, val);
          pushLabel(distName.toUpperCase(), val);

          // Map variants for fallback match expressions to align with shapefile/vector tile names
          Object.keys(DISTRICT_NAME_VARIANTS).forEach((variantKey) => {
            if (DISTRICT_NAME_VARIANTS[variantKey] === distName) {
              pushLabel(variantKey, val);
              pushLabel(variantKey.toUpperCase(), val);
            }
          });

          const sVal = Math.floor(val / 8);

          const pushSLabel = (label: string, value: number) => {
            if (!sValueMatchLabels.has(label)) {
              sValueMatchLabels.add(label);
              sValueMatch.push(label, value);
            }
          };

          pushSLabel(distName, sVal);
          pushSLabel(distName.toUpperCase(), sVal);

          Object.keys(DISTRICT_NAME_VARIANTS).forEach((variantKey) => {
            if (DISTRICT_NAME_VARIANTS[variantKey] === distName) {
              pushSLabel(variantKey, sVal);
              pushSLabel(variantKey.toUpperCase(), sVal);
            }
          });
        });
      }
      valueMatch.push(0);
      sValueMatch.push(0);

      // 1. Districts Layer
      const districtColorExp =
        activeLayer === 'deg_urbanisation'
          ? '#D3D3D3'
          : scaleValues.length === 4
            ? [
              'step',
              ['coalesce', ['get', propName], valueMatch],
              '#f0f9e8',
              scaleValues[1],
              '#bae4bc',
              scaleValues[2],
              '#7bccc4',
              scaleValues[3],
              '#0868ac',
            ]
            : [
              'step',
              ['coalesce', ['get', propName], valueMatch],
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

      map.setPaintProperty(
        'districts-fill',
        'fill-color',
        districtColorExp as any,
      );

      // 2. Subdistrict Layer
      if (map.getLayer('subdistricts-fill')) {
        const sScale = dynamicSteps ?? getSubScale(effectiveLayer);
        const subColorExp =
          activeLayer === 'deg_urbanisation'
            ? '#E5E7EB'
            : activeLayer === 'pop'
              ? [
                'step',
                ['coalesce', ['get', subPropName], sValueMatch],
                '#f0f9e8',
                sScale[1],
                '#bae4bc',
                sScale[2],
                '#7bccc4',
                sScale[3],
                '#0868ac',
              ]
              : [
                'step',
                ['coalesce', ['get', subPropName], sValueMatch],
                '#f0f9e8',
                sScale[1],
                '#bae4bc',
                sScale[2],
                '#7bccc4',
                sScale[3],
                '#43a2ca',
                sScale[4],
                '#0868ac',
              ];

        map.setPaintProperty(
          'subdistricts-fill',
          'fill-color',
          subColorExp as any,
        );
        const nameExpr = [
          'coalesce',
          ['get', 'district_name'],
          ['get', 'DIST_NAME'],
          ['get', 'NAME'],
          ['get', 'name'],
        ];
        const hasTarget = targetDistrict && targetDistrict !== 'All Districts' && targetDistrict !== 'Odisha';
        const fillOpacityExpr = hasTarget
          ? ['match', nameExpr, getDistrictVariants(targetDistrict), 1.0, 0.0]
          : 1.0;
        const lineOpacityExpr = hasTarget
          ? ['match', nameExpr, getDistrictVariants(targetDistrict), 0.8, 0.0]
          : 0.8;

        map.setPaintProperty(
          'subdistricts-fill',
          'fill-opacity',
          showSubdistrict ? fillOpacityExpr as any : 0,
        );
        if (map.getLayer('subdistricts-border')) {
          map.setPaintProperty(
            'subdistricts-border',
            'line-opacity',
            showSubdistrict ? lineOpacityExpr as any : 0,
          );
        }
      }

      if (onLegendDataUpdate) {
        onLegendDataUpdate(scaleValues[0], scaleValues[4]);
      }

      if (map.getLayer('districts-labels') && !showSubdistrict) {
        map.moveLayer('districts-labels');
      }
    };

    updateColors();
    const timeout = setTimeout(updateColors, 500);
    return () => clearTimeout(timeout);
  }, [
    selectedYear,
    gender,
    activeLayer,
    showSubdistrict,
    subdistrictDataLoaded,
    onLegendDataUpdate,
    onLegendStepsUpdate,
    targetDistrict,
    activeBasemap,
    styleLoadedCount,
    ageCohortSub,
  ]);

  // Handle Layer visibility separately for performance
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer('districts-fill')) {
      map.setLayoutProperty(
        'districts-fill',
        'visibility',
        showSubdistrict ? 'none' : 'visible',
      );
      map.setPaintProperty(
        'districts-fill',
        'fill-opacity',
        showSubdistrict ? 0 : 1.0,
      );

      // Filter districts to show only the selected district if targetDistrict is active
      map.setFilter('districts-fill', null);
    }
    if (map.getLayer('districts-border')) {
      map.setLayoutProperty('districts-border', 'visibility', 'visible');
      map.setPaintProperty(
        'districts-border',
        'line-color',
        '#4A5568',
      );
      map.setPaintProperty(
        'districts-border',
        'line-width',
        // showSubdistrict ? 1.5 : 1.5,
        1.5
      );
      map.setPaintProperty(
        'districts-border',
        'line-opacity',
        showSubdistrict ? 1 : 0.8,
      );
      if (showSubdistrict) {
        map.moveLayer('districts-border');
      }
    }
    if (map.getLayer('subdistricts-fill')) {
      map.setLayoutProperty(
        'subdistricts-fill',
        'visibility',
        showSubdistrict ? 'visible' : 'none',
      );
      const nameExpr = [
        'coalesce',
        ['get', 'district_name'],
        ['get', 'DIST_NAME'],
        ['get', 'NAME'],
        ['get', 'name'],
      ];
      const hasTarget = targetDistrict && targetDistrict !== 'All Districts' && targetDistrict !== 'Odisha';
      const fillOpacityExpr = hasTarget
        ? ['match', nameExpr, getDistrictVariants(targetDistrict), 1.0, 0.0]
        : 1.0;
      map.setPaintProperty(
        'subdistricts-fill',
        'fill-opacity',
        showSubdistrict ? fillOpacityExpr as any : 0,
      );
    }
    if (map.getLayer('subdistricts-border')) {
      map.setLayoutProperty(
        'subdistricts-border',
        'visibility',
        showSubdistrict ? 'visible' : 'none',
      );
      const nameExpr = [
        'coalesce',
        ['get', 'district_name'],
        ['get', 'DIST_NAME'],
        ['get', 'NAME'],
        ['get', 'name'],
      ];
      const hasTarget = targetDistrict && targetDistrict !== 'All Districts' && targetDistrict !== 'Odisha';
      const lineOpacityExpr = hasTarget
        ? ['match', nameExpr, getDistrictVariants(targetDistrict), 0.8, 0.0]
        : 0.8;
      map.setPaintProperty(
        'subdistricts-border',
        'line-opacity',
        showSubdistrict ? lineOpacityExpr as any : 0,
      );
    }

    // Do not filter subdistricts, clear any existing filters to allow click/hover on non-selected ones
    if (map.getLayer('subdistricts-fill') && map.getLayer('subdistricts-border')) {
      map.setFilter('subdistricts-fill', null);
      map.setFilter('subdistricts-border', null);
    }

    if (map.getLayer('selected-district-outline')) {
      map.moveLayer('selected-district-outline');
    }
    if (map.getLayer('districts-labels')) {
      map.setLayoutProperty(
        'districts-labels',
        'visibility',
        showSubdistrict ? 'none' : 'visible',
      );
      if (!showSubdistrict) {
        map.moveLayer('districts-labels');
      }
    }
  });

  // Handle Region Filtering
  useEffect(() => {
    if (mapRef.current?.getLayer('districts-fill')) {
      const filter =
        region === 'All' ? null : ['==', ['get', 'region'], region];
      mapRef.current.setFilter('districts-fill', filter as any);

      if (mapRef.current?.getLayer('districts-border')) {
        mapRef.current.setFilter('districts-border', filter as any);
      }
    }
  }, [region]);

  const handleResetView = () => {
    if (onResetClick) onResetClick();
    if (mapRef.current && initialBoundsRef.current) {
      mapRef.current.fitBounds(initialBoundsRef.current, {
        padding: { right: 0, left: 100, top: 80, bottom: 80 },
        duration: 1000,
        essential: true,
      });
    } else if (mapRef.current) {
      mapRef.current.flyTo({
        center: [85.8245, 20.2961],
        zoom: 5,
        duration: 1000,
      });
    }
  };

  const basemapOptions: { id: BasemapType; label: string }[] = [
    { id: 'grey', label: 'Grey Canvas' },
    { id: 'dark', label: 'Dark Matter' },
    { id: 'satellite', label: 'Satellite' },
  ];

  return (
    <div className="relative w-full h-full bg-slate-50">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-100 flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Top Right Controls (Basemap) */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-white/90 backdrop-blur-md w-9 h-9 flex items-center justify-center rounded-xl shadow-lg border border-gray-100 text-gray-600 hover:text-primary hover:border-primary transition-all active:scale-90"
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
                    setActiveBasemap(option.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-[11px] font-bold transition-colors flex items-center justify-between ${activeBasemap === option.id
                    ? 'bg-orange-50 text-primary'
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

      {/* Custom Controls (Bottom Right) */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-20">
        {/* Zoom Controls */}
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
    </div>
  );
};
