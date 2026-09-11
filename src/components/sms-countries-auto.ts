// 自动生成 - 由 scripts/sync-countries.mjs 维护
// 此文件初始为空，等待第一次同步填入数据。
// 手动编辑将被覆盖，请勿手动修改。

import type { SmsRegion } from "./sms-countries-data";

export type AutoCountry = {
  code: string;
  name: string;
  nameEn: string;
  dial: string;
  region: SmsRegion;
};

export const AUTO_COUNTRIES: AutoCountry[] = [];
