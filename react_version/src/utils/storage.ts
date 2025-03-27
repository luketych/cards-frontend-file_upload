import { Molecule, StorageInfo } from '../types';

const DB_NAME = 'MoleculeDB';
const DB_VERSION = 1;
const STORE_NAME = 'molecules';

class StorageManager {
    private db: IDBDatabase | null = null;
    private useIndexedDB: boolean;

    constructor() {
        this.useIndexedDB = 'indexedDB' in window;
    }

    async init(): Promise<void> {
        if (!this.useIndexedDB) {
            console.warn('IndexedDB not supported, falling back to localStorage');
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.warn('IndexedDB error, falling back to localStorage');
                this.useIndexedDB = false;
                resolve();
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async getMolecules(): Promise<Molecule[]> {
        if (!this.useIndexedDB) {
            const molecules = localStorage.getItem('molecules');
            return molecules ? JSON.parse(molecules) : [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveMolecule(molecule: Molecule): Promise<void> {
        if (!this.useIndexedDB) {
            const molecules = await this.getMolecules();
            const index = molecules.findIndex(m => m.id === molecule.id);
            if (index >= 0) {
                molecules[index] = molecule;
            } else {
                molecules.push(molecule);
            }
            localStorage.setItem('molecules', JSON.stringify(molecules));
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(molecule);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMolecule(id: number): Promise<void> {
        if (!this.useIndexedDB) {
            const molecules = await this.getMolecules();
            const filtered = molecules.filter(m => m.id !== id);
            localStorage.setItem('molecules', JSON.stringify(filtered));
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll(): Promise<void> {
        if (!this.useIndexedDB) {
            localStorage.removeItem('molecules');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getStorageInfo(): Promise<StorageInfo> {
        if (!this.useIndexedDB) {
            const molecules = await this.getMolecules();
            const size = new Blob([JSON.stringify(molecules)]).size;
            const maxSize = 5 * 1024 * 1024; // ~5MB for localStorage
            return { size, maxSize };
        }

        // For IndexedDB, we'll estimate based on the data we have
        const molecules = await this.getMolecules();
        const size = new Blob([JSON.stringify(molecules)]).size;
        const maxSize = 1024 * 1024 * 1024; // 1GB (conservative estimate)
        return { size, maxSize };
    }

    async migrateFromLocalStorage(): Promise<void> {
        if (!this.useIndexedDB) return;

        const existingData = localStorage.getItem('molecules');
        if (existingData) {
            const molecules = JSON.parse(existingData);
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            for (const molecule of molecules) {
                await new Promise<void>((resolve, reject) => {
                    const request = store.put(molecule);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            // Clear localStorage after successful migration
            localStorage.removeItem('molecules');
            console.log('Successfully migrated data to IndexedDB');
        }
    }
}

export const storageManager = new StorageManager(); 