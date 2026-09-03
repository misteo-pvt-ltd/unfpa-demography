# Data Catalogue

**Odisha Demographic & Data Intelligence Platform**

The platform integrates census records, satellite imagery, land cover products, settlement models, and infrastructure data to estimate, predict, and explain population dynamics across the 30 districts of Odisha. The table below lists every dataset used, what it provides, and the role it plays in the platform.

---

## Datasets Used

| # | Dataset | Source | Format | Years Used | Resolution / Granularity | Role in the Platform |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Census of India 2011 | Office of the Registrar General & Census Commissioner | CSV | 2011 | District / Sub-District | Demographic ground truth for model training; anchor for the full 2011-2036 series; official land areas and baseline urban shares |
| 2 | UNFPA Population Projections | UNFPA | Tabular | 2011 - 2036 | District / State | Independent validation of the estimated and predicted population series |
| 3 | Administrative Boundaries (GADM v4.1) | GADM | SHP / GeoJSON | Current | District | Analysis units for zonal statistics, aggregation, and map rendering |
| 4 | WorldPop Gridded Population (R2025A) | WorldPop, University of Southampton | GeoTIFF | 2015 - 2030 | 1 km | Independent validation of district population levels and growth trends |
| 5 | Landsat 5/7/8 Optical Imagery | USGS / NASA | GeoTIFF | 2011 - 2025 | 30 m | Annual spectral indices (NDVI, NDBI, MNDWI, SAVI, EVI, BUI, UI, IBI) and Land Surface Temperature as features for the ML population estimation models |
| 6 | Sentinel-2 L2A Optical Imagery | ESA Copernicus | JP2 / COG | 2016 - 2025 | 10 m | Land-use change detection, hotspot ranking, and before/after satellite comparisons |
| 7 | VIIRS Nighttime Lights (DNB) | NOAA / NASA | GeoTIFF | 2012 - 2026 | 500 m | Settlement intensity and electrification proxy; one of the strongest population predictors (r = 0.79) |
| 8 | ESRI Land Cover | Esri Living Atlas | GeoTIFF | 2017 - 2025 | 10 m | Land cover classes and built-up areas as model features; transition matrices and built-expansion masks for change analysis |
| 9 | GHS-SMOD Settlement Model (Degree of Urbanisation) | European Commission JRC | GeoTIFF | 2010 - 2030 | 1 km | Settlement-type classification layers (rural to urban centre) across five epochs |
| 10 | OpenStreetMap Infrastructure | OpenStreetMap | GeoJSON / SHP | Current | Vector | Roads, railways, mines, plants, and settlements used to attribute drivers and classify change hotspots |

---

## How the Datasets Map to Project Objectives

| Objective | Datasets Used | Proxy Indicators | Output in the Platform |
| --- | --- | --- | --- |
| **Population Dynamics** | Census 2011, Landsat, VIIRS, ESRI Land Cover | Built-up indices (NDBI, BUI, UI, IBI), nighttime light intensity, land cover areas, LST, vegetation indices | Annual district population estimates (2011-2025) and predictions (2026-2036), with density and growth statistics |
| **Urban/Rural Distribution** | Census 2011, GHS-SMOD, VIIRS, ESRI Land Cover | DEGURBA settlement classes, light intensity, built-up extent, Census baseline urban share | Urban/rural population split per district and year; Degree of Urbanisation map layers (2010-2030) |
| **Habitation Pattern** | Sentinel-2, ESRI Land Cover, OpenStreetMap | Spectral change signals, land cover transitions, built-expansion masks, proximity to infrastructure drivers | 150 attributed change hotspots (5 per district) with settlement-type tags, before/after imagery, and driver context maps |
| **Population Growth** | Estimation model outputs, WorldPop, UNFPA projections | Year-on-year change in the calibrated annual series | Annual growth rates and projected growth charts per district, validated against WorldPop and UNFPA references |

---

