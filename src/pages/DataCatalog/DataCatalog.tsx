import React from 'react';
import PageWrapper from '../PageWrapper/PageWrapper';
import {
  Database,
  Target,
  BookOpen
} from 'lucide-react';

interface Dataset {
  id: number;
  name: string;
  source: string;
  format: string;
  years: string;
  resolution: string;
  role: string;
}

interface ObjectiveMapping {
  objective: string;
  datasets: string;
  proxies: string;
  output: string;
}

const DATASETS: Dataset[] = [
  {
    id: 1,
    name: 'Census of India 2011',
    source: 'Office of the Registrar General & Census Commissioner',
    format: 'CSV',
    years: '2011',
    resolution: 'District / Sub-District',
    role: 'Demographic ground truth for model training; anchor for the full 2011-2036 series; official land areas and baseline urban shares',
  },
  {
    id: 2,
    name: 'UNFPA Population Projections',
    source: 'UNFPA',
    format: 'Tabular',
    years: '2011 - 2036',
    resolution: 'District / State',
    role: 'Independent validation of the estimated and predicted population series',
  },
  {
    id: 3,
    name: 'Administrative Boundaries (GADM v4.1)',
    source: 'GADM',
    format: 'SHP / GeoJSON',
    years: 'Current',
    resolution: 'District',
    role: 'Analysis units for zonal statistics, aggregation, and map rendering',
  },
  {
    id: 4,
    name: 'WorldPop Gridded Population (R2025A)',
    source: 'WorldPop, University of Southampton',
    format: 'GeoTIFF',
    years: '2015 - 2030',
    resolution: '1 km',
    role: 'Independent validation of district population levels and growth trends',
  },
  {
    id: 5,
    name: 'Landsat 5/7/8 Optical Imagery',
    source: 'USGS / NASA',
    format: 'GeoTIFF',
    years: '2011 - 2025',
    resolution: '30 m',
    role: 'Landsat 5/7/8 Optical Imagery | USGS / NASA | GeoTIFF | 2011 - 2025 | 30 m | Annual spectral indices: Normalized Difference Vegetation Index (NDVI), Normalized Difference Built-up Index (NDBI), Modified Normalized Difference Water Index (MNDWI), Soil-Adjusted Vegetation Index (SAVI), Enhanced Vegetation Index (EVI), Built-up Index (BUI), Urban Index (UI), Index-based Built-up Index (IBI) and Land Surface Temperature (LST) as features for the ML population estimation models',
  },
  {
    id: 6,
    name: 'Sentinel-2 L2A Optical Imagery',
    source: 'ESA Copernicus',
    format: 'JP2 / COG',
    years: '2016 - 2025',
    resolution: '10 m',
    role: 'Land-use change detection, hotspot ranking, and before/after satellite comparisons',
  },
  {
    id: 7,
    name: 'VIIRS Nighttime Lights (DNB)',
    source: 'NOAA / NASA',
    format: 'GeoTIFF',
    years: '2012 - 2026',
    resolution: '500 m',
    role: 'Settlement intensity and electrification proxy; one of the strongest population predictors (r = 0.79)',
  },
  {
    id: 8,
    name: 'ESRI Land Cover',
    source: 'Esri Living Atlas',
    format: 'GeoTIFF',
    years: '2017 - 2025',
    resolution: '10 m',
    role: 'Land cover classes and built-up areas as model features; transition matrices and built-expansion masks for change analysis',
  },
  {
    id: 9,
    name: 'GHS-SMOD Settlement Model (Degree of Urbanisation)',
    source: 'European Commission JRC',
    format: 'GeoTIFF',
    years: '2010 - 2030',
    resolution: '1 km',
    role: 'Settlement-type classification layers (rural to urban centre) across five epochs',
  },
  {
    id: 10,
    name: 'OpenStreetMap Infrastructure',
    source: 'OpenStreetMap',
    format: 'GeoJSON / SHP',
    years: 'Current',
    resolution: 'Vector',
    role: 'Roads, railways, mines, plants, and settlements used to attribute drivers and classify change hotspots',
  },
];

interface DatasetDetail {
  name: string;
  source: string;
  chips: string[];
  rationale: string;
  purpose: string;
}

