/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import {
  ChevronDown,
  ChevronsDown,
  Map as MapIcon,
  // Maximize,
  // MoreHorizontal
  ArrowUpRight,
  ArrowDownRight,
  UsersRound,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import type { ViewType, LayerType } from '../../../types';
// import { GrowthChart, AgeChart } from '../Chart/Chart';
import { MapComponent, LAYER_SCALES } from '../Map/MapComponent';
// import * as pmtiles from 'pmtiles';

import {
  DISTRICT_NAME_VARIANTS,
  DISTRICT_DEMOGRAPHICS,
  ALLOWED_DISTRICTS,
  GENDER,
  CENSUS_PROJECTION_DATA,
  CENSUS_URBAN_RURAL_DATA,
  CENSUS_STATS_DATA,
  getRecord,
} from '../../data/comparativeData';
import {
  MODEL_DATA,
  MODEL_STATS_DATA,
  MODEL_URBAN_RURAL_DATA,
} from '../../data/modelStats';
import { DEMOGRAPHIC_STATS } from '../../data/comparativeData';
import ageSexRatioData from '../../data/age_sex_ratio.json';
import { AGE_COHORT_DATA } from '../../data/ageCohortData';

interface MapSectionProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onDistrictChange?: (name: string) => void;
  onDataChange?: (data: any) => void;
  onDataLoad?: (data: any[]) => void;
  targetDistrict?: string;
}

const InfoTooltip = ({
  text,
  position = 'top',
}: {
  text: string;
  position?: 'top' | 'bottom';
  source?: string;
}) => (
  // const InfoTooltip = ({ text, position = 'top', source = 'UNFPA AI/ML Model v1' }: { text: string; position?: 'top' | 'bottom'; source?: string }) => (
  <span className="group/info inline-block ml-2 align-middle z-100">
    <Info className="w-3.5 h-3.5 text-gray-400 group-hover/info:text-[#F96000] transition-colors cursor-help" />
    <span
      className={`absolute left-0 right-0 px-1 hidden group-hover/info:block animate-in fade-in zoom-in-95 duration-200 pointer-events-none z-[110] 
            ${position === 'bottom' ? 'top-full mt-2 slide-in-from-top-1' : 'bottom-full mb-3 slide-in-from-bottom-1'}`}
    >
      <span className="bg-white/98 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-gray-100 mx-auto w-full block">
        <span className="text-[9px] text-gray-700 leading-relaxed font-semibold mb-2 block">
          {text}
        </span>
        {/* <span className="flex flex-col items-start gap-1 pt-2 border-t border-gray-100">
                    <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">
                        Source:
                        <span className="text-[7px] text-[#0868ac] font-black leading-none ml-1 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50">
                            {source}
                        </span>
                    </span>
                </span> */}
        {/* Tooltip Arrow */}
        {position === 'top' ? (
          <span className="absolute top-[calc(100%-6px)] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 shadow-sm block"></span>
        ) : (
          <span className="absolute bottom-[calc(100%-6px)] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45 shadow-sm block"></span>
        )}
      </span>
    </span>
  </span>
);

