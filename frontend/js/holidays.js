/**
 * TimeTask 农历日历引擎 + 节假日数据
 *
 * 功能:
 *   1. 自动计算任意日期的农历日期（初五、廿六等）
 *   2. 提供中国大陆和香港两地节假日标记
 *
 * 农历月份定义（基于 2026 年天文历法推算）:
 *   2025年腊月: 2026-01-19 ~ 2026-02-16 (29天)
 *   2026年正月: 2026-02-17 ~ 2026-03-18 (30天)
 *   2026年二月: 2026-03-19 ~ 2026-04-16 (29天)
 *   2026年三月: 2026-04-17 ~ 2026-05-15 (29天)
 *   2026年四月: 2026-05-16 ~ 2026-06-14 (30天)
 *   2026年五月: 2026-06-15 ~ 2026-07-13 (29天)
 *   2026年六月: 2026-07-14 ~ 2026-08-11 (29天)
 *   2026年七月: 2026-08-12 ~ 2026-09-10 (30天)
 *   2026年八月: 2026-09-11 ~ 2026-10-09 (29天)
 *   2026年九月: 2026-10-10 ~ 2026-11-07 (29天)
 *   2026年十月: 2026-11-08 ~ 2026-12-07 (30天)
 *   2026年十一月: 2026-12-08 ~ 2027-01-05 (29天)
 *
 * 数据来源:
 * - 香港: https://www.gov.hk/tc/about/abouthk/holiday/2026.htm
 * - 中国大陆: 国务院办公厅通知
 */

// ═══════════════════════════════════════════════════
// 农历月份定义
// ═══════════════════════════════════════════════════

const LUNAR_MONTHS = [
    { year: 2025, month: 12, label: '腊月', start: '2026-01-19', days: 29 },
    { year: 2026, month: 1,  label: '正月', start: '2026-02-17', days: 30 },
    { year: 2026, month: 2,  label: '二月', start: '2026-03-19', days: 29 },
    { year: 2026, month: 3,  label: '三月', start: '2026-04-17', days: 29 },
    { year: 2026, month: 4,  label: '四月', start: '2026-05-16', days: 30 },
    { year: 2026, month: 5,  label: '五月', start: '2026-06-15', days: 29 },
    { year: 2026, month: 6,  label: '六月', start: '2026-07-14', days: 29 },
    { year: 2026, month: 7,  label: '七月', start: '2026-08-12', days: 30 },
    { year: 2026, month: 8,  label: '八月', start: '2026-09-11', days: 29 },
    { year: 2026, month: 9,  label: '九月', start: '2026-10-10', days: 29 },
    { year: 2026, month: 10, label: '十月', start: '2026-11-08', days: 30 },
    { year: 2026, month: 11, label: '十一月', start: '2026-12-08', days: 29 },
];

// 农历日名称
const LUNAR_DAY_NAMES = [
    '', '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
];

/**
 * 计算某日期对应的农历信息
 * @param {string} dateStr YYYY-MM-DD
 * @returns {{ day: string, full: string }|null}
 *   day: "初五"  full: "五月初五"
 */
function getLunarInfo(dateStr) {
    const ts = new Date(dateStr + 'T12:00:00').getTime();
    for (const m of LUNAR_MONTHS) {
        const start = new Date(m.start + 'T12:00:00').getTime();
        const end = start + m.days * 86400000;
        if (ts >= start && ts < end) {
            const dayIndex = Math.floor((ts - start) / 86400000) + 1;
            const day = LUNAR_DAY_NAMES[dayIndex] || null;
            return { day, full: day ? m.label + day : null };
        }
    }
    return null;
}

/** 简写：只返回农历日，如"初五" */
function getLunarDay(dateStr) {
    const info = getLunarInfo(dateStr);
    return info ? info.day : null;
}

/** 完整：返回农历几月初几，如"五月初五" */
function getLunarFull(dateStr) {
    const info = getLunarInfo(dateStr);
    return info ? info.full : null;
}

// ═══════════════════════════════════════════════════
// 节假日数据（仅存节日名称，农历日由引擎自动计算）
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// 合并的节假日数据（同一日期可同时有内地和香港节日）
// ═══════════════════════════════════════════════════

