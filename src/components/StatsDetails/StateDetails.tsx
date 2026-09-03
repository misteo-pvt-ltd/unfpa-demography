/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Trophy,
  AlertCircle,
  Map as MapIcon,
  ChartNoAxesColumnIncreasing,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Info,
} from 'lucide-react';

const InfoTooltip = ({
  text,
  position = 'top',
  // source,
  content,
  className = 'w-48',
}: {
  text?: string;
  position?: 'top' | 'bottom';
  source?: string;
  content?: React.ReactNode;
  className?: string;
}) => (
  <span className="group/info relative inline-block ml-2 align-middle z-[100]">
    <Info className="w-4 h-4 text-gray-400 group-hover/info:text-[#F96000] transition-colors cursor-help" />
    <span
      className={`absolute left-1/2 -translate-x-1/2 px-1 hidden group-hover/info:flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 pointer-events-none z-[200] ${className} 
            ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
    >
      <span className="bg-white/98 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-gray-100 w-full block whitespace-normal text-left">
        {content ? (
          content
        ) : (
          <span className="text-[10px] text-gray-700 leading-relaxed font-semibold block text-center">
            {text}
          </span>
        )}
        {position === 'top' ? (
          <span className="absolute top-[calc(100%-6px)] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 shadow-sm block"></span>
        ) : (
          <span className="absolute bottom-[calc(100%-6px)] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45 shadow-sm block"></span>
        )}
      </span>
    </span>
  </span>
);
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceArea,
  LabelList,
} from 'recharts';
import {
  DISTRICT_NAMES,
  DISTRICT_NAME_VARIANTS,
  // DISTRICT_DEMOGRAPHICS,
  ALLOWED_DISTRICTS,
  DEMOGRAPHIC_STATS,
  CENSUS_PROJECTION_DATA,
  getRecord,
} from '../../data/comparativeData';
import {
  MODEL_STATS_DATA,
  MODEL_DATA,
  MODEL_URBAN_RURAL_DATA,
} from '../../data/modelStats';
import { DISTRICT_DEVELOPMENT } from '../../data/districtDevelopment';
import type { LayerType } from '../../../types';
import MapCompare, {
  LULC_QUARTERS,
  LULC_YEARS,
  NTL_QUARTERS,
} from '../MapCompare/MapCompare';
import { MultiMapCompare } from '../MapCompare/MultiMapCompare';

import { MapSentinelQuaterly } from '../Map/MapSentinelQuaterly';
import { WhatHowWhy_v2 } from '../Map/WhatHowWhy_v2/WhatHowWhy_v2';
interface StatsDetailsProps {
  selectedDistrict: string;
  onDistrictSelect?: (district: string) => void;
  data?: any;
  allDistrictsData?: any[];
  isQuarterly?: boolean;
}

export const StatsDetails: React.FC<StatsDetailsProps> = ({
  selectedDistrict = 'Odisha',
  onDistrictSelect,
  data,
  allDistrictsData,
  isQuarterly = false,
}) => {
  const [year1, setYear1] = useState<number | string>(
    isQuarterly ? '2018 q1' : '2017',
  );
  const [year2, setYear2] = useState<number | string>(
    isQuarterly ? '2026 q1' : '2025',
  );
  const [compareLayer, setCompareLayer] = useState<
    LayerType | 'builtup' | 'lulc'
  >('builtup' as any);
  const [compareLulcPixel] = useState<number | null>(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [viewMode] = useState<'map' | 'compare' | 'change_analysis'>('compare');
  const [showSentinel, setShowSentinel] = useState(false);
  const [openYear1, setOpenYear1] = useState(false);
  const [openYear2, setOpenYear2] = useState(false);
  const [chartDistricts, setChartDistricts] = useState<string[]>(
    selectedDistrict &&
      selectedDistrict !== 'Odisha' &&
      selectedDistrict !== 'All Districts'
      ? [selectedDistrict]
      : ['Anugul', 'Balangir', 'Cuttack', 'Kendujhar', 'Khordha']
  );
  const [openDistrictSelector, setOpenDistrictSelector] = useState(false);
  const MATRIX_YEARS = Array.from({ length: 26 }, (_, i) => String(2011 + i));
  const [matrixYear, setMatrixYear] = useState('2025');
  const [isMatrixYearDropdownOpen, setIsMatrixYearDropdownOpen] = useState(false);
  const devContent =
    (getRecord(DISTRICT_DEVELOPMENT, selectedDistrict) as
      | (typeof DISTRICT_DEVELOPMENT)[string]
      | undefined) || DISTRICT_DEVELOPMENT['Anugul'];
  const [projectionMode, setProjectionMode] = useState<
    'Model Only' | 'Model Vs Census Projection'
  >('Model Only');
  const layerYearMap: Record<string, string[]> = {
    nightlight: NTL_QUARTERS,
    roads: [
      '2014',
      '2015',
      '2016',
      '2017',
      '2018',
      '2019',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
    ],
    builtup: LULC_QUARTERS,
    cropland: LULC_QUARTERS,
    forest: LULC_QUARTERS,
  };

  const currentLulcYears = isQuarterly ? LULC_QUARTERS : LULC_YEARS;

  const validYears = React.useMemo(() => {
    if (
      ['builtup', 'cropland', 'forest', 'lulc'].includes(compareLayer as string)
    ) {
      return currentLulcYears;
    }
    return layerYearMap[compareLayer] || ['2018', '2024'];
  }, [compareLayer, currentLulcYears]);

  const availableYears = validYears;
  const isLulcLayer = ['builtup', 'cropland', 'forest', 'lulc'].includes(
    compareLayer as string,
  );

  const formatLulcLabel = (y: string | number) => {
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

  // Update years if current selection is not available for new layer
  React.useEffect(() => {
    if (isLulcLayer) {
      if (!currentLulcYears.includes(String(year1)))
        setYear1(currentLulcYears[0]);
      if (!currentLulcYears.includes(String(year2)))
        setYear2(currentLulcYears[currentLulcYears.length - 1]);
    } else {
      if (!validYears.includes(String(year1))) {
        setYear1(
          isNaN(Number(validYears[0]))
            ? validYears[0]
            : parseInt(validYears[0]),
        );
        setYear2(
          isNaN(Number(validYears[validYears.length - 1]))
            ? validYears[validYears.length - 1]
            : parseInt(validYears[validYears.length - 1]),
        );
      }
    }
  }, [compareLayer, isLulcLayer, validYears]);

  const devScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showDevLeftScroll, setShowDevLeftScroll] = useState(false);
  const [showDevRightScroll, setShowDevRightScroll] = useState(false);

  const checkDevScroll = React.useCallback(() => {
    if (devScrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        devScrollContainerRef.current;
      setShowDevLeftScroll(scrollLeft > 0);
      setShowDevRightScroll(Math.ceil(scrollLeft) < scrollWidth - clientWidth);
    }
  }, []);

  const insightsScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showInsightsLeftScroll, setShowInsightsLeftScroll] = useState(false);
  const [showInsightsRightScroll, setShowInsightsRightScroll] = useState(false);

  const checkInsightsScroll = React.useCallback(() => {
    if (insightsScrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        insightsScrollContainerRef.current;
      setShowInsightsLeftScroll(scrollLeft > 0);
      setShowInsightsRightScroll(
        Math.ceil(scrollLeft) < scrollWidth - clientWidth,
      );
    }
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      checkDevScroll();
      checkInsightsScroll();
    }, 100);
    const handleResize = () => {
      checkDevScroll();
      checkInsightsScroll();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkDevScroll, checkInsightsScroll]);

  const scrollDev = (direction: 'left' | 'right') => {
    if (devScrollContainerRef.current) {
      const scrollAmount = 400;
      devScrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkDevScroll, 350);
    }
  };

  const scrollInsights = (direction: 'left' | 'right') => {
    if (insightsScrollContainerRef.current) {
      const scrollAmount = 400;
      insightsScrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkInsightsScroll, 350);
    }
  };
  React.useEffect(() => {
  }, [selectedDistrict]);

  // State for Map Synchronization
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [resetMapTrigger, setResetMapTrigger] = useState(0);
  React.useEffect(() => {
    if (
      selectedDistrict &&
      selectedDistrict !== 'Odisha' &&
      selectedDistrict !== 'All Districts'
    ) {
      if (data && data.bounds) {
        setMapBounds(data.bounds);
      }
      setShowSentinel(true);
    } else {
      setMapBounds(null);
      setResetMapTrigger((prev) => prev + 1);
      setShowSentinel(false);
    }
  }, [data, selectedDistrict]);

  // Create a lookup for all districts data if available
  const districtsLookup = React.useMemo(() => {
    if (!allDistrictsData) return new Map();
    const map = new Map();
    allDistrictsData.forEach((d) => {
      const rawName = d.district_name || d.NAME || d.name;
      const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;
      if (name) map.set(name, d);
    });
    return map;
  }, [allDistrictsData]);

  // Helper to get pop value from data
  const getPopForYear = (
    districtName: string,
    year: string,
    gender: 'sum' | 'Male' | 'Female' = 'sum',
  ) => {
    const propKey =
      gender === 'sum'
        ? `pop_${year}_sum`
        : gender === 'Male'
          ? `male_${year}`
          : `female_${year}`;
    const isAll = districtName === 'All Districts' || districtName === 'Odisha';

    // Sum across all districts if it's the state-level view
    if (isAll && allDistrictsData && allDistrictsData.length > 0) {
      return allDistrictsData.reduce(
        (acc, d) => acc + (parseFloat(d[propKey] || 0) || 0),
        0,
      );
    }

    // Priority 1: Selected District Data (passed directly)
    if (selectedDistrict === districtName && data) {
      const val = data[propKey];
      if (val !== undefined && val !== null)
        return typeof val === 'string' ? parseFloat(val) : val;
    }

    // Priority 2: All Districts Data (from map query)
    if (districtsLookup.has(districtName)) {
      const dData = districtsLookup.get(districtName);
      const val = dData[propKey];
      if (val !== undefined && val !== null)
        return typeof val === 'string' ? parseFloat(val) : val;
    }

    return null;
  };

  // New helper to get trend data specifically from MODEL_DATA
  const getModelTrendData = (name: string) => {
    if (MODEL_DATA[name]) {
      // Return full range from 2011 to 2036 as per modelStats.ts
      return Object.entries(MODEL_DATA[name])
        .map(([year, value]) => ({
          year: year.toString(),
          value: value as number,
        }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    }
    // Fallback to PMTiles trend if model data is not available
    return availableTrendYears.map((year) => ({
      year,
      value: (getPopForYear(name, year) as number) || 0,
    }));
  };

  // Dynamically identify available years from the data
  const availableTrendYears = React.useMemo(() => {
    let years: string[] = [];
    if (allDistrictsData && allDistrictsData.length > 0) {
      const first = allDistrictsData[0];
      const dataYears = Object.keys(first)
        .filter((k) => /^pop_\d{4}_sum$/.test(k))
        .map((k) => k.split('_')[1])
        .sort();
      if (dataYears.length > 0) years = dataYears;
    }
    return years;
  }, [allDistrictsData]);  // Sync chart districts with selected district from map
  React.useEffect(() => {
    if (
      selectedDistrict &&
      selectedDistrict !== 'Odisha' &&
      selectedDistrict !== 'All Districts'
    ) {
      setChartDistricts([selectedDistrict]);
    }
  }, [selectedDistrict]);
  const isDistrictSelected =
    selectedDistrict &&
    selectedDistrict !== 'Odisha' &&
    selectedDistrict !== 'All Districts';

  React.useEffect(() => {
    if (
      !isDistrictSelected &&
      projectionMode === 'Model Vs Census Projection'
    ) {
      setProjectionMode('Model Only');
    }
  }, [selectedDistrict, projectionMode, isDistrictSelected]);

  const DISTRICT_PERFORMANCE = React.useMemo(() => {
    const yearForTable = matrixYear;
    const yearForGrowthNum = Math.max(2011, parseInt(matrixYear) - 2);
    const yearForGrowth = String(yearForGrowthNum);
    const yearNumeric = parseInt(yearForTable);

    const rawData = ALLOWED_DISTRICTS.map((name) => {
      const seed = name.length;

      const trendData = getModelTrendData(name);

      const pmtilesPop = (getPopForYear(name, yearForTable) as number) || 0;
      const pmtilesPopPrev = (getPopForYear(name, yearForGrowth) as number) || 0;

      let populationValue = pmtilesPop;
      if (MODEL_DATA[name] && MODEL_DATA[name][yearNumeric]) {
        populationValue = MODEL_DATA[name][yearNumeric];
      }

      const densityKey = `density_${yearForTable}`;
      let latestDensityValue = 0;

      const modelStatYear = getRecord(MODEL_STATS_DATA, name)?.[yearForTable];
      if (modelStatYear) {
        latestDensityValue = modelStatYear.density;
      } else if (selectedDistrict === name && data && data[densityKey]) {
        latestDensityValue = parseFloat(data[densityKey]);
      } else if (districtsLookup.has(name)) {
        const dData = districtsLookup.get(name);
        latestDensityValue = parseFloat(dData[densityKey] || 0);
      }

      // Growth calculation from MODEL_STATS_DATA for selected year
      let growthStr = '+0.0%';
      if (modelStatYear) {
        const growthVal = modelStatYear.growth;
        if (growthVal === null) {
          growthStr = '-';
        } else {
          growthStr = (growthVal >= 0 ? '+' : '') + growthVal.toFixed(2) + '%';
        }
      } else {
        const demoStatRecord = getRecord(DEMOGRAPHIC_STATS, name)?.[yearNumeric];
        if (demoStatRecord) {
          const growthVal = demoStatRecord.growth;
          growthStr = (growthVal >= 0 ? '+' : '') + growthVal.toFixed(2) + '%';
        } else if (pmtilesPop > 0 && pmtilesPopPrev > 0) {
          const totalGrowth = ((pmtilesPop - pmtilesPopPrev) / pmtilesPopPrev) * 100;
          const yearlyGrowth = totalGrowth / 2;
          growthStr = (yearlyGrowth >= 0 ? '+' : '') + yearlyGrowth.toFixed(1) + '%';
        }
      }

      const latestPop = populationValue;
      let urbanPop = 0;
      let ruralPop = 0;
      const modelUrbanRuralYear = getRecord(MODEL_URBAN_RURAL_DATA, name)?.[yearForTable];
      if (modelUrbanRuralYear) {
        urbanPop = modelUrbanRuralYear.urban;
        ruralPop = modelUrbanRuralYear.rural;
      }

      return {
        name,
        latestPop,
        // rank will be assigned after sorting
        population: latestPop.toLocaleString(),
        density:
          latestDensityValue > 0
            ? latestDensityValue.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }) + '/km²'
            : (400 + seed * 50).toFixed(0) + '/km²',
        urban: (urbanPop / 1000000).toFixed(2) + 'M',
        rural: (ruralPop / 1000000).toFixed(2) + 'M',
        growth: growthStr,
        trendData: trendData,
      };
    });

    // Sort by latest population descending
    return rawData
      .sort((a, b) => b.latestPop - a.latestPop)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [matrixYear, availableTrendYears, allDistrictsData, data, selectedDistrict]); // Recalculate when data changes

  const visibleDistricts = DISTRICT_PERFORMANCE;

  React.useEffect(() => {
    setTimeout(() => {
      const container = document.getElementById('regional-matrix-container');
      if (!container) return;

      if (selectedDistrict && selectedDistrict !== 'Odisha') {
        const el = document.getElementById(`district-row-${selectedDistrict}`);
        if (el) {
          // Calculate relative to the container scroll
          const topOffset =
            el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
          container.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
      } else {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  }, [selectedDistrict]);

  const getProjectionData = () => {
    const years = Array.from({ length: 26 }, (_, i) => 2011 + i); // 2011 to 2036

    return years.map((y) => {
      const row: any = { year: y };
      chartDistricts.forEach((distName) => {
        // Model Data (Only from MODEL_DATA)
        let modelVal = null;
        const modelRecord = getRecord(MODEL_DATA, distName);
        if (modelRecord && modelRecord[y]) {
          modelVal = modelRecord[y];
        }

        if (modelVal !== null) {
          if (y <= 2025) row[`${distName}_model_s`] = modelVal;
          if (y >= 2025) row[`${distName}_model_d`] = modelVal;
        }

        // Census Data (CENSUS_PROJECTION_DATA)
        if (projectionMode === 'Model Vs Census Projection') {
          const censusRecord = getRecord(CENSUS_PROJECTION_DATA, distName);
          if (
            censusRecord &&
            censusRecord[y]
          ) {
            const censusVal = censusRecord[y];
            if (y <= 2025) row[`${distName}_census_s`] = censusVal;
            if (y >= 2025) row[`${distName}_census_d`] = censusVal;
          }
        }
      });
      return row;
    });
  };

  const PROJECTION_DATA = getProjectionData();
  const isModelVsCensus = projectionMode === 'Model Vs Census Projection';
  const displayDistricts = isModelVsCensus
    ? [selectedDistrict]
    : chartDistricts;

  return (
    <div className="bg-white min-h-[500px]">
      <div className="w-full mx-auto px-4 lg:px-6 py-14 space-y-12">
        {/* 1.5 Population Projections Section */}
        <div className="space-y-6 pb-10 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <ChartNoAxesColumnIncreasing className="w-6 h-6 text-black" />
                Population Projections - {selectedDistrict}
                {/* <InfoTooltip text="Projected demographic trends and statistics." position="top" /> */}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                District wise demographic projection and growth trajectory
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Projection Mode Toggle */}
              <div className="relative group">
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setProjectionMode('Model Only')}
                    className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${projectionMode === 'Model Only' ? 'bg-white text-[#F76000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Model Only
                  </button>
                  <button
                    disabled={!isDistrictSelected}
                    onClick={() =>
                      setProjectionMode('Model Vs Census Projection')
                    }
                    className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${projectionMode === 'Model Vs Census Projection'
                      ? 'bg-white text-[#1C68AC] shadow-sm'
                      : isDistrictSelected
                        ? 'text-gray-500 hover:text-gray-700'
                        : 'text-gray-300 cursor-not-allowed'
                      }`}
                  >
                    Model Vs. Census Proj.
                  </button>
                </div>

                {/* Custom Tooltip */}
                {!isDistrictSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-white border border-gray-100 shadow-xl rounded-lg px-3 py-2 text-[10px] font-bold text-gray-600 whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200 ring-1 ring-black/5">
                      Please select a district from the map
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white drop-shadow-sm"></div>
                    </div>
                  </div>
                )}
              </div>
              {/* District Multi-Selector */}
              <div
                className={`relative flex items-center gap-2 group transition-all ${isModelVsCensus ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div
                  onClick={() =>
                    !isModelVsCensus &&
                    setOpenDistrictSelector(!openDistrictSelector)
                  }
                  className="flex flex-wrap items-center gap-1.5 p-1 px-2 min-h-[38px] bg-white border rounded-md min-w-[100px] cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {(isModelVsCensus ? [selectedDistrict] : chartDistricts).map(
                    (district) => (
                      <div
                        key={district}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] rounded-md font-bold text-white border border-gray-200 transition-all ${isModelVsCensus ? 'bg-[#1C68AC]' : 'bg-[#F96000]'}`}
                      >
                        <span>{district}</span>
                        {!isModelVsCensus && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setChartDistricts((prev) =>
                                prev.filter((d) => d !== district),
                              );
                            }}
                            className="cursor-pointer"
                          >
                            <X className="w-3 h-3" strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    ),
                  )}
                  {!isModelVsCensus && chartDistricts.length === 0 && (
                    <span className="px-3 text-[12px] font-black text-gray-400">
                      Select Districts
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    !isModelVsCensus &&
                    setOpenDistrictSelector(!openDistrictSelector)
                  }
                  className={`${isModelVsCensus ? 'text-gray-300' : 'text-[#f64e24]'} transition-all hover:scale-110 shrink-0`}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${openDistrictSelector ? 'rotate-180' : ''}`}
                    strokeWidth={2.5}
                  />
                </button>

                {openDistrictSelector && (
                  <>
                    <div
                      className="fixed inset-0 z-[190]"
                      onClick={() => setOpenDistrictSelector(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-[200] max-h-[400px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                      <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Select up to 5 districts
                        </p>
                      </div>
                      <div className="overflow-y-auto p-2 custom-scrollbar space-y-0.5">
                        {DISTRICT_NAMES.map((name) => {
                          const isSelected = chartDistricts.includes(name);
                          const isDisabled =
                            (!isSelected && chartDistricts.length >= 5) ||
                            !ALLOWED_DISTRICTS.includes(name);
                          return (
                            <button
                              key={name}
                              disabled={isDisabled}
                              onClick={() => {
                                if (isSelected) {
                                  setChartDistricts((prev) =>
                                    prev.filter((d) => d !== name),
                                  );
                                } else {
                                  setChartDistricts((prev) =>
                                    [...prev, name].slice(0, 5),
                                  );
                                }
                              }}
                              className="w-full px-3 py-2.5 text-left transition-all hover:bg-gray-50/50 group/item flex items-center rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <span
                                className={`text-xs font-bold tracking-wider border-b-2 pb-0.5 transition-all ${isSelected ? 'text-gray-600 border-gray-400' : 'text-gray-600 border-gray-400'}`}
                              >
                                {name}
                              </span>
                              {isSelected && (
                                <Check
                                  className="w-4 h-4 ml-auto text-[#f64e24]"
                                  strokeWidth={3}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <section className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 relative min-h-[450px]">
            {(!allDistrictsData || allDistrictsData.length === 0) && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-lg transition-all duration-300">
                <div className="loading-spinner"></div>
              </div>
            )}
            <div
              className="h-[400px] w-full relative overflow-hidden group/chart"
              onMouseLeave={() => setHoveredDistrict(null)}
            >
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] group-hover/chart:opacity-[0.05] transition-opacity"></div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={PROJECTION_DATA}
                  margin={{ top: 25, right: 80, left: 10, bottom: 0 }}
                >
                  <ReferenceArea
                    x1={2036}
                    x2={2036}
                    fill="#f8f8f8ff"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <CartesianGrid
                    vertical={true}
                    stroke="#E5E7EB"
                    strokeOpacity={1}
                  />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[2011, 2036]}
                    ticks={[2011, 2016, 2021, 2026, 2031, 2036]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }}
                    tickFormatter={(value: any) =>
                      `${(value / 1000000).toFixed(2)}M`
                    }
                  />
                  <Tooltip
                    cursor={false}
                    shared={true}
                    isAnimationActive={true}
                    animationDuration={100}
                    content={({ active, payload, label }) => {
                      if (
                        active &&
                        payload &&
                        payload.length &&
                        hoveredDistrict
                      ) {
                        const filteredPayload = payload.filter((p) =>
                          (p.dataKey as string).startsWith(hoveredDistrict),
                        );

                        const uniqueEntries: any[] = [];
                        const seenTypes = new Set<string>();

                        filteredPayload.forEach((p) => {
                          const type = (p.dataKey as string).split('_')[1];
                          if (!seenTypes.has(type)) {
                            seenTypes.add(type);
                            uniqueEntries.push(p);
                          }
                        });

                        if (uniqueEntries.length === 0) return null;

                        return (
                          <div className="bg-white border-0 shadow-xl rounded-none p-3 md:p-4 min-w-[150px]">
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                              {label}
                            </p>
                            <div className="space-y-2">
                              {uniqueEntries.map((p: any) => {
                                const rawDataKey = p.dataKey as string;
                                const type = rawDataKey.split('_')[1];
                                const val = p.value as number;

                                return (
                                  <div
                                    key={rawDataKey}
                                    className="flex justify-between items-center text-xs gap-4"
                                  >
                                    <span className="font-bold text-gray-700">
                                      {hoveredDistrict} (
                                      {type === 'model' ? 'Model' : 'Census'})
                                    </span>
                                    <span className="font-mono text-[#0868ac] font-bold">
                                      {(val / 1000000).toFixed(2)}M
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {displayDistricts.map((district) => {
                    const isSelected = selectedDistrict === district;
                    const isSomethingHovered = hoveredDistrict !== null;
                    const isHovered = hoveredDistrict === district;
                    const isSomethingSelected =
                      selectedDistrict !== 'Odisha' &&
                      selectedDistrict !== 'All Districts' &&
                      selectedDistrict !== '';

                    // Dynamic styling
                    let strokeWidth = 1.5;
                    let strokeOpacity = 0.5;

                    if (isHovered) {
                      strokeWidth = 4;
                      strokeOpacity = 1;
                    } else if (isSelected) {
                      strokeWidth = 3.5;
                      strokeOpacity = 1;
                    } else if (isSomethingHovered || isSomethingSelected) {
                      strokeWidth = 1;
                      strokeOpacity = 0.3;
                    }

                    return (
                      <React.Fragment key={district}>
                        {/* Model Lines */}
                        <Line
                          type="monotone"
                          dataKey={`${district}_model_s`}
                          stroke="#F76000"
                          strokeWidth={strokeWidth}
                          strokeOpacity={strokeOpacity}
                          dot={false}
                          activeDot={false}
                          connectNulls={true}
                          isAnimationActive={false}
                          onMouseEnter={() => setHoveredDistrict(district)}
                          onMouseLeave={() => setHoveredDistrict(null)}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${district}_model_d`}
                          stroke="#F76000"
                          strokeWidth={strokeWidth}
                          strokeOpacity={strokeOpacity}
                          strokeDasharray="4 4"
                          dot={false}
                          activeDot={false}
                          connectNulls={true}
                          isAnimationActive={false}
                          onMouseEnter={() => setHoveredDistrict(district)}
                          onMouseLeave={() => setHoveredDistrict(null)}
                        >
                          <LabelList
                            dataKey={`${district}_model_d`}
                            position="right"
                            content={(props: any) => {
                              const { x, y, index, value } = props;
                              // Only show on the very last point and if value exists
                              if (
                                index !== PROJECTION_DATA.length - 1 ||
                                value === undefined ||
                                value === null
                              )
                                return null;
                              return (
                                <text
                                  x={x + 10}
                                  y={y - 5}
                                  fill="#F76000"
                                  fontSize={10}
                                  fontWeight="800"
                                  textAnchor="start"
                                  alignmentBaseline="middle"
                                >
                                  {district}
                                </text>
                              );
                            }}
                          />
                        </Line>

                        {/* Census Lines (conditional) */}
                        {projectionMode === 'Model Vs Census Projection' && (
                          <React.Fragment>
                            <Line
                              type="monotone"
                              dataKey={`${district}_census_s`}
                              stroke="#1C68AC"
                              strokeWidth={strokeWidth}
                              strokeOpacity={strokeOpacity}
                              dot={false}
                              activeDot={false}
                              connectNulls={true}
                              isAnimationActive={false}
                              onMouseEnter={() => setHoveredDistrict(district)}
                              onMouseLeave={() => setHoveredDistrict(null)}
                            />
                            <Line
                              type="monotone"
                              dataKey={`${district}_census_d`}
                              stroke="#1C68AC"
                              strokeWidth={strokeWidth}
                              strokeOpacity={strokeOpacity}
                              strokeDasharray="4 4"
                              dot={false}
                              activeDot={false}
                              connectNulls={true}
                              isAnimationActive={false}
                              onMouseEnter={() => setHoveredDistrict(district)}
                              onMouseLeave={() => setHoveredDistrict(null)}
                            >
                              <LabelList
                                dataKey={`${district}_census_d`}
                                position="right"
                                content={(props: any) => {
                                  const { x, y, index, value } = props;
                                  // Only show on the very last point and if value exists
                                  if (
                                    index !== PROJECTION_DATA.length - 1 ||
                                    value === undefined ||
                                    value === null
                                  )
                                    return null;
                                  return (
                                    <text
                                      x={x + 10}
                                      y={y + 5}
                                      fill="#1C68AC"
                                      fontSize={10}
                                      fontWeight="800"
                                      textAnchor="start"
                                      alignmentBaseline="middle"
                                    >
                                      {district}
                                    </text>
                                  );
                                }}
                              />
                            </Line>
                          </React.Fragment>
                        )}
                      </React.Fragment>
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-center gap-8">
              {/* Model Legend Items */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-1 bg-[#F76000]"></div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Model
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-1 border-t-2 border-dashed border-[#F76000]"></div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Model Projection
                  </span>
                </div>
              </div>

              {/* Census Legend Items (conditional) */}
              {projectionMode === 'Model Vs Census Projection' && (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
                    <div className="w-8 h-1 bg-[#1C68AC]"></div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider"></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 border-t-2 border-dashed border-[#1C68AC]"></div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Census Projection
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {isDistrictSelected && (
          <>
            {/* <MapLulc selectedDistrict={selectedDistrict} onDistrictSelect={onDistrictSelect} /> */}

            {/* Quarterly Sentinel-2 TCI Timelapse */}
            <div className="w-full mb-14">
              <MapSentinelQuaterly
                targetDistrict={selectedDistrict}
                targetBounds={mapBounds}
              />
            </div>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <MapIcon className="w-6 h-6 text-black" />
                  Comparative Analysis - {selectedDistrict}
                  <InfoTooltip
                    position="bottom"
                    className="w-[280px] sm:w-[380px] md:w-[480px]"
                    content={
                      <div className="space-y-4 p-1 text-gray-800">
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-wider mb-1">
                            Built-up Area
                          </h4>
                          <p className="text-[10px] text-gray-600 leading-relaxed font-semibold">
                            Built-up area represents land covered by human-made
                            structures such as residential buildings, commercial
                            establishments, industrial facilities, roads, and other
                            impervious surfaces.
                          </p>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                          <h4 className="text-[11px] font-black  uppercase tracking-wider mb-1">
                            Night Lights
                          </h4>
                          <p className="text-[10px] text-gray-600 leading-relaxed font-semibold">
                            Night-Time Light (NTL) data are derived from the Visible
                            Infrared Imaging Radiometer Suite (VIIRS) sensor onboard the
                            joint NASA/NOAA satellites. The dataset captures artificial
                            lighting emitted from human settlements and economic
                            activities during nighttime. Higher radiance values
                            generally indicate greater levels of human activity,
                            infrastructure, and electrification.
                          </p>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                          <h4 className="text-[11px] font-black  uppercase tracking-wider mb-1">
                            Road Network
                          </h4>
                          <p className="text-[10px] text-gray-600 leading-relaxed font-semibold">
                            The road layer represents transportation infrastructure,
                            including highways, primary roads, secondary roads, and local
                            road networks. Roads provide connectivity between
                            settlements, markets, healthcare facilities, schools, and
                            other services.
                          </p>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                          <h4 className="text-[11px] font-black  uppercase tracking-wider mb-1">
                            Cropland
                          </h4>
                          <p className="text-[10px] text-gray-600 leading-relaxed font-semibold">
                            Cropland represents areas used for agricultural cultivation
                            and food production. The layer is derived from the LULC
                            dataset by extracting pixels classified as agricultural land
                            or cropland.
                          </p>
                        </div>
                      </div>
                    }
                  />
                </h2>
                {/* <p className="text-sm text-gray-500 mt-1 font-medium">
                  Visualizing spatiotemporal changes in {selectedDistrict}.
                  Click on the markers on the map to navigate to the “What
                  Changed?”, “How It Changed,” and “Why It Changed” sections.
                </p> */}
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Visualizing spatiotemporal changes in {selectedDistrict}.
                </p>
              </div>
            </div>

            {/* Category & Year Controls */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-4">
              {/* Category Labels */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full lg:w-auto">
                {[
                  { label: 'Builtup', layer: 'builtup' },
                  { label: 'Night Light', layer: 'nightlight' },
                  { label: 'Roads', layer: 'roads' },
                  { label: 'Cropland', layer: 'cropland' },
                  // { label: 'Forest', layer: 'forest' },
                ].map((cat) => (
                  <button
                    key={cat.layer}
                    onClick={() => setCompareLayer(cat.layer as any)}
                    className={`px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border rounded-md ${compareLayer === cat.layer
                      ? 'bg-[#F96000] text-white shadow-sm'
                      : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-white'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Year Selection */}
              <div className="flex items-center gap-4 shrink-0 transition-all bg-gray-50/50 p-1.5 px-3 rounded-lg border border-gray-100">
                {/* Year 1 */}
                <div className="relative flex items-center gap-1.5 group">
                  <div
                    onClick={() => {
                      setOpenYear1(!openYear1);
                      setOpenYear2(false);
                    }}
                    className="px-4 py-1.5 text-[12px] font-black tracking-wide bg-white text-gray-600 border border-gray-400 rounded-md transition-all min-w-[70px] flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400"
                  >
                    <span className="font-mono">{formatLulcLabel(year1)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setOpenYear1(!openYear1);
                      setOpenYear2(false);
                    }}
                    className="text-[#f64e24] transition-all hover:scale-110"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${openYear1 ? 'rotate-180' : ''}`}
                      strokeWidth={2.5}
                    />
                  </button>
                  {openYear1 && (
                    <div className="absolute right-0 top-full mt-3 bg-white rounded-md shadow-xl border border-gray-100 p-3 z-[200] animate-in fade-in slide-in-from-top-2 w-max min-w-[160px] max-h-60 overflow-y-auto transition-all">
                      {availableYears.map((y) => (
                        <button
                          key={y}
                          onClick={() => {
                            setYear1(isNaN(Number(y)) ? y : parseInt(y));
                            setOpenYear1(false);
                          }}
                          className="w-full px-2 py-3 text-left transition-all hover:bg-gray-50/50 group/item flex items-center rounded whitespace-nowrap"
                        >
                          <span
                            className={`text-xs font-bold tracking-wider border-b-2 pb-0.5 transition-all ${year1 === (isNaN(Number(y)) ? y : parseInt(y)) ? 'text-gray-600 border-gray-400' : 'text-gray-600 border-gray-400'}`}
                          >
                            {formatLulcLabel(y)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                  vs
                </span>

                {/* Year 2 */}
                <div className="relative flex items-center gap-1.5 group">
                  <div
                    onClick={() => {
                      setOpenYear2(!openYear2);
                      setOpenYear1(false);
                    }}
                    className="px-4 py-1.5 text-[12px] font-black tracking-wide bg-white text-gray-600 border border-gray-400 rounded-md transition-all min-w-[70px] flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400"
                  >
                    <span className="font-mono">{formatLulcLabel(year2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setOpenYear2(!openYear2);
                      setOpenYear1(false);
                    }}
                    className="text-[#f64e24] transition-all hover:scale-110"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${openYear2 ? 'rotate-180' : ''}`}
                      strokeWidth={2.5}
                    />
                  </button>
                  {openYear2 && (
                    <div className="absolute right-0 top-full mt-3 bg-white rounded-md shadow-xl border border-gray-100 p-3 z-[200] animate-in fade-in slide-in-from-top-2 w-max min-w-[160px] max-h-60 overflow-y-auto transition-all">
                      {availableYears.map((y) => (
                        <button
                          key={y}
                          onClick={() => {
                            setYear2(isNaN(Number(y)) ? y : parseInt(y));
                            setOpenYear2(false);
                          }}
                          className="w-full px-2 py-3 text-left transition-all hover:bg-gray-50/50 group/item flex items-center rounded whitespace-nowrap"
                        >
                          <span
                            className={`text-xs font-bold tracking-wider border-b-2 pb-0.5 transition-all ${year2 === (isNaN(Number(y)) ? y : parseInt(y)) ? 'text-gray-600 border-gray-400' : 'text-gray-600 border-gray-400'}`}
                          >
                            {formatLulcLabel(y)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 1. Comparative Analysis Section */}
            <div className="pb-10">
              <section className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-white p-6 md:p-8">
                  <MapCompare
                    targetBounds={mapBounds}
                    activeLayer={compareLayer}
                    activeLulcPixel={compareLulcPixel}
                    year1={year1.toString()}
                    year2={year2.toString()}
                    resetTrigger={resetMapTrigger}
                    targetDistrict={selectedDistrict}
                    onDistrictSelect={onDistrictSelect}
                    viewMode={viewMode}
                    onMapClick={() => setShowSentinel(true)}
                    isQuarterly={isQuarterly}
                  />
                </div>
              </section>
            </div>

            {/* 1.2 Multi-Temporal Analysis Section */}
            {/* <div className="mb-6">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <MapIcon className="w-6 h-6 text-black" />
                                Comparative Analysis (Multiple Maps)
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 font-medium italic">
                                Use the "Add Map" button below to compare different demographic markers or years side-by-side.
                            </p>
                        </div> */}
            <MultiMapCompare
              targetBounds={mapBounds}
              selectedDistrict={selectedDistrict}
              activeLayer={
                compareLayer === 'builtup' ? 'builtup' : 'nightlight'
              }
              onDistrictSelect={onDistrictSelect}
            />
          </>
        )}

        {/* 1.1 Analysis Section */}
        {/* <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="bg-white p-6 md:p-8">
                        <Analysis
                            targetBounds={mapBounds}
                            activeLayer={compareLayer}
                            onLayerSelect={(layer, pixel) => {
                                setCompareLayer(layer as any);
                                setCompareLulcPixel(pixel || null);
                            }}
                            activeLulcPixel={compareLulcPixel}
                            year1={year1.toString()}
                            year2={year2.toString()}
                            resetTrigger={resetMapTrigger}
                            targetDistrict={selectedDistrict}
                            onDistrictSelect={onDistrictSelect}
                        />
                    </div>
                </section> */}

        {/* 2. Change Analysis Summary Section */}
        {/* <ChangeAnalysis /> */}

        {showSentinel && (
          // <div className="w-full mb-14">
          //   <MapSentinel
          //     targetDistrict={selectedDistrict}
          //     targetBounds={mapBounds}
          //   />
          // </div>

          <div className="w-full mb-12">
            <WhatHowWhy_v2
              targetDistrict={selectedDistrict}
              targetBounds={mapBounds}
            />
          </div>
        )}

        {/* 3. Regional Performance Matrix Section */}
        <div className="space-y-6 pb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Trophy className="w-6 h-6 text-black" />
                Regional Performance Matrix
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Comprehensive district-level demographic indicators including
                total population, density, and urban/rural distribution for the
                year {matrixYear}.
              </p>
            </div>

            {/* Year selector — matches Hotspot Analysis style */}
            <div className="flex items-center gap-4 shrink-0 transition-all bg-gray-50/50 p-1.5 px-3 rounded-lg border border-gray-100">
              <div className="relative flex items-center gap-1.5 group">
                <div
                  onClick={() => setIsMatrixYearDropdownOpen(!isMatrixYearDropdownOpen)}
                  className="px-4 py-1.5 text-[12px] font-black tracking-wide bg-white text-gray-600 border border-gray-400 rounded-md transition-all min-w-[70px] flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400"
                >
                  <span className="font-mono">{matrixYear}</span>
                </div>
                <button
                  onClick={() => setIsMatrixYearDropdownOpen(!isMatrixYearDropdownOpen)}
                  className="text-[#f64e24] transition-all hover:scale-110"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${isMatrixYearDropdownOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2.5}
                  />
                </button>

                {isMatrixYearDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMatrixYearDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-3 bg-white rounded-md shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 min-w-[120px] max-h-64 overflow-y-auto custom-scrollbar">
                      {MATRIX_YEARS.map((y) => (
                        <button
                          key={y}
                          onClick={() => {
                            setMatrixYear(y);
                            setIsMatrixYearDropdownOpen(false);
                          }}
                          className="w-full px-2 py-2.5 text-left transition-all hover:bg-gray-50/50 flex items-center justify-between rounded group/item"
                        >
                          <span
                            className={`text-xs font-bold tracking-wider border-b-2 pb-0.5 transition-all ${matrixYear === y
                                ? 'text-[#F76000] border-[#F76000]'
                                : 'text-gray-600 border-gray-400'
                              }`}
                          >
                            {y}
                          </span>
                          {matrixYear === y && (
                            <Check className="w-3 h-3 text-[#F76000] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <section className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 overflow-hidden">
            <div
              id="regional-matrix-container"
              className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar rounded-lg border border-gray-100 relative"
            >
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="bg-white text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                    <th className="px-6 py-4 text-center w-20">Rank</th>
                    <th className="px-6 py-4 text-left">District Name</th>
                    <th className="px-6 py-4 text-right">Total Population</th>
                    <th className="px-6 py-4 text-right">Population Density</th>
                    <th className="px-6 py-4 text-right">Urban Population</th>
                    <th className="px-6 py-4 text-right">Rural Population</th>
                    <th className="px-6 py-4 text-right">YoY Growth</th>
                    <th className="px-6 py-4 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visibleDistricts.map((d: any, index: number) => {
                    if (d.isSeparator) {
                      return (
                        <tr key={`separator-${index}`} className="bg-white/50">
                          <td
                            colSpan={8}
                            className="px-6 py-2 text-center text-xs font-medium text-gray-400 tracking-widest uppercase"
                          >
                            ...
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr
                        id={`district-row-${d.name}`}
                        key={d.rank}
                        className={`transition-all group cursor-pointer ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'bg-[#F58220] shadow-md' : 'hover:bg-white'}`}
                        onClick={() => onDistrictSelect?.(d.name)}
                      >
                        <td
                          className={`px-6 py-4 text-center font-bold transition-colors first:rounded-l-xl last:rounded-r-xl ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`}
                        >
                          #{d.rank}
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'text-white' : 'text-gray-900'}`}
                        >
                          {d.name}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-medium ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'text-white' : 'text-gray-600'}`}
                        >
                          {d.population}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-medium ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'text-white' : 'text-gray-600'}`}
                        >
                          {d.density}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-medium text-[#1A5BAB] ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'text-blue-100 font-bold' : ''}`}
                        >
                          {d.urban}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-medium text-[#358221] ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'text-green-100 font-bold' : ''}`}
                        >
                          {d.rural}
                        </td>
                        <td
                          className={`px-6 py-4 text-right first:rounded-l-xl last:rounded-r-xl`}
                        >
                          <span
                            className={`px-2 py-1 rounded ${selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'bg-white/20 text-white font-bold' : 'text-green-600 bg-green-50/50 font-bold'}`}
                          >
                            {d.growth}
                          </span>
                        </td>
                        <td className="px-6 py-4 first:rounded-l-xl last:rounded-r-xl">
                          <div className="h-10 w-24 mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={d.trendData}>
                                {/* <Tooltip
                                                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '4px 8px', fontSize: '10px' }}
                                                                                        cursor={{ stroke: selectedDistrict?.trim().toLowerCase() === d.name.trim().toLowerCase() ? '#fff' : '#F58220', strokeWidth: 1 }}
                                                                                    /> */}
                                <defs>
                                  <linearGradient
                                    id={`gradient-${d.rank}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor={
                                        selectedDistrict
                                          ?.trim()
                                          .toLowerCase() ===
                                          d.name.trim().toLowerCase()
                                          ? '#fff'
                                          : '#F58220'
                                      }
                                      stopOpacity={0.5}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor={
                                        selectedDistrict
                                          ?.trim()
                                          .toLowerCase() ===
                                          d.name.trim().toLowerCase()
                                          ? '#fff'
                                          : '#F58220'
                                      }
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                </defs>
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke={
                                    selectedDistrict?.trim().toLowerCase() ===
                                      d.name.trim().toLowerCase()
                                      ? '#fff'
                                      : '#F58220'
                                  }
                                  strokeWidth={1.5}
                                  fill={`url(#gradient-${d.rank})`}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* <div className="mt-4 text-center border-t border-gray-50 pt-4">
                            <button
                                onClick={() => setIsDatasetModalOpen(true)}
                                className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                                View Full Dataset
                            </button>
                        </div> */}
          </section>
        </div>

        {/* 4. Critical Insights Section */}
        <div className="space-y-6 pb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-black" />
                Development Activities
                {/* <InfoTooltip text="Overview of ongoing development activities." position="top" /> */}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Core developments in {selectedDistrict}
              </p>
            </div>
          </div>

          <section className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 relative">
            {showDevLeftScroll && (
              <button
                onClick={() => scrollDev('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border border-gray-200 text-gray-700 hover:text-[#ffffff] hover:bg-[#F96000] transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {showDevRightScroll && (
              <button
                onClick={() => scrollDev('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border border-gray-200 text-gray-700 hover:text-[#ffffff] hover:bg-[#F96000] transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <div
              ref={devScrollContainerRef}
              onScroll={checkDevScroll}
              className="flex  overflow-x-auto gap-6 pb-2 snap-x snap-mandatory no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
              {devContent.activities.map((card) => (
                <div
                  key={card.title}
                  className="bg-white p-4 rounded-lg border border-gray-200 min-w-[85vw] md:min-w-[calc(33.333%-16px)] max-w-[85vw] md:max-w-[calc(33.333%-16px)] shrink-0 snap-start"
                >
                  <h4 className="text-xs font-bold text-[#F58220] uppercase mb-2">
                    {card.title}
                  </h4>
                  <p className="text-sm text-[#F58220] leading-relaxed">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-black" />
                Insights
                {/* <InfoTooltip text="Key insights derived from the data." position="top" /> */}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {devContent.insightsIntro}
              </p>
            </div>
          </div>

          <section className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 relative">
            {showInsightsLeftScroll && (
              <button
                onClick={() => scrollInsights('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border border-gray-200 text-gray-700 hover:text-[#ffffff] hover:bg-[#F96000] transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {showInsightsRightScroll && (
              <button
                onClick={() => scrollInsights('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 border border-gray-200 text-gray-700 hover:text-[#ffffff] hover:bg-[#F96000] transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <div
              ref={insightsScrollContainerRef}
              onScroll={checkInsightsScroll}
              className="flex  overflow-x-auto gap-6 pb-2 snap-x snap-mandatory no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
              {devContent.insights.map((card) => (
                <div
                  key={card.title}
                  className="bg-white p-4 rounded-lg border border-gray-200 min-w-[85vw] md:min-w-[calc(33.333%-16px)] max-w-[85vw] md:max-w-[calc(33.333%-16px)] shrink-0 snap-start"
                >
                  <h4 className="text-xs font-bold text-[#F58220] uppercase mb-2">
                    {card.title}
                  </h4>
                  <p className="text-sm text-[#F58220] leading-relaxed">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Full Dataset Modal */}
      {isDatasetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-[#F58220]" />
                Regional Performance Matrix - Full Dataset
              </h3>
              <button
                onClick={() => setIsDatasetModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Full Table Body */}
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                      <th className="px-6 py-4 text-center w-20">Rank</th>
                      <th className="px-6 py-4 text-left">District Name</th>
                      <th className="px-6 py-4 text-right">Total Population</th>
                      <th className="px-6 py-4 text-right">
                        Population Density
                      </th>
                      <th className="px-6 py-4 text-right">Urban Population</th>
                      <th className="px-6 py-4 text-right">Rural Population</th>
                      <th className="px-6 py-4 text-right">YoY Growth</th>
                      <th className="px-6 py-4 text-center">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {DISTRICT_PERFORMANCE.map((d: any) => (
                      <tr
                        key={d.rank}
                        className={`transition-all hover:bg-white`}
                      >
                        <td className="px-6 py-4 text-center font-bold text-gray-400">
                          #{d.rank}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {d.name}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-600">
                          {d.population}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-600">
                          {d.density}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-[#1A5BAB]">
                          {d.urban}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-[#358221]">
                          {d.rural}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2 py-1 rounded text-green-600 bg-green-50/50 font-bold">
                            {d.growth}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-10 w-24 mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={d.trendData}>
                                <defs>
                                  <linearGradient
                                    id={`gradient-modal-${d.rank}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#F58220"
                                      stopOpacity={0.5}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#F58220"
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                </defs>
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#F58220"
                                  strokeWidth={1.5}
                                  fill={`url(#gradient-modal-${d.rank})`}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
