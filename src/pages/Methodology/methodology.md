# Methodology

**Odisha Demographic & Data Intelligence Platform**
*Population Estimation & Dynamics for Odisha using Geospatial & AI/ML Methods*

---

## 1. Overview

The Odisha Demographic & Data Intelligence Platform provides annual, district-level population estimates and projections for all 30 districts of Odisha from 2011 through 2036, together with land-use change analysis, settlement classification, and satellite-derived urbanisation indicators. Because India's decennial census provides demographic ground truth only once per decade (and the 2021 enumeration was delayed), the platform answers a question the census alone cannot: *how is Odisha's population changing year by year, where exactly is that change happening, and what is driving it?*

To answer this, the platform fuses three complementary analytical pipelines built on open data and open-source tooling:

1. **Satellite-based population estimation (2011–2025)**: machine-learning regression models trained on Census 2011 ground truth that estimate annual population from satellite-derived proxies (built-up area, nighttime lights, vegetation indices, land surface temperature) at district and sub-district levels.
2. **Population prediction (2026–2036)**: an annual district-level prediction model that learns each district's growth trajectory from the estimated historical series and projects it forward to 2036, validated against WorldPop gridded projections and the UNFPA's official projections.
3. **Land-use change detection and driver attribution**: a multi-signal change-detection pipeline that identifies the most significant settlement, industrial, mining, and transport-related land transformations in every district between 2016 and 2024, explaining *what* changed, *how*, and *why*.

All outputs are delivered through an interactive web application built on React and MapLibre GL, streaming Cloud-Optimized GeoTIFFs (COGs) and PMTiles.

---

## 2. Study Area

Odisha, on India's eastern coast, spans approximately **155,707 km²** and recorded a population of **41,974,218** in the 2011 Census across **30 districts** and numerous sub-districts (blocks/tehsils). The state's geography is highly heterogeneous, spanning coastal plains, central plateaus, and forested mountainous regions, producing two distinct demographic regimes that shape the analysis:

- **Coastal industrial and metropolitan corridors** (Khordha, Cuttack, Puri, Ganjam, Jajpur) characterised by rapid urbanisation around the Bhubaneswar agglomeration and the Paradip–Kalinganagar industrial belt, alongside exposure to cyclone and flood hazards.
- **Interior tribal and mining belts** (the KBK region, Kendujhar, Sundargarh, Mayurbhanj, Koraput, Rayagada) characterised by dispersed rural settlement, mining-driven workforce concentrations, and slower formal urbanisation.

This combination of resource-driven growth and persistent rural populations makes Odisha an ideal testbed for satellite-based demographic methods, and makes accurate, frequently updated population data critical for disaster risk reduction, planning, and equitable resource allocation.

---

## 3. Data Sources

The platform integrates census records, gridded population products, satellite imagery, settlement models, and infrastructure data:

| Category | Dataset | Resolution | Coverage / Years | Role |
|---|---|---|---|---|
| Census & administrative | **Census of India 2011** (Primary Census Abstract) | District / sub-district | 2011 | Ground truth for model training; calibration anchor; official areas and urban shares |
| Reference projections | **UNFPA official projections** (Bayesian approaches) | District / state | 2011–2036 | Independent cross-validation only (not used in fitting) |
| Boundaries | **GADM v4.1** (Level 2) administrative boundaries | Vector | Current | Zonal statistics and aggregation units |
| Gridded population | **WorldPop Global 2015–2030 Projections (R2025A v1)**, constrained, 1 km | 1 km | 2015–2030, annual | Independent validation of the estimated and predicted series |
| Multispectral imagery | **Landsat 5/7/8** | 30 m | 2011–2024 | Spectral indices (NDVI, NDBI, MNDWI, SAVI, EVI, BUI, UI, IBI) and Land Surface Temperature for ML estimation |
| Multispectral imagery | **Sentinel-2 L2A** | 10 m (60 m working) | 2016–2024 | Change detection, true-colour chips, before/after comparisons |
| Nighttime lights | **VIIRS Day/Night Band** | 500 m | 2012–2024 | Human activity, economic development, and electrification proxy |
| Land cover | **ESRI Land Cover** (10 m annual) | 10 m | 2017–2024 | LULC classification, transition analysis, built-expansion masks |
| Settlement model | **GHS-SMOD R2023A v2.0** (JRC, Degree of Urbanisation framework) | 1 km | 2010–2030 (5-yr epochs) | Settlement-type classification rasters (rural → urban centre, 8 classes) |
| Infrastructure | **OpenStreetMap** road, rail, industrial, and settlement features | Vector | Current | Accessibility covariates and hotspot driver attribution |

