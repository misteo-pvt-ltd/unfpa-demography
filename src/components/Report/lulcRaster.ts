/**
 * lulcRaster — renders a district's LULC COG (the same GeoTIFFs the dashboard
 * streams via maplibre-cog-protocol) to a colorized PNG data URL for the PDF
 * report. Reads a mid-resolution overview (~600px) so it's fast (~200ms/read),
 * and colorizes with the exact ESRI palette the dashboard uses
 * (MapSentinelQuaterly.LULC_RGBA).
 */
import { fromUrl } from 'geotiff';

// pixel value -> RGBA (dashboard palette)
const LULC_RGBA: Record<number, [number, number, number, number]> = {
  1: [65, 155, 223, 255], // Water #419BDF
  2: [57, 125, 73, 255], // Trees #397D49
  4: [122, 135, 198, 255], // Flooded vegetation #7A87C6
  5: [228, 150, 53, 255], // Crops #E49635
  7: [196, 40, 27, 255], // Built #C4281B
  8: [165, 155, 143, 255], // Bare #A59B8F
  9: [240, 240, 240, 255], // Snow/Ice
  10: [232, 232, 232, 255], // Clouds
  11: [223, 195, 90, 255], // Rangeland #DFC35A
};

const cogUrl = (district: string, year: string) => {
  const d = district.replace(/\s+/g, '').trim();
  return `${import.meta.env.VITE_REACT_DATA_URL}/lulc_yearly/${d}/${d}_lulc_${year}.tif`;
};

export interface LulcRasterImage {
  year: string;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render one year's LULC raster. Returns undefined on any failure (missing
 * COG, network error) so the report can degrade gracefully.
 */
export async function renderLulcRaster(
  district: string,
  year: string,
  targetWidth = 620,
): Promise<LulcRasterImage | undefined> {
  try {
    const tiff = await fromUrl(cogUrl(district, year));
    const count = await tiff.getImageCount();

    // choose the smallest overview that is still >= targetWidth wide
    let image = await tiff.getImage(0);
    for (let i = count - 1; i >= 0; i--) {
      const im = await tiff.getImage(i);
      if (im.getWidth() >= targetWidth) {
        image = im;
        break;
      }
    }

    const w = image.getWidth();
    const h = image.getHeight();
    const data = (await image.readRasters({ interleave: true })) as unknown as
      | Uint8Array
      | Uint16Array;

    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const c = LULC_RGBA[data[i] as number];
      if (c) {
        rgba[i * 4] = c[0];
        rgba[i * 4 + 1] = c[1];
        rgba[i * 4 + 2] = c[2];
        rgba[i * 4 + 3] = 255;
      }
      // else: leave transparent (nodata / outside district boundary)
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
    return { year, dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
  } catch {
    return undefined;
  }
}

/** First + latest LULC year rendered in parallel (2017 vs 2024). */
export async function renderLulcPair(
  district: string,
): Promise<{ before?: LulcRasterImage; after?: LulcRasterImage }> {
  const [before, after] = await Promise.all([
    renderLulcRaster(district, '2017'),
    renderLulcRaster(district, '2024'),
  ]);
  return { before, after };
}

export interface NtlRasterImage {
  year: string;
  dataUrl: string;
  mean: number;
  max: number;
}

/**
 * Aggregates quarterly NTL GeoTIFFs for a given year into an annual average map and calculates stats.
 */
export async function renderNtlAnnual(
  district: string,
  year: string,
  targetWidth = 620,
): Promise<NtlRasterImage | undefined> {
  const quarters = ['q1', 'q2', 'q3', 'q4'];
  const formattedDistrict = district.replace(/\s+/g, '').trim();

  try {
    const tiffs = await Promise.all(
      quarters.map(async (q) => {
        try {
          const url = `${import.meta.env.VITE_REACT_DATA_URL}/ntl/${formattedDistrict}/${formattedDistrict}_${year}_${q}_ntl.tif`;
          const tiff = await fromUrl(url);
          return tiff;
        } catch {
          return null;
        }
      })
    );

    const activeTiffs = tiffs.filter((t): t is Exclude<typeof t, null> => t !== null);
    if (activeTiffs.length === 0) return undefined;

    const images = await Promise.all(
      activeTiffs.map(async (tiff) => {
        const count = await tiff.getImageCount();
        let image = await tiff.getImage(0);
        for (let i = count - 1; i >= 0; i--) {
          const im = await tiff.getImage(i);
          if (im.getWidth() >= targetWidth) {
            image = im;
            break;
          }
        }
        return image;
      })
    );

    const w = images[0].getWidth();
    const h = images[0].getHeight();

    const rasters = await Promise.all(
      images.map(async (img) => {
        return (await img.readRasters({ interleave: true })) as unknown as Uint8Array | Float32Array;
      })
    );

    const rgba = new Uint8ClampedArray(w * h * 4);
    let totalSum = 0;
    let pixelCount = 0;
    let maxVal = 0;

    for (let i = 0; i < w * h; i++) {
      let sum = 0;
      let count = 0;

      for (let r = 0; r < rasters.length; r++) {
        const val = rasters[r][i];
        if (val != null && !isNaN(val) && val >= 0 && val !== -3.4028234663852886e+38) {
          sum += val;
          count++;
        }
      }

      if (count > 0) {
        const avg = sum / count;
        totalSum += avg;
        pixelCount++;
        if (avg > maxVal) maxVal = avg;

        if (avg <= 0.8) {
          rgba[i * 4] = 11;
          rgba[i * 4 + 1] = 46;
          rgba[i * 4 + 2] = 79;
          rgba[i * 4 + 3] = 255;
        } else if (avg <= 5) {
          rgba[i * 4] = 72;
          rgba[i * 4 + 1] = 72;
          rgba[i * 4 + 2] = 93;
          rgba[i * 4 + 3] = 255;
        } else if (avg <= 28) {
          rgba[i * 4] = 246;
          rgba[i * 4 + 1] = 234;
          rgba[i * 4 + 2] = 175;
          rgba[i * 4 + 3] = 255;
        } else {
          rgba[i * 4] = 254;
          rgba[i * 4 + 1] = 0;
          rgba[i * 4 + 2] = 0;
          rgba[i * 4 + 3] = 255;
        }
      } else {
        // Transparent outside district
        rgba[i * 4] = 0;
        rgba[i * 4 + 1] = 0;
        rgba[i * 4 + 2] = 0;
        rgba[i * 4 + 3] = 0;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.putImageData(new ImageData(rgba, w, h), 0, 0);

    return {
      year,
      dataUrl: canvas.toDataURL('image/png'),
      mean: pixelCount > 0 ? totalSum / pixelCount : 0,
      max: maxVal,
    };
  } catch {
    return undefined;
  }
}

/**
 * Loads LULC maps for all requested years.
 */
export async function renderLulcTimeline(
  district: string,
  years: string[] = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
): Promise<Record<string, LulcRasterImage>> {
  const results: Record<string, LulcRasterImage> = {};
  await Promise.all(
    years.map(async (y) => {
      const img = await renderLulcRaster(district, y);
      if (img) results[y] = img;
    })
  );
  return results;
}

/**
 * Loads Night Light maps and stats for all requested years.
 */
export async function renderNtlTimeline(
  district: string,
  years: string[] = ['2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026']
): Promise<Record<string, NtlRasterImage>> {
  const results: Record<string, NtlRasterImage> = {};
  await Promise.all(
    years.map(async (y) => {
      const img = await renderNtlAnnual(district, y);
      if (img) results[y] = img;
    })
  );
  return results;
}