// Rationale (why this dataset was chosen) and purpose (what it does in the
// platform) for every dataset in the table above.
const DATASET_DETAILS: DatasetDetail[] = [
  {
    name: 'Census of India 2011',
    source: 'Office of the Registrar General & Census Commissioner',
    chips: ['CSV', '2011', 'District / Sub-District'],
    rationale:
      'The census is the only complete enumeration of every household in the state. No modelled or satellite-derived product can substitute for full-count ground truth, and every machine-learning estimator needs a reliable anchor to learn from. With the 2021 round delayed, 2011 remains the sole exact baseline.',
    purpose:
      'Trains the population-estimation models, anchors the entire 2011–2036 series to enumerated reality, and supplies the official district land areas and baseline urban shares used for density and urban/rural indicators.',
  },
  {
    name: 'UNFPA Population Projections',
    source: 'UNFPA',
    chips: ['Tabular', '2011–2036', 'District / State'],
    rationale:
      'Produced with Bayesian demographic methods that share no inputs with the satellite pipeline, these projections are the ideal independent referee. Reserving them strictly for validation (never as model input) keeps the comparison free of circularity.',
    purpose:
      'Year-by-year validation of the estimated and predicted series; the platform agrees with this reference to within ±5% in every year for the priority districts.',
  },
  {
    name: 'Administrative Boundaries (GADM v4.1)',
    source: 'GADM',
    chips: ['SHP / GeoJSON', 'Current', 'District'],
    rationale:
      'Analysis needs one consistent, openly licensed set of district polygons. Odisha\'s district boundaries have been stable since 2011, so a contemporary snapshot introduces at most a few percent of boundary mismatch.',
    purpose:
      'Defines the analysis units for all zonal statistics, aggregation and reconciliation, and clips every raster product to district extents for the map client.',
  },
  {
    name: 'WorldPop Gridded Population (R2025A)',
    source: 'WorldPop, University of Southampton',
    chips: ['GeoTIFF', '2015–2030', '1 km'],
    rationale:
      'The most widely used gridded population product globally, calibrated to UN World Population Prospects 2024 and produced entirely independently of this platform. A second external reference alongside UNFPA strengthens the validation triangle.',
    purpose:
      'Cross-checks district population levels and growth trajectories over the overlapping 2015–2030 window, and powers the population choropleth basemap in the dashboard.',
  },
  {
    name: 'Landsat 5/7/8 Optical Imagery',
    source: 'USGS / NASA',
    chips: ['GeoTIFF', '2011–2025', '30 m'],
    rationale:
      'The only optical archive that reaches back to the 2011 census anchor with consistent calibration: Sentinel-2 simply does not exist before 2015. A continuous 2011–2025 record is what makes annual estimation from the census baseline possible at all.',
    purpose:
      'Supplies the annual spectral indices (NDVI, NDBI, MNDWI, SAVI, EVI, BUI, UI, IBI) and Land Surface Temperature that form the feature stack for the ML population-estimation models.',
  },
  {
    name: 'Sentinel-2 L2A Optical Imagery',
    source: 'ESA Copernicus',
    chips: ['JP2 / COG', '2016–2025', '10 m'],
    rationale:
      'At 10 m resolution with a five-day revisit, Sentinel-2 is the best freely available sensor for seeing individual settlements, factories and roads appear. Its globally consistent L2A quality from late 2015 defines the 2016–2024 change-analysis window.',
    purpose:
      'Drives the land-use change detection and hotspot ranking, and provides the before/after true-colour composites and hotspot chips shown in the dashboard and the district profile PDF.',
  },
  {
    name: 'VIIRS Nighttime Lights (DNB)',
    source: 'NOAA / NASA',
    chips: ['GeoTIFF', '2012–2026', '500 m'],
    rationale:
      'Where lights brighten, people and economic activity concentrate. Night-time radiance is the single strongest population proxy in the feature stack (r = 0.79 at district level) and responds to electrification and settlement growth between censuses.',
    purpose:
      'Settlement-intensity feature for the estimation models and the night-time lights comparison layers in the dashboard\'s map views.',
  },
  {
    name: 'ESRI Land Cover',
    source: 'Esri Living Atlas',
    chips: ['GeoTIFF', '2017–2025', '10 m'],
    rationale:
      'An annual, globally consistent 10 m land-cover classification whose nine classes map directly onto the questions asked here: where is built area expanding, and at whose expense. Annual cadence enables true year-over-year transition analysis.',
    purpose:
      'Provides land-cover composition statistics and class areas as model features, the built-expansion masks for change scoring, and the LULC rasters streamed in the dashboard and embedded in the district profile.',
  },
  {
    name: 'GHS-SMOD Settlement Model (Degree of Urbanisation)',
    source: 'European Commission JRC',
    chips: ['GeoTIFF', '2010–2030', '1 km'],
    rationale:
      'Implements the UN-endorsed Degree of Urbanisation (DEGURBA) standard, which treats urbanisation as a spectrum of eight settlement classes rather than a binary. That makes settlement intensity comparable across districts, epochs and international contexts.',
    purpose:
      'The settlement-classification layers (rural through urban centre) for five epochs, letting users watch the Degree of Urbanisation evolve from 2010 to 2030.',
  },
  {
    name: 'OpenStreetMap Infrastructure',
    source: 'OpenStreetMap',
    chips: ['GeoJSON / SHP', 'Current', 'Vector'],
    rationale:
      'Explaining why land changed requires local context no satellite can supply: the mine, plant, port or railway next to the change. OSM is the richest open registry of such features and can be queried live around every hotspot.',
    purpose:
      'Feeds the nearby-drivers registry used to attribute causes to change hotspots and to assign settlement-type tags (residential, industrial, mining, transport).',
  },
];

