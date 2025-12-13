import {parseLine, parseNum} from "./utils.js";

export const processWealthCSVData = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const getIndex = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));

  const idxDate = getIndex(['date', 'data']);
  const idxRon = headers.findIndex(h => h.includes('ron') && !h.includes('gain') && !h.includes('loss'));
  const idxEur = getIndex(['eur']);
  const idxGain = getIndex(['gain', 'loss', 'profit']);
  const idxInv = getIndex(['investments', 'investitii']);
  const idxCash = getIndex(['cash', 'numerar']);
  const idxComment = getIndex(['comment', 'comentariu']);

  if (idxDate === -1 || idxEur === -1) {
    throw new Error("Format Istoric invalid.");
  }

  const newData = lines.slice(1).map(line => {
    const cols = parseLine(line);
    if (cols.length < 2) return null;

    return {
      date: cols[idxDate] || '',
      ron: idxRon !== -1 ? parseNum(cols[idxRon]) : 0,
      eur: idxEur !== -1 ? parseNum(cols[idxEur]) : 0,
      gainLoss: idxGain !== -1 ? parseNum(cols[idxGain]) : 0,
      investments: idxInv !== -1 ? parseNum(cols[idxInv]) : 0,
      cash: idxCash !== -1 ? parseNum(cols[idxCash]) : 0,
      comment: idxComment !== -1 ? cols[idxComment].replace(/^"|"$/g, '') : ''
    };
  }).filter(item => item !== null && item.date);

  newData.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('.').map(Number);
    const [dayB, monthB, yearB] = b.date.split('.').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA - dateB;
  });

  return newData;
};

export const processCashSplitCSVData = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const idxSursa = headers.findIndex(h => h.includes('sursa'));
  const idxLei = headers.findIndex(h => h.includes('valoare lei'));
  const idxEur = headers.findIndex(h => h.includes('valoare euro'));

  if (idxSursa === -1 || idxLei === -1 || idxEur === -1) {
    throw new Error("Format Cash Split invalid.");
  }

  return lines.slice(1).map((line, index) => {
    if (index > 16) return null;
    const cols = parseLine(line);
    if (cols.length < 2) return null;

    const sursaRaw = cols[idxSursa];
    if (!sursaRaw || sursaRaw.trim() === '' || sursaRaw.toUpperCase().includes('"#N/A"')) return null;

    const sursa = sursaRaw.replace(/^"|"$/g, '').trim();
    if (sursa.toUpperCase() === 'TOTAL CASH') return null;

    const leiValue = parseNum(cols[idxLei]);
    const eurValue = parseNum(cols[idxEur]);

    return {
      sursa,
      ron: leiValue,
      eur: eurValue,
      totalEur: eurValue + (leiValue / 5)
    };
  }).filter(item => item !== null && (item.ron > 0 || item.eur > 0));
};

export const processInvestmentsCSVData = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  const getIndex = (keywords) => headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k)));

  const indices = {
    name: getIndex(['denumire etf']),
    ticker: getIndex(['ticker']),
    targetAllocation: getIndex(['alocare']),
    invested: getIndex(['suma investita']),
    currentValue: getIndex(['valoare actuala']),
    profitEur: getIndex(['profit (€)']),
    profitPct: getIndex(['profit (%)']),
    currentAllocation: getIndex(['alocare actuala']),
    ter: getIndex(['ter %']),
  };

  return lines.slice(1).map((line, index) => {
    if (index > 3) return null;
    const cols = parseLine(line);
    if (cols.length < headers.length) return null;

    return {
      'Denumire ETF': cols[indices.name] || 'N/A',
      'Ticker': cols[indices.ticker] || 'N/A',
      'Alocare': parseNum(cols[indices.targetAllocation]),
      'Suma investita': parseNum(cols[indices.invested]),
      'Valoare actuala': parseNum(cols[indices.currentValue]),
      'Profit (€)': parseNum(cols[indices.profitEur]),
      'Profit (%)': parseNum(cols[indices.profitPct]),
      'Alocare actuala': parseNum(cols[indices.currentAllocation]),
      'TER': parseNum(cols[indices.ter]),
    };
  }).filter(item => item && item.Ticker !== 'N/A');
};

export const processAssetsCSVData = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h => h.trim());
  const dateIndex = headers.findIndex(h => h.toLowerCase() === 'data');

  if (dateIndex === -1) {
    throw new Error("Format Assets invalid: Missing 'Data' column");
  }

  const data = lines.slice(1).map(line => {
    const cols = parseLine(line);
    if (cols.length < 2) return null;

    const date = cols[dateIndex];
    const assets = {};
    let total = 0;

    headers.forEach((header, idx) => {
      if (idx !== dateIndex) {
        const val = parseNum(cols[idx]);
        assets[header] = val;
        total += val;
      }
    });

    return { date, assets, total };
  }).filter(item => item !== null && item.date);

  data.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('.').map(Number);
    const [dayB, monthB, yearB] = b.date.split('.').map(Number);
    return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
  });

  console.log("assets data", data)
  return data;
};