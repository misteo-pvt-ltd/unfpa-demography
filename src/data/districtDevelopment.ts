/**
 * districtDevelopment — per-district content for the dashboard's
 * "Development Activities" and "Insights" sections (StateDetails.tsx).
 *
 * Content is grounded in the platform's own satellite change-detection results
 * (the hotspot landmarks in Map/WhatHowWhy_v2/frontend_data.ts) and each
 * district's demographic narrative. Resolve districts with getRecord() so
 * name variants (Keonjhar/Kendujhar, Bolangir/Balangir, ...) work.
 */

export interface ContentCard {
  title: string;
  text: string;
}

export interface DistrictDevContent {
  activities: ContentCard[];
  insightsIntro: string;
  insights: ContentCard[];
}

export const DISTRICT_DEVELOPMENT: Record<string, DistrictDevContent> = {
  Anugul: {
    activities: [
      {
        title: 'Coal- and power-led industrialisation deepening',
        text: "Talcher hosts India's largest power-grade coalfield, with an estimated 168,000 workers in Anugul dependent on coal; studies suggest production will peak within the next decade then decline after 2040.",
      },
      {
        title: 'Major upgrades in road and rail logistics',
        text: 'The four-laning of NH-55 via Anugul is nearing completion, with stretches already operational.',
      },
      {
        title: 'Anugul railway station becoming a modern hub',
        text: 'Anugul station is being redeveloped under the Amrit Bharat / Amrit Station Scheme with about ₹25.4 crore sanctioned, and over half the physical work done by 2025.',
      },
      {
        title: 'Talcher coal rail corridors and new mines',
        text: "The Talcher coalfield inner and outer rail corridors (₹4,882 crore total) are being taken up to raise MCL's coal dispatch by rail to about 88% (162.8 MT) by 2029-30, with Phase-I already commissioned.",
      },
      {
        title: 'Mahanadi Coal Railway Phase-II',
        text: 'Phase-II of the Mahanadi Coal Railway (Balram-Jarpada-Tentuloi, about 54 km) is targeted for commissioning by December 2025, designed to evacuate around 58 MT of coal annually from the southern and central Talcher coalfield.',
      },
      {
        title: 'New district-level road and education projects',
        text: 'In July 2025, 34 projects worth about ₹44.9 crore were inaugurated and 19 more (about ₹8.9 crore) launched in Anugul, including the Kosala-Chhendipada and NH-55 to Patharagada road improvements and education upgrades.',
      },
    ],
    insightsIntro:
      "The demographic transformation of Anugul from 2011 to 2024 is a story of industrial-driven urbanisation. Satellite imagery and machine-learning analysis reveal how coal, power and aluminium have fundamentally reshaped the district's population dynamics and spatial distribution.",
    insights: [
      {
        title: 'Industrial expansion as the primary growth catalyst',
        text: "Coal mining and the NTPC Talcher/Kaniha power complexes dominate Anugul's demographic evolution, attracting sustained in-migration and creating concentrated population clusters around mining and industrial centres — transforming a predominantly agricultural district.",
      },
      {
        title: 'Concentrated growth in the Anugul-Talcher corridor',
        text: 'Change detection shows urbanisation in a highly concentrated pattern: the Anugul-Talcher belt and the NALCO smelter surrounds account for most new built-up area, while rural peripheries such as Chhendipada grow far more slowly.',
      },
      {
        title: 'Land-use transformation and agricultural decline',
        text: "Opencast mining and coalfield expansion have converted substantial tree and crop land to built and bare classes — a shift with direct implications for traditional livelihoods and the district's occupational profile.",
      },
      {
        title: 'Displacement and resettlement dynamics',
        text: 'Mining expansion has triggered significant population displacement, forcing affected families into new settlements and non-agricultural employment, and reshaping community structures across the coal belt.',
      },
      {
        title: 'Infrastructure enabling further growth',
        text: 'NH-55 four-laning, new coal rail corridors and station modernisation are enhancing connectivity — encouraging new settlements and small industry along the transport spines detected in the hotspot analysis.',
      },
    ],
  },

  Balangir: {
    activities: [
      {
        title: 'Lower Suktel irrigation project advancing',
        text: 'The long-pending Lower Suktel major irrigation project is progressing toward completion, expected to stabilise agriculture across a drought-prone district and reduce distress migration.',
      },
      {
        title: 'Kantabanji and Balangir rail corridors upgraded',
        text: 'Satellite change detection flags steady built-up growth along the Balangir and Kantabanji railway corridors, consistent with the Khurda Road-Balangir new rail line works improving connectivity to coastal Odisha.',
      },
      {
        title: 'Town-periphery housing and services growth',
        text: 'Balangir town and its periphery show the strongest settlement expansion in the district, with crops-to-built conversion the dominant land pathway as urban services consolidate.',
      },
      {
        title: 'Mixed industrial-residential footprints emerging',
        text: 'Small mixed industrial and residential footprints detected around the district headquarters signal early-stage diversification beyond agriculture.',
      },
    ],
    insightsIntro:
      'Balangir, part of the historically migration-prone KBK region, shows slow but steady demographic growth from 2011 to 2024, with change concentrated around its towns and railway corridors.',
    insights: [
      {
        title: 'Rail connectivity is the strongest change signal',
        text: 'The clearest built-up expansion tracks the railway corridors at Balangir and Kantabanji — connectivity, not industry, is the primary spatial driver of growth.',
      },
      {
        title: 'Agriculture still anchors the economy',
        text: 'Cropland-to-built conversion is modest and localised; the rural share of population remains dominant, keeping service delivery for dispersed villages the central planning challenge.',
      },
      {
        title: 'Out-migration tempers growth',
        text: "The district's below-state-average growth reflects continuing seasonal and long-term out-migration; irrigation investment such as Lower Suktel is the key counterweight.",
      },
      {
        title: 'Town-centric urbanisation',
        text: 'Urbanisation is concentrated in Balangir town rather than spread across secondary centres, arguing for focused urban infrastructure in the headquarters while strengthening rural services elsewhere.',
      },
    ],
  },

  Baleshwar: {
    activities: [
      {
        title: 'NH-16 corridor industrial growth',
        text: 'The Kolkata-Chennai NH-16 spine through Baleshwar continues to attract alloy, plastics and agro-processing units, consolidating the Balasore industrial estate belt.',
      },
      {
        title: 'Coastal defence and technology institutions',
        text: 'The Chandipur ITR and DRDO establishments, plus proposed expansions around them, sustain a stable technical workforce and associated housing demand.',
      },
      {
        title: 'Bhograi and coastal-block settlement growth',
        text: 'Change detection flags settlement expansion in the Bhograi coastal belt bordering West Bengal, driven by dense rural population and cross-border trade.',
      },
      {
        title: 'Forest-edge conversion under watch',
        text: 'Trees-to-built conversion is the dominant detected pathway, indicating urban and industrial development pressing on forest margins — a trend requiring planning attention.',
      },
    ],
    insightsIntro:
      'Baleshwar combines a dense coastal rural population with an industrialising NH-16 corridor, producing steady growth concentrated along transport spines from 2011 to 2024.',
    insights: [
      {
        title: 'Highway-led, not city-led, growth',
        text: 'Built-up expansion follows the NH-16 corridor rather than radiating from Balasore town alone — a linear urbanisation pattern typical of highway industrialisation.',
      },
      {
        title: 'Forest margins bear the conversion burden',
        text: 'The dominance of trees-to-built transitions distinguishes Baleshwar from crop-conversion districts, flagging ecological pressure at the forest edge.',
      },
      {
        title: 'Dense rural baseline sustains growth',
        text: 'Even with modest urbanisation, high rural density keeps absolute population growth significant, sustaining demand for schools, health and flood-resilient infrastructure.',
      },
      {
        title: 'Cyclone exposure shapes settlement risk',
        text: "The coastal blocks where settlement is expanding are also the district's most cyclone-exposed — growth and hazard overlap that disaster planning must address.",
      },
    ],
  },

  Bargarh: {
    activities: [
      {
        title: 'Rice-bowl agro-processing expansion',
        text: "Bargarh, Odisha's rice bowl on the Hirakud command area, continues to add rice mills and agro-processing capacity, reinforcing its role as a food-grain hub.",
      },
      {
        title: 'Bargarh Road rail corridor growth',
        text: 'Change detection shows built-up expansion around the Bargarh Road railway corridor, aligning with freight and passenger upgrades on the Sambalpur-Jharsuguda axis.',
      },
      {
        title: 'Sohela and peri-urban settlement growth',
        text: 'Sohela and other block towns show peri-urban expansion onto farmland, the classic signature of prospering agricultural market towns.',
      },
      {
        title: 'Cement and mineral-based industry',
        text: 'Limestone-based cement capacity in the Bargarh belt sustains an industrial employment base alongside agriculture.',
      },
    ],
    insightsIntro:
      "Bargarh's trajectory from 2011 to 2024 is that of a prosperous agricultural district urbanising gently through its market towns rather than through heavy industry.",
    insights: [
      {
        title: 'Farm prosperity drives town growth',
        text: 'Irrigated agriculture underwrites the growth of market towns; crops-to-built conversion around Bargarh and Sohela reflects agricultural surplus translating into urban services.',
      },
      {
        title: 'Balanced, multi-town urbanisation',
        text: 'Unlike single-centre districts, change is spread across several block towns, suggesting infrastructure investment should be similarly distributed.',
      },
      {
        title: 'Farmland conversion needs management',
        text: 'Urban expansion onto prime irrigated farmland is the main land-use tension; protecting the command area while accommodating town growth is the planning balance.',
      },
      {
        title: 'Moderate growth, stable structure',
        text: 'Population growth tracks the state average with no displacement shocks, giving planners a stable base for incremental service expansion.',
      },
    ],
  },

  Baudh: {
    activities: [
      {
        title: 'Settlement growth around Boudh town',
        text: 'Detected change concentrates around Boudh town and its periphery, with rangeland and crop conversion marking gradual urban consolidation.',
      },
      {
        title: 'Mahanadi bridge and road connectivity',
        text: 'Improved bridging and road links across the Mahanadi are shortening access to Sonepur and Sambalpur, gradually integrating Baudh into regional markets.',
      },
      {
        title: 'Rural housing and services programmes',
        text: 'Government housing and rural infrastructure programmes account for much of the dispersed new built-up signal across blocks.',
      },
      {
        title: 'Agro-based livelihoods strengthening',
        text: 'Paddy and horticulture value-chain initiatives remain the main economic development thread in this predominantly rural district.',
      },
    ],
    insightsIntro:
      'Baudh is one of Odisha\'s smallest and most rural districts; its 2011-2024 change signal is modest, dispersed, and centred on the district town.',
    insights: [
      {
        title: 'Slow, town-centred urbanisation',
        text: 'Almost all detected built-up growth clusters around Boudh town — the district remains overwhelmingly rural with a single urban anchor.',
      },
      {
        title: 'Connectivity is the binding constraint',
        text: 'Distance from rail and major highways caps industrial prospects; road and bridge investment is the highest-leverage development lever.',
      },
      {
        title: 'Stable population, low displacement',
        text: 'With no mining or heavy industry, Baudh avoids displacement dynamics; growth planning is about incremental service quality, not managing booms.',
      },
      {
        title: 'Rangeland conversion as the quiet signal',
        text: 'Rangeland-to-built transitions dominate — low-intensity settlement expansion rather than dramatic land-use upheaval.',
      },
    ],
  },

  Bhadrak: {
    activities: [
      {
        title: 'Dhamra Port expansion and LNG terminal',
        text: 'Dhamra Port continues to expand cargo capacity, and the adjacent LNG regasification terminal anchors an emerging coastal industrial-energy cluster clearly visible in the change detection.',
      },
      {
        title: 'Industrial build-out along the coast',
        text: 'Satellite analysis flags industrial construction around Dhamra and Chandbali, marking the arrival of port-linked logistics and processing units.',
      },
      {
        title: 'NH-16 and rail connectivity upgrades',
        text: 'Bhadrak station upgrades and NH-16 improvements strengthen the district\'s role as the gateway between coastal Odisha and Kolkata.',
      },
      {
        title: 'Aquaculture and delta agriculture',
        text: 'Brackish-water aquaculture continues to spread across the delta blocks, changing coastal land and water use patterns.',
      },
    ],
    insightsIntro:
      'Bhadrak\'s 2011-2024 story is the emergence of a port-energy economy at Dhamra layered onto a dense deltaic agricultural base.',
    insights: [
      {
        title: 'Port gravity is reshaping the coast',
        text: 'Dhamra Port and the LNG terminal are pulling employment, logistics and settlement toward the coast — a new growth pole distinct from Bhadrak town.',
      },
      {
        title: 'Twin-anchor spatial structure',
        text: 'The district now grows around two anchors — the NH-16/rail axis at Bhadrak town and the port cluster at Dhamra — requiring connective infrastructure between them.',
      },
      {
        title: 'Delta density meets industrial change',
        text: 'High rural density in the delta means even modest industrial land take affects many households; land and livelihood transitions need careful handling.',
      },
      {
        title: 'Climate exposure of new assets',
        text: 'The very coast attracting investment is among the most cyclone- and surge-exposed in India, making resilient design of port-linked growth essential.',
      },
    ],
  },

  Cuttack: {
    activities: [
      {
        title: 'Choudwar industrial area revival',
        text: 'The Choudwar industrial belt shows renewed construction activity in the change analysis, with new units on the old industrial estate footprint.',
      },
      {
        title: 'Cuttack station and urban transport upgrades',
        text: 'Cuttack railway station modernisation and ring-road improvements are reinforcing the twin-city transport frame shared with Bhubaneswar.',
      },
      {
        title: 'Peri-urban growth at Salipur and beyond',
        text: 'Detected settlement expansion at Salipur and other periphery blocks marks the outward spread of the Cuttack urban region into its rural hinterland.',
      },
      {
        title: 'Riverfront and heritage-city projects',
        text: 'Mahanadi riverfront development and heritage-precinct upgrades in the old city aim to renew the core while growth shifts to the fringes.',
      },
    ],
    insightsIntro:
      'Cuttack, the historic core of the Bhubaneswar-Cuttack twin city, grew steadily from 2011 to 2024 with change concentrated on its industrial estates and expanding periphery.',
    insights: [
      {
        title: 'Twin-city integration drives growth',
        text: "Cuttack's demographic momentum is inseparable from the Bhubaneswar agglomeration; commuting corridors and shared infrastructure bind the two urban economies.",
      },
      {
        title: 'Periphery outpaces the core',
        text: 'Built-up expansion at Salipur and fringe blocks outstrips the saturated old city — classic metropolitan spillover requiring peri-urban service planning.',
      },
      {
        title: 'Industrial legacy being repurposed',
        text: 'Choudwar\'s renewed activity shows brownfield industrial land absorbing new investment, a more sustainable path than greenfield conversion.',
      },
      {
        title: 'Forest-edge conversion on the fringe',
        text: 'Trees-to-built transitions on the urban margins flag the environmental cost of outward growth along the Mahanadi frame.',
      },
    ],
  },

  Deogarh: {
    activities: [
      {
        title: 'Deogarh town consolidation',
        text: 'The district town and Reamal block show the main detected settlement growth, gradual densification of a small administrative centre.',
      },
      {
        title: 'Road links to Sambalpur and Angul',
        text: 'Improvements to the NH-49 corridor and district roads are shortening access to the neighbouring industrial districts, positioning Deogarh as a quiet hinterland.',
      },
      {
        title: 'Hydro and irrigation assets',
        text: 'Small hydro and irrigation schemes around the Rengali system support agriculture, the district\'s primary livelihood.',
      },
      {
        title: 'Eco-tourism potential at Pradhanpat',
        text: 'Waterfall and forest eco-tourism development remains a stated growth avenue for a district rich in natural assets.',
      },
    ],
    insightsIntro:
      'Deogarh is among Odisha\'s least populous districts; 2011-2024 change is gentle, town-centred and agriculture-anchored.',
    insights: [
      {
        title: 'Smallest-scale urban dynamics',
        text: 'Detected growth is limited to Deogarh town and Reamal periphery — the district remains one of the most rural in the state.',
      },
      {
        title: 'Hinterland position, spillover potential',
        text: 'Sitting between Sambalpur and Angul\'s industrial economies, Deogarh\'s prospects hinge on connectivity that lets it share their growth without their displacement pressures.',
      },
      {
        title: 'Stable demographics ease planning',
        text: 'Low growth and no industrial shocks make service-quality upgrades, not capacity races, the planning focus.',
      },
      {
        title: 'Land conversion is minimal',
        text: 'Crop and rangeland conversion signals are among the smallest statewide, preserving the agricultural land base.',
      },
    ],
  },

  Dhenkanal: {
    activities: [
      {
        title: 'Mixed industrial-residential growth',
        text: 'Change detection flags mixed industrial and residential footprints near Dhenkanal town, consistent with steel-ancillary and agro-industrial units along the NH-55 corridor.',
      },
      {
        title: 'Kamakhyanagar sub-regional growth',
        text: 'Kamakhyanagar and its periphery form a second detected growth cluster, strengthening the district\'s twin-node urban structure.',
      },
      {
        title: 'NH-55 corridor improvements',
        text: 'Four-laning works on the Cuttack-Sambalpur NH-55 through Dhenkanal are improving the district\'s position between the coastal and western economies.',
      },
      {
        title: 'Sal forest and elephant-corridor management',
        text: 'Development in Dhenkanal proceeds alongside significant elephant corridors; infrastructure alignment increasingly accounts for wildlife passage.',
      },
    ],
    insightsIntro:
      'Dhenkanal grew moderately from 2011 to 2024, its change signal split between the NH-55 corridor around the district town and the Kamakhyanagar node.',
    insights: [
      {
        title: 'Corridor position is the core asset',
        text: 'Sitting on the NH-55 between Cuttack and Angul, Dhenkanal captures pass-through industrial investment without hosting heavy extraction itself.',
      },
      {
        title: 'Two-node urban system',
        text: 'Dhenkanal town and Kamakhyanagar grow in parallel, suggesting infrastructure plans should treat the district as a twin-centre system.',
      },
      {
        title: 'Rangeland conversion dominates',
        text: 'Rangeland-to-built transitions lead the land-use signal — lower-conflict conversion than farmland or forest loss.',
      },
      {
        title: 'Wildlife-development interface',
        text: 'Growth corridors overlap elephant ranges; the district is a test case for reconciling connectivity investment with wildlife movement.',
      },
    ],
  },

  Gajapati: {
    activities: [
      {
        title: 'Paralakhemundi town and rail corridor growth',
        text: 'The district\'s main detected change centres on Paralakhemundi town and its railway corridor, marking gradual consolidation of the administrative hub.',
      },
      {
        title: 'Horticulture and cashew value chains',
        text: 'Cashew, pineapple and turmeric processing initiatives anchor livelihood development across the hill blocks.',
      },
      {
        title: 'Hill-road connectivity programmes',
        text: 'Rural road construction into the Eastern Ghats blocks continues to be the main infrastructure thrust in a terrain-constrained district.',
      },
      {
        title: 'Vegetation transitions under monitoring',
        text: 'Satellite analysis shows significant vegetation-class shifts (trees to rangeland) without built expansion, reflecting shifting cultivation and forest dynamics.',
      },
    ],
    insightsIntro:
      'Gajapati, a hill district with a large tribal population, shows one of the gentlest urbanisation signals in the state, centred almost entirely on Paralakhemundi.',
    insights: [
      {
        title: 'Single-town urban system',
        text: 'Paralakhemundi is the only significant urban node; the district\'s development question is rural service delivery across dispersed hill settlements.',
      },
      {
        title: 'Ecological change without construction',
        text: 'The dominant detected transitions are vegetation shifts, not building — land dynamics here are agro-ecological rather than urban.',
      },
      {
        title: 'Connectivity as social infrastructure',
        text: 'Hill-road investment does more for welfare outcomes (health, education access) than for industrial attraction — the right metric for evaluating it.',
      },
      {
        title: 'Out-migration pressure persists',
        text: 'Slow local job creation sustains out-migration; horticulture value addition is the most realistic counter-strategy.',
      },
    ],
  },

  Ganjam: {
    activities: [
      {
        title: 'Berhampur urban region expansion',
        text: 'The Berhampur-Chhatrapur-Gopalpur triangle continues to consolidate as south Odisha\'s metropolitan anchor, with detected growth at Chhatrapur and Hinjili.',
      },
      {
        title: 'Gopalpur port and industrial park',
        text: 'Gopalpur port expansion and the adjacent industrial park (including TATA\'s facilities) anchor coastal industrial employment.',
      },
      {
        title: 'NH-16 and rail doubling works',
        text: 'Highway and rail capacity works along the Chennai corridor reinforce Ganjam\'s position as Odisha\'s southern gateway.',
      },
      {
        title: 'Return-migration absorption',
        text: 'As one of India\'s highest out-migration districts, Ganjam\'s development programmes increasingly focus on absorbing returning workers into local industry and services.',
      },
    ],
    insightsIntro:
      'Ganjam, Odisha\'s second-most-populous district, combines the Berhampur urban economy with one of the country\'s strongest labour out-migration streams.',
    insights: [
      {
        title: 'Migration defines the demography',
        text: 'Large-scale out-migration (notably to Surat) suppresses resident growth despite high natural increase — remittances, not local wages, drive much household welfare.',
      },
      {
        title: 'Berhampur as the southern counterweight',
        text: 'The Berhampur region is the only urban system outside the Bhubaneswar belt with metropolitan potential; investing in it rebalances the state\'s urban geography.',
      },
      {
        title: 'Vegetation recovery signals',
        text: 'Uniquely, parts of Ganjam show rangeland-to-trees transitions — vegetation recovery alongside coastal industrial growth.',
      },
      {
        title: 'Coastal hazard and dense settlement',
        text: 'Dense coastal blocks remain highly cyclone-exposed (Phailin\'s landfall zone); resilience retrofitting is a permanent agenda.',
      },
    ],
  },

  Jagatsinghapur: {
    activities: [
      {
        title: 'Paradip refinery and petrochemical expansion',
        text: 'The IOCL Paradip refinery complex — clearly flagged in the change detection — continues to add petrochemical capacity, anchoring one of eastern India\'s largest industrial investments.',
      },
      {
        title: 'Paradip port capacity growth',
        text: 'Paradip Port\'s cargo expansion projects sustain construction and logistics employment across Kujang and Erasama blocks.',
      },
      {
        title: 'Industrial-corridor township growth',
        text: 'Detected settlement expansion at Jagatsinghpur town, Kujang and Erasama tracks the workforce housing spreading around the port-refinery cluster.',
      },
      {
        title: 'Coastal protection works',
        text: 'Saline embankment and coastal protection programmes continue across the delta blocks, defending dense settlement and farmland.',
      },
    ],
    insightsIntro:
      'Jagatsinghapur pairs a compact, dense delta population with the Paradip port-refinery complex — the strongest single industrial gravity point on Odisha\'s coast.',
    insights: [
      {
        title: 'Port-refinery cluster dominates change',
        text: 'The IOCL complex and port surrounds account for the bulk of detected new built-up area — a single-cluster industrial geography.',
      },
      {
        title: 'Trees-to-built at the industrial edge',
        text: 'Forest and plantation loss at the expanding industrial margin is the district\'s principal land-use cost.',
      },
      {
        title: 'Small district, high stakes',
        text: 'With little land to spare, competition between industry, aquaculture, agriculture and settlement is sharper here than anywhere else on the coast.',
      },
      {
        title: 'Surge-zone industrialisation',
        text: 'The 1999 super-cyclone\'s landfall district now hosts critical energy infrastructure — resilience standards for new assets are non-negotiable.',
      },
    ],
  },

  Jajapur: {
    activities: [
      {
        title: 'Kalinganagar steel cluster build-out',
        text: 'The Kalinganagar industrial complex (Tata Steel and associated units) continues its multi-phase expansion, with industrial build-out flagged around the Sukinda valley.',
      },
      {
        title: 'Sukinda chromite operations',
        text: 'The Sukinda valley — hosting most of India\'s chromite — sustains mining employment and associated settlement detected in the periphery analysis.',
      },
      {
        title: 'Jajpur town and corridor growth',
        text: 'Jajpur town and the NH-16/rail corridor show steady settlement expansion linking the district to the coastal economic spine.',
      },
      {
        title: 'Skill and resettlement programmes',
        text: 'Industrial-area skill centres and resettlement colonies remain central to managing the workforce transition around Kalinganagar.',
      },
    ],
    insightsIntro:
      'Jajapur\'s 2011-2024 trajectory is driven by the Kalinganagar steel cluster and Sukinda mining valley — among the most significant industrial geographies in eastern India.',
    insights: [
      {
        title: 'Steel-cluster gravity',
        text: 'Kalinganagar\'s expansion is the district\'s defining economic event, pulling migrant workers and reshaping the southern blocks\' settlement pattern.',
      },
      {
        title: 'Mining valley environmental load',
        text: 'Chromite extraction in Sukinda carries well-documented environmental burdens; detected vegetation transitions there warrant continued monitoring.',
      },
      {
        title: 'Dual economy in one district',
        text: 'A dense agricultural delta north of the highway coexists with heavy industry to the south — two planning regimes in one district.',
      },
      {
        title: 'Displacement legacy shapes politics of land',
        text: 'Kalinganagar\'s resettlement history makes land acquisition and rehabilitation quality the decisive factor in future expansion.',
      },
    ],
  },

  Jharsuguda: {
    activities: [
      {
        title: 'Vedanta smelter and power complex',
        text: 'The Vedanta Jharsuguda aluminium smelter — one of the world\'s largest — and its captive power plants anchor the district economy, with surrounding growth flagged in the analysis.',
      },
      {
        title: 'MCL coal mining at Belpahar',
        text: 'MCL\'s Belpahar and adjacent opencast operations continue to expand, with mine-edge settlement change detected at Brajrajnagar and Banaharpali.',
      },
      {
        title: 'Airport-led connectivity',
        text: 'Veer Surendra Sai Airport has established Jharsuguda as western Odisha\'s air gateway, supporting industrial logistics and business travel.',
      },
      {
        title: 'Rail hub reinforcement',
        text: 'Jharsuguda junction\'s capacity works reinforce its role as the coal-belt\'s principal rail node.',
      },
    ],
    insightsIntro:
      'Jharsuguda is Odisha\'s most industrialised small district: aluminium, coal and power give it one of the highest urbanisation levels in the state.',
    insights: [
      {
        title: 'Highest industrial intensity per km²',
        text: 'Smelter, mines and power plants compress heavy industry into a small area — Jharsuguda\'s per-capita industrial footprint leads the state.',
      },
      {
        title: 'Mine-town settlement dynamics',
        text: 'Brajrajnagar and Belpahar exemplify coal-town growth: expanding workforce settlement pressed against active mine boundaries.',
      },
      {
        title: 'Rangeland absorbs the expansion',
        text: 'Rangeland-to-built dominates transitions, though air and water quality — not land class — are the binding environmental constraints.',
      },
      {
        title: 'Diversification imperative',
        text: 'Dependence on coal-power-aluminium makes the district prosperous but exposed; the airport and logistics assets are the seeds of diversification.',
      },
    ],
  },

  Kalahandi: {
    activities: [
      {
        title: 'Lanjigarh alumina refinery operations',
        text: 'Vedanta\'s Lanjigarh alumina refinery and its phased expansion remain the district\'s largest industrial presence, with industrial build-out flagged nearby.',
      },
      {
        title: 'Bhawanipatna town growth',
        text: 'The district headquarters shows steady peri-urban expansion, consolidating administrative and market functions.',
      },
      {
        title: 'Irrigation expansion in the Indravati command',
        text: 'Upper Indravati systems continue to convert once drought-prone tracts into double-cropped farmland — the quiet transformation of the old "Kalahandi syndrome" districts.',
      },
      {
        title: 'Rice and cotton value chains',
        text: 'Paddy procurement infrastructure and a growing cotton belt add agro-industrial employment.',
      },
    ],
    insightsIntro:
      'Kalahandi\'s 2011-2024 change combines a single industrial anchor at Lanjigarh with agriculture steadily strengthened by Indravati irrigation.',
    insights: [
      {
        title: 'From scarcity narrative to farm surplus',
        text: 'Irrigation has flipped parts of Kalahandi into rice-surplus territory — the district\'s demographic stability reflects this agrarian consolidation.',
      },
      {
        title: 'Industrial enclave dynamics',
        text: 'Lanjigarh functions as an enclave: substantial local impact around the refinery, limited district-wide industrial spillover so far.',
      },
      {
        title: 'Vegetation change beyond the refinery',
        text: 'Detected vegetation transitions across hill blocks reflect forest-agriculture dynamics rather than construction.',
      },
      {
        title: 'Two-track planning need',
        text: 'The refinery corridor needs industrial-township governance; the rest of the district needs agrarian services — one policy does not fit both.',
      },
    ],
  },

  Kandhamal: {
    activities: [
      {
        title: 'Phulbani and Baliguda town growth',
        text: 'The two principal towns show the district\'s main detected settlement change, gradual consolidation in an otherwise deeply rural hill district.',
      },
      {
        title: 'Turmeric GI and spice value chains',
        text: 'Kandhamal turmeric\'s GI tag underpins processing and marketing initiatives that anchor tribal livelihood development.',
      },
      {
        title: 'Hill connectivity programmes',
        text: 'All-weather road construction across the Eastern Ghats blocks remains the central infrastructure effort.',
      },
      {
        title: 'Community forest resource rights',
        text: 'CFR recognition under the Forest Rights Act is reshaping forest governance and livelihood security across the district.',
      },
    ],
    insightsIntro:
      'Kandhamal, a predominantly tribal hill district, shows a gentle change signal centred on its two towns, with land dynamics dominated by forest and shifting-cultivation cycles.',
    insights: [
      {
        title: 'Rural-first demography',
        text: 'With minimal urbanisation, development outcomes hinge on rural health, education and road access rather than town growth.',
      },
      {
        title: 'Forest-livelihood interdependence',
        text: 'Detected vegetation transitions track podu and forest-produce cycles; livelihood policy and forest policy are inseparable here.',
      },
      {
        title: 'Value addition over extraction',
        text: 'Turmeric and spice processing offer the clearest path to local income growth without land-use disruption.',
      },
      {
        title: 'Connectivity dividend is social',
        text: 'Road investment pays off primarily in service access and market linkage for farm produce — the right lens for appraisal.',
      },
    ],
  },

  Kendrapara: {
    activities: [
      {
        title: 'Delta-town network growth',
        text: 'Detected settlement change spreads across Pattamundai, Marshaghai, Mahakalapada and Aul — a distributed delta-town pattern rather than single-centre growth.',
      },
      {
        title: 'Industrial build-out at the margins',
        text: 'Early industrial construction signals near the district\'s edges reflect spillover from the Paradip corridor.',
      },
      {
        title: 'Coastal embankment and resilience works',
        text: 'Saline embankment reconstruction and cyclone-shelter networks remain the backbone of public investment in this surge-prone delta.',
      },
      {
        title: 'Bhitarkanika eco-tourism',
        text: 'Managed tourism around Bhitarkanika\'s mangroves grows steadily, adding a conservation-linked income stream.',
      },
    ],
    insightsIntro:
      'Kendrapara is a dense deltaic district where 2011-2024 change is distributed across many small towns, shaped everywhere by water and coastal risk.',
    insights: [
      {
        title: 'Polycentric delta urbanisation',
        text: 'Growth spreads across block towns rather than concentrating — infrastructure must follow a networked, not hub, model.',
      },
      {
        title: 'Out-migration from a full delta',
        text: 'Limited land and recurrent flooding sustain out-migration; local growth depends on services and resilience, not land-hungry industry.',
      },
      {
        title: 'Mangrove buffer as capital',
        text: 'Bhitarkanika\'s mangroves are the district\'s storm buffer; their integrity is development infrastructure, not just conservation.',
      },
      {
        title: 'Erosion frontier at Satabhaya',
        text: 'Coastal erosion has already displaced villages — Kendrapara hosts India\'s early climate-relocation experience, with lessons for the whole coast.',
      },
    ],
  },

  Kendujhar: {
    activities: [
      {
        title: 'Joda-Barbil iron-ore corridor expansion',
        text: 'The Joda-Barbil-Banspani cluster — flagged repeatedly in the change detection — continues to expand with mining, beneficiation and workforce settlement.',
      },
      {
        title: 'Banspani rail and slurry logistics',
        text: 'Iron-ore evacuation capacity via the Banspani rail head and slurry pipelines keeps growing with steel-demand-led output.',
      },
      {
        title: 'DMF-funded social infrastructure',
        text: 'Kendujhar\'s District Mineral Foundation — among India\'s largest — funds hospitals, schools and water projects across the mining belt.',
      },
      {
        title: 'Kendujhar town administrative growth',
        text: 'The district headquarters grows steadily as the services counterpart to the northern mining economy.',
      },
    ],
    insightsIntro:
      'Kendujhar\'s demography from 2011 to 2024 is written by iron ore: the Joda-Barbil corridor concentrates workforce settlement while the south remains agrarian and tribal.',
    insights: [
      {
        title: 'Mining corridor as the growth engine',
        text: 'Banspani workforce settlement and the Joda-Barbil surrounds dominate detected change — a textbook extractive-corridor geography.',
      },
      {
        title: 'North-south divide',
        text: 'The industrial north and tribal-agrarian south have diverging needs; district averages hide both, and planning must be zone-specific.',
      },
      {
        title: 'Rangeland conversion around mines',
        text: 'Mine-edge expansion converts rangeland more than farmland, but dust, water and forest impacts extend beyond the converted pixels.',
      },
      {
        title: 'DMF as transformation finance',
        text: 'Mineral revenues give Kendujhar rare fiscal space to convert extraction into durable human-capital gains — the central governance test.',
      },
    ],
  },

  Khordha: {
    activities: [
      {
        title: 'Bhubaneswar metropolitan expansion',
        text: 'The capital region continues rapid growth — the change analysis flags the airport surrounds, Tamando and the NH-16 south-east corridor as the strongest expansion fronts.',
      },
      {
        title: 'Airport growth and aerocity plans',
        text: 'Biju Patnaik International Airport\'s terminal expansion and surrounding commercial development anchor the city\'s south-western growth.',
      },
      {
        title: 'IT, education and institutional campuses',
        text: 'Info Valley, university campuses and government institutional expansion keep pushing the urban frontier outward.',
      },
      {
        title: 'Metro and mobility investment',
        text: 'The Bhubaneswar metro project and bus-network modernisation aim to structure the region\'s mobility ahead of further growth.',
      },
    ],
    insightsIntro:
      'Khordha, home to Bhubaneswar, is Odisha\'s demographic engine: the fastest-growing, most urbanised district, with 2011-2024 change concentrated along its expanding capital-region corridors.',
    insights: [
      {
        title: 'The state\'s primary growth pole',
        text: 'Khordha absorbs the largest share of Odisha\'s urban population growth; its planning quality effectively sets the state\'s urban trajectory.',
      },
      {
        title: 'Corridor-led sprawl',
        text: 'Expansion follows NH-16 and the airport axis rather than infilling — transit and trunk-infrastructure alignment will decide whether growth stays efficient.',
      },
      {
        title: 'Farmland at the frontier',
        text: 'Crops-to-built dominates conversions on the fringe; peri-urban farmland governance is the district\'s sharpest land question.',
      },
      {
        title: 'Regional responsibility',
        text: 'As the twin-city core, Khordha\'s decisions ripple into Cuttack, Puri and beyond — metropolitan-scale coordination is essential.',
      },
    ],
  },

  Koraput: {
    activities: [
      {
        title: 'NALCO Damanjodi alumina complex',
        text: 'The NALCO refinery at Damanjodi and its bauxite linkages remain the district\'s industrial anchor, with mixed industrial-residential growth detected around the plateau towns.',
      },
      {
        title: 'HAL and defence manufacturing at Sunabeda',
        text: 'HAL\'s engine division sustains a stable high-skill enclave, one of south Odisha\'s largest formal employers.',
      },
      {
        title: 'Jeypore-Koraput twin-town growth',
        text: 'Jeypore and Koraput towns both show detected periphery expansion, forming the district\'s urban dumbbell.',
      },
      {
        title: 'Coffee and millet missions',
        text: 'Koraput coffee and the millet mission build climate-suited, tribal-led value chains across the uplands.',
      },
    ],
    insightsIntro:
      'Koraput\'s change signal combines industrial enclaves (NALCO, HAL) with twin-town growth at Koraput-Jeypore, set within a largely tribal upland landscape.',
    insights: [
      {
        title: 'Enclave industrialisation',
        text: 'Damanjodi and Sunabeda are high-productivity islands; spreading their linkages into the local economy remains the unfinished agenda.',
      },
      {
        title: 'Twin-town urban system',
        text: 'Koraput and Jeypore split administrative and commercial roles — coordinated planning of the pair beats treating either alone.',
      },
      {
        title: 'Upland agro-identity as asset',
        text: 'Coffee, millets and tribal produce give the district a distinctive value-chain path that doesn\'t depend on land-heavy industry.',
      },
      {
        title: 'Vegetation dynamics dominate land change',
        text: 'Outside the towns, detected transitions are vegetation shifts tied to shifting cultivation — livelihood transition, not construction.',
      },
    ],
  },

  Malkangiri: {
    activities: [
      {
        title: 'Gurupriya bridge and Swabhiman Anchal integration',
        text: 'The Gurupriya bridge ended the cut-off status of Swabhiman Anchal, and road-building through the area continues to integrate long-isolated villages.',
      },
      {
        title: 'Malkangiri town growth',
        text: 'The district headquarters shows the main detected settlement expansion as administration, markets and security infrastructure consolidate.',
      },
      {
        title: 'Irrigation from the Balimela system',
        text: 'Balimela reservoir-linked irrigation and lift schemes expand cultivable command in the district\'s valleys.',
      },
      {
        title: 'New airstrip connectivity',
        text: 'The Malkangiri airstrip commissioning opens the remotest district to air access for the first time.',
      },
    ],
    insightsIntro:
      'Malkangiri, long Odisha\'s most isolated district, is in an integration phase: 2011-2024 change tracks new connectivity reaching a predominantly tribal population.',
    insights: [
      {
        title: 'Connectivity is the transformation',
        text: 'Bridges, roads and the airstrip are doing here what industry does elsewhere — every detected growth signal follows new access.',
      },
      {
        title: 'Town-anchored change',
        text: 'Malkangiri town absorbs most new construction; the interior remains dispersed hamlets where services must travel to people.',
      },
      {
        title: 'Post-conflict development window',
        text: 'Improved security has unlocked normal development; sustaining trust through visible service delivery is strategy, not just administration.',
      },
      {
        title: 'Watch crops-and-forest conversion',
        text: 'Crops-to-built and trees-to-built signals around the town are early; guiding them now is cheaper than correcting sprawl later.',
      },
    ],
  },

  Mayurbhanj: {
    activities: [
      {
        title: 'Baripada eastern-fringe expansion',
        text: 'The district\'s clearest detected growth is Baripada\'s eastern fringe, consolidating the north Odisha regional centre.',
      },
      {
        title: 'Similipal conservation-tourism balance',
        text: 'Similipal\'s management — biosphere, tiger reserve, eco-tourism — shapes land policy across the district\'s core.',
      },
      {
        title: 'Sal seed, tussar and forest-produce value chains',
        text: 'Forest-produce processing and tussar sericulture anchor tribal livelihood programmes.',
      },
      {
        title: 'NH and rail links to the steel belt',
        text: 'Connectivity to Jamshedpur and the Kolkata corridor supports agro-forest trade and out-commuting.',
      },
    ],
    insightsIntro:
      'Mayurbhanj, Odisha\'s largest district by area and a major tribal homeland, shows measured growth centred on Baripada with land dynamics ruled by the forest.',
    insights: [
      {
        title: 'Forest-first land system',
        text: 'Trees-to-rangeland transitions dominate detected change — forest dynamics, not construction, drive the district\'s land story.',
      },
      {
        title: 'Baripada as the single counter-magnet',
        text: 'One regional centre serves a vast district; strengthening Baripada\'s services shortens everyone\'s distance to opportunity.',
      },
      {
        title: 'Conservation economy potential',
        text: 'Similipal positions Mayurbhanj for a conservation-linked economy — tourism, NTFP brands, carbon — instead of extractive shortcuts.',
      },
      {
        title: 'Steady demography, dispersed need',
        text: 'Moderate growth across dispersed settlements makes mobile and outreach services more effective than fixed-node expansion.',
      },
    ],
  },

  Nabarangpur: {
    activities: [
      {
        title: 'Umerkote agro-town growth',
        text: 'Umerkote\'s periphery shows the district\'s main detected expansion, reflecting its role as the maize-belt market centre.',
      },
      {
        title: 'Maize processing investment',
        text: 'India\'s densest maize district is adding drying, storage and processing capacity to move up the value chain.',
      },
      {
        title: 'Indravati command agriculture',
        text: 'Irrigation from the Indravati system underpins cropping intensification across the plateau.',
      },
      {
        title: 'Rural road densification',
        text: 'PMGSY-era road building continues to knit together a dispersed, high-birth-rate rural population.',
      },
    ],
    insightsIntro:
      'Nabarangpur grows faster than most of south Odisha on the strength of a young population and a maize-led agrarian economy.',
    insights: [
      {
        title: 'Agrarian growth pole',
        text: 'Maize has done for Nabarangpur what minerals did elsewhere — market-town growth at Umerkote is agricultural surplus urbanising.',
      },
      {
        title: 'Youthful age structure',
        text: 'High natural increase keeps the district young; education and skilling capacity must run ahead of the demographic wave.',
      },
      {
        title: 'Value chains before land conversion',
        text: 'Processing investment raises incomes without large land take — the detected built-up signal remains modest and town-centred.',
      },
      {
        title: 'Tribal-majority inclusion lens',
        text: 'Growth policies must be measured by tribal household outcomes, the district\'s majority and its historic deprivation frontier.',
      },
    ],
  },

  Nayagarh: {
    activities: [
      {
        title: 'Daspalla and western-block growth',
        text: 'Detected change centres on Daspalla\'s periphery — modest settlement consolidation on the district\'s forested western side.',
      },
      {
        title: 'Bhubaneswar hinterland integration',
        text: 'Improved roads toward the capital pull Nayagarh\'s eastern blocks into the metropolitan commuting and supply orbit.',
      },
      {
        title: 'Cashew and horticulture belts',
        text: 'Cashew processing and vegetable supply to the capital anchor the district\'s agro-economy.',
      },
      {
        title: 'Mahanadi bank management',
        text: 'Riverbank protection and lift irrigation along the Mahanadi frame support the northern agricultural blocks.',
      },
    ],
    insightsIntro:
      'Nayagarh sits quietly beside the capital region: 2011-2024 change is limited, with the district functioning increasingly as Bhubaneswar\'s green hinterland.',
    insights: [
      {
        title: 'Hinterland, not periphery',
        text: 'Proximity to Bhubaneswar is an asset if captured deliberately — food supply, weekend tourism, spill-over housing — rather than passively.',
      },
      {
        title: 'Minimal construction signal',
        text: 'Much of the detected change involves vegetation shifts without new built pixels — the land base remains largely intact.',
      },
      {
        title: 'Forest-agriculture mosaic',
        text: 'The western forests and eastern farms form a stable mosaic; development should thicken value chains, not thin the mosaic.',
      },
      {
        title: 'Commuter-belt future',
        text: 'As capital-region transport improves, eastern Nayagarh\'s residential attractiveness will grow — zoning ahead of it will pay.',
      },
    ],
  },

  Nuapada: {
    activities: [
      {
        title: 'Khariar town consolidation',
        text: 'Khariar and its periphery show the district\'s main detected growth, a small-town anchor for the western blocks.',
      },
      {
        title: 'Lower Indra and irrigation works',
        text: 'Irrigation projects continue to harden a drought-prone agricultural base long associated with distress migration.',
      },
      {
        title: 'Road links on the Chhattisgarh border',
        text: 'Border-corridor road improvements integrate Nuapada with Raipur-side markets.',
      },
      {
        title: 'MGNREGA-led land and water works',
        text: 'Watershed structures and farm ponds dominate the rural works portfolio, building drought resilience plot by plot.',
      },
    ],
    insightsIntro:
      'Nuapada, on the dry western border, shows a modest change signal; its demographic story is still shaped by rainfall risk and seasonal migration.',
    insights: [
      {
        title: 'Water security is population policy',
        text: 'Every irrigation gain directly reduces out-migration pressure — the tightest development-demography link in the district.',
      },
      {
        title: 'Small-town anchors',
        text: 'Khariar\'s growth shows the value of strengthening secondary towns where a single large centre is absent.',
      },
      {
        title: 'Cross-border economics',
        text: 'Chhattisgarh\'s proximity shapes wages and markets; planning should treat the border as an interface, not an edge.',
      },
      {
        title: 'Low conversion, high vulnerability',
        text: 'Land conversion is minimal, but climate sensitivity keeps the population\'s welfare fragile — resilience beats expansion as the metric.',
      },
    ],
  },

  Puri: {
    activities: [
      {
        title: 'Shree Mandir Parikrama heritage corridor',
        text: 'The Jagannath temple heritage-corridor project has reshaped Puri\'s core, upgrading pilgrim capacity and the town\'s infrastructure.',
      },
      {
        title: 'Pilgrim-city infrastructure surge',
        text: 'Detected growth at Pipli, Satyabadi and the Puri periphery tracks hospitality, housing and services expanding along the Bhubaneswar-Puri axis.',
      },
      {
        title: 'Coastal highway and connectivity',
        text: 'Puri-Konark marine drive upgrades and rail improvements reinforce the tourism triangle.',
      },
      {
        title: 'Blue-flag beach and tourism quality',
        text: 'Beach management certification and waterfront improvements push Puri toward higher-value, better-managed tourism.',
      },
    ],
    insightsIntro:
      'Puri\'s 2011-2024 change is tourism- and pilgrimage-led: corridor growth toward Bhubaneswar and heritage-driven renewal in the temple town.',
    insights: [
      {
        title: 'Faith economy as growth engine',
        text: 'Pilgrimage underwrites Puri\'s urban economy; managing peak flows (Rath Yatra scale) is the defining capacity question.',
      },
      {
        title: 'Axis urbanisation toward the capital',
        text: 'The Pipli-Satyabadi growth belt is fusing Puri into the capital region — corridor governance matters as much as town planning.',
      },
      {
        title: 'Trees-to-built on the coastal fringe',
        text: 'Casuarina and plantation loss to construction along the shore trades storm protection for real estate — a trend to control.',
      },
      {
        title: 'Heritage-resilience double mandate',
        text: 'A World Heritage-calibre core on a cyclone coast: every investment must serve both conservation and resilience.',
      },
    ],
  },

  Rayagada: {
    activities: [
      {
        title: 'JK Paper Mills expansion',
        text: 'The JK Paper complex at Rayagada — flagged in the change analysis — continues to anchor the district\'s formal industry with plantation linkages.',
      },
      {
        title: 'Alumina and mineral processing',
        text: 'Alumina refinery operations and associated infrastructure in the district\'s south add a second industrial thread.',
      },
      {
        title: 'Rayagada town and Bissamcuttack growth',
        text: 'Detected mixed industrial-residential expansion around Rayagada town and Bissamcuttack marks the urban consolidation of the valley corridor.',
      },
      {
        title: 'Rail doubling on the Vizag corridor',
        text: 'Capacity works on the Vizianagaram-Rayagada line strengthen the district\'s freight position toward Visakhapatnam.',
      },
    ],
    insightsIntro:
      'Rayagada blends valley-corridor industry (paper, alumina) with tribal uplands, its 2011-2024 change concentrated along the rail valley.',
    insights: [
      {
        title: 'Valley-corridor industrialisation',
        text: 'Industry and towns line the rail valley while uplands stay agrarian — a corridor-versus-hinterland structure that planning must bridge.',
      },
      {
        title: 'Plantation-industry land loop',
        text: 'Paper-mill plantations create a managed land economy; detected rangeland and crop conversions sit inside this industrial-agro loop.',
      },
      {
        title: 'Tribal-majority context',
        text: 'Industrial benefits must be measured against tribal-household outcomes; the Niyamgiri experience shapes the district\'s consent politics.',
      },
      {
        title: 'Southern gateway role',
        text: 'Orientation toward Visakhapatnam gives Rayagada an inter-state economic identity distinct from coastal Odisha.',
      },
    ],
  },

  Sambalpur: {
    activities: [
      {
        title: 'Aditya Aluminium Lapanga complex',
        text: 'Hindalco\'s Aditya Aluminium smelter at Lapanga — flagged in the change detection — anchors the district\'s heavy-industry belt.',
      },
      {
        title: 'Sambalpur junction rail expansion',
        text: 'Junction remodelling and corridor works reinforce Sambalpur\'s role as western Odisha\'s rail hub.',
      },
      {
        title: 'Burla-Hirakud knowledge and power cluster',
        text: 'The university-medical-hydropower cluster at Burla shows steady detected growth, complementing the industrial economy.',
      },
      {
        title: 'Redhakhol corridor growth',
        text: 'Settlement expansion at Redhakhol tracks the NH-55 corridor\'s strengthening between Sambalpur and Angul.',
      },
    ],
    insightsIntro:
      'Sambalpur pairs a metropolitan-scale service centre with aluminium-and-power industry, making it western Odisha\'s pivot from 2011 to 2024.',
    insights: [
      {
        title: 'Regional capital of the west',
        text: 'Education, health and rail concentrate here; Sambalpur\'s service reach spans a dozen districts and shapes their outcomes.',
      },
      {
        title: 'Industry beside heritage waters',
        text: 'Smelter growth beside Hirakud demands standing vigilance on water and air — the reservoir is both asset and constraint.',
      },
      {
        title: 'Crops-to-built along corridors',
        text: 'Farmland conversion follows the NH-55 and rail axes; corridor zoning will decide the efficiency of the district\'s expansion.',
      },
      {
        title: 'Twin-node structure with Burla',
        text: 'Sambalpur city and Burla form complementary nodes — one commercial, one institutional — best planned as a single urban system.',
      },
    ],
  },

  Subarnapur: {
    activities: [
      {
        title: 'Binka and river-town growth',
        text: 'Detected change centres on Binka and the Mahanadi river towns, gentle consolidation in a handloom-and-agriculture district.',
      },
      {
        title: 'Bomkai handloom cluster support',
        text: 'GI-tagged Sonepuri/Bomkai weaving clusters receive design, credit and market support as the district\'s signature industry.',
      },
      {
        title: 'Irrigation from Hirakud command',
        text: 'Canal command agriculture keeps the district\'s rice economy stable.',
      },
      {
        title: 'Road links to Balangir and Boudh',
        text: 'Inter-district road improvements stitch Subarnapur into the western Odisha grid.',
      },
    ],
    insightsIntro:
      'Subarnapur is a small, stable, craft-and-agriculture district; 2011-2024 change is light and concentrated on its river towns.',
    insights: [
      {
        title: 'Craft economy as identity',
        text: 'Handloom is the district\'s comparative advantage — value protection (GI, e-commerce) beats land-based industrial chasing.',
      },
      {
        title: 'Farmland conversion minimal',
        text: 'Crops-to-built signals are small and town-adjacent; the agricultural base remains essentially intact.',
      },
      {
        title: 'Stable demography',
        text: 'Near-average growth with no shocks lets planning focus on quality — schools, health, weaving incomes — over capacity.',
      },
      {
        title: 'River-town heritage line',
        text: 'The Mahanadi towns hold heritage value that modest tourism circuits could monetise without disruption.',
      },
    ],
  },

  Sundargarh: {
    activities: [
      {
        title: 'Rourkela Steel Plant modernisation',
        text: 'SAIL\'s Rourkela Steel Plant continues capacity modernisation, anchoring the district\'s industrial city.',
      },
      {
        title: 'Koira-Bonai mining range expansion',
        text: 'The Koira iron-ore range and MCL\'s Basundhara-Garjanbahal coal complex — both flagged in the change detection — keep expanding output and workforce settlement.',
      },
      {
        title: 'Hockey World Cup legacy infrastructure',
        text: 'The Birsa Munda stadium and associated city upgrades gave Rourkela international-event infrastructure now serving sport and tourism.',
      },
      {
        title: 'Rail corridor and connectivity works',
        text: 'Coal and ore evacuation corridors, plus Rourkela station redevelopment, reinforce the district\'s logistics spine.',
      },
    ],
    insightsIntro:
      'Sundargarh runs on two engines — the Rourkela steel city and the Koira-Basundhara mining belts — with 2011-2024 change strongest around mines and the urban fringe.',
    insights: [
      {
        title: 'Mining-belt settlement surge',
        text: 'The largest detected footprints sit beside the Koira range and MCL coal mines — workforce settlement racing alongside extraction.',
      },
      {
        title: 'Steel-city maturity, fringe growth',
        text: 'Rourkela\'s core is mature; growth now spills to its fringe and satellite blocks, calling for metropolitan-area planning.',
      },
      {
        title: 'Tribal-district paradox',
        text: 'A Fifth Schedule district hosting heavy industry: benefit-sharing (DMF, employment, land justice) is the legitimacy test for every expansion.',
      },
      {
        title: 'Rangeland conversion at mine edges',
        text: 'Rangeland-to-built dominates conversions, but the deeper environmental ledger — forests, rivers, dust — extends past the pixel classes.',
      },
    ],
  },
};
