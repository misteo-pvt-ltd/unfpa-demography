/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  POPULATION_GROWTH_DATA,
  AGE_DISTRIBUTION_DATA,
  PRIMARY_COLOR,
} from '../../data/comparativeData';

const AGE_COLORS = [
  '#FEF2E8', // Lightest
  '#FFCBA4',
  '#F58220', // Primary
  '#D66B12',
  '#A03900', // Darkest
];

interface ChartProps {
  height?: number | string;
  minimal?: boolean;
}

export const GrowthChart: React.FC<ChartProps> = ({
  height = '100%',
  minimal = false,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height as any}>
      <AreaChart
        data={POPULATION_GROWTH_DATA}
        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.2} />
            <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f0f0f0"
        />
        <XAxis
          dataKey="year"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          dy={10}
          hide={minimal}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          hide={minimal}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '12px',
          }}
        />
        <Area
          type="monotone"
          dataKey="population"
          stroke={PRIMARY_COLOR}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPop)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const AgeChart: React.FC<ChartProps> = ({
  height = '100%',
  minimal = false,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height as any}>
      <BarChart
        data={AGE_DISTRIBUTION_DATA}
        margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
      >
        <XAxis
          dataKey="group"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          dy={5}
          hide={minimal}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="percentage" radius={[4, 4, 4, 4]}>
          {AGE_DISTRIBUTION_DATA.map((_entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={AGE_COLORS[index % AGE_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
