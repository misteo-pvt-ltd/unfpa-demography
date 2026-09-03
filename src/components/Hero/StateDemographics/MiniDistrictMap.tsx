/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from 'pmtiles';

import { DISTRICT_NAME_VARIANTS } from '../../../data/comparativeData';
import { registerMiniMap, unregisterMiniMap } from '../../Report/mapSnapshot';

// ---------------- PMTiles Setup (singleton safe) ----------------
const protocol = new pmtiles.Protocol();
if (!(maplibregl as any)._pmtilesInitialized) {
  maplibregl.addProtocol('pmtiles', protocol.tile);
  (maplibregl as any)._pmtilesInitialized = true;
}

// ---------------- CONSTANT ----------------
const PMTILES_URL =
  `${import.meta.env.VITE_REACT_DATA_URL}/population_data/od_district_pop_total_2036.pmtiles`;

type Props = {
  targetDistrict?: string;
  className?: string;
  showBasemap?: boolean; // ✅ NEW
};

export const MiniDistrictMap = ({
  targetDistrict,
  className,
  showBasemap = false, // ✅ default OFF
}: Props) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<Map<string, any>>(new Map());

  const [featuresReady, setFeaturesReady] = useState(false);

  const normalize = (s?: string) => (s || '').toLowerCase().trim();

  // ---------------- INIT MAP ----------------
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: 'https://basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
        sources: showBasemap
          ? {
            base: {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
              ],
              tileSize: 256,
            },
          }
          : {},
        layers: showBasemap
          ? [
            {
              id: 'base',
              type: 'raster',
              source: 'base',
            },
          ]
          : [],
      },
      center: [85.8245, 20.2961],
      zoom: 5,
      interactive: false,
      attributionControl: false,
      // required so the report can snapshot the canvas (maplibre-gl v5 location)
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    map.on('load', () => {
      // ---- SOURCE ----
      map.addSource('districts', {
        type: 'vector',
        url: `pmtiles://${PMTILES_URL}`,
      });

      // ---- BASE FILL ----
      map.addLayer({
        id: 'district-fill',
        type: 'fill',
        source: 'districts',
        'source-layer': 'zcta',
        paint: {
          'fill-color': showBasemap ? '#fff' : '#fff',
          'fill-opacity': showBasemap ? 0.4 : 0.7,
        },
      });

      // ---- HIGHLIGHT OUTLINE ----
      map.addLayer({
        id: 'selected-district-outline',
        type: 'line',
        source: 'districts',
        'source-layer': 'zcta',
        paint: {
          'line-color': '#F96000',
          'line-width': 2,
          'line-opacity': 0,
        },
        filter: ['==', 'fid', ''],
      });

      // ---- COLLECT FEATURES ----
      map.on('idle', () => {
        const feats = map.querySourceFeatures('districts', {
          sourceLayer: 'zcta',
        });

        feats.forEach((f: any) => {
          const raw =
            f.properties?.district_name ||
            f.properties?.NAME ||
            f.properties?.name;

          if (raw && !featuresRef.current.has(raw)) {
            featuresRef.current.set(raw, f);
          }
        });

        if (featuresRef.current.size > 0) {
          setFeaturesReady(true);
        }
      });
    });

    mapRef.current = map;
    registerMiniMap(map);

    return () => {
      unregisterMiniMap(map);
      map.remove();
      mapRef.current = null;
    };
  }, [showBasemap]);

  // ---------------- HIGHLIGHT LOGIC ----------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !targetDistrict || !featuresReady) return;

    let targetFeature: any = null;

    for (const feature of featuresRef.current.values()) {
      const raw =
        feature.properties?.district_name ||
        feature.properties?.NAME ||
        feature.properties?.name;

      const canonical = DISTRICT_NAME_VARIANTS[raw] || raw;

      if (normalize(canonical) === normalize(targetDistrict)) {
        targetFeature = feature;
        break;
      }
    }

    if (!targetFeature) return;

    // ---- APPLY OUTLINE ----
    map.setFilter('selected-district-outline', [
      '==',
      'fid',
      targetFeature.properties.fid,
    ]);

    map.setPaintProperty('selected-district-outline', 'line-opacity', 1);

    // ---- FIT BOUNDS ----
    const bounds = new maplibregl.LngLatBounds();

    const extend = (coords: any) => {
      if (typeof coords[0] === 'number') {
        bounds.extend(coords);
      } else {
        coords.forEach(extend);
      }
    };

    extend(targetFeature.geometry.coordinates);

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 40,
        duration: 800,
      });
    }
  }, [targetDistrict, featuresReady]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-xl  ${className || ''}`}
    />
  );
};