Imagery acquisition and preprocessing are performed in Google Earth Engine and the Microsoft Planetary Computer STAC catalogue, with all raster processing in Python (rasterio, rioxarray, xarray, GDAL, geopandas).

---

## 4. Pipeline 1: Satellite-Based Population Estimation (AI/ML)

### 4.1 Rationale

Built-up extent, nighttime light intensity, and related spectral signals are strong physical proxies for where people live and how settlement intensity changes. By learning the relationship between these signals and the Census 2011 counts, the models can estimate population for any year in which satellite imagery exists, filling the intercensal gap with annual estimates.

### 4.2 Feature engineering

Annual cloud-free composites were generated in Google Earth Engine for each year from 2011 to 2024. Preprocessing included radiometric calibration, atmospheric correction, cloud masking (with the cloud-cover threshold tightened from 10–20% to 3–5% to improve composite consistency), and SLC-off gap correction for Landsat 7. From these composites the pipeline derives a feature stack per administrative unit:

- **Spectral indices**: NDVI, NDBI, MNDWI, SAVI, EVI, TVI, BUI, UI, IBI (annual means via zonal statistics)
- **Land Surface Temperature (LST)**: annual mean
- **Nighttime lights (VIIRS DNB)**: radiance counts (2012 used as a proxy for the missing 2011 year)
- **VTLPI** (Vegetation–Temperature–Light Population Index): a composite of normalised DNB, normalised LST, and maximum NDVI
- **LULC class areas**: built-up, agricultural, forest, wasteland, and water area per unit

Zonal statistics were computed at two administrative levels, district (30 units) and sub-district, each stored as GeoJSON with yearly attribute columns, reprojected to UTM Zone 44N for area-true spatial analysis.

### 4.3 Feature selection

A Pearson correlation analysis against Census 2011 population guided feature selection. Built-up area (r = 0.65–0.70 across levels), nighttime lights (r = 0.79 at district level), and agricultural land showed strong positive correlations; forest and wasteland showed weak or negligible relationships. Low-correlation variables (e.g., BUI at r = 0.053, UI at r = 0.12 at the sub-district level) were removed, which improved model generalisation, confirming that noisy features degrade performance in sparse rural settlement contexts.

### 4.4 Models and validation strategy

Four non-linear ensemble regressors were trained and compared: **Random Forest**, **XGBoost**, **LightGBM**, and **CatBoost**. Two validation strategies were used to guard against spatial autocorrelation inflating apparent skill:

- **Leave-One-Out (LOO) cross-validation**: each administrative unit held out in turn.
- **Gridded block-wise spatial split**: the state partitioned into spatial blocks, with whole blocks held out, ensuring the model is tested on geographically unseen areas.

Models were trained on 2011 (the only full ground truth), then used to predict population for 2012–2025 from each year's satellite features. Predictions for 2021 were evaluated against official projected 2021 figures using R², RMSE, MAE, and MAPE.

### 4.5 Iterative refinement

The modelling proceeded through three documented iterations:

