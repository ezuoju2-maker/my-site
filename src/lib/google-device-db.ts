const DEVICES_URL = "https://cdn.jsdelivr.net/gh/bsthen/device-models/devices.json";

type DeviceEntry = { brand: string; name: string };
type DeviceMap = Record<string, DeviceEntry>;

let cache: DeviceMap | null = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function lookupDevice(code: string): Promise<DeviceEntry | null> {
  const now = Date.now();
  if (!cache || now - cacheTime > CACHE_TTL) {
    try {
      const res = await fetch(DEVICES_URL);
      if (res.ok) {
        cache = (await res.json()) as DeviceMap;
        cacheTime = now;
      }
    } catch {
      // keep old cache
    }
  }
  if (!cache) return null;
  return cache[code.toUpperCase()] ?? cache[code] ?? null;
}
