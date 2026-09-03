/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * mapSnapshot — lets the district report grab a PNG of the on-screen
 * MiniDistrictMap (maplibre) at export time. Only one mini-map is shown at a
 * time, so a module-level singleton is sufficient.
 *
 * The map must be created with `preserveDrawingBuffer: true` for toDataURL()
 * to return actual pixels (see MiniDistrictMap).
 */
let activeMap: any = null;

export const registerMiniMap = (map: any) => {
  activeMap = map;
};

export const unregisterMiniMap = (map: any) => {
  if (activeMap === map) activeMap = null;
};

const waitIdle = (map: any, timeout = 900): Promise<void> =>
  new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    try {
      map.once('idle', finish);
      map.triggerRepaint();
    } catch {
      finish();
    }
    setTimeout(finish, timeout);
  });

/**
 * Capture the current district mini-map as a PNG data URL. Temporarily paints
 * the district fills a light grey so the shapes read on a white page, then
 * restores the on-screen styling. Returns undefined if no map is available.
 */
export async function captureDistrictMap(): Promise<string | undefined> {
  const map = activeMap;
  if (!map) return undefined;
  const LAYER = 'district-fill';
  let prevColor: any;
  let prevOpacity: any;
  try {
    try {
      prevColor = map.getPaintProperty(LAYER, 'fill-color');
      prevOpacity = map.getPaintProperty(LAYER, 'fill-opacity');
      map.setPaintProperty(LAYER, 'fill-color', '#E6EAF0');
      map.setPaintProperty(LAYER, 'fill-opacity', 1);
    } catch {
      /* layer may not exist yet — capture whatever is there */
    }

    await waitIdle(map);
    const url = map.getCanvas().toDataURL('image/png');

    // restore on-screen appearance
    try {
      if (prevColor !== undefined)
        map.setPaintProperty(LAYER, 'fill-color', prevColor);
      if (prevOpacity !== undefined)
        map.setPaintProperty(LAYER, 'fill-opacity', prevOpacity);
    } catch {
      /* noop */
    }

    // a blank/near-empty capture is worse than none
    return url && url.length > 2000 ? url : undefined;
  } catch {
    return undefined;
  }
}