1. **Baseline district and sub-district models** established the workflow but showed weak temporal transfer (district-level 2021 R² of 0.40 for Random Forest).
2. **Iterative learning on predicted data** (training on previous years' predictions) was tested and *discontinued*: compounding errors degraded RMSE by 5–8% annually. Instead, the cloud-cover threshold adjustment substantially improved input raster quality, lifting CatBoost to **R² = 0.91** on the 2021 LOO evaluation with RMSE reduced by over 50% in some configurations.
3. **Final feature pruning** confirmed stable performance: a best 2021 sub-district score of CatBoost R² = 0.87, with MAPE in the 13–16% range for the strongest model–year combinations.

The final configuration uses CatBoost and LightGBM as the primary estimators, producing annual population estimates from 2011 to 2025 that are aggregated and reconciled across administrative levels. Estimated population is also disaggregated to a continuous grid (dasymetric redistribution) so that allocation remains consistent with administrative totals while revealing intra-district density patterns.

---

## 5. Pipeline 2: Population Prediction 2026–2036

### 5.1 Approach

Forward projections for 2026–2036 are produced by a district-level prediction model built on the historical series estimated under Pipeline 1 (2011–2025). Rather than importing external projections as inputs, the model learns each district's own demographic trajectory from the satellite-derived estimates and extends it forward year by year. External reference series, the WorldPop gridded projections and the UNFPA's official projections, are reserved strictly for independent validation.

### 5.2 Growth-rate modelling

A log-linear growth model is fitted independently for each district (and the state aggregate) by ordinary least squares on the log-transformed historical series:

> ln P(d, y) = aₐ + rₐ·y

The fitting window is restricted to the most recent years of the estimated series rather than the full 2011–2025 span. Because population growth in Odisha is decelerating, a rate fitted adjacent to the prediction region is more defensible than a long-run average that would over-weight the faster growth of the early 2010s.

### 5.3 Forward prediction

The fitted district rate rₐ is applied geometrically from the final estimated year:

> P(d, y) = P(d, 2025) · exp(rₐ · (y − 2025)),  y ∈ {2026, ..., 2036}

District predictions are reconciled with the state aggregate so the parts remain consistent with the whole. Because the underlying historical series is trained directly on Census 2011 ground truth, the full 2011–2036 trajectory remains anchored to the census baseline, and the per-district growth signal is preserved end to end.

### 5.4 Validation against reference series

The predicted series is compared year-by-year against two independent references: the **WorldPop Global 2015–2030 projections** (R2025A, calibrated to UN World Population Prospects 2024) over the overlapping years, and the **UNFPA's official projections** through 2036. Agreement levels and the residual methodological gap are reported in Section 7 and published alongside the data.

### 5.5 Derived indicators

From the combined estimated and predicted series (2011–2036) the platform computes, per district and year:

- **Density**: population divided by the official Census 2011 land area (persons/km²).
- **Year-on-year growth**: annual percentage change (null for 2011).
- **Urban/rural split**: the Census 2011 urban share, advanced linearly at Odisha's observed 2001→2011 urbanisation rate of **+0.17 percentage points per year**, applied to the modelled total. The urban and rural counts sum to the total by construction.

### 5.6 Settlement classification series

A parallel sub-pipeline converts the **GHS Settlement Model (SMOD)** rasters for 2010, 2015, 2020, 2025, and 2030 into per-district Cloud-Optimized GeoTIFFs. Tiles are mosaicked, reprojected from Mollweide to Web Mercator using **nearest-neighbour resampling** (mandatory for categorical data), clipped per district, and written through GDAL's COG driver for efficient HTTP-range streaming into the map client. The eight DEGURBA classes, from water and very-low-density rural through suburban, semi-dense urban, dense urban, and urban centre, let users watch the Degree of Urbanisation evolve across two decades.

---

## 6. Pipeline 3: Land-Use Change Detection & Driver Attribution (2016 → 2024)

### 6.1 Purpose

Population numbers describe *how much* change occurred; this pipeline shows *where* and *why*. It quantifies land-use change across all 30 districts between 2016 and 2024. This window was chosen because Sentinel-2 L2A reaches globally consistent quality only after late 2015, and an ~8-year span captures stable change while avoiding inter-annual classifier noise. The analysis focuses on the four spatial signatures of population change: settlement/housing growth, industrial footprint expansion, mining-induced workforce concentration, and transport-corridor development.

### 6.2 Image acquisition and compositing

For each district and endpoint year, Sentinel-2 L2A scenes are queried from the Planetary Computer STAC catalogue within the **post-monsoon October–February window** (minimising cloud contamination and paddy-phenology noise across Odisha's rice belt), filtered to <10% scene cloud cover. Pixel-level cloud masking uses the Scene Classification Layer, and a per-pixel **median composite**, robust to residual contamination, is computed per year. District-wide change scoring runs at a 60 m working resolution; each detected hotspot is then re-fetched at native 10 m for high-resolution visual verification.

### 6.3 Multi-signal change scoring

Five spectral indices (NDVI, NDBI, NDWI, MNDWI, BSI) are computed per year and differenced. Each delta is converted to a directional change magnitude matched to the demographic question (vegetation *loss*, built-up *gain*, bare-soil *gain*) and combined with a strict land-cover **built-expansion mask** (pixels that were not Built in 2016 and are Built in 2024, derived from the ESRI annual land cover product). Signals are robust-z-normalised (median/MAD, insensitive to the very outliers being detected) and linearly weighted, with land-cover transition (0.40) and NDBI gain (0.35) dominating. A water-exclusion mask suppresses reservoir drawdown/refill artefacts that would otherwise dominate districts with large dams.

### 6.4 Hotspot ranking and attribution

The change-score raster is aggregated to a 1 km grid, and non-maximum suppression with a 3 km minimum separation selects the **top five spatially distinct hotspots per district**, 150 across the state. Each hotspot receives a full attribution record:

- the **dominant land-cover transition** (with anthropogenic transitions prioritised) and a from-class area breakdown answering "what was here before";
- **nearby drivers**, merged from a curated registry of ~250 district-context features (mines, plants, smelters, urban centres, stations, ports) and live OpenStreetMap queries within a 10 km buffer;
- a **likely-cause narrative with a numeric confidence score**, upgraded when the nearest driver is consistent with the observed transition (e.g., a coal mine next to a Trees→Bare conversion);
- a **settlement-type tag** (residential, industrial, mining-adjacent, transport, mixed, or vegetation), assigned by a distance-weighted classifier with bias rules validated against ground knowledge. Crucially, hotspots with zero new built area are snapped to *vegetation*, preventing canopy loss in mining belts from masquerading as settlement growth.

Every hotspot ships with a native-resolution before/after image pair, an animated cross-fade comparison, and a driver-context map, powering the platform's "What / How / Why" exploratory interface.

---

## 7. Validation & Quality Assurance

The platform applies validation at every stage rather than as a single end check.

**Statistical evaluation of ML estimates.** All models are scored with R², RMSE, MAE, and MAPE under both Leave-One-Out and spatially blocked splits. Spatial blocking is the stricter test: it measures whether the model generalises to entirely unseen geography. The strongest configuration achieves a 2021 prediction score of R² = 0.91 (CatBoost, sub-district LOO), with year-by-year back-tests for 2012–2020 maintaining R² between 0.77 and 0.92.

**Independent cross-validation against official projections.** The full 2011–2036 series is compared year-by-year against the UNFPA's official projection series, produced using Bayesian approaches, an entirely independent methodology. The priority districts agree with the official reference to **within ±5% in every year**, with the aggregate tracking within 3.4% at maximum. The platform's series runs slightly conservative (implied state CAGR ~0.69%/yr vs ~0.81%/yr), a gap that reflects the differing fertility-decline assumptions of the two methodologies. Both trajectories are internally defensible, and the comparison is published with the data.

**Comparison with gridded population products.** District-year totals for the overlapping years are cross-checked against the WorldPop Global 2015–2030 projections (R2025A) for consistency of both levels and growth trajectories.

**Human-in-the-loop validation of change hotspots.** All hotspots from the initial multi-district batch were manually audited against ground knowledge of Odisha's geography. The audit drove three classifier improvements (the zero-built vegetation snap, nearest-per-category driver voting, and road down-weighting), after which the wrong-tag count fell from 8/40 to **0/40**. Cross-district sanity checks confirm independent priors: the state's largest residential hotspot sits on the Bhubaneswar fringe in Khordha, and the largest mining-adjacent footprint lands in Sundargarh's Bonai iron-ore belt.

**LULC accuracy assessment.** Classification outputs are validated through visual interpretation against high-resolution reference imagery and confusion-matrix analysis on stratified random samples.

---

## 8. Assumptions & Limitations

The platform is transparent about the boundaries of its methods:

- **Census 2011 is the only full-count anchor.** With the 2021 Census delayed, post-2011 estimates rest on modelled and satellite-derived signals validated against official projections rather than enumeration. The 2011 anchor is exact by construction; uncertainty grows with distance from it.
- **Projection uncertainty compounds toward 2036.** Terminal-year district estimates carry a reasonable 80% confidence band of roughly ±5–10%. Outputs are point estimates; formal uncertainty intervals are a planned extension.
- **The urbanisation rate is a uniform state-average assumption** (+0.17 pp/year). Real district rates vary (Khordha urbanised faster, Mayurbhanj slower), making this the largest known error source in the urban/rural split for districts far from the state average.
- **Current projections are totals, not age–sex cohorts.** A cohort-component extension using SRS fertility, mortality, and migration inputs is the natural follow-on for working-age, school-age, and elderly breakdowns.
- **Satellite proxies have physical limits.** Monsoon-season cloud cover requires seasonal median composites; VIIRS nightlights saturate in dense urban cores and under-detect low-intensity rural electrification; and the 60 m change-scoring resolution can miss transformations smaller than ~1 ha (mitigated by 10 m re-analysis at every hotspot).
- **Settlement-type tags are spatial proxies, not headcounts.** They are designed to be read alongside census and survey data, not to replace it.
- **Boundary vintage.** GADM polygons are a contemporary snapshot; Odisha's district boundaries have been largely stable since 2011, so residual boundary mismatch contributes at most a few percent to district totals.

---

## 9. Technology & Reproducibility

The full pipeline is built on open-source software. Data engineering uses Python (geopandas, rasterio/rioxarray, xarray, numpy, scikit-learn, XGBoost, LightGBM, CatBoost) with Google Earth Engine and Planetary Computer STAC APIs for imagery access. Geospatial assets are served as Cloud-Optimized GeoTIFFs and PMTiles from object storage and rendered client-side by a React + TypeScript frontend using MapLibre GL with COG and PMTiles protocols, and Recharts for analytics.

Reproducibility is engineered in: deterministic STAC query caching, fixed random seeds, deterministic grid layouts and median compositing, and idempotent pipeline runs that produce byte-identical outputs on re-execution. Batch processing across all 30 districts is resilient to upstream API outages through automated health-polling and retry orchestration. The methodology scripts (data ingestion, feature extraction, model training, calibration, and validation) are maintained as a documented repository, and the pipeline is parameterised so that extending it to additional districts or states requires only new boundary, census-anchor, and area dictionaries rather than structural code changes.

---

## 10. References

1. Census of India 2011, Primary Census Abstract, Odisha. Office of the Registrar General & Census Commissioner, India.
2. WorldPop Global 2015–2030 Population Projections, R2025A v1. University of Southampton. https://www.worldpop.org/
3. European Commission JRC, GHS Settlement Model grid R2023A v2.0 (Schiavina, Freire, MacManus, 2023). https://human-settlement.emergency.copernicus.eu/
4. Degree of Urbanisation (DEGURBA): Eurostat, FAO, ILO, OECD, UN-HABITAT, World Bank; UN Statistical Commission, 2020.
5. GADM, Database of Global Administrative Areas, v4.1. https://gadm.org/
6. ESA Copernicus Sentinel-2 L2A; USGS Landsat Collection 2; NOAA VIIRS DNB.
7. ESRI Land Cover, 10 m Annual Land Use Land Cover (Esri / Impact Observatory / Microsoft). https://livingatlas.arcgis.com/landcover/
8. Cloud-Optimized GeoTIFF specification. https://www.cogeo.org/
