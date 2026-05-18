import fs from 'fs';

const DATA_PATH = '/tmp/cafe-kokoikeru-data.json';

export interface Store {
  id: number;
  name: string;
  address: string;
}

export interface CrowdingReport {
  id: number;
  storeId: number;
  status: string;
  createdAt: string;
}

export interface CrowdingStatus {
  storeId: number;
  storeName: string;
  status: string | null;
  reportCount: number;
  lastUpdated: string | null;
}

interface DataStore {
  stores: Store[];
  reports: CrowdingReport[];
  nextReportId: number;
}

const SEED_STORES: Store[] = [
  { id: 1, name: 'カフェ・サクラ', address: '渋谷区道玄坂1-2-3' },
  { id: 2, name: 'コーヒーハウス新宿', address: '新宿区新宿3-4-5' },
  { id: 3, name: 'ブルーボトル表参道', address: '港区南青山5-6-7' },
  { id: 4, name: 'カフェ・ラ・テール銀座', address: '中央区銀座4-3-2' },
  { id: 5, name: 'スターバックス池袋', address: '豊島区南池袋1-28-1' },
  { id: 6, name: 'ドトールコーヒー上野', address: '台東区上野6-14-4' },
];

function loadData(): DataStore {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as DataStore;
  } catch {
    return { stores: SEED_STORES, reports: [], nextReportId: 1 };
  }
}

function saveData(data: DataStore): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data), 'utf-8');
}

export function getStores(): Store[] {
  return loadData().stores;
}

export function getCrowdingStatus(): CrowdingStatus[] {
  const data = loadData();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  return data.stores.map((store) => {
    const storeReports = data.reports
      .filter((r) => r.storeId === store.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const latest = storeReports[0] ?? null;
    const recentCount = storeReports.filter((r) => r.createdAt >= oneHourAgo).length;

    return {
      storeId: store.id,
      storeName: store.name,
      status: latest ? latest.status : null,
      reportCount: recentCount,
      lastUpdated: latest ? latest.createdAt : null,
    };
  });
}

export function addCrowdingReport(storeId: number, status: string): void {
  const data = loadData();
  data.reports.push({
    id: data.nextReportId++,
    storeId,
    status,
    createdAt: new Date().toISOString(),
  });
  // Keep only last 1000 reports to avoid unbounded growth
  if (data.reports.length > 1000) {
    data.reports = data.reports.slice(-1000);
  }
  saveData(data);
}
