import type { SaveEnvelope } from "./envelope";

export const DATABASE_NAME = "analysis-idle:v2";
export const DATABASE_VERSION = 1;
export const STORE_SAVE_BACKUPS = "save-backups";
export const STORE_REPLAY_LOG = "replay-log";
export const STORE_DIAGNOSTIC_LOG = "diagnostic-log";

export function openPersistenceDatabase(
  factory: IDBFactory = indexedDB,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_SAVE_BACKUPS))
        database.createObjectStore(STORE_SAVE_BACKUPS, {
          keyPath: "generation",
        });
      if (!database.objectStoreNames.contains(STORE_REPLAY_LOG))
        database.createObjectStore(STORE_REPLAY_LOG, {
          keyPath: ["sessionId", "sequence"],
        });
      if (!database.objectStoreNames.contains(STORE_DIAGNOSTIC_LOG))
        database.createObjectStore(STORE_DIAGNOSTIC_LOG, {
          autoIncrement: true,
        });
    };
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);
  });
}

function append(
  database: IDBDatabase,
  storeName: string,
  value: unknown,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).add(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        transaction.error ??
          new Error(`IndexedDB append failed for ${storeName}`),
      );
    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error(`IndexedDB append aborted for ${storeName}`),
      );
  });
}

export class IndexedDbHistory {
  public constructor(private readonly database: IDBDatabase) {}
  public appendSave(envelope: SaveEnvelope): Promise<void> {
    return append(this.database, STORE_SAVE_BACKUPS, envelope);
  }
  public appendReplay(entry: {
    sessionId: string;
    sequence: number;
    data: unknown;
  }): Promise<void> {
    return append(this.database, STORE_REPLAY_LOG, entry);
  }
  public appendDiagnostic(entry: unknown): Promise<void> {
    return append(this.database, STORE_DIAGNOSTIC_LOG, entry);
  }
}
