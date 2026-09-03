export interface DemographicData {
  year: number;
  population: number;
}

export interface AgeGroupData {
  group: string;
  percentage: number;
}

export interface InfrastructureMetric {
  name: string;
  value: number;
  change: number;
  trend: number[];
  iconType: 'water' | 'electricity' | 'health';
}

export type LayerType = 'density' | 'pop' | 'deg_urbanisation' | 'growth' | 'population' | 'lulc' | 'nightlight' | 'buildup' | 'urbansprawl' | 'age_cohort';

export interface DistrictRanking {
  rank: number;
  name: string;
  value: string;
  change: string;
}

export type ViewType = 'Demographics' | 'Healthcare' | 'Migration';
