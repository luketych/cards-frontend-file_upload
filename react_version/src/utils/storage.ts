import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Molecule } from '../types/molecule';

interface LogEntry {
    id?: number;
    timestamp: number;
    level: string;
    message: string;
    data?: any;
}

interface MyDB extends DBSchema {
    logs: {
        key: number;
        value: LogEntry;
        indexes: { 'by-timestamp': number };
    };
}

let db: IDBPDatabase<MyDB> | null = null;

export const initDB = async () => {
    if (!db) {
        db = await openDB<MyDB>('logs-db', 1, {
            upgrade(db) {
                const store = db.createObjectStore('logs', {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }
    return db;
};

export const addLog = async (log: Omit<LogEntry, 'id'>) => {
    const db = await initDB();
    return db.add('logs', {
        ...log,
        timestamp: Date.now(),
    });
};

export const getLogs = async (limit = 1000) => {
    const db = await initDB();
    return db.getAllFromIndex('logs', 'by-timestamp', undefined, limit);
};

export const clearLogs = async () => {
    const db = await initDB();
    return db.clear('logs');
};

class StorageManager {
    private dbName = 'moleculeDB';
    private storeName = 'molecules';

    async init() {
        this.db = await openDB(this.dbName, 1, {
            upgrade(db) {
                db.createObjectStore('molecules', { keyPath: 'id' });
            },
        });
    }

    async getMolecules(): Promise<Molecule[]> {
        if (!this.db) await this.init();
        return this.db.getAll(this.storeName);
    }

    async saveMolecule(molecule: Molecule): Promise<void> {
        if (!this.db) await this.init();
        await this.db.put(this.storeName, molecule);
    }

    async deleteMolecule(id: number): Promise<void> {
        if (!this.db) await this.init();
        await this.db.delete(this.storeName, id);
    }

    async clearAll(): Promise<void> {
        if (!this.db) await this.init();
        await this.db.clear(this.storeName);
    }

    async getStorageInfo(): Promise<{ size: number; maxSize: number }> {
        if (!this.db) await this.init();
        const estimate = await navigator.storage.estimate();
        return {
            size: estimate.usage || 0,
            maxSize: estimate.quota || 0,
        };
    }

    async migrateFromLocalStorage(): Promise<void> {
        if (!this.db) await this.init();
        const localStorageData = localStorage.getItem('molecules');
        if (localStorageData) {
            const molecules: Molecule[] = JSON.parse(localStorageData);
            for (const molecule of molecules) {
                await this.saveMolecule(molecule);
            }
            localStorage.removeItem('molecules');
        }
    }
}

export const storageManager = new StorageManager(); 