const HOLIDAY_DATA = {
    // ── 两地重合的节日 ──
    '2026-01-01': [
        { region: 'cn', name: '元旦' },
        { region: 'hk', name: '元旦' },
    ],
    '2026-02-17': [
        { region: 'cn', name: '春节·初一' },
        { region: 'hk', name: '農曆年初一' },
    ],
    '2026-02-18': [
        { region: 'cn', name: '春节·初二' },
        { region: 'hk', name: '農曆年初二' },
    ],
    '2026-02-19': [
        { region: 'cn', name: '春节·初三' },
        { region: 'hk', name: '農曆年初三' },
    ],
    '2026-05-01': [
        { region: 'cn', name: '劳动节' },
        { region: 'hk', name: '勞動節' },
    ],
    '2026-06-19': [
        { region: 'cn', name: '端午节' },
        { region: 'hk', name: '端午節' },
    ],
    '2026-10-01': [
        { region: 'cn', name: '国庆节' },
        { region: 'hk', name: '國慶日' },
    ],

    // ── 仅中国大陆 ──
    '2026-01-02': [{ region: 'cn', name: '元旦假期' }],
    '2026-01-03': [{ region: 'cn', name: '元旦假期' }],
    '2026-02-16': [{ region: 'cn', name: '除夕' }],
    '2026-02-20': [{ region: 'cn', name: '春节假期' }],
    '2026-02-21': [{ region: 'cn', name: '春节假期' }],
    '2026-02-22': [{ region: 'cn', name: '春节假期' }],
    '2026-04-04': [{ region: 'cn', name: '清明节' }],
    '2026-04-05': [{ region: 'cn', name: '清明节' }],
    '2026-04-06': [{ region: 'cn', name: '清明节补休' }],
    '2026-05-02': [{ region: 'cn', name: '劳动节假期' }],
    '2026-05-03': [{ region: 'cn', name: '劳动节假期' }],
    '2026-05-04': [{ region: 'cn', name: '劳动节假期' }],
    '2026-05-05': [{ region: 'cn', name: '劳动节假期' }],
    '2026-06-20': [
        { region: 'cn', name: '端午节假期' },
        { region: 'mo', name: '端午節翌日' },
    ],
    '2026-06-21': [{ region: 'cn', name: '端午节假期' }],
    '2026-09-25': [{ region: 'cn', name: '中秋节' }],
    '2026-09-26': [{ region: 'cn', name: '中秋节假期' }],
    '2026-09-27': [{ region: 'cn', name: '中秋节假期' }],
    '2026-10-02': [{ region: 'cn', name: '国庆节假期' }],
    '2026-10-03': [{ region: 'cn', name: '国庆节假期' }],
    '2026-10-04': [{ region: 'cn', name: '国庆节假期' }],
    '2026-10-05': [{ region: 'cn', name: '国庆节假期' }],
    '2026-10-06': [{ region: 'cn', name: '国庆节假期' }],
    '2026-10-07': [{ region: 'cn', name: '国庆节假期' }],

    // ── 仅香港 ──
    // 来源: https://www.gov.hk/tc/about/abouthk/holiday/2026.htm
    '2026-04-03': [{ region: 'hk', name: '耶穌受難節' }],
    '2026-04-04': [
        { region: 'hk', name: '耶穌受難節翌日' },
        { region: 'mo', name: '清明節' },
    ],
    '2026-04-06': [
        { region: 'hk', name: '清明節翌日' },
        { region: 'mo', name: '復活節' },
    ],
    '2026-04-07': [{ region: 'hk', name: '復活節星期一翌日' }],
    '2026-05-25': [{ region: 'hk', name: '佛誕翌日' }],
    '2026-05-02': [{ region: 'mo', name: '佛誕節' }],
    '2026-07-01': [{ region: 'hk', name: '香港特區成立紀念日' }],
    '2026-09-26': [
        { region: 'hk', name: '中秋節翌日' },
        { region: 'mo', name: '中秋節翌日' },
    ],
    '2026-10-19': [
        { region: 'hk', name: '重陽節翌日' },
        { region: 'mo', name: '重陽節' },
    ],
    '2026-12-25': [
        { region: 'hk', name: '聖誕節' },
        { region: 'mo', name: '聖誕節' },
    ],
    '2026-12-26': [{ region: 'hk', name: '聖誕節後第一個周日' }],

    // ── 仅中国澳门 ──
    '2026-04-05': [{ region: 'mo', name: '復活節前日' }],
    '2026-10-02': [{ region: 'mo', name: '國慶節翌日' }],
    '2026-11-02': [{ region: 'mo', name: '追思節' }],
    '2026-12-08': [{ region: 'mo', name: '聖母無原罪瞻禮' }],
    '2026-12-20': [{ region: 'mo', name: '澳門特區成立紀念日' }],
    '2026-12-21': [{ region: 'mo', name: '澳門特區成立紀念日翌日' }],
    '2026-12-22': [{ region: 'mo', name: '冬至' }],
    '2026-12-24': [{ region: 'mo', name: '聖誕節前夕' }],
};

/**
 * 获取某日期的所有节假日
 * @param {string} dateStr YYYY-MM-DD
 * @returns {Array<{region:string, name:string}>}
 */
function getHolidays(dateStr) {
    return HOLIDAY_DATA[dateStr] || [];
}

/**
 * 获取某月的节假日（按日期分组）
 * @param {number} year
 * @param {number} month 1-12
 * @returns {Object} { 'YYYY-MM-DD': [{region, name}] }
 */
function getMonthHolidays(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const result = {};
    for (const [date, holidays] of Object.entries(HOLIDAY_DATA)) {
        if (date.startsWith(prefix)) {
            result[date] = holidays;
        }
    }
    return result;
}

/**
 * 获取所有节假日的日期集合
 * @param {string} [region] 'cn' 或 'hk'，不传则返回所有
 * @returns {Set<string>}
 */
function getHolidayDates(region) {
    const dates = new Set();
    for (const [date, holidays] of Object.entries(HOLIDAY_DATA)) {
        if (!region || holidays.some(h => h.region === region)) {
            dates.add(date);
        }
    }
    return dates;
}