const OBJECTIVES: ObjectiveMapping[] = [
  {
    objective: 'Population Dynamics',
    datasets: 'Census 2011, Landsat, VIIRS, ESRI Land Cover',
    proxies: 'Built-up indices (NDBI, BUI, UI, IBI), nighttime light intensity, land cover areas, LST, vegetation indices',
    output: 'Annual district population estimates (2011-2025) and predictions (2026-2036), with density and growth statistics',
  },
  {
    objective: 'Urban/Rural Distribution',
    datasets: 'Census 2011, GHS-SMOD, VIIRS, ESRI Land Cover',
    proxies: 'DEGURBA settlement classes, light intensity, built-up extent, Census baseline urban share',
    output: 'Urban/rural population split per district and year; Degree of Urbanisation map layers (2010-2030)',
  },
  {
    objective: 'Habitation Pattern',
    datasets: 'Sentinel-2, ESRI Land Cover, OpenStreetMap',
    proxies: 'Spectral change signals, land cover transitions, built-expansion masks, proximity to infrastructure drivers',
    output: '150 attributed change hotspots (5 per district) with settlement-type tags, before/after imagery, and driver context maps',
  },
  {
    objective: 'Population Growth',
    datasets: 'Estimation model outputs, WorldPop, UNFPA projections',
    proxies: 'Year-on-year change in the calibrated annual series',
    output: 'Annual growth rates and projected growth charts per district, validated against WorldPop and UNFPA references',
  },
];

const DataCatalogPage: React.FC = () => {
  return (
    <PageWrapper title="Data Catalog">
      <div className="w-full max-w-9xl mx-auto">

        {/* Header Hero Section */}
        <div className="mb-12 border-b border-gray-100 pb-8">
          <p className="text-[#F76000] font-black text-xs uppercase tracking-[0.2em] mb-3">
            Odisha Demographic & Data Intelligence Platform
          </p>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-4xl">
            The platform integrates census records, satellite imagery, land cover products, settlement models,
            and infrastructure data to estimate, predict, and explain population dynamics across the 30 districts of Odisha.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="space-y-16 pb-24">

          {/* SECTION 1: Datasets Used */}
          <section id="datasets-used" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">Datasets Used</h3>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs md:text-sm">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">#</th>
                    <th className="px-6 py-4 min-w-[200px]">Dataset</th>
                    <th className="px-6 py-4 font-semibold">Source</th>
                    <th className="px-6 py-4 font-semibold">Format</th>
                    <th className="px-6 py-4 font-semibold">Years Used</th>
                    <th className="px-6 py-4 font-semibold">Resolution / Granularity</th>
                    <th className="px-6 py-4 min-w-[300px] font-semibold">Role in the Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {DATASETS.map((dataset) => (
                    <tr key={dataset.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-gray-400">
                        {dataset.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {dataset.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {dataset.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-orange-50 border border-orange-100 rounded-md text-[10px] font-black text-[#F58220] uppercase tracking-wide">
                          {dataset.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-xs font-semibold text-center">
                        {dataset.years}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-[11px] font-medium text-gray-600">
                          {dataset.resolution}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 leading-relaxed text-xs">
                        {dataset.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 2: Dataset Rationale & Purpose */}
          <section id="dataset-rationale" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                Dataset Rationale & Purpose
              </h3>
            </div>
            <p className="text-gray-500 text-xs md:text-sm mb-6 max-w-3xl">
              Why each dataset was chosen, and what it contributes to the platform.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {DATASET_DETAILS.map((d, i) => (
                <div
                  key={d.name}
                  className="rounded-2xl border border-gray-200/70 bg-white overflow-hidden hover:shadow-lg hover:shadow-orange-500/5 transition-shadow duration-300"
                >
                  {/* card header */}
                  <div className="px-5 py-3.5 bg-[#F9FAFB] border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#FFF4EB] text-[#F76000] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm leading-snug">{d.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">{d.source}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pl-10">
                      {d.chips.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-semibold text-gray-500"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* rationale + purpose */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-4 h-1 rounded-full bg-[#F76000]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#F76000]">
                          Why this dataset
                        </span>
                      </div>
                      <p className="text-xs md:text-[13px] text-gray-600 leading-relaxed">
                        {d.rationale}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-4 h-1 rounded-full bg-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
                          What it provides
                        </span>
                      </div>
                      <p className="text-xs md:text-[13px] text-gray-600 leading-relaxed">
                        {d.purpose}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Objective Mapping */}
          <section id="objective-mapping" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#FFF4EB] rounded-lg text-[#F76000]">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">How the Datasets Map to Project Objectives</h3>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs md:text-sm">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 min-w-[180px] font-semibold">Objective</th>
                    <th className="px-6 py-4 min-w-[200px] font-semibold">Datasets Used</th>
                    <th className="px-6 py-4 min-w-[250px] font-semibold">Proxy Indicators</th>
                    <th className="px-6 py-4 min-w-[300px] font-semibold">Output in the Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {OBJECTIVES.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {item.objective}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-xs">
                        {item.datasets}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs leading-relaxed">
                        {item.proxies}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs leading-relaxed">
                        {item.output}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

      </div>
    </PageWrapper>
  );
};

export default DataCatalogPage;