export const MapSection: React.FC<MapSectionProps> = ({
  currentView: _cv,
  onViewChange: _ovc,
  onDistrictChange,
  onDataChange,
  onDataLoad,
  targetDistrict,
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerType>('pop');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedGender, setSelectedGender] = useState('All');
  const [ageCohortSub, setAgeCohortSub] = useState<'0_14' | '15_59' | '60_plus'>('0_14');
  const [selectedRegion] = useState('All');
  const [districtData, setDistrictData] = useState<any>(null);
  const [allDistrictsData, setAllDistrictsData] = useState<any[]>([]);
  const [selectedDistrictName, setSelectedDistrictName] =
    useState<string>('All Districts');
  const [isCensusSource, setIsCensusSource] = useState(false);

  const tooltipSource = isCensusSource
    ? 'Census Stat. Projection'
    : 'UNFPA AI/ML Model v1';

  // Create a robust lookup map from allDistrictsData for consistency
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

  // Memoize Age Distribution Data for Animation stability
  const ageDistributionData = React.useMemo(() => {
    // ALWAYS use model data for the Age Distribution Chart
    const year = selectedYear;
    const isAllDistricts =
      selectedDistrictName === 'All Districts' ||
      selectedDistrictName === 'Odisha';

    const getSumNew = (key: string) => {
      if (isAllDistricts) {
        let total = 0;
        for (const district in ageSexRatioData) {
          total += (ageSexRatioData as any)[district][key] || 0;
        }
        return total;
      } else {
        const districtName = DISTRICT_NAME_VARIANTS[selectedDistrictName] || selectedDistrictName;
        const districtDataJson = (ageSexRatioData as any)[districtName] || (ageSexRatioData as any)[selectedDistrictName];
        return districtDataJson ? (districtDataJson[key] || 0) : 0;
      }
    };

    const ageGroupsList = [
      { label: '0-9', m: `male_${year}_0_9`, f: `female_${year}_0_9` },
      { label: '10-19', m: `male_${year}_10_19`, f: `female_${year}_10_19` },
      { label: '20-29', m: `male_${year}_20_29`, f: `female_${year}_20_29` },
      { label: '30-39', m: `male_${year}_30_39`, f: `female_${year}_30_39` },
      { label: '40-49', m: `male_${year}_40_49`, f: `female_${year}_40_49` },
      { label: '50-59', m: `male_${year}_50_59`, f: `female_${year}_50_59` },
      { label: '60-69', m: `male_${year}_60_69`, f: `female_${year}_60_69` },
      { label: '70-79', m: `male_${year}_70_79`, f: `female_${year}_70_79` },
      { label: '80-89', m: `male_${year}_80_89`, f: `female_${year}_80_89` },
      { label: '90+', m: `male_${year}_90_plus`, f: `female_${year}_90_plus` },
    ].reverse();

    return ageGroupsList.map((group) => {
      const maleSum = getSumNew(group.m);
      const femaleSum = getSumNew(group.f);

      return {
        age: group.label,
        male: -maleSum,
        female: femaleSum,
        maleAbs: maleSum,
      };
    });
  }, [selectedYear, selectedDistrictName]);

  const formatAgeTick = (tick: number) => {
    const val = Math.abs(tick);
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toString();
  };

  const CustomAgeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const m =
        payload.find((p: any) => p.dataKey === 'male')?.payload.maleAbs || 0;
      const f = payload.find((p: any) => p.dataKey === 'female')?.value || 0;
      const formatter = new Intl.NumberFormat('en-US');
      return (
        <div className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm text-xs text-left">
          <p className="font-bold text-gray-700 mb-1">{label} Years</p>
          <p className="text-[#0868ac] font-mono">
            <span className="font-bold text-gray-600">Male:</span>{' '}
            {formatter.format(m)}
          </p>
          <p className="text-[#F96000] font-mono">
            <span className="font-bold text-gray-600">Female:</span>{' '}
            {formatter.format(f)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Sync state upward when district changes
  useEffect(() => {
    if (districtData) {
      const rawName =
        districtData.district_name ||
        districtData.NAME ||
        districtData.name ||
        'Selected Area';
      const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;

      // Also sync the dropdown if map clicked
      setSelectedDistrictName(name);

      if (onDistrictChange) onDistrictChange(name);
      if (onDataChange) onDataChange(districtData);
    } else {
      // setSelectedDistrictName('All Districts'); // Optional: reset dropdown if map reset?
      if (onDistrictChange) onDistrictChange('Odisha');
      if (onDataChange) onDataChange(null);
    }
  }, [districtData]); // removed onDistrictChange, onDataChange to avoid unnecessary loops

  useEffect(() => {
    if (targetDistrict) {
      const mappedName =
        targetDistrict === 'Odisha' ? 'All Districts' : targetDistrict;
      if (mappedName !== selectedDistrictName) {
        setSelectedDistrictName(mappedName);

        // Also update districtData if we have the full data list
        if (mappedName === 'All Districts') {
          setDistrictData(null);
        } else if (districtsLookup.has(mappedName)) {
          setDistrictData(districtsLookup.get(mappedName));
        }
      }
    }
  }, [targetDistrict, districtsLookup]);

  // const [availableYears, setAvailableYears] = useState<string[]>(['2023']);
  // const [availableDistricts, setAvailableDistricts] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showSubdistrict, setShowSubdistrict] = useState(false);

  const AGE_COHORT_SUBS: { id: '0_14' | '15_59' | '60_plus'; label: string }[] = [
    { id: '0_14', label: '0 - 14' },
    { id: '15_59', label: '15 - 59' },
    { id: '60_plus', label: '60+' },
  ];

  useEffect(() => {
    if (activeLayer === 'density') {
      setShowSubdistrict(true);
    } else if (activeLayer === 'pop' || activeLayer === 'age_cohort') {
      setShowSubdistrict(false);
    }
  }, [activeLayer]);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [customLegendSteps, setCustomLegendSteps] = useState<number[] | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.scrollY > 10 ||
        window.pageYOffset > 10 ||
        document.documentElement.scrollTop > 10
      ) {
        setShowScrollHint(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Applied filters state (updates in real-time)
  const [appliedFilters, setAppliedFilters] = useState({
    layer: 'pop',
    year: '2025',
    gender: 'All',
    region: 'All',
    district: 'All Districts',
  });

  useEffect(() => {
    setAppliedFilters({
      layer: activeLayer,
      year: selectedYear,
      gender: selectedGender,
      region: selectedRegion,
      district: selectedDistrictName,
    });
  }, [
    activeLayer,
    selectedYear,
    selectedGender,
    selectedRegion,
    selectedDistrictName,
  ]);

  const layers = [
    { id: 'pop', label: 'Total Population', minYear: 2011, maxYear: 2036 },
    {
      id: 'density',
      label: 'Population Density',
      minYear: 2011,
      maxYear: 2036,
    },
    {
      id: 'age_cohort',
      label: 'Age Cohort',
      minYear: 2001,
      maxYear: 2036,
    },
  ];

  useEffect(() => {
    const lyr = layers.find((l) => l.id === activeLayer);
    if (activeLayer === 'age_cohort') {
      const ageCohortYears = ['2001', '2011', '2021', '2026', '2031', '2036'];
      if (!ageCohortYears.includes(selectedYear)) {
        const currentYr = parseInt(selectedYear);
        let nearestYear = '2026';
        let minDiff = Infinity;
        ageCohortYears.forEach((yrStr) => {
          const diff = Math.abs(parseInt(yrStr) - currentYr);
          if (diff < minDiff) {
            minDiff = diff;
            nearestYear = yrStr;
          }
        });
        setSelectedYear(nearestYear);
      }
    } else if (lyr) {
      const yr = parseInt(selectedYear);
      if (yr < lyr.minYear) setSelectedYear(lyr.minYear.toString());
      if (yr > lyr.maxYear) setSelectedYear(lyr.maxYear.toString());
    }
  }, [activeLayer, selectedYear]);

  const genders = ['All', 'Male', 'Female'];

  // Helper to format large numbers
  const formatNumber = (num: any) => {
    const val = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(val) || val === null || val === undefined) return '0';
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return Math.floor(val).toString();
  };

  const getPopForYear = (
    districtName: string,
    year: string,
    gender: 'sum' | 'Male' | 'Female' = 'sum',
    forceModel: boolean = false,
  ) => {
    const isAll = districtName === 'All Districts' || districtName === 'Odisha';
    if (isCensusSource && !forceModel) {
      const name = DISTRICT_NAME_VARIANTS[districtName] || districtName;
      const nameForLookup = name === 'All Districts' ? 'Odisha' : name;
      const yearInt = parseInt(year);
      const censusVal = getRecord(CENSUS_PROJECTION_DATA, nameForLookup)?.[yearInt];
      if (censusVal !== undefined) {
        if (gender === 'Male') return censusVal * 0.5;
        if (gender === 'Female') return censusVal * 0.5;
        return censusVal;
      }
    }

    const propKey =
      gender === 'sum'
        ? `pop_${year}_sum`
        : gender === 'Male'
          ? `male_${year}`
          : `female_${year}`;

    // Priority 0: Check MODEL_DATA for 'sum' population when in Model mode
    if ((!isCensusSource || forceModel) && gender === 'sum') {
      const name = DISTRICT_NAME_VARIANTS[districtName] || districtName;
      const nameForLookup = name === 'All Districts' ? 'Odisha' : name;
      const yearInt = parseInt(year);
      const modelVal = getRecord(MODEL_DATA, nameForLookup)?.[yearInt];
      if (modelVal !== undefined && modelVal !== null) return modelVal;
    }

    // Explicitly check static data for Odisha first to support 2011-2036 projections
    if (isAll && DISTRICT_DEMOGRAPHICS['Odisha']) {
      const odishaData = DISTRICT_DEMOGRAPHICS['Odisha'][parseInt(year)];
      if (odishaData) {
        if (gender === 'Male') return odishaData.male;
        if (gender === 'Female') return odishaData.female;
        return odishaData.male + odishaData.female;
      }
    }

    // Sum across all districts if it's the state-level view
    if (isAll && allDistrictsData && allDistrictsData.length > 0) {
      return allDistrictsData.reduce(
        (acc, d) => acc + (parseFloat(d[propKey] || 0) || 0),
        0,
      );
    }

    // Priority 1: Selected District Data (passed directly)
    if (selectedDistrictName === districtName && districtData) {
      const val = districtData[propKey];
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

    // Priority 3: Static GENDER data
    const genderRecord = getRecord(GENDER, districtName);
    if (gender !== 'sum' && genderRecord) {
      const key = gender === 'Male' ? `${year}_male` : `${year}_female`;
      const staticVal = genderRecord[key];
      if (staticVal !== undefined) return staticVal;
    }

    return null;
  };

  // Get current stats from district data
  const getStats = () => {
    const dName =
      selectedDistrictName && selectedDistrictName !== 'All Districts'
        ? selectedDistrictName
        : districtData
          ? districtData.district_name ||
          districtData.NAME ||
          districtData.name ||
          'Selected Area'
          : 'All Districts';
    const name = DISTRICT_NAME_VARIANTS[dName] || dName;
    const yearSuffix = appliedFilters.year;
    const yearInt = parseInt(yearSuffix);

    const nameForLookup = name === 'All Districts' ? 'Odisha' : name;
    const demo = getRecord(DISTRICT_DEMOGRAPHICS, nameForLookup);

    const getPopDataForYear = (year: number) => {
      if (!demo) return null;
      if (demo[year]) return demo[year];
      const avYears = Object.keys(demo)
        .map(Number)
        .sort((a, b) => a - b);
      if (avYears.length === 0) return null;
      const closest = avYears.reduce((prev, curr) =>
        Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev,
      );
      return demo[closest];
    };

    const currentDemo = getPopDataForYear(yearInt);
    const totalP =
      (getPopForYear(name, yearSuffix, 'sum') as number) ||
      (currentDemo ? currentDemo.male + currentDemo.female : 41974218);
    const mP =
      (getPopForYear(name, yearSuffix, 'Male') as number) ||
      (currentDemo ? currentDemo.male : 21196980);
    const fP =
      (getPopForYear(name, yearSuffix, 'Female') as number) ||
      (currentDemo ? currentDemo.female : 20777238);

    if (isCensusSource) {
      // Use Model data for gender metrics rendering on Census tab
      const latestModelPop =
        (getPopForYear(name, yearSuffix, 'sum', true) as number) ||
        (currentDemo ? currentDemo.male + currentDemo.female : 41974218);
      let modelMaleCount = getPopForYear(
        name,
        yearSuffix,
        'Male',
        true,
      ) as number;
      let modelFemaleCount = getPopForYear(
        name,
        yearSuffix,
        'Female',
        true,
      ) as number;

      // Fallback to static demographics if missing model data
      const nameDemoRecord = getRecord(DISTRICT_DEMOGRAPHICS, name);
      if (
        !modelMaleCount &&
        !modelFemaleCount &&
        nameDemoRecord &&
        nameDemoRecord[yearInt]
      ) {
        modelMaleCount = nameDemoRecord[yearInt].male;
        modelFemaleCount = nameDemoRecord[yearInt].female;
      } else {
        modelMaleCount = modelMaleCount || latestModelPop * 0.51;
        modelFemaleCount = modelFemaleCount || latestModelPop * 0.49;
      }

      const modelTotalForGender = modelMaleCount + modelFemaleCount;
      const modelMalePct =
        ((modelMaleCount / modelTotalForGender) * 100).toFixed(1) + '%';
      const modelFemalePct =
        ((modelFemaleCount / modelTotalForGender) * 100).toFixed(1) + '%';

      const area =
        districtData?.['Shape_Area'] ||
        districtData?.['AREA'] ||
        districtData?.['Area'] ||
        districtData?.['area'] ||
        (nameForLookup === 'Odisha' ? 155707 : 5000);
      const censusStat =
        getRecord(CENSUS_STATS_DATA, nameForLookup)?.[appliedFilters.year];
      let censusDensity = censusStat?.density;

      if (censusDensity === undefined && totalP > 0 && area > 0) {
        censusDensity = totalP / area;
      }

      return {
        name: name,
        pop: formatNumber(totalP), // Uses actual Census total population
        area: area,
        density:
          censusDensity !== undefined
            ? censusDensity % 1 === 0
              ? censusDensity.toString()
              : censusDensity.toFixed(2)
            : '350',
        literacy: '72.9%',
        male: modelMalePct, // Model male %
        female: modelFemalePct, // Model female %
        maleCount: formatNumber(modelMaleCount), // Model exact male count
        femaleCount: formatNumber(modelFemaleCount), // Model exact female count
      };
    }

    const DEFAULTS = {
      name: name,
      pop: formatNumber(totalP),
      literacy: '72.9%',
      male: ((mP / totalP) * 100).toFixed(1) + '%',
      female: ((fP / totalP) * 100).toFixed(1) + '%',
      area: 155707,
      maleCount: formatNumber(mP),
      femaleCount: formatNumber(fP),
      density:
        getRecord(MODEL_STATS_DATA, nameForLookup)?.[yearSuffix]?.density.toString() ??
        getRecord(DEMOGRAPHIC_STATS, 'Odisha')?.[yearInt]?.density ??
        '270',
    };

    if (name === 'All Districts' || name === 'Odisha') return DEFAULTS;

    const litKeyBase =
      districtData?.[`Literacy_${yearSuffix}`] !== undefined
        ? `Literacy_${yearSuffix}`
        : `literacy_${yearSuffix}`;

    // Exact logic from StateDetails Regional Performance Matrix
    let latestPop = getPopForYear(name, yearSuffix, 'sum') as number;
    if (!latestPop && districtData?.[`pop_${yearSuffix}_sum`]) {
      latestPop = parseFloat(districtData[`pop_${yearSuffix}_sum`]);
    }
    // Fallback safety
    latestPop = latestPop || totalP;

    const maleCount = getPopForYear(name, yearSuffix, 'Male') as number;
    const femaleCount = getPopForYear(name, yearSuffix, 'Female') as number;

    let malePop = maleCount || latestPop * 0.51;
    let femalePop = femaleCount || latestPop * 0.49;

    // Explicitly set absolute male/female population figures for baseline display if pmtiles is missing
    const statsDemoRecord = getRecord(DISTRICT_DEMOGRAPHICS, name);
    if (
      !maleCount &&
      !femaleCount &&
      statsDemoRecord &&
      statsDemoRecord[yearInt]
    ) {
      malePop = statsDemoRecord[yearInt].male;
      femalePop = statsDemoRecord[yearInt].female;
      // Update the total population implicitly to match the sum of exact demographic points
      if (!getPopForYear(name, yearSuffix, 'sum')) {
        latestPop = malePop + femalePop;
      }
    }

    const exactMalePercent = (malePop / (malePop + femalePop)) * 100 || 51;
    const exactFemalePercent = (femalePop / (malePop + femalePop)) * 100 || 49;

    // Density calculation (Model priority)
    const densityKey = `density_${yearSuffix}`;
    let densityValue: string | number = '—';

    if (!isCensusSource) {
      const modelStat = getRecord(MODEL_STATS_DATA, name)?.[yearSuffix];
      if (modelStat?.density !== undefined) {
        densityValue = modelStat.density;
      }
    }

    if (densityValue === '—') {
      if (districtData?.[densityKey] !== undefined) {
        densityValue = parseFloat(districtData[densityKey]);
      } else if (districtsLookup.has(name)) {
        const dData = districtsLookup.get(name);
        if (dData?.[densityKey] !== undefined) {
          densityValue = parseFloat(dData[densityKey]);
        }
      }
    }

    // Fallback or Odisha default
    const demoStatRecord = getRecord(DEMOGRAPHIC_STATS, name === 'All Districts' ? 'Odisha' : name);
    if (
      densityValue === '—' &&
      demoStatRecord?.[yearInt]
    ) {
      densityValue = demoStatRecord[yearInt].density;
    }

    return {
      name: name,
      pop: latestPop > 0 ? formatNumber(latestPop) : DEFAULTS.pop,
      area:
        districtData?.['Shape_Area'] ||
        districtData?.['AREA'] ||
        districtData?.['Area'] ||
        districtData?.['area'] ||
        0,
      density:
        typeof densityValue === 'number'
          ? densityValue % 1 === 0
            ? densityValue
            : densityValue.toFixed(2)
          : densityValue,
      literacy:
        districtData?.[litKeyBase] !== undefined
          ? districtData[litKeyBase] + '%'
          : DEFAULTS.literacy,
      male: exactMalePercent.toFixed(1) + '%',
      female: exactFemalePercent.toFixed(1) + '%',
      maleCount: formatNumber(malePop),
      femaleCount: formatNumber(femalePop),
    };
  };

  const stats = getStats();

  const formatStatValue = (val: string, unitSize: string = 'text-[20px]') => {
    const match = val.match(/^([\d.]+)([Mk%])?$/);
    if (match) {
      return (
        <>
          <span className="font-mono text-[#0868ac]">{match[1]}</span>
          <span className={`font-semibold ${unitSize} text-gray-400`}>
            {' '}
            {match[2]}
          </span>
        </>
      );
    }
    return val;
  };

  return (
    <div className="flex flex-col bg-[#F8FAFC] mx-auto py-14 2xl:py-[56px] space-y-12">
      {/* BOTTOM SECTION: CONTENT AREA */}
      <div className="flex-1">
        <div className="w-full mx-auto px-4 lg:px-6 2xl:px-[24px] flex flex-col lg:flex-row gap-4 pt-10 pb-10">
          {/* ----------------- CENTER: MAP AREA ----------------- */}
          <div className="w-full h-112.5 lg:flex-1 relative overflow-hidden lg:h-[80vh] 2xl:h-[84vh] bg-white rounded-lg shadow-sm border border-gray-100 group">
            <MapComponent
              activeLayer={appliedFilters.layer}
              selectedYear={appliedFilters.year}
              gender={appliedFilters.gender}
              region={appliedFilters.region}
              targetDistrict={appliedFilters.district}
              showSubdistrict={showSubdistrict}
              ageCohortSub={appliedFilters.layer === 'age_cohort' ? ageCohortSub : undefined}
              onLegendStepsUpdate={setCustomLegendSteps}
              onResetClick={() => {
                setDistrictData(null);
                setSelectedDistrictName('All Districts');
                setAppliedFilters((prev) => ({
                  ...prev,
                  district: 'All Districts',
                }));
              }}
              onDistrictClick={(data) => {
                const rawName =
                  data.district_name ||
                  data.NAME ||
                  data.name ||
                  'Selected Area';
                const name = DISTRICT_NAME_VARIANTS[rawName] || rawName;
                if (!ALLOWED_DISTRICTS.includes(name)) return;
                setDistrictData(data);
                setAppliedFilters((prev) => ({ ...prev, district: name }));
              }}
              onDataLoad={(data) => {
                setAllDistrictsData(data);
                if (onDataLoad) onDataLoad(data);
              }}
            />

            {/* Map Overlay: Grid/Effects */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"></div>

            {/* Floating Control Panel (Top Left) */}
            <div className="absolute top-5 bottom-5 left-5 z-60 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-gray-100 w-[260px] 2xl:w-[320px] max-w-[calc(100%-40px)] transition-all hover:shadow-md flex flex-col overflow-hidden">
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                            input[type=range]::-webkit-slider-thumb {
                                appearance: none;
                                height: 16px;
                                width: 16px;
                                border-radius: 50%;
                                background: #F96000;
                                cursor: pointer;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                margin-top: -6px;
                            }
                            input[type=range]::-moz-range-thumb {
                                height: 18px;
                                width: 18px;
                                border-radius: 50%;
                                background: #F96000;
                                cursor: pointer;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            input[type=range]::-webkit-slider-runnable-track {
                                width: 100%;
                                height: 6px;
                                cursor: pointer;
                                background: #aeaeaeff;
                                border-radius: 3px;
                            }
                        `,
                }}
              />
              {/* Sticky Header */}
              <div className="p-5 pb-4 sticky top-0 bg-white/90 backdrop-blur-md z-70 shrink-0 border-b border-gray-200">
                <h3 className="text-[16px] font-bold text-gray-900 leading-tightt mb-2 uppercase">
                  Filter / Selection
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Configure viewing preferences. Apply geographical filters,
                  temporal ranges, and demographic slices.
                </p>
              </div>

              <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
                <div className="relative w-full">
                  <span className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70 block">
                    District
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const sortedDistricts = [...ALLOWED_DISTRICTS].sort();
                      const selectedIndex =
                        sortedDistricts.indexOf(selectedDistrictName);

                      let theme = {
                        bg: 'bg-white',
                        text: 'text-gray-600',
                        border: 'border-gray-400',
                      };

                      if (
                        selectedDistrictName !== 'All Districts' &&
                        selectedIndex !== -1
                      ) {
                        const flavorIndex = selectedIndex % 6;
                        const flavors = [
                          {
                            bg: 'bg-[#bae4bc]',
                            text: 'text-gray-600',
                            border: 'border-gray-400',
                          },
                          {
                            bg: 'bg-[#bae4bc]',
                            text: 'text-gray-600',
                            border: 'border-gray-400',
                          },
                          {
                            bg: 'bg-[#bae4bc]',
                            text: 'text-gray-600',
                            border: 'border-gray-400',
                          },
                          {
                            bg: 'bg-[#bae4bc]',
                            text: 'text-gray-600',
                            border: 'border-gray-400',
                          },
                          {
                            bg: 'bg-[#bae4bc]',
                            text: 'text-gray-600',
                            border: 'border-gray-400',
                          },
                          {
                            bg: 'bg-[#bae4bc]',
                            text: 'text-gray-600',
                            border: 'border-gray-400',
                          },
                        ];
                        theme = flavors[flavorIndex];
                      }

                      return (
                        <div
                          className={`flex-1 px-3 py-1.5 text-[12px] tracking-wide bg-white text-gray-700 font-semibold border rounded-md ${theme.border} truncate h-full flex items-center transition-colors`}
                        >
                          {selectedDistrictName === 'All Districts'
                            ? 'All'
                            : selectedDistrictName}
                        </div>
                      );
                    })()}
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === 'district' ? null : 'district',
                        )
                      }
                      className="h-full px-1 hover:bg-gray-100 transition-colors flex items-center justify-center border border-transparent hover:border-gray-200"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-[#f64e24] transition-transform ${openDropdown === 'district' ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                  {openDropdown === 'district' && (
                    <div className="absolute left-0 top-full mt-2 max-h-75 overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 p-2 z-[50] animate-in fade-in slide-in-from-top-2">
                      <button
                        // onClick={() => {
                        //   setSelectedDistrictName('All Districts');
                        //   setOpenDropdown(null);
                        // }}
                        onClick={() => {
                          setDistrictData(null); // 🔥 most important
                          setSelectedDistrictName('All Districts');
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-left transition-all hover:bg-gray-50/50"
                      >
                        <span className="text-xs tracking-wider border-b-2 pb-0.5 text-gray-600 font-semibold border-gray-400">
                          All
                        </span>
                      </button>
                      {ALLOWED_DISTRICTS.slice()
                        .sort()
                        .map((name, index) => {
                          const flavors = [
                            {
                              text: 'text-gray-600',
                              border: 'border-gray-400',
                            },
                            {
                              text: 'text-gray-600',
                              border: 'border-gray-400',
                            },
                            {
                              text: 'text-gray-600',
                              border: 'border-gray-400',
                            },
                            {
                              text: 'text-gray-600',
                              border: 'border-gray-400',
                            },
                            {
                              text: 'text-gray-600',
                              border: 'border-gray-400',
                            },
                            {
                              text: 'text-gray-600',
                              border: 'border-gray-400',
                            },
                          ];
                          const theme = flavors[index % flavors.length];

                          return (
                            <button
                              key={name}
                              onClick={() => {
                                setSelectedDistrictName(name);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left transition-all hover:bg-gray-50/50"
                            >
                              <span
                                className={`text-xs tracking-wider border-b-2 pb-0.5 font-semibold ${theme.text} ${theme.border}`}
                              >
                                {name}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-full mx-auto h-px bg-gray-200 shrink-0"></div>

                <div className="relative w-full">
                  <span className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70 block">
                    Layer
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      return (
                        <div
                          className={`flex-1 px-3 py-1.5 text-[12px] tracking-wide bg-white text-gray-700 font-semibold rounded-md border border-gray-400 truncate h-full flex items-center transition-colors min-w-[140px]`}
                        >
                          {layers.find((l) => l.id === activeLayer)?.label}
                        </div>
                      );
                    })()}
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === 'layer' ? null : 'layer',
                        )
                      }
                      className="h-full px-1 hover:bg-gray-100 transition-colors flex items-center justify-center border border-transparent hover:border-gray-200"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-[#f64e24] transition-transform ${openDropdown === 'layer' ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {openDropdown === 'layer' && (
                    <div className="absolute left-0 top-full mt-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 p-2 z-[50] animate-in fade-in slide-in-from-top-2">
                      {layers.map((l, index) => {
                        const flavors = [
                          { text: 'text-gray-600', border: 'border-gray-400' },
                          { text: 'text-gray-600', border: 'border-gray-400' },
                          { text: 'text-gray-600', border: 'border-gray-400' },
                          { text: 'text-gray-600', border: 'border-gray-400' },
                          { text: 'text-gray-600', border: 'border-gray-400' },
                          { text: 'text-gray-600', border: 'border-gray-400' },
                        ];
                        const theme = flavors[index % flavors.length];

                        return (
                          <button
                            key={l.id}
                            onClick={() => {
                              setActiveLayer(l.id as LayerType);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-left transition-all hover:bg-gray-50/50"
                          >
                            <span
                              className={`text-xs tracking-wider border-b-2 pb-0.5 font-semibold ${theme.text} ${theme.border}`}
                            >
                              {l.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Age Cohort Sub-Filter Buttons */}
                {activeLayer === 'age_cohort' && (
                  <div className="w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70 block">
                      Age Group
                    </span>
                    <div className="flex items-center gap-1.5">
                      {AGE_COHORT_SUBS.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setAgeCohortSub(sub.id)}
                          className={`flex-1 px-2 py-1.5 text-[11px] font-bold rounded-md tracking-wide transition-all ${ageCohortSub === sub.id
                            ? 'bg-[#F96000] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`flex items-center justify-between px-1 ${activeLayer === 'age_cohort' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    Show Subdistrict
                  </span>
                  <button
                    onClick={() => setShowSubdistrict(!showSubdistrict)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showSubdistrict ? 'bg-[#F76000]' : 'bg-gray-200'}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showSubdistrict ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {/* Divider */}
                <div className="w-full mx-auto h-px bg-gray-200 shrink-0"></div>

                {(() => {
                  const isAgeCohort = activeLayer === 'age_cohort';
                  const ageCohortYears = ['2001', '2011', '2021', '2026', '2031', '2036'];
                  const minYear = isAgeCohort ? 2001 : (layers.find((l) => l.id === activeLayer)?.minYear || 2011);
                  const maxYear = isAgeCohort ? 2036 : (layers.find((l) => l.id === activeLayer)?.maxYear || 2036);

                  return (
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                          Year
                        </span>
                        <span className="text-sm font-black text-[#0868ac] font-mono">
                          {selectedYear}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={isAgeCohort ? 0 : minYear}
                        max={isAgeCohort ? ageCohortYears.length - 1 : maxYear}
                        step="1"
                        value={isAgeCohort ? ageCohortYears.indexOf(selectedYear) : selectedYear}
                        onChange={(e) => {
                          if (isAgeCohort) {
                            setSelectedYear(ageCohortYears[parseInt(e.target.value)]);
                          } else {
                            setSelectedYear(e.target.value);
                          }
                        }}
                        className="w-full appearance-none bg-transparent"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] font-bold text-gray-400">
                          {minYear}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400">
                          {maxYear}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Divider */}
                {/* <div className="w-full mx-auto h-px bg-gray-200 shrink-0"></div> */}

                <div
                  className={`hidden w-full ${activeLayer === 'deg_urbanisation' ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70 block">
                    Gender
                  </span>
                  <div className="flex items-center gap-2">
                    {genders.map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`px-3 py-1 text-[12px] font-bold rounded-md tracking-wide transition-all ${selectedGender === g
                          ? g === 'Male'
                            ? 'bg-[#F96000] text-[#ffffff]'
                            : g === 'Female'
                              ? 'bg-[#F96000] text-[#ffffff] '
                              : 'bg-[#F96000] text-[#ffffff] ' // Default/All
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-whit'
                          }`}
                      >
                        {g}
                      </button>
                    ))}
                    {/* bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-whit */}
                  </div>
                </div>
              </div>

              {/* Sticky Legend (Bottom) */}
              {(() => {
                const scaleKey = activeLayer === 'age_cohort' ? `age_cohort_${ageCohortSub}` : (activeLayer ?? '');
                const steps = customLegendSteps
                  ? customLegendSteps
                  : (showSubdistrict && LAYER_SCALES[`sub_${activeLayer}`])
                    ? LAYER_SCALES[`sub_${activeLayer}`]
                    : (LAYER_SCALES[scaleKey] ?? LAYER_SCALES[activeLayer ?? ''] ?? [0, 25, 50, 75, 100]);

                const formatNum = (v: number) => {
                  if (Math.abs(v) >= 1000000) {
                    const formatted = (v / 1000000).toFixed(2);
                    return formatted.endsWith('.00')
                      ? formatted.slice(0, -3) + 'M'
                      : formatted.endsWith('0')
                        ? formatted.slice(0, -1) + 'M'
                        : formatted + 'M';
                  }
                  if (Math.abs(v) >= 1000) {
                    const kVal = v / 1000;
                    return kVal % 1 === 0 ? kVal.toFixed(0) + 'K' : kVal.toFixed(1) + 'K';
                  }
                  return Math.round(v).toString();
                };

                const unit =
                  activeLayer === 'growth'
                    ? '%'
                    : activeLayer === 'density'
                      ? ' P / sq.km'
                      : activeLayer === 'deg_urbanisation'
                        ? ' sq.km'
                        : '';

                let labels: string[] = [];
                const isDistrictDensity = activeLayer === 'density' && !showSubdistrict;

                const formatCohortNum = (v: number) => {
                  return v.toLocaleString('en-US');
                };

                if (activeLayer === 'age_cohort') {
                  labels = [
                    `< ${formatCohortNum(steps[1])}`,
                    `${formatCohortNum(steps[1])} – ${formatCohortNum(steps[2])}`,
                    `${formatCohortNum(steps[2])} – ${formatCohortNum(steps[3])}`,
                    `${formatCohortNum(steps[3])} – ${formatCohortNum(steps[4])}`,
                    `≥ ${formatCohortNum(steps[4])}`
                  ];
                } else if (activeLayer === 'pop') {
                  labels = [
                    `${formatNum(steps[0])} to <${formatNum(steps[1])}`,
                    `${formatNum(steps[1])} to <${formatNum(steps[2])}`,
                    `${formatNum(steps[2])} to <${formatNum(steps[3])}`,
                    `${formatNum(steps[3])} to <${formatNum(steps[4])}`
                  ];
                } else if (isDistrictDensity) {
                  labels = [
                    `${formatNum(steps[0])} - ${formatNum(steps[1])} ${unit}`,
                    `${formatNum(steps[1])} - ${formatNum(steps[2])} ${unit}`,
                    `${formatNum(steps[2])} - ${formatNum(steps[3])} ${unit}`,
                    `> ${formatNum(steps[3])} ${unit}`,
                  ];
                } else {
                  labels = [
                    `${formatNum(steps[0])} - ${formatNum(steps[1])} ${unit}`,
                    `${formatNum(steps[1])} - ${formatNum(steps[2])} ${unit}`,
                    `${formatNum(steps[2])} - ${formatNum(steps[3])} ${unit}`,
                    `${formatNum(steps[3])} - ${formatNum(steps[4])} ${unit}`,
                    `> ${formatNum(steps[4])} ${unit}`,
                  ];
                }

                return (
                  <div className="p-3 2xl:p-4 sticky bottom-0 bg-white/90 backdrop-blur-md z-[70] shrink-0 border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(255,255,255,0.9)]">
                    <h4 className="text-[10px] 2xl:text-[12px] font-bold text-gray-500 uppercase mb-1.5 2xl:mb-2 tracking-wide">
                      {activeLayer === 'age_cohort'
                        ? `Age Cohort · ${AGE_COHORT_SUBS.find(s => s.id === ageCohortSub)?.label ?? ''}`
                        : (layers.find((l) => l.id === activeLayer)?.label || 'Legend')}
                    </h4>
                    <div className="flex flex-col gap-1 2xl:gap-1.5 font-semibold">
                      {activeLayer === 'deg_urbanisation' ? (
                        <div className="flex items-center gap-2.5 2xl:gap-3">
                          <div className="w-6 h-3 2xl:w-8 2xl:h-4 rounded-full bg-[#D3D3D3]"></div>
                          <span className="text-[10px] 2xl:text-[12px] text-gray-800 font-medium tracking-wide">
                            Urbanisation Distribution
                          </span>
                        </div>
                      ) : (
                        (activeLayer === 'pop' || isDistrictDensity ? [
                          { color: '#f0f9e8', label: labels[0] },
                          { color: '#bae4bc', label: labels[1] },
                          { color: '#7bccc4', label: labels[2] },
                          { color: '#0868ac', label: labels[3] },
                        ] : [
                          { color: '#F0F9E8', label: labels[0] },
                          { color: '#BAE4BC', label: labels[1] },
                          { color: '#7BCCC4', label: labels[2] },
                          { color: '#43A2CA', label: labels[3] },
                          { color: '#0868AC', label: labels[4] },
                        ]).map((item, id) => (
                          <div key={id} className="flex items-center gap-2.5 2xl:gap-3">
                            <div
                              className="w-6 h-3 2xl:w-8 2xl:h-4 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-[10px] 2xl:text-[12px] text-gray-800 font-medium tracking-wide">
                              {item.label}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ----------------- RIGHT SIDEBAR: DETAILS ----------------- */}
          <div className="w-full lg:w-80 2xl:w-[420px] h-auto lg:h-[80vh] 2xl:h-[84vh] bg-white border border-gray-100 rounded-lg flex flex-col z-20 shadow-sm transition-all hover:shadow-md relative">
            <div className="p-6 border-b border-gray-100 flex flex-col items-start bg-gray-50/30">
              <div className="flex justify-between w-full">
                {/* Left Side */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {stats.name === 'All Districts' ? 'Odisha' : stats.name}
                    </h3>
                  </div>

                  {stats.name === 'All Districts' && (
                    <p className="mt-1 font-bold">
                      <span>
                        <span className="text-xs font-semibold uppercase text-gray-600">
                          Area :
                        </span>{' '}
                        <span className="text-xs font-mono text-[#0868ac] tracking-wider">
                          {stats.area ? stats.area.toLocaleString() : 'N/A'}
                        </span>
                      </span>{' '}
                      <span className="text-xs text-gray-600">km²</span>
                    </p>
                  )}

                  {stats.name !== 'All Districts' && (
                    <span>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                        <MapIcon className="w-3 h-3" />
                        District
                      </p>
                      <p>
                        <span className="text-xs  font-bold tracking-wider">
                          <span>
                            <span className="text-xs font-semibold uppercase text-gray-600">
                              Area :
                            </span>{' '}
                            <span className="text-xs font-mono text-[#0868ac] tracking-wider">
                              {stats.area ? stats.area.toLocaleString() : 'N/A'}
                            </span>
                          </span>{' '}
                          <span className="text-xs text-gray-600">km²</span>
                        </span>
                      </p>
                    </span>
                  )}
                </div>

                {/* Right Side */}
                <div className="ml-4 mt-2 shrink-0">
                  <span className="px-2 py-1 text-[12px] font-mono text-[#F96000] bg-[#FDCFB3] font-semibold rounded-md">
                    {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-gray-600 font-bold uppercase tracking-wider">
                  Key Stats
                </span>
                <div className="flex bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/50 shadow-inner">
                  <button
                    onClick={() => setIsCensusSource(false)}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-tight rounded-md transition-all duration-200 ${!isCensusSource ? 'bg-white text-[#F96000] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Model
                  </button>
                  <button
                    onClick={() => setIsCensusSource(true)}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-tight rounded-md transition-all duration-200 ${isCensusSource ? 'bg-white text-[#F96000] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Census
                  </button>
                </div>
              </div>

              {/* Data Source Descriptor */}
              <div className="text-[10px] text-gray-500 font-medium text-right w-full mt-[-22px]">
                {isCensusSource
                  ? 'Based on official census data and projections.'
                  : 'Generated using AI/ML models and satellite data.'}
              </div>

              {/* Key Stats Grid */}
              <div className="grid mt-4">
                {(() => {
                  // Calculate Sparkline Data

                  // Calculate Growth (YoY)
                  const selectedYear = parseInt(appliedFilters.year);
                  const prevYear = selectedYear - 1;
                  const districtNameForStats =
                    stats.name === 'All Districts' ? 'Odisha' : stats.name;

                  const popCurr = getPopForYear(
                    districtNameForStats,
                    selectedYear.toString(),
                  );
                  const popPrev = getPopForYear(
                    districtNameForStats,
                    prevYear.toString(),
                  );

                  let growth = 0;
                  if (isCensusSource) {
                    const censusStat =
                      CENSUS_STATS_DATA[districtNameForStats]?.[
                      selectedYear.toString()
                      ];
                    growth =
                      censusStat?.growth !== null &&
                        censusStat?.growth !== undefined
                        ? censusStat.growth
                        : 1.25;
                  } else if (popCurr && popPrev && popPrev !== 0) {
                    growth = ((popCurr - popPrev) / popPrev) * 100;
                  } else {
                    // Fallback to DEMOGRAPHIC_STATS if specific year data is missing
                    const statRecord =
                      getRecord(DEMOGRAPHIC_STATS, districtNameForStats)?.[selectedYear];
                    growth = statRecord?.pop_total_growth || 0;
                  }

                  const isPositive = growth >= 0;

                  return (
                    <div className="flex w-full bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all group/stat items-center justify-between gap-2 relative">
                      <div className="w-1/4 flex items-center justify-center">
                        <UsersRound className="w-7.5 h-7.5 text-[#F96000]" />
                      </div>

                      <div className="w-3/4">
                        <div className="flex flex-wrap items-baseline gap-2 gap-y-1 mb-1">
                          <p className="text-2xl font-black text-gray-900 tracking-tight">
                            {formatStatValue(stats.pop)}
                          </p>
                          <div
                            className={`flex items-center text-[10px] font-bold ${isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-1.5 py-0.5 rounded-md`}
                          >
                            {isPositive ? (
                              <ArrowUpRight
                                className="w-3 h-3 mr-1"
                                strokeWidth={3}
                              />
                            ) : (
                              <ArrowDownRight
                                className="w-3 h-3 mr-1"
                                strokeWidth={3}
                              />
                            )}
                            {Math.abs(growth).toFixed(2)}%
                          </div>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                          Total Population
                          <InfoTooltip
                            text="Projected total population count."
                            position="bottom"
                            source={tooltipSource}
                          />
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Population Density Card */}
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-gray-800">
                      <div className="flex flex-col gap-0.5 mb-1 pt-2">
                        <span className="text-xl font-black text-[#0868ac] tracking-tight leading-none group-hover/stat:scale-105 transition-transform origin-left font-mono">
                          {stats.density}
                        </span>
                        <div className="text-[10px] font-bold text-gray-500 leading-tight flex flex-col">
                          <span>P / sq.km</span>
                        </div>
                      </div>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      Pop. Density
                      <InfoTooltip
                        text="Population divided by the official Census 2011 land area (persons/km²)."
                        source={tooltipSource}
                      />
                    </span>
                  </div>
                </div>

                {/* Growth Card */}
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-gray-800">
                      <div className="items-baseline gap-x-2 gap-y-1 mb-1">
                        <span className="text-xl font-black text-[#0868ac] tracking-tight leading-none group-hover/stat:scale-105 transition-transform origin-left font-mono">
                          {(() => {
                            const currentYear = parseInt(appliedFilters.year);
                            const prevYear = currentYear - 1;
                            const dName =
                              stats.name === 'All Districts'
                                ? 'Odisha'
                                : stats.name;

                            let growthValue: string | null = null;

                            if (isCensusSource) {
                              const censusStat =
                                CENSUS_STATS_DATA[dName]?.[
                                currentYear.toString()
                                ];
                              if (censusStat?.growth === null)
                                growthValue = '—';
                              else if (censusStat?.growth !== undefined) {
                                growthValue = censusStat.growth.toFixed(2);
                              }
                            }

                            // Priority 1: Check MODEL_STATS_DATA for model growth
                            if (!isCensusSource && growthValue === null) {
                              const modelStat =
                                MODEL_STATS_DATA[dName]?.[
                                currentYear.toString()
                                ];
                              if (modelStat?.growth === null) growthValue = '—';
                              else if (modelStat?.growth !== undefined) {
                                growthValue = modelStat.growth.toFixed(2);
                              }
                            }

                            if (growthValue === null) {
                              const popCurr = getPopForYear(
                                dName,
                                currentYear.toString(),
                              );
                              const popPrev = getPopForYear(
                                dName,
                                prevYear.toString(),
                              );

                              if (popCurr && popPrev && popPrev !== 0) {
                                growthValue = (
                                  ((popCurr - popPrev) / popPrev) *
                                  100
                                ).toFixed(2);
                              }
                            }

                            // Fallback: Check if growth is explicitly provided in data
                            if (growthValue === null) {
                              const pmtilesGrowthKey = `growth_${currentYear}`;
                              let val =
                                districtData?.[pmtilesGrowthKey] ||
                                districtsLookup.get(dName)?.[pmtilesGrowthKey];

                              if (val === undefined || val === null) {
                                val =
                                  getRecord(DEMOGRAPHIC_STATS, dName)?.[currentYear]
                                    ?.growth;
                              }
                              growthValue =
                                typeof val === 'number'
                                  ? val.toFixed(2)
                                  : val || '—';
                            }

                            return (
                              <>
                                {growthValue}
                                {growthValue !== '—' && (
                                  <span className="text-[10px] font-bold text-gray-500 ml-1">
                                    %
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </span>
                      </div>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      Growth{' '}
                      <span className="text-[9px] text-gray-400 lowercase ml-1 font-medium italic">
                        {' '}
                        (vs. {parseInt(appliedFilters.year) - 1})
                      </span>
                      <InfoTooltip
                        text="Annual percentage change (null for 2011 base year)."
                        source={tooltipSource}
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* Urban / Rural Distribution Chart */}
              {(() => {
                const isAllDistricts =
                  selectedDistrictName === 'All Districts' ||
                  selectedDistrictName === 'Odisha';
                const currentName = isAllDistricts ? 'Odisha' : stats.name;
                const demographicData = getRecord(DEMOGRAPHIC_STATS, currentName)?.[
                  parseInt(appliedFilters.year)
                ];
                const modelUrbanData = getRecord(MODEL_URBAN_RURAL_DATA, currentName)?.[appliedFilters.year];
                if (
                  !isCensusSource &&
                  (!demographicData || !demographicData.urban) &&
                  (!modelUrbanData || !modelUrbanData.urban)
                )
                  return null;

                const urbanData = isCensusSource
                  ? getRecord(CENSUS_URBAN_RURAL_DATA, currentName)?.[appliedFilters.year]
                  : null;
                const urban = isCensusSource
                  ? urbanData?.urban ||
                  0.6 *
                  (getPopForYear(
                    currentName,
                    appliedFilters.year,
                  ) as number)
                  : (modelUrbanData?.urban ?? demographicData.urban);
                const rural = isCensusSource
                  ? urbanData?.rural ||
                  0.4 *
                  (getPopForYear(
                    currentName,
                    appliedFilters.year,
                  ) as number)
                  : (modelUrbanData?.rural ?? demographicData.rural);
                const total = urban + rural;
                const urbanPercent = Math.round((urban / total) * 100);
                const ruralPercent = 100 - urbanPercent;

                const formatLakhs = (val: number) => {
                  return (val / 100000).toFixed(2);
                };

                return (
                  <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-700 mb-2">
                      <span className="font-bold uppercase tracking-wider text-gray-500">
                        Urban /
                      </span>{' '}
                      <span className="font-bold  tracking-wider uppercase text-gray-500">
                        Rural
                      </span>
                      <InfoTooltip
                        text="Population living in urban and rural areas. Classification follows the United Nations-endorsed Degree of Urbanisation (DEGURBA) methodology, which defines urban areas based on population density and settlement size. Areas outside these settlements are classified as rural."
                        source={tooltipSource}
                      />
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold">
                        <span className="text-[#0868ac] text-xl font-mono">
                          {formatLakhs(urban)}
                        </span>{' '}
                        <span className="text-[10px] text-gray-500"> L </span>{' '}
                        <span className="text-gray-400"> / </span>{' '}
                        <span className="text-xl text-[#0868ac] font-mono">
                          {formatLakhs(rural)}
                        </span>{' '}
                        <span className="text-[10px] text-gray-500"> L</span>
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full flex overflow-hidden">
                      <div
                        className="bg-gray-400 h-full transition-all duration-500"
                        style={{ width: `${urbanPercent}%` }}
                      ></div>
                      <div
                        className="bg-[#0868ac] h-full transition-all duration-500"
                        style={{ width: `${ruralPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}

              {/* Gender Distribution Chart */}
              {isCensusSource && (
                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-gray-700 mb-4">
                    <span className="font-bold uppercase tracking-wider text-gray-500">
                      Gender Distribution
                    </span>
                    <InfoTooltip
                      text="Breakdown of the population by male and female counts."
                      source={tooltipSource}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Stats */}
                    <div className="space-y-4">
                      <div>
                        <p className="!text-[14px] font-bold text-gray-500 mb-0.5">
                          {formatStatValue(stats.maleCount, 'text-[14px]')}
                        </p>
                        <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
                          {formatStatValue(stats.male, 'text-[10px]')}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">
                          Male
                        </p>
                      </div>
                      <div>
                        <p className="!text-[14px] font-bold text-gray-500 mb-0.5">
                          {formatStatValue(stats.femaleCount, 'text-[14px]')}
                        </p>
                        <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
                          {formatStatValue(stats.female, 'text-[10px]')}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider">
                          Female
                        </p>
                      </div>
                    </div>

                    {/* Right: Pie Chart */}
                    <div className="w-32 h-32 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            formatter={(value, name) => [`${value}%`, name]}
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              fontSize: '12px',
                            }}
                          />

                          <Pie
                            data={[
                              {
                                name: 'Male',
                                value: parseFloat(stats.male) || 50,
                              },
                              {
                                name: 'Female',
                                value: parseFloat(stats.female) || 50,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="#ffffff" // border color
                            strokeWidth={2}
                            isAnimationActive={true}
                            animationDuration={500} // border thickness
                          >
                            <Cell fill="#99A1AF" />
                            <Cell fill="#0868ac" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-xs font-bold text-gray-400"></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Age Cohort Card */}
              {isCensusSource && (() => {
                const rawDistrict = stats.name === 'All Districts' || !stats.name ? 'Odisha' : stats.name;
                const normD = rawDistrict.trim().toLowerCase();
                const activeDistrict = normD === 'angul' || normD === 'anugul' ? 'Anugul' :
                  normD === 'nabarangpur' || normD === 'nabarangapur' ? 'Nabarangpur' :
                    rawDistrict;
                const activeCohortLabel = ageCohortSub === '0_14' ? '0–14' : ageCohortSub === '15_59' ? '15–59' : '60+';
                const cohortKey = ageCohortSub === '0_14' ? 'age_0_14' : ageCohortSub === '15_59' ? 'age_15_59' : 'age_60_plus';

                const isCohortAvailable = ['2001', '2011', '2021', '2026', '2031', '2036'].includes(selectedYear);

                if (!isCohortAvailable) {
                  return (
                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-medium text-gray-700 mb-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold uppercase tracking-wider text-gray-500">
                            Age Cohort - {activeDistrict}
                          </span>
                          <InfoTooltip
                            text={`Population Projections using Bayesian Method.`}
                            source={tooltipSource}
                          />
                        </div>
                      </div>

                      <div className="w-full h-56 flex flex-col items-center justify-center text-center p-4">
                        <Info className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          Age Cohort Data Unavailable
                        </p>
                        <p className="text-[10px] text-gray-400 leading-normal max-w-[200px]">
                          Age cohort data is only available for the years 2001, 2011, 2021, 2026, 2031, and 2036.
                        </p>
                      </div>
                    </div>
                  );
                }

                // 1. Highest & lowest district for selected age group + year
                const districtValues = Object.entries(AGE_COHORT_DATA)
                  .filter(([name]) => name !== 'Odisha')
                  .map(([name, years]) => {
                    const yrData = years[selectedYear];
                    const val = yrData ? (yrData.male[cohortKey] || 0) + (yrData.female[cohortKey] || 0) : 0;
                    return { name, val };
                  });

                districtValues.sort((a, b) => a.val - b.val);
                const lowestDistrict = districtValues[0] || { name: 'N/A', val: 0 };
                const highestDistrict = districtValues[districtValues.length - 1] || { name: 'N/A', val: 0 };

                // 2. District rank
                const rankedDistricts = [...districtValues].sort((a, b) => b.val - a.val);
                const activeDistrictIndex = rankedDistricts.findIndex(d => d.name.toLowerCase() === activeDistrict.toLowerCase());
                const activeDistrictRank = activeDistrictIndex !== -1 ? activeDistrictIndex + 1 : 1;

                const getOrdinal = (n: number) => {
                  const s = ["th", "st", "nd", "rd"];
                  const v = n % 100;
                  return n + (s[(v - 20) % 10] || s[v] || s[0]);
                };

                // 3. Age composition split (all three) for current district and year
                const activeCohortData = AGE_COHORT_DATA[activeDistrict] || AGE_COHORT_DATA['Odisha'];
                const activeYearData = activeCohortData?.[selectedYear];
                const count0_14 = activeYearData ? (activeYearData.male.age_0_14 || 0) + (activeYearData.female.age_0_14 || 0) : 0;
                const count15_59 = activeYearData ? (activeYearData.male.age_15_59 || 0) + (activeYearData.female.age_15_59 || 0) : 0;
                const count60_plus = activeYearData ? (activeYearData.male.age_60_plus || 0) + (activeYearData.female.age_60_plus || 0) : 0;
                const totalCohortPop = count0_14 + count15_59 + count60_plus;

                const pct0_14 = totalCohortPop > 0 ? (count0_14 / totalCohortPop) * 100 : 0;
                const pct15_59 = totalCohortPop > 0 ? (count15_59 / totalCohortPop) * 100 : 0;
                const pct60_plus = totalCohortPop > 0 ? (count60_plus / totalCohortPop) * 100 : 0;

                // 4. Trend sparkline across all cohort years
                const cohortYears = ['2001', '2011', '2021', '2026', '2031', '2036'];
                const sparklinePoints = cohortYears.map(yr => {
                  const yrD = activeCohortData?.[yr];
                  const val = yrD ? (yrD.male[cohortKey] || 0) + (yrD.female[cohortKey] || 0) : 0;
                  return { year: yr, val };
                });



                // 5. Sex breakdown & ratio
                const cohortMaleCount = activeYearData ? (activeYearData.male[cohortKey] || 0) : 0;
                const cohortFemaleCount = activeYearData ? (activeYearData.female[cohortKey] || 0) : 0;
                const cohortTotal = cohortMaleCount + cohortFemaleCount;
                const cohortMalePct = cohortTotal > 0 ? (cohortMaleCount / cohortTotal) * 100 : 0;
                const cohortFemalePctVal = cohortTotal > 0 ? (cohortFemaleCount / cohortTotal) * 100 : 0;
                const cohortSexRatio = cohortMaleCount > 0 ? (cohortFemaleCount / cohortMaleCount) * 1000 : 0;

                // 6. Share of state total
                const odishaYearData = AGE_COHORT_DATA['Odisha']?.[selectedYear];
                const odishaCohortTotal = odishaYearData ? (odishaYearData.male[cohortKey] || 0) + (odishaYearData.female[cohortKey] || 0) : 0;
                const stateSharePct = odishaCohortTotal > 0 ? (cohortTotal / odishaCohortTotal) * 100 : 0;

                // 7. Growth rate
                let yStart = '2021';
                let yEnd = '2026';
                if (selectedYear === '2001' || selectedYear === '2011') {
                  yStart = '2001';
                  yEnd = '2011';
                } else if (selectedYear === '2021') {
                  yStart = '2011';
                  yEnd = '2021';
                } else if (selectedYear === '2026') {
                  yStart = '2021';
                  yEnd = '2026';
                } else if (selectedYear === '2031') {
                  yStart = '2026';
                  yEnd = '2031';
                } else if (selectedYear === '2036') {
                  yStart = '2031';
                  yEnd = '2036';
                }
                const startVal = (activeCohortData?.[yStart]?.male[cohortKey] || 0) + (activeCohortData?.[yStart]?.female[cohortKey] || 0);
                const endVal = (activeCohortData?.[yEnd]?.male[cohortKey] || 0) + (activeCohortData?.[yEnd]?.female[cohortKey] || 0);
                const diff = endVal - startVal;
                const growthPct = startVal > 0 ? (diff / startVal) * 100 : 0;

                return (
                  <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-medium text-gray-700 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-bold uppercase tracking-wider text-gray-500">
                          Age Cohort - {activeDistrict}
                        </span>
                        <InfoTooltip
                          text={`Population Projections using Bayesian Method.`}
                          source={tooltipSource}
                        />
                      </div>
                    </div>

                    {/* Inline Age Group Selector Buttons */}
                    <div className="flex gap-1.5 mb-4 bg-gray-50 p-1 rounded-lg border border-gray-100">
                      {[
                        { id: '0_14', label: '0–14 yrs' },
                        { id: '15_59', label: '15–59 yrs' },
                        { id: '60_plus', label: '60+ yrs' },
                      ].map((grp) => (
                        <button
                          key={grp.id}
                          onClick={() => setAgeCohortSub(grp.id as any)}
                          className={`flex-1 text-center py-1 text-[10px] font-bold rounded-md transition-all ${ageCohortSub === grp.id
                            ? 'bg-[#0868AC] text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                          {grp.label}
                        </button>
                      ))}
                    </div>

                    {/* Conditional Grid Layout */}
                    {activeDistrict === 'Odisha' ? (
                      /* Default view (Odisha): 2 rows of 2 columns */
                      <>
                        {/* Row 1: Cohort & Sex Ratio */}
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3 mb-3">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Cohort Pop ({activeCohortLabel})
                            </p>
                            <p className="text-lg font-black text-gray-900 tracking-tight mt-0.5 leading-none">
                              {formatNumber(cohortTotal)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Sex Ratio
                            </p>
                            <p className="text-lg font-black text-gray-900 tracking-tight mt-0.5 leading-none">
                              {cohortSexRatio > 0 ? Math.round(cohortSexRatio).toString() : '–'}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
                              Females per 1k males
                            </p>
                          </div>
                        </div>

                        {/* Row 2: Gender split & Growth */}
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3 mb-3">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Gender Split
                            </p>
                            <div className="text-[11px] font-bold text-gray-900 mt-0.5 leading-tight">
                              Male: {cohortMalePct.toFixed(1)}%<br />
                              Female: {cohortFemalePctVal.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Growth ({yStart}→{yEnd})
                            </p>
                            <p className={`text-lg font-black tracking-tight mt-0.5 leading-none ${growthPct >= 0 ? 'text-[#0868AC]' : 'text-red-600'}`}>
                              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
                            </p>
                            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
                              {growthPct >= 0 ? 'Expansion' : 'Contraction'}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* District Selected View: 3 rows of 2 columns */
                      <>
                        {/* Row 1: Cohort & District Rank */}
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3 mb-3">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Cohort Pop ({activeCohortLabel})
                            </p>
                            <p className="text-lg font-black text-gray-900 tracking-tight mt-0.5 leading-none">
                              {formatNumber(cohortTotal)}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
                              {stateSharePct.toFixed(1)}% of state cohort
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              District Rank
                            </p>
                            <p className="text-lg font-black text-gray-900 tracking-tight mt-0.5 leading-none">
                              {getOrdinal(activeDistrictRank)}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
                              out of 30 districts
                            </p>
                          </div>
                        </div>

                        {/* Row 2: Gender split & Sex Ratio */}
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3 mb-3">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Gender Split
                            </p>
                            <div className="text-[11px] font-bold text-gray-900 mt-0.5 leading-tight">
                              Male: {cohortMalePct.toFixed(1)}%<br />
                              Female: {cohortFemalePctVal.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Sex Ratio
                            </p>
                            <p className="text-lg font-black text-gray-900 tracking-tight mt-0.5 leading-none">
                              {cohortSexRatio > 0 ? Math.round(cohortSexRatio).toString() : '–'}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
                              Females per 1k males
                            </p>
                          </div>
                        </div>

                        {/* Row 3: Growth */}
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3 mb-3">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              Growth ({yStart}→{yEnd})
                            </p>
                            <p className={`text-lg font-black tracking-tight mt-0.5 leading-none ${growthPct >= 0 ? 'text-[#0868AC]' : 'text-red-600'}`}>
                              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
                            </p>
                            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
                              {growthPct >= 0 ? 'Expansion' : 'Contraction'}
                            </p>
                          </div>
                          <div>
                            {/* Empty column for grid symmetry */}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Trend Line Chart with X-Axis & Hover Tooltip */}
                    <div className="border-b border-gray-100 pb-3 mb-3">
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-2">
                        Trend Trajectory ({activeCohortLabel} Population)
                      </p>
                      <div className="w-full h-24 mt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={sparklinePoints}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                          >
                            <XAxis
                              dataKey="year"
                              tick={{ fontSize: 8, fontWeight: 'bold', fill: '#9CA3AF' }}
                              axisLine={{ stroke: '#E5E7EB' }}
                              tickLine={false}
                            />
                            <Tooltip
                              formatter={(value: any) => [formatNumber(value as number), 'Population']}
                              labelFormatter={(label) => `Year: ${label}`}
                              contentStyle={{
                                borderRadius: '6px',
                                border: '1px solid #E5E7EB',
                                fontSize: '10px',
                                padding: '4px 8px',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="val"
                              stroke="#F76000"
                              strokeWidth={2}
                              dot={{ r: 3, fill: '#F76000', strokeWidth: 0 }}
                              activeDot={{ r: 5, fill: '#F96000', stroke: '#ffffff', strokeWidth: 1.5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Age composition split */}
                    <div className="border-b border-gray-100 pb-3 mb-3">
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">
                        Age Composition Split ({selectedYear})
                      </p>
                      <div className="w-full h-2 rounded-full flex overflow-hidden mb-1.5 bg-gray-100">
                        <div
                          className="bg-[#7BCCC4] h-full transition-all duration-500"
                          style={{ width: `${pct0_14}%` }}
                          title={`0–14: ${pct0_14.toFixed(1)}%`}
                        ></div>
                        <div
                          className="bg-[#43A2CA] h-full transition-all duration-500"
                          style={{ width: `${pct15_59}%` }}
                          title={`15–59: ${pct15_59.toFixed(1)}%`}
                        ></div>
                        <div
                          className="bg-[#0868AC] h-full transition-all duration-500"
                          style={{ width: `${pct60_plus}%` }}
                          title={`60+: ${pct60_plus.toFixed(1)}%`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#7BCCC4] rounded-full"></span>
                          <span>0–14: {pct0_14.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#43A2CA] rounded-full"></span>
                          <span>15–59: {pct15_59.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#0868AC] rounded-full"></span>
                          <span>60+: {pct60_plus.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Highest / Lowest extremes */}
                    <div>
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">
                        State Extremes ({activeCohortLabel}, {selectedYear})
                      </p>
                      <div className="space-y-1 text-[11px] font-semibold text-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-medium">Highest:</span>
                          <span>
                            {highestDistrict.name} ({formatNumber(highestDistrict.val)})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-medium">Lowest:</span>
                          <span>
                            {lowestDistrict.name} ({formatNumber(lowestDistrict.val)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Population Pyramid Chart */}
              {isCensusSource &&
                selectedDistrictName !== 'All Districts' &&
                selectedDistrictName !== 'Odisha' && (
                  <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all relative">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-700 mb-4">
                      <span className="font-bold uppercase tracking-wider text-gray-500">
                        Age Distribution
                      </span>
                      <InfoTooltip
                        text="Age composition of the population, showing male and female distribution across birth cohorts. Source: WorldPop"
                        source={tooltipSource}
                      />
                    </div>
                    <div className="w-full h-70">
                      {(() => {
                        const yearNum = parseInt(selectedYear);
                        const isAgeDistributionAvailable = yearNum >= 2015 && yearNum <= 2030;

                        if (!isAgeDistributionAvailable) {
                          return (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                              <Info className="w-8 h-8 text-gray-300 mb-2" />
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Age Distribution Data Unavailable
                              </p>
                              <p className="text-[10px] text-gray-400 leading-normal max-w-[200px]">
                                Age distribution data is only available for the years from 2015 to 2030.
                              </p>
                            </div>
                          );
                        }

                        const data = ageDistributionData;
                        // const maxVal = Math.max(
                        //   1,
                        //   ...data.map((d) =>
                        //     Math.max(Math.abs(d.male), d.female),
                        //   ),
                        // );

                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={data}
                              margin={{
                                top: 5,
                                right: 10,
                                left: 10,
                                bottom: 5,
                              }}
                              barGap={0}
                              barCategoryGap={0}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                stroke="#f3f4f6"
                              />
                              <XAxis
                                type="number"
                                domain={[-400000, 400000]}
                                tickFormatter={formatAgeTick}
                                tick={{
                                  fontSize: 9,
                                  fill: '#9ca3af',
                                  fontWeight: 600,
                                }}
                                axisLine={{ stroke: '#f3f4f6' }}
                                tickLine={false}
                                tickCount={5}
                              />
                              <YAxis
                                dataKey="age"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                  fontSize: 9,
                                  fill: '#6b7280',
                                  fontWeight: 'bold',
                                }}
                                width={30}
                              />
                              <Tooltip
                                content={<CustomAgeTooltip />}
                                cursor={{ fill: '#f3f4f6' }}
                              />
                              <Legend
                                iconType="circle"
                                wrapperStyle={{
                                  fontSize: '10px',
                                  paddingTop: '10px',
                                }}
                                formatter={(value) => (
                                  <span
                                    style={{
                                      color: '#6b7280',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {value.toUpperCase()}
                                  </span>
                                )}
                              />
                              <Bar
                                dataKey="male"
                                fill="#0868ac"
                                barSize={-12}
                                name="Male"
                                isAnimationActive={true}
                                animationDuration={800}
                                animationEasing="ease-in-out"
                              />
                              <Bar
                                dataKey="female"
                                fill="#99A1AF"
                                barSize={12}
                                name="Female"
                                isAnimationActive={true}
                                animationDuration={800}
                                animationEasing="ease-in-out"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>
                )}

            </div>
          </div>
        </div>

      </div>


      {showScrollHint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-auto cursor-pointer"
          onClick={() => {
            window.scrollBy({
              top: window.innerHeight * 0.4, // Scrolls down exactly 20vh
              behavior: 'smooth',
            });
          }}
        >
          {/* Default state: no background. Hover state: rounded circle background */}
          <div className="text-black p-2 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-black/5 hover:backdrop-blur-sm">
            <ChevronsDown className="w-5 h-5" />
          </div>
        </motion.div>
      )}
    </div>
  );
};
