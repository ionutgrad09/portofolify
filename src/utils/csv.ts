import {parseLine, parseNum} from "./utils";
import type {WealthData, CashSplitData, InvestmentData, AssetData} from "../types";

export const processWealthCSVData = (csvText: string): WealthData[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const getIndex = (keywords: string[]): number => headers.findIndex(h => keywords.some(k => h.includes(k)));

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

  const newData = lines.slice(1).map((line): WealthData | null => {
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
  }).filter((item): item is WealthData => item !== null && !!item.date);

  newData.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('.').map(Number);
    const [dayB, monthB, yearB] = b.date.split('.').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA.getTime() - dateB.getTime();
  });

  return newData;
};

export const processCashSplitCSVData = (csvText: string): CashSplitData[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const idxSursa = headers.findIndex(h => h.includes('sursa'));
  const idxLei = headers.findIndex(h => h.includes('valoare lei'));
  const idxEur = headers.findIndex(h => h.includes('valoare euro'));

  if (idxSursa === -1 || idxLei === -1 || idxEur === -1) {
    throw new Error("Format Cash Split invalid.");
  }

  return lines.slice(1).map((line, index): CashSplitData | null => {
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
  }).filter((item): item is CashSplitData => item !== null && (item.ron > 0 || item.eur > 0));
};

export const processInvestmentsCSVData = (csvText: string): InvestmentData[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  const getIndex = (keywords: string[]): number => headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k)));

  const indices = {
    name: getIndex(['denumire etf']),
    ticker: getIndex(['ticker']),
    targetAllocation: getIndex(['alocare']),
    invested: getIndex(['suma investita']),
    currentValue: getIndex(['valoare actuala']),
    profitEur: getIndex(['profit (€)', 'profit (eur)', 'profit eur']),
    profitPct: getIndex(['profit (%)', 'profit (%)']),
    currentAllocation: getIndex(['alocare actuala']),
    ter: getIndex(['ter %','ter']),
  };

  const result  = lines.slice(1).map((line, index): InvestmentData | null => {
    if (index > 3) return null;
    const cols = parseLine(line);
    if (cols.length < headers.length) return null;

    return {
      denumireEtf: cols[indices.name] || 'N/A',
      ticker: cols[indices.ticker] || 'N/A',
      alocare: parseNum(cols[indices.targetAllocation]),
      sumaInvestita: parseNum(cols[indices.invested]),
      valoareActuala: parseNum(cols[indices.currentValue]),
      profitEur: parseNum(cols[indices.profitEur]),
      profitPct: parseNum(cols[indices.profitPct]),
      alocareActuala: parseNum(cols[indices.currentAllocation]),
      ter: parseNum(cols[indices.ter]),
    };
  }).filter((item): item is InvestmentData => !!item && item.ticker !== 'N/A');

  return result;
};

export const processAssetsCSVData = (csvText: string): AssetData[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h => h.trim());
  const dateIndex = headers.findIndex(h => h.toLowerCase() === 'data');

  if (dateIndex === -1) {
    throw new Error("Format Assets invalid: Missing 'Data' column");
  }

  const data = lines.slice(1).map((line): AssetData | null => {
    const cols = parseLine(line);
    if (cols.length < 2) return null;

    const date = cols[dateIndex];
    const assets: { [key: string]: number } = {};
    let total = 0;

    headers.forEach((header, idx) => {
      if (idx !== dateIndex) {
        const val = parseNum(cols[idx]);
        assets[header] = val;
        total += val;
      }
    });

    return { date, assets, total };
  }).filter((item): item is AssetData => item !== null && !!item.date);

  data.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('.').map(Number);
    const [dayB, monthB, yearB] = b.date.split('.').map(Number);
    return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
  });

  return data;
};