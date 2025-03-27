class StorageManager {
    constructor() {
        this.DB_NAME = 'MoleculeDB';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'molecules';
        this.useIndexedDB = this.isIndexedDBSupported();
    }

    isIndexedDBSupported() {
        return 'indexedDB' in window;
    }

    async init() {
        if (!this.useIndexedDB) {
            console.warn('IndexedDB not supported, falling back to localStorage');
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.warn('IndexedDB error, falling back to localStorage');
                this.useIndexedDB = false;
                resolve();
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async getMolecules() {
        if (!this.useIndexedDB) {
            const molecules = localStorage.getItem('molecules');
            return molecules ? JSON.parse(molecules) : [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveMolecule(molecule) {
        if (!this.useIndexedDB) {
            const molecules = await this.getMolecules();
            molecules.push(molecule);
            localStorage.setItem('molecules', JSON.stringify(molecules));
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put(molecule);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMolecule(id) {
        if (!this.useIndexedDB) {
            const molecules = await this.getMolecules();
            const filtered = molecules.filter(m => m.id !== id);
            localStorage.setItem('molecules', JSON.stringify(filtered));
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        if (!this.useIndexedDB) {
            localStorage.removeItem('molecules');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getStorageInfo() {
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

    // Migrate existing data from localStorage to IndexedDB
    async migrateFromLocalStorage() {
        if (!this.useIndexedDB) return;

        const existingData = localStorage.getItem('molecules');
        if (existingData) {
            const molecules = JSON.parse(existingData);
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            for (const molecule of molecules) {
                await new Promise((resolve, reject) => {
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

if (typeof exports !== 'undefined') {
    module.exports = StorageManager;
} else {
    window.StorageManager = StorageManager;
}

export default StorageManager;
