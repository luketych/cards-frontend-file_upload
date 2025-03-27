import { openDB } from 'idb';
import { Molecule } from '../types/molecule';

class StorageManager {
    private dbName = 'moleculeDB';
    private storeName = 'molecules';
    private db: any;

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
}

export const storageManager = new StorageManager(); 