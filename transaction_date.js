'use strict';

const MONTHS = Object.freeze({
  jan: 1,
  januari: 1,
  feb: 2,
  februari: 2,
  mar: 3,
  maret: 3,
  apr: 4,
  april: 4,
  mei: 5,
  jun: 6,
  juni: 6,
  jul: 7,
  juli: 7,
  agu: 8,
  ags: 8,
  agustus: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  nov: 11,
  november: 11,
  des: 12,
  desember: 12,
});

const TIMEZONE_OFFSET_MINUTES = Object.freeze({
  WIB: 7 * 60,
  WITA: 8 * 60,
  WIT: 9 * 60,
});

function isValidDateParts(year, month, day, hour, minute, second) {
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  );
}

function buildIso({ year, month, day, hour, minute, second, timezone = 'WIB' }) {
  const values = [year, month, day, hour, minute, second].map(Number);
  if (values.some((value) => !Number.isInteger(value))) return null;
  const [y, m, d, h, min, sec] = values;
  if (!isValidDateParts(y, m, d, h, min, sec)) return null;

  /** 
  const offsetMinutes = TIMEZONE_OFFSET_MINUTES[String(timezone).toUpperCase()] ?? 7 * 60;
  const utcMillis = Date.UTC(y, m - 1, d, h, min, sec) - offsetMinutes * 60 * 1000;
  return new Date(utcMillis).toISOString();
  */
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getTransactionDate(text = '') {
  if (typeof text !== 'string' || !text.trim()) return '-';

  const normalized = text
    .replace(/[：]/g, ':')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ');

  const numericPattern = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*(?:,|\s|-)*\s*(\d{1,2}):(\d{2}):(\d{2})\s*(WIB|WITA|WIT)?\b/i;
  const numeric = normalized.match(numericPattern);
  if (numeric) {
    return buildIso({
      day: Number(numeric[1]),
      month: Number(numeric[2]),
      year: Number(numeric[3]),
      hour: Number(numeric[4]),
      minute: Number(numeric[5]),
      second: Number(numeric[6]),
      timezone: numeric[7] || 'WIB',
    }) || '-';
  }

  const namedPattern = /\b(\d{1,2})[ .-]+([A-Za-z]+)[ .-]+(\d{4})\s*(?:,|\s|-)*\s*(\d{1,2}):(\d{2}):(\d{2})\s*(WIB|WITA|WIT)?\b/i;
  const named = normalized.match(namedPattern);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (!month) return '-';
    return buildIso({
      day: Number(named[1]),
      month,
      year: Number(named[3]),
      hour: Number(named[4]),
      minute: Number(named[5]),
      second: Number(named[6]),
      timezone: named[7] || 'WIB',
    }) || '-';
  }

  return '-';
}

module.exports = { getTransactionDate, buildIso, MONTHS, TIMEZONE_OFFSET_MINUTES };
