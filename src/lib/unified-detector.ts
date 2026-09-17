import DeviceDetector from "device-detector-js";
import { lookupDevice } from "./google-device-db";
import { detectAndroidDevice } from "./android-model";

const dd = new DeviceDetector();

export type UnifiedResult = {
  brand: string | null;
  model: string | null;
  commercialName: string | null;
  osName: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
  deviceType: string;
  confidence: "高" | "中" | "低";
  source: string;
};

export async function detectDevice(
  ua: string,
  signals?: { screenWidth?: number; maxTouchPoints?: number },
): Promise<UnifiedResult> {
  const parsed = dd.parse(ua) as any;

  const modelMatch = ua.match(/Android[^;]*;\s*([^;()]+?)(?:\s+Build|\))/i);
  const rawCode = modelMatch ? modelMatch[1].trim() : null;

  let googleEntry: { brand: string; name: string } | null = null;
  if (rawCode) {
    googleEntry = await lookupDevice(rawCode);
  }

  const localResult = detectAndroidDevice(ua, signals);

  const finalBrand = googleEntry?.brand || localResult.brand || parsed?.device?.brand || null;
  const finalModel = rawCode || localResult.modelRaw || parsed?.device?.model || null;
  const finalCommercial = googleEntry?.name || localResult.commercialName || null;

  let confidence: "高" | "中" | "低" = "低";
  if (googleEntry) confidence = "高";
  else if (localResult.commercialName) confidence = "高";
  else if (finalBrand && finalModel) confidence = "中";

  return {
    brand: finalBrand,
    model: finalModel,
    commercialName: finalCommercial,
    osName: parsed?.os?.name || localResult.osName,
    osVersion: parsed?.os?.version || localResult.osVersion,
    browserName: parsed?.client?.name || "未知",
    browserVersion: parsed?.client?.version || "",
    deviceType: parsed?.device?.type || localResult.formFactor,
    confidence,
    source: googleEntry ? "google-play-db" : localResult.commercialName ? "local-map" : "ua-parser",
  };
}
