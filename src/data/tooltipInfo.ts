export const COMPARE_TOOLTIPS = {
  roads: {
    title: 'Road Network',
    content: 'Visualizes the primary transit infrastructure, specifically focusing on National and State highways across the selected district.',
  },
  nightlight: {
    title: 'Night Light Intensity',
    content: 'Measures nocturnal luminosity (VIIRS) to approximate urbanization, electrification levels, and economic activity.',
  },
  builtup: {
    title: 'Built Area',
    content: 'Represents human-made structures and impervious surfaces. Blue pixels show the reference state, while Red pixels show the comparison state.',
  },
  cropland: {
    title: 'Crops',
    content: 'Identifies agricultural land used for crop production. Blue pixels show the reference state, while Red pixels show the comparison state.',
  },
  forest: {
    title: 'Trees',
    content: 'Indicates forest coverage and areas with significant tree canopy. Blue pixels show the reference state, while Red pixels show the comparison state.',
  },
  lulc: {
    title: 'Land Use',
    content: 'Categorical representation of land surface cover, highlighting landscape transformations between two selected periods.',
  },
};

export const MULTI_TOOLTIPS = {
  roads: {
    title: 'Road Network',
    content: 'Displays the network of National and State highways for the specific district and time period selected.',
  },
  nightlight: {
    title: 'Nightlight Intensity',
    content: 'Categorical representation of nocturnal light levels (VIIRS), indicating levels of urbanization and electrification.',
  },
  ghsl: {
    title: 'Settlement',
    content: 'Classifies urban and rural settlement types based on population density and built-up area (GHS-SMOD).',
  },
  builtup: {
    title: 'Built-up Area',
    content: 'Highlights human-made structures and urban development for the specific period shown in the card.',
  },
  cropland: {
    title: 'Crops',
    content: 'Visualizes agricultural footprint and crop production areas for the specific period shown.',
  },
  forest: {
    title: 'Trees',
    content: 'Displays forest coverage and significant tree canopy for the specific period shown.',
  },
};
