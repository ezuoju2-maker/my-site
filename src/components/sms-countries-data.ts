import { isValidIso } from "./iso-codes";

export type SmsRegion =
  | "east_asia"
  | "southeast_asia"
  | "south_asia"
  | "central_asia"
  | "west_asia"
  | "europe"
  | "north_america"
  | "south_america"
  | "africa"
  | "oceania";

export const REGION_LABELS: Record<SmsRegion, string> = {
  east_asia: "东亚",
  southeast_asia: "东南亚",
  south_asia: "南亚",
  central_asia: "中亚",
  west_asia: "西亚 / 中东",
  europe: "欧洲",
  north_america: "北美 / 加勒比",
  south_america: "南美",
  africa: "非洲",
  oceania: "大洋洲",
};

export type SmsCountry = {
  code: string;
  name: string;
  nameEn: string;
  dial: string;
  region: SmsRegion;
};

const c = (
  code: string,
  name: string,
  nameEn: string,
  dial: string,
  region: SmsRegion,
): SmsCountry => ({ code, name, nameEn, dial, region });

export const ALL_COUNTRIES: SmsCountry[] = [
  // === 东亚 ===
  c("cn", "中国", "China", "+86", "east_asia"),
  c("hk", "中国香港", "Hong Kong", "+852", "east_asia"),
  c("mo", "中国澳门", "Macau", "+853", "east_asia"),
  c("tw", "中国台湾", "Taiwan", "+886", "east_asia"),
  c("jp", "日本", "Japan", "+81", "east_asia"),
  c("kr", "韩国", "South Korea", "+82", "east_asia"),
  c("kp", "朝鲜", "North Korea", "+850", "east_asia"),
  c("mn", "蒙古", "Mongolia", "+976", "east_asia"),

  // === 东南亚 ===
  c("sg", "新加坡", "Singapore", "+65", "southeast_asia"),
  c("my", "马来西亚", "Malaysia", "+60", "southeast_asia"),
  c("th", "泰国", "Thailand", "+66", "southeast_asia"),
  c("vn", "越南", "Vietnam", "+84", "southeast_asia"),
  c("ph", "菲律宾", "Philippines", "+63", "southeast_asia"),
  c("id", "印度尼西亚", "Indonesia", "+62", "southeast_asia"),
  c("mm", "缅甸", "Myanmar", "+95", "southeast_asia"),
  c("kh", "柬埔寨", "Cambodia", "+855", "southeast_asia"),
  c("la", "老挝", "Laos", "+856", "southeast_asia"),
  c("bn", "文莱", "Brunei", "+673", "southeast_asia"),
  c("tl", "东帝汶", "Timor-Leste", "+670", "southeast_asia"),

  // === 南亚 ===
  c("in", "印度", "India", "+91", "south_asia"),
  c("pk", "巴基斯坦", "Pakistan", "+92", "south_asia"),
  c("bd", "孟加拉国", "Bangladesh", "+880", "south_asia"),
  c("lk", "斯里兰卡", "Sri Lanka", "+94", "south_asia"),
  c("np", "尼泊尔", "Nepal", "+977", "south_asia"),
  c("bt", "不丹", "Bhutan", "+975", "south_asia"),
  c("mv", "马尔代夫", "Maldives", "+960", "south_asia"),
  c("af", "阿富汗", "Afghanistan", "+93", "south_asia"),

  // === 中亚 ===
  c("kz", "哈萨克斯坦", "Kazakhstan", "+7", "central_asia"),
  c("uz", "乌兹别克斯坦", "Uzbekistan", "+998", "central_asia"),
  c("tm", "土库曼斯坦", "Turkmenistan", "+993", "central_asia"),
  c("kg", "吉尔吉斯斯坦", "Kyrgyzstan", "+996", "central_asia"),
  c("tj", "塔吉克斯坦", "Tajikistan", "+992", "central_asia"),

  // === 西亚 / 中东 ===
  c("tr", "土耳其", "Turkey", "+90", "west_asia"),
  c("ir", "伊朗", "Iran", "+98", "west_asia"),
  c("iq", "伊拉克", "Iraq", "+964", "west_asia"),
  c("sy", "叙利亚", "Syria", "+963", "west_asia"),
  c("lb", "黎巴嫩", "Lebanon", "+961", "west_asia"),
  c("jo", "约旦", "Jordan", "+962", "west_asia"),
  c("il", "以色列", "Israel", "+972", "west_asia"),
  c("ps", "巴勒斯坦", "Palestine", "+970", "west_asia"),
  c("sa", "沙特阿拉伯", "Saudi Arabia", "+966", "west_asia"),
  c("ye", "也门", "Yemen", "+967", "west_asia"),
  c("om", "阿曼", "Oman", "+968", "west_asia"),
  c("ae", "阿联酋", "UAE", "+971", "west_asia"),
  c("qa", "卡塔尔", "Qatar", "+974", "west_asia"),
  c("bh", "巴林", "Bahrain", "+973", "west_asia"),
  c("kw", "科威特", "Kuwait", "+965", "west_asia"),
  c("ge", "格鲁吉亚", "Georgia", "+995", "west_asia"),
  c("am", "亚美尼亚", "Armenia", "+374", "west_asia"),
  c("az", "阿塞拜疆", "Azerbaijan", "+994", "west_asia"),

  // === 欧洲 ===
  c("gb", "英国", "United Kingdom", "+44", "europe"),
  c("fr", "法国", "France", "+33", "europe"),
  c("de", "德国", "Germany", "+49", "europe"),
  c("it", "意大利", "Italy", "+39", "europe"),
  c("es", "西班牙", "Spain", "+34", "europe"),
  c("pt", "葡萄牙", "Portugal", "+351", "europe"),
  c("nl", "荷兰", "Netherlands", "+31", "europe"),
  c("be", "比利时", "Belgium", "+32", "europe"),
  c("lu", "卢森堡", "Luxembourg", "+352", "europe"),
  c("ch", "瑞士", "Switzerland", "+41", "europe"),
  c("at", "奥地利", "Austria", "+43", "europe"),
  c("dk", "丹麦", "Denmark", "+45", "europe"),
  c("no", "挪威", "Norway", "+47", "europe"),
  c("se", "瑞典", "Sweden", "+46", "europe"),
  c("fi", "芬兰", "Finland", "+358", "europe"),
  c("is", "冰岛", "Iceland", "+354", "europe"),
  c("ie", "爱尔兰", "Ireland", "+353", "europe"),
  c("pl", "波兰", "Poland", "+48", "europe"),
  c("cz", "捷克", "Czechia", "+420", "europe"),
  c("sk", "斯洛伐克", "Slovakia", "+421", "europe"),
  c("hu", "匈牙利", "Hungary", "+36", "europe"),
  c("ro", "罗马尼亚", "Romania", "+40", "europe"),
  c("bg", "保加利亚", "Bulgaria", "+359", "europe"),
  c("gr", "希腊", "Greece", "+30", "europe"),
  c("hr", "克罗地亚", "Croatia", "+385", "europe"),
  c("si", "斯洛文尼亚", "Slovenia", "+386", "europe"),
  c("rs", "塞尔维亚", "Serbia", "+381", "europe"),
  c("ba", "波黑", "Bosnia and Herzegovina", "+387", "europe"),
  c("me", "黑山", "Montenegro", "+382", "europe"),
  c("mk", "北马其顿", "North Macedonia", "+389", "europe"),
  c("al", "阿尔巴尼亚", "Albania", "+355", "europe"),
  c("ua", "乌克兰", "Ukraine", "+380", "europe"),
  c("by", "白俄罗斯", "Belarus", "+375", "europe"),
  c("ru", "俄罗斯", "Russia", "+7", "europe"),
  c("md", "摩尔多瓦", "Moldova", "+373", "europe"),
  c("lt", "立陶宛", "Lithuania", "+370", "europe"),
  c("lv", "拉脱维亚", "Latvia", "+371", "europe"),
  c("ee", "爱沙尼亚", "Estonia", "+372", "europe"),
  c("mt", "马耳他", "Malta", "+356", "europe"),
  c("cy", "塞浦路斯", "Cyprus", "+357", "europe"),
  c("ad", "安道尔", "Andorra", "+376", "europe"),
  c("mc", "摩纳哥", "Monaco", "+377", "europe"),
  c("li", "列支敦士登", "Liechtenstein", "+423", "europe"),
  c("sm", "圣马力诺", "San Marino", "+378", "europe"),
  c("va", "梵蒂冈", "Vatican", "+379", "europe"),
  c("gi", "直布罗陀", "Gibraltar", "+350", "europe"),
  c("fo", "法罗群岛", "Faroe Islands", "+298", "europe"),
  c("im", "马恩岛", "Isle of Man", "+44", "europe"),
  c("je", "泽西岛", "Jersey", "+44", "europe"),
  c("gg", "根西岛", "Guernsey", "+44", "europe"),

  // === 北美 / 加勒比 ===
  c("us", "美国", "United States", "+1", "north_america"),
  c("ca", "加拿大", "Canada", "+1", "north_america"),
  c("mx", "墨西哥", "Mexico", "+52", "north_america"),
  c("cu", "古巴", "Cuba", "+53", "north_america"),
  c("jm", "牙买加", "Jamaica", "+1876", "north_america"),
  c("ht", "海地", "Haiti", "+509", "north_america"),
  c("do", "多米尼加", "Dominican Republic", "+1809", "north_america"),
  c("bs", "巴哈马", "Bahamas", "+1242", "north_america"),
  c("bb", "巴巴多斯", "Barbados", "+1246", "north_america"),
  c("tt", "特立尼达和多巴哥", "Trinidad and Tobago", "+1868", "north_america"),
  c("pr", "波多黎各", "Puerto Rico", "+1787", "north_america"),
  c("cr", "哥斯达黎加", "Costa Rica", "+506", "north_america"),
  c("pa", "巴拿马", "Panama", "+507", "north_america"),
  c("gt", "危地马拉", "Guatemala", "+502", "north_america"),
  c("hn", "洪都拉斯", "Honduras", "+504", "north_america"),
  c("sv", "萨尔瓦多", "El Salvador", "+503", "north_america"),
  c("ni", "尼加拉瓜", "Nicaragua", "+505", "north_america"),
  c("bz", "伯利兹", "Belize", "+501", "north_america"),
  c("gl", "格陵兰", "Greenland", "+299", "north_america"),
  c("bm", "百慕大", "Bermuda", "+1441", "north_america"),
  c("ky", "开曼群岛", "Cayman Islands", "+1345", "north_america"),
  c("lc", "圣卢西亚", "Saint Lucia", "+1758", "north_america"),
  c("gd", "格林纳达", "Grenada", "+1473", "north_america"),
  c("ag", "安提瓜和巴布达", "Antigua and Barbuda", "+1268", "north_america"),
  c("kn", "圣基茨和尼维斯", "Saint Kitts and Nevis", "+1869", "north_america"),
  c("pm", "圣皮埃尔和密克隆", "Saint Pierre and Miquelon", "+508", "north_america"),
  c("ms", "蒙特塞拉特", "Montserrat", "+1664", "north_america"),
  c("ai", "安圭拉", "Anguilla", "+1264", "north_america"),
  c("vg", "英属维尔京群岛", "British Virgin Islands", "+1284", "north_america"),
  c("vi", "美属维尔京群岛", "US Virgin Islands", "+1340", "north_america"),
  c("tc", "特克斯和凯科斯", "Turks and Caicos", "+1649", "north_america"),
  c("sx", "荷属圣马丁", "Sint Maarten", "+1721", "north_america"),
  c("mf", "圣马丁", "Saint Martin", "+590", "north_america"),
  c("bl", "圣巴泰勒米", "Saint Barthelemy", "+590", "north_america"),
  c("cw", "库拉索", "Curacao", "+599", "north_america"),
  c("aw", "阿鲁巴", "Aruba", "+297", "north_america"),
  c("bq", "博奈尔", "Bonaire", "+599", "north_america"),

  // === 南美 ===
  c("br", "巴西", "Brazil", "+55", "south_america"),
  c("ar", "阿根廷", "Argentina", "+54", "south_america"),
  c("cl", "智利", "Chile", "+56", "south_america"),
  c("pe", "秘鲁", "Peru", "+51", "south_america"),
  c("co", "哥伦比亚", "Colombia", "+57", "south_america"),
  c("ve", "委内瑞拉", "Venezuela", "+58", "south_america"),
  c("ec", "厄瓜多尔", "Ecuador", "+593", "south_america"),
  c("bo", "玻利维亚", "Bolivia", "+591", "south_america"),
  c("py", "巴拉圭", "Paraguay", "+595", "south_america"),
  c("uy", "乌拉圭", "Uruguay", "+598", "south_america"),
  c("gy", "圭亚那", "Guyana", "+592", "south_america"),
  c("sr", "苏里南", "Suriname", "+597", "south_america"),
  c("gf", "法属圭亚那", "French Guiana", "+594", "south_america"),
  c("fk", "福克兰群岛", "Falkland Islands", "+500", "south_america"),

  // === 非洲 ===
  c("eg", "埃及", "Egypt", "+20", "africa"),
  c("ly", "利比亚", "Libya", "+218", "africa"),
  c("tn", "突尼斯", "Tunisia", "+216", "africa"),
  c("dz", "阿尔及利亚", "Algeria", "+213", "africa"),
  c("ma", "摩洛哥", "Morocco", "+212", "africa"),
  c("sd", "苏丹", "Sudan", "+249", "africa"),
  c("ss", "南苏丹", "South Sudan", "+211", "africa"),
  c("et", "埃塞俄比亚", "Ethiopia", "+251", "africa"),
  c("ke", "肯尼亚", "Kenya", "+254", "africa"),
  c("tz", "坦桑尼亚", "Tanzania", "+255", "africa"),
  c("ug", "乌干达", "Uganda", "+256", "africa"),
  c("rw", "卢旺达", "Rwanda", "+250", "africa"),
  c("bi", "布隆迪", "Burundi", "+257", "africa"),
  c("so", "索马里", "Somalia", "+252", "africa"),
  c("dj", "吉布提", "Djibouti", "+253", "africa"),
  c("er", "厄立特里亚", "Eritrea", "+291", "africa"),
  c("ng", "尼日利亚", "Nigeria", "+234", "africa"),
  c("gh", "加纳", "Ghana", "+233", "africa"),
  c("ci", "科特迪瓦", "Cote d'Ivoire", "+225", "africa"),
  c("sn", "塞内加尔", "Senegal", "+221", "africa"),
  c("ml", "马里", "Mali", "+223", "africa"),
  c("bf", "布基纳法索", "Burkina Faso", "+226", "africa"),
  c("ne", "尼日尔", "Niger", "+227", "africa"),
  c("gn", "几内亚", "Guinea", "+224", "africa"),
  c("sl", "塞拉利昂", "Sierra Leone", "+232", "africa"),
  c("lr", "利比里亚", "Liberia", "+231", "africa"),
  c("tg", "多哥", "Togo", "+228", "africa"),
  c("bj", "贝宁", "Benin", "+229", "africa"),
  c("gm", "冈比亚", "Gambia", "+220", "africa"),
  c("gw", "几内亚比绍", "Guinea-Bissau", "+245", "africa"),
  c("cv", "佛得角", "Cape Verde", "+238", "africa"),
  c("mr", "毛里塔尼亚", "Mauritania", "+222", "africa"),
  c("cm", "喀麦隆", "Cameroon", "+237", "africa"),
  c("cf", "中非", "Central African Republic", "+236", "africa"),
  c("td", "乍得", "Chad", "+235", "africa"),
  c("ga", "加蓬", "Gabon", "+241", "africa"),
  c("cg", "刚果（布）", "Republic of the Congo", "+242", "africa"),
  c("cd", "刚果（金）", "DR Congo", "+243", "africa"),
  c("st", "圣多美和普林西比", "Sao Tome and Principe", "+239", "africa"),
  c("gq", "赤道几内亚", "Equatorial Guinea", "+240", "africa"),
  c("ao", "安哥拉", "Angola", "+244", "africa"),
  c("zm", "赞比亚", "Zambia", "+260", "africa"),
  c("zw", "津巴布韦", "Zimbabwe", "+263", "africa"),
  c("mw", "马拉维", "Malawi", "+265", "africa"),
  c("mz", "莫桑比克", "Mozambique", "+258", "africa"),
  c("na", "纳米比亚", "Namibia", "+264", "africa"),
  c("bw", "博茨瓦纳", "Botswana", "+267", "africa"),
  c("za", "南非", "South Africa", "+27", "africa"),
  c("ls", "莱索托", "Lesotho", "+266", "africa"),
  c("sz", "斯威士兰", "Eswatini", "+268", "africa"),
  c("mg", "马达加斯加", "Madagascar", "+261", "africa"),
  c("mu", "毛里求斯", "Mauritius", "+230", "africa"),
  c("sc", "塞舌尔", "Seychelles", "+248", "africa"),
  c("km", "科摩罗", "Comoros", "+269", "africa"),

  // === 大洋洲 ===
  c("au", "澳大利亚", "Australia", "+61", "oceania"),
  c("nz", "新西兰", "New Zealand", "+64", "oceania"),
  c("fj", "斐济", "Fiji", "+679", "oceania"),
  c("pg", "巴布亚新几内亚", "Papua New Guinea", "+675", "oceania"),
  c("sb", "所罗门群岛", "Solomon Islands", "+677", "oceania"),
  c("vu", "瓦努阿图", "Vanuatu", "+678", "oceania"),
  c("ws", "萨摩亚", "Samoa", "+685", "oceania"),
  c("to", "汤加", "Tonga", "+676", "oceania"),
  c("ki", "基里巴斯", "Kiribati", "+686", "oceania"),
  c("tv", "图瓦卢", "Tuvalu", "+688", "oceania"),
  c("nr", "瑙鲁", "Nauru", "+674", "oceania"),
  c("pw", "帕劳", "Palau", "+680", "oceania"),
  c("mh", "马绍尔群岛", "Marshall Islands", "+692", "oceania"),
  c("fm", "密克罗尼西亚", "Micronesia", "+691", "oceania"),
  c("nc", "新喀里多尼亚", "New Caledonia", "+687", "oceania"),
  c("pf", "法属波利尼西亚", "French Polynesia", "+689", "oceania"),
  c("gu", "关岛", "Guam", "+1671", "oceania"),
  c("mp", "北马里亚纳", "Northern Mariana Islands", "+1670", "oceania"),
  c("as", "美属萨摩亚", "American Samoa", "+1684", "oceania"),
  c("ck", "库克群岛", "Cook Islands", "+682", "oceania"),
  c("nu", "纽埃", "Niue", "+683", "oceania"),
  c("tk", "托克劳", "Tokelau", "+690", "oceania"),
  c("wf", "瓦利斯和富图纳", "Wallis and Futuna", "+681", "oceania"),
  c("pn", "皮特凯恩", "Pitcairn Islands", "+64", "oceania"),
];

export const POPULAR_COUNTRY_CODES = [
  "us","gb","ca","au","sg","jp","kr","de","fr","in",
  "id","vn","ph","th","my","br","mx","ru","es","it",
];

export const POPULAR_COUNTRIES: SmsCountry[] = POPULAR_COUNTRY_CODES
  .map((code) => ALL_COUNTRIES.find((c) => c.code === code))
  .filter((c): c is SmsCountry => Boolean(c));

export function getFlag(code: string): string {
  if (!/^[a-z]{2}$/i.test(code)) return "🏳️";
  if (!isValidIso(code)) return "🏳️";
  return code
    .toUpperCase()
    .replace(/./g, (ch) =>
      String.fromCodePoint(127397 + ch.charCodeAt(0)),
    );
}

export function groupByRegion(): {
  region: SmsRegion;
  label: string;
  items: SmsCountry[];
}[] {
  const map = new Map<SmsRegion, SmsCountry[]>();
  for (const country of ALL_COUNTRIES) {
    if (!map.has(country.region)) map.set(country.region, []);
    map.get(country.region)!.push(country);
  }
  return Array.from(map.entries()).map(([region, items]) => ({
    region,
    label: REGION_LABELS[region],
    items,
  }));
}
