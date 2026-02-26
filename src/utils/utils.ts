import {CONFIG} from "./config";


export const parseLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
};

export const parseNum = (val: string): number => {
  if (!val) return 0;
  let cleaned = val.replace(/[€"]/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatEUR = (value: number | undefined): string => {
  if (value === undefined) return 'N/A';

  return `€${formatCurrency(value)}`;
};

export const formatRON = (value: number): string => {
  // if value is bigger than 1 million, format in millions
  if (Math.abs(value) >= 1_000_000) {
    return `${formatCurrency(value / 1_000_000)} mil. RON`;
  }

  if (Math.abs(value) >= 1_000_00) {
    return `${formatCurrency(value / 1_000)}k RON`;
  }

  return `${formatCurrency(value)} RON`;
};

export const getFromStorage = <T>(key: string): T[] => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

export const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const checkSession = (): boolean => {
  const session = JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY) as string);
  return session && Date.now() < session.expiry;
};

export const createSession = (): void => {
  const expiry = Date.now() + CONFIG.SESSION_DURATION_MS;
  localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({ expiry }));
};