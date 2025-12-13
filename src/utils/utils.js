import {CONFIG} from "./config.js";


export const parseLine = (line) => {
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

export const parseNum = (val) => {
  if (!val) return 0;
  let cleaned = val.replace(/[€"]/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatEUR = (value) => {
  return `€${formatCurrency(value)}`;
};

export const formatRON = (value) => {
  return `${formatCurrency(value)} RON`;
};

export const getFromStorage = (key) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

export const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const checkSession = () => {
  const session = JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY));
  return session && Date.now() < session.expiry;
};

export const createSession = () => {
  const expiry = Date.now() + CONFIG.SESSION_DURATION_MS;
  localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({ expiry }));
};