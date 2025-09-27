const fs = require('fs');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseDate(s) {
  if (!s) return null;
  s = s.replace(/[^\x20-\x7E]/g, '').trim();
  let m;
  if ((m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/))) {
    const month = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}[m[2].toLowerCase()];
    return new Date(2000 + parseInt(m[3]), month, parseInt(m[1]));
  }
  if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/))) {
    const month = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}[m[2].toLowerCase()];
    return new Date(2000 + parseInt(m[3]), month, parseInt(m[1]));
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function parseAmount(a) {
  if (!a) return NaN;
  return parseFloat(a.replace(/[$,\s]/g, ''));
}

function compute(path) {
  const text = fs.readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').toLowerCase());
  const idx = (names) => { for (const n of names) { const i = headers.findIndex(h => h.includes(n)); if (i !== -1) return i; } return -1; };
  const di = idx(['date']);
  const deb = idx(['debit']);
  const cre = idx(['credit']);
  const des = idx(['description']);

  const byDay = new Map();
  for (let i = 1; i < lines.length; i++) {
    const v = parseCSVLine(lines[i]);
    if (v.length < headers.length) continue;
    const dateStr = v[di] || '';
    const db = v[deb] || '';
    const cr = v[cre] || '';
    const desc = v[des] || '';
    if (!dateStr || (!db && !cr) || !desc) continue;
    const dt = parseDate(dateStr);
    if (!dt) continue;
    let amt = NaN;
    if (db && db.trim() !== '') amt = parseAmount(db);
    else if (cr && cr.trim() !== '') amt = -parseAmount(cr);
    if (!isFinite(amt)) continue;
    if (amt <= 0) continue; // only spending
    const key = dt.toISOString().slice(0, 10);
    const e = byDay.get(key) || { amount: 0, count: 0 };
    e.amount += amt; e.count += 1;
    byDay.set(key, e);
  }

  const entries = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const total = entries.reduce((s, [, v]) => s + v.amount, 0);
  const days = entries.length;
  const avg = days ? total / days : 0;
  const highest = entries.reduce((hi, [date, v]) => (!hi || v.amount > hi.amount) ? { date, amount: v.amount, count: v.count } : hi, null);

  return { days, total: +total.toFixed(2), average: +avg.toFixed(2), highest };
}

if (require.main === module) {
  const result = compute('data/September_2025.csv');
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { compute };


