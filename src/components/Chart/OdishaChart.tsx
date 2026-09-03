/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createTrend } from 'trendline';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const LULC_STATS_OD: Record<
  string,
  Record<string, Record<string, number>>
> = {
  odisha: {
    '2017': {
      Water: 4610.72,
      Trees: 62873.96,
      'Flooded Vegetation': 284.47,
      Crops: 54387.99,
      'Built Area': 5421.08,
      'Bare Ground': 576.46,
      Rangeland: 30326.27,
    },
    '2018': {
      Water: 4503.35,
      Trees: 57687.67,
      'Flooded Vegetation': 236.52,
      Crops: 56581.08,
      'Built Area': 5913.21,
      'Bare Ground': 494.03,
      Rangeland: 33065.09,
    },
    '2019': {
      Water: 4554.4,
      Trees: 55021.17,
      'Flooded Vegetation': 192.42,
      Crops: 57902.68,
      'Built Area': 6346.16,
      'Bare Ground': 450.94,
      Rangeland: 34013.17,
    },
    '2020': {
      Water: 5003.09,
      Trees: 58960.07,
      'Flooded Vegetation': 276.97,
      Crops: 55574.7,
      'Built Area': 7045.4,
      'Bare Ground': 396.2,
      Rangeland: 31224.51,
    },
    '2021': {
      Water: 4553.82,
      Trees: 54753.24,
      'Flooded Vegetation': 219.19,
      Crops: 57001.59,
      'Built Area': 6467.05,
      'Bare Ground': 385.67,
      Rangeland: 35100.38,
    },
    '2022': {
      Water: 4692.29,
      Trees: 56738.65,
      'Flooded Vegetation': 292.83,
      Crops: 54459.75,
      'Built Area': 7543.97,
      'Bare Ground': 374.81,
      Rangeland: 34378.64,
    },
    '2023': {
      Water: 4681.21,
      Trees: 57208.8,
      'Flooded Vegetation': 297.04,
      Crops: 54886.67,
      'Built Area': 7460.6,
      'Bare Ground': 380.29,
      Rangeland: 33565.32,
    },
    '2024': {
      Water: 4630.33,
      Trees: 56945.69,
      'Flooded Vegetation': 238.48,
      Crops: 55543.59,
      'Built Area': 7956.97,
      'Bare Ground': 376.75,
      Rangeland: 32788.7,
    },
    '2025': {
      Water: 4785.36,
      Trees: 61170.59,
      'Flooded Vegetation': 309.02,
      Crops: 54937.6,
      'Built Area': 7904.62,
      'Bare Ground': 381.95,
      Rangeland: 28991.38,
    },
  },
};

const LULC_LEGEND = [
  { label: 'Water', color: '#419BDF', key: 'water' },
  { label: 'Trees', color: '#397D49', key: 'trees' },
  { label: 'Flooded Vegetation', color: '#7A87C6', key: 'flooded_vegetation' },
  { label: 'Crops', color: '#E49635', key: 'crops' },
  { label: 'Built Area', color: '#C4281B', key: 'built' },
  { label: 'Bare Ground', color: '#A59B8F', key: 'bare' },
  { label: 'Rangeland', color: '#DFC35A', key: 'rangeland' },
];

const ODISHA_CHART_DATA = (() => {
  const data: any[] = Object.keys(LULC_STATS_OD.odisha).sort().map((year, index) => {
    const stats = LULC_STATS_OD.odisha[year];
    return {
      name: year,
      year: parseInt(year),
      index: index,
      water: stats['Water'] || 0,
      trees: stats['Trees'] || 0,
      flooded_vegetation: stats['Flooded Vegetation'] || 0,
      crops: stats['Crops'] || 0,
      built: stats['Built Area'] || 0,
      bare: stats['Bare Ground'] || 0,
      rangeland: stats['Rangeland'] || 0,
    };
  });

  LULC_LEGEND.forEach((cat) => {
    const trend = createTrend(data, 'index', cat.key);
    data.forEach((item: any, index) => {
      item[`${cat.key}_trend`] = trend.calcY(index);
    });
  });

  return data;
})();

export const OdishaChart: React.FC = () => {
  return (
    <div className="w-full bg-white border-b border-gray-100 py-10 px-4 md:px-8">
      <div className="w-full max-w-9xl mx-auto transform transition-all duration-1000 slide-in-from-bottom-8">
        <div className="w-full mb-2 bg-white/40 p-5 md:p-6 rounded-2xl border border-gray-100/50 backdrop-blur-md shadow-sm">
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-[0.05em] uppercase mb-1 text-center">
            Odisha Land Cover (LULC) Trends <span className="text-[#F76000]">(2017 - 2025)</span>
          </h3>
          <p className="text-[11px] text-gray-500 mb-6 font-semibold uppercase tracking-wider text-center">
            State-level annual area coverage in sq. km with trend lines
          </p>

          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ODISHA_CHART_DATA} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} width={45} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-md border border-gray-200 p-2.5 rounded-lg shadow-xl text-[10px] text-left">
                          <p className="font-black text-gray-900 mb-1 border-b pb-1">
                            Year {label}
                          </p>
                          {payload
                            .filter((p: any) => !p.dataKey.endsWith('_trend'))
                            .map((p: any) => (
                              <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="font-bold text-gray-600 capitalize">
                                    {p.name.replace('_', ' ')}
                                  </span>
                                </div>
                                <span className="font-mono font-black text-[#F76000]">
                                  {Number(p.value).toFixed(1)}{' '}
                                  <span className="text-[8px] opacity-60">sqkm</span>
                                </span>
                              </div>
                            ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {LULC_LEGEND.map((cat) => (
                  <React.Fragment key={cat.key}>
                    <Line
                      type="monotone"
                      dataKey={cat.key}
                      name={cat.label}
                      stroke={cat.color}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={`${cat.key}_trend`}
                      name={`${cat.label} Trend`}
                      stroke={cat.color}
                      strokeWidth={1.2}
                      strokeDasharray="4 4"
                      dot={false}
                      legendType="none"
                      isAnimationActive={false}
                    />
                  </React.Fragment>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-5 text-[9px] font-black uppercase text-gray-600 tracking-wider">
            {LULC_LEGEND.map((cat) => (
              <div key={cat.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
