import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = '/tmp/cafe-kokoikeru.db';

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crowding_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );
  `);

  const count = (db.prepare('SELECT COUNT(*) as cnt FROM stores').get() as { cnt: number }).cnt;
  if (count === 0) {
    const insertStore = db.prepare('INSERT INTO stores (id, name, address) VALUES (?, ?, ?)');
    const seedStores = db.transaction(() => {
      insertStore.run(1, 'カフェ・サクラ', '渋谷区道玄坂1-2-3');
      insertStore.run(2, 'コーヒーハウス新宿', '新宿区新宿3-4-5');
      insertStore.run(3, 'ブルーボトル表参道', '港区南青山5-6-7');
      insertStore.run(4, 'カフェ・ラ・テール銀座', '中央区銀座4-3-2');
      insertStore.run(5, 'スターバックス池袋', '豊島区南池袋1-28-1');
      insertStore.run(6, 'ドトールコーヒー上野', '台東区上野6-14-4');
    });
    seedStores();
  }

  return db;
}

export interface Store {
  id: number;
  name: string;
  address: string;
}

export interface CrowdingStatus {
  storeId: number;
  storeName: string;
  status: string | null;
  reportCount: number;
  lastUpdated: string | null;
}

export function getStores(): Store[] {
  const database = getDb();
  return database.prepare('SELECT id, name, address FROM stores ORDER BY id').all() as Store[];
}

export function getCrowdingStatus(): CrowdingStatus[] {
  const database = getDb();

  const stores = getStores();

  const results: CrowdingStatus[] = stores.map((store) => {
    const latest = database
      .prepare(
        `SELECT status, created_at FROM crowding_reports
         WHERE store_id = ?
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .get(store.id) as { status: string; created_at: string } | undefined;

    const countRow = database
      .prepare(
        `SELECT COUNT(*) as cnt FROM crowding_reports
         WHERE store_id = ?
           AND created_at >= datetime('now', '-1 hour')`
      )
      .get(store.id) as { cnt: number };

    return {
      storeId: store.id,
      storeName: store.name,
      status: latest ? latest.status : null,
      reportCount: countRow.cnt,
      lastUpdated: latest ? latest.created_at : null,
    };
  });

  return results;
}

export function addCrowdingReport(storeId: number, status: string): void {
  const database = getDb();
  database
    .prepare('INSERT INTO crowding_reports (store_id, status) VALUES (?, ?)')
    .run(storeId, status);
}
