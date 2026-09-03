import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { type DistrictData } from '../shared';
import {
  TrendingUpDown,
  Users,
  MapPin,
  TrendingUp,
  Building2,
  Trees,
  FileDown,
  Loader2,
} from 'lucide-react';
import { MiniDistrictMap } from './MiniDistrictMap';
import { DISTRICT_OVERVIEWS } from './districtNarrative';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { DEFAULT_REPORT_OPTIONS, type ReportOptionsConfig } from '../../Report/reportData';

type Props = {
  selectedDistrict?: string;
  selectedData?: DistrictData;
  allDistrictsData: DistrictData[];
  withCards?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat extraction, sourced entirely from DISTRICT_OVERVIEWS text
// Each entry is hand-tuned from the narrative so numbers match the source.
// ─────────────────────────────────────────────────────────────────────────────
const DISTRICT_STATS: Record<
  string,
  { label: string; value: string; sub?: string; icon: string }[]
> = {
  Anugul: [
    {
      label: '2011 Population',
      value: '1.27M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '1.52M',
      sub: '+247K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR',
      value: '0.71%',
      sub: 'Compound growth rate',
      icon: 'trend',
    },
    { label: 'Area', value: '6,375 km²', sub: 'District area', icon: 'map' },
    {
      label: '2036 Urban Share',
      value: '21.1%',
      sub: 'Up from 16.85%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '239 /km²',
      sub: 'Up from 200',
      icon: 'map',
    },
  ],
  Balangir: [
    {
      label: '2011 Population',
      value: '1.65M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '1.93M',
      sub: '+280K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR (early)',
      value: '0.76%',
      sub: 'Slows to 0.55%',
      icon: 'trend',
    },
    { label: 'Area', value: '6,575 km²', sub: 'District area', icon: 'map' },
    {
      label: '2036 Urban Share',
      value: '13.74%',
      sub: 'Up from 9.49%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '293 /km²',
      sub: 'Up from 251',
      icon: 'map',
    },
  ],
  Cuttack: [
    {
      label: '2011 Population',
      value: '2.62M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '3.09M',
      sub: '+466K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR (early)',
      value: '0.9%',
      sub: 'Slows to 0.6%',
      icon: 'trend',
    },
    { label: 'Area', value: '3,932 km²', sub: 'District area', icon: 'map' },
    {
      label: '2036 Urban Share',
      value: '32.03%',
      sub: 'Up from 27.78%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '786 /km²',
      sub: 'Up from 668',
      icon: 'map',
    },
  ],
  Kendujhar: [
    {
      label: '2011 Population',
      value: '1.80M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '2.17M',
      sub: '+372K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR (early)',
      value: '0.86%',
      sub: 'Decelerating',
      icon: 'trend',
    },
    { label: 'Area', value: '8,303 km²', sub: 'District area', icon: 'map' },
    {
      label: '2036 Urban Share',
      value: '17.62%',
      sub: 'Up from 13.37%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '262 /km²',
      sub: 'Up from 217',
      icon: 'map',
    },
  ],
  Khordha: [
    {
      label: '2011 Population',
      value: '2.25M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '2.66M',
      sub: '+411K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR (early)',
      value: '0.8%',
      sub: 'Slows to 0.55%',
      icon: 'trend',
    },
    {
      label: 'Area',
      value: '2,888 km²',
      sub: 'Smallest in panel',
      icon: 'map',
    },
    {
      label: '2036 Urban Share',
      value: '52.38%',
      sub: 'Up from 48.13%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '922 /km²',
      sub: 'Up from 780',
      icon: 'map',
    },
  ],
  Mayurbhanj: [
    {
      label: '2011 Population',
      value: '2.52M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '3.02M',
      sub: '+499K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR (early)',
      value: '0.85%',
      sub: 'Slows to 0.65%',
      icon: 'trend',
    },
    {
      label: 'Area',
      value: '10,418 km²',
      sub: 'Largest in Odisha',
      icon: 'map',
    },
    {
      label: '2036 Urban Share',
      value: '12.03%',
      sub: 'Up from 7.78%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '290 /km²',
      sub: 'Up from 242',
      icon: 'map',
    },
  ],
  Sambalpur: [
    {
      label: '2011 Population',
      value: '1.04M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '1.23M',
      sub: '+194K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR (early)',
      value: '0.83%',
      sub: 'Slows to 0.61%',
      icon: 'trend',
    },
    { label: 'Area', value: '6,624 km²', sub: 'District area', icon: 'map' },
    {
      label: '2036 Urban Share',
      value: '35.26%',
      sub: 'Up from 31.01%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '186 /km²',
      sub: 'Up from 157',
      icon: 'map',
    },
  ],
  Sundargarh: [
    {
      label: '2011 Population',
      value: '2.09M',
      sub: 'Census base',
      icon: 'users',
    },
    {
      label: '2036 Projection',
      value: '2.49M',
      sub: '+400K over 25 yrs',
      icon: 'trending',
    },
    {
      label: 'CAGR (early)',
      value: '0.81%',
      sub: 'Slows to 0.59%',
      icon: 'trend',
    },
    {
      label: 'Area',
      value: '9,712 km²',
      sub: 'Second-largest in panel',
      icon: 'map',
    },
    {
      label: '2036 Urban Share',
      value: '39.59%',
      sub: 'Up from 35.34%',
      icon: 'building',
    },
    {
      label: '2036 Density',
      value: '257 /km²',
      sub: 'Up from 215',
      icon: 'map',
    },
  ],
};

const ICON_MAP: Record<string, React.ReactNode> = {
  users: <Users className="w-3.5 h-3.5" />,
  trending: <TrendingUp className="w-3.5 h-3.5" />,
  trend: <TrendingUpDown className="w-3.5 h-3.5" />,
  map: <MapPin className="w-3.5 h-3.5" />,
  building: <Building2 className="w-3.5 h-3.5" />,
  trees: <Trees className="w-3.5 h-3.5" />,
};

export function StateDemographics_v3({
  selectedDistrict,
  selectedData,
  withCards = false,
}: Props) {
  useEffect(() => {
    console.log('Render Demographics v3', {
      selectedDistrict,
      hasData: !!selectedData,
    });
  }, [selectedDistrict, selectedData]);

  const [isExporting, setIsExporting] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [options, setOptions] = useState<ReportOptionsConfig>({
    ...DEFAULT_REPORT_OPTIONS,
    demographicOverview: { ...DEFAULT_REPORT_OPTIONS.demographicOverview },
    populationProjection: { ...DEFAULT_REPORT_OPTIONS.populationProjection },
    populationStructure: { ...DEFAULT_REPORT_OPTIONS.populationStructure },
    urbanRuralComposition: { ...DEFAULT_REPORT_OPTIONS.urbanRuralComposition },
    landUseAnalysis: { ...DEFAULT_REPORT_OPTIONS.landUseAnalysis },
    nightLightAnalysis: { ...DEFAULT_REPORT_OPTIONS.nightLightAnalysis },
    hotspotAnalysis: { ...DEFAULT_REPORT_OPTIONS.hotspotAnalysis },
    regionalPerformanceMatrix: { ...DEFAULT_REPORT_OPTIONS.regionalPerformanceMatrix },
    developmentActivities: { ...DEFAULT_REPORT_OPTIONS.developmentActivities },
    technicalNotes: { ...DEFAULT_REPORT_OPTIONS.technicalNotes },
  });

  const toggleSection = (sectionKey: keyof ReportOptionsConfig) => {
    setOptions((prev) => {
      const newEnabled = !prev[sectionKey].enabled;
      const updatedSection = { ...prev[sectionKey], enabled: newEnabled };
      Object.keys(updatedSection).forEach((k) => {
        if (k !== 'enabled') {
          (updatedSection as any)[k] = newEnabled;
        }
      });
      return { ...prev, [sectionKey]: updatedSection };
    });
  };

  // const toggleComponent = (sectionKey: keyof ReportOptionsConfig, componentKey: string) => {
  //   setOptions((prev) => {
  //     const section = prev[sectionKey];
  //     const newVal = !(section as any)[componentKey];
  //     const updatedSection = { ...section, [componentKey]: newVal };

  //     const subKeys = Object.keys(updatedSection).filter((k) => k !== 'enabled');
  //     const anyActive = subKeys.some((k) => (updatedSection as any)[k]);
  //     updatedSection.enabled = anyActive;

  //     return { ...prev, [sectionKey]: updatedSection };
  //   });
  // };

  const handleExport = async () => {
    if (!selectedDistrict || isExporting) return;
    try {
      setIsExporting(true);
      setShowOptionsModal(false);
      const { downloadDistrictReport } = await import(
        '../../Report/DistrictReportPdf'
      );
      await downloadDistrictReport(selectedDistrict, selectedData, options);
    } catch (err) {
      console.error('District report export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const overview = useMemo(() => {
    if (!selectedDistrict) return null;
    return DISTRICT_OVERVIEWS[selectedDistrict] || null;
  }, [selectedDistrict]);

  const paragraphs = useMemo(() => overview?.paragraphs || [], [overview]);
  const highlightPhrases = useMemo(
    () => overview?.highlightPhrases || [],
    [overview],
  );

  const stats = useMemo(() => {
    if (!selectedDistrict) return [];
    return DISTRICT_STATS[selectedDistrict] || [];
  }, [selectedDistrict]);

  // Refactored highlighting function to use explicit phrases
  const highlightText = (text: string, phrases: string[]) => {
    if (!text || !phrases.length) return text;

    // Sort phrases by length descending to avoid partial matches
    const sortedPhrases = [...phrases].sort((a, b) => b.length - a.length);

    // Create a regex to match all phrases
    const escapedPhrases = sortedPhrases.map((p) =>
      p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    const regex = new RegExp(`(${escapedPhrases.join('|')})`, 'gi');

    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = phrases.some(
        (phrase) => phrase.toLowerCase() === part.toLowerCase(),
      );

      if (isMatch) {
        return (
          <span
            key={i}
            className="px-1 py-0.5 rounded-sm bg-orange-100 text-gray-900 font-bold border-b border-orange-200/50"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!selectedData) return null;

  const districtName =
    selectedData.district_name || selectedDistrict || 'District';

  return (
    <motion.div
      className="mx-auto px-4 lg:px-6 py-14 space-y-10 pb-15"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* HEADER */}
      <div className="pb-0 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <TrendingUpDown className="w-6 h-6 text-black" />
            District Overview - {districtName}
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            A comprehensive synthesis of population dynamics and demographic
            trends.
          </p>
        </div>
        {selectedDistrict && selectedDistrict.toLowerCase() !== 'odisha' && (
          <button
            type="button"
            onClick={() => setShowOptionsModal(true)}
            disabled={isExporting}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-[#F96000] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D66B12] focus:outline-none focus:ring-2 focus:ring-[#F96000]/40 disabled:opacity-60 disabled:cursor-wait"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {isExporting ? 'Generating…' : 'Export Report'}
          </button>
        )}
      </div>

      {/* STAT CARDS, full width, above the 2-col layout */}
      {withCards && stats.length > 0 && (
        <div className="-mt-4 mb-20">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
            Key Figures at a Glance
          </p>
          <div className="grid grid-cols-6 gap-2">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">{ICON_MAP[stat.icon]}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                    {stat.label}
                  </span>
                </div>
                <div className="text-xl font-black tracking-tight text-[#F96000]">
                  {stat.value}
                </div>
                {stat.sub && (
                  <div className="text-[9px] text-gray-500 font-medium leading-snug">
                    {stat.sub}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 2 COLUMN LAYOUT */}
      <div className="grid grid-cols-10 gap-2">
        {/* LEFT - 70% */}
        <div className="col-span-7 space-y-4 text-md text-gray-700 leading-relaxed font-medium">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <p key={i}>{highlightText(p, highlightPhrases)}</p>
            ))
          ) : (
            <p>Narrative data unavailable for this district.</p>
          )}
        </div>

        {/* RIGHT - 30% */}
        <div className="col-span-3 min-h-auto">
          <MiniDistrictMap targetDistrict={selectedDistrict} />
        </div>
      </div>

      <Dialog open={showOptionsModal} onOpenChange={setShowOptionsModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900">Export Report Options</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Select the modules and individual components to include in the exported PDF district profile.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 grid grid-cols-2 gap-4">
            {/* Section 2: Population Projection */}
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.populationProjection.enabled}
                  onChange={() => toggleSection('populationProjection')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Population Projection & Growth
              </label>
            </div>

            {/* Section 3: Population Structure */}
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.populationStructure.enabled}
                  onChange={() => toggleSection('populationStructure')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Population Structure
              </label>
            </div>

            {/* Section 4: Urban & Rural Composition (Commented Out) */}
            {/*
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.urbanRuralComposition.enabled}
                  onChange={() => toggleSection('urbanRuralComposition')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Urban & Rural Composition
              </label>
            </div>
            */}

            {/* Section 5: Land Use Analysis */}
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.landUseAnalysis.enabled}
                  onChange={() => toggleSection('landUseAnalysis')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Land Use Analysis
              </label>
            </div>

            {/* Section 6: Night Light Analysis */}
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.nightLightAnalysis.enabled}
                  onChange={() => toggleSection('nightLightAnalysis')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Night Light Analysis
              </label>
            </div>

            {/* Section 7: Areas of Rapid Change */}
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.hotspotAnalysis.enabled}
                  onChange={() => toggleSection('hotspotAnalysis')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Areas of Rapid Change
              </label>
            </div>

            {/* Section 8: Regional Performance Matrix */}
            {/* <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.regionalPerformanceMatrix.enabled}
                  onChange={() => toggleSection('regionalPerformanceMatrix')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Regional Performance Matrix
              </label>
            </div> */}

            {/* Section 9: Development Activities & Insights */}
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.developmentActivities.enabled}
                  onChange={() => toggleSection('developmentActivities')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Development Activities & Insights
              </label>
            </div>

            {/* Section 10: Technical Notes & Sources */}
            <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 hover:bg-gray-50 transition-colors col-span-2">
              <label className="flex items-center gap-2.5 font-bold text-gray-800 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.technicalNotes.enabled}
                  onChange={() => toggleSection('technicalNotes')}
                  className="rounded border-gray-300 text-[#F96000] focus:ring-[#F96000]/40 h-4 w-4 cursor-pointer"
                />
                Technical Notes & Sources
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowOptionsModal(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#F96000] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D66B12] disabled:opacity-60 disabled:cursor-wait"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isExporting ? 'Generating Report…' : 'Generate & Download'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
