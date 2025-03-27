import { storageManager } from '../storage';
import { Molecule } from '../../types';

// Mock IndexedDB
const mockIndexedDB = {
    open: jest.fn(),
    deleteDatabase: jest.fn(),
};

// Mock IDBDatabase
const mockDatabase = {
    transaction: jest.fn(),
    objectStoreNames: {
        contains: jest.fn(),
    },
    createObjectStore: jest.fn(),
    deleteObjectStore: jest.fn(),
    close: jest.fn(),
};

// Mock IDBTransaction
const mockTransaction = {
    objectStore: jest.fn(),
    commit: jest.fn(),
};

// Mock IDBObjectStore
const mockObjectStore = {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    count: jest.fn(),
    clear: jest.fn(),
};

describe('StorageManager', () => {
    let mockRequest: { result: any; onsuccess: () => void; onerror: () => void };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock request
        mockRequest = {
            result: null,
            onsuccess: jest.fn(),
            onerror: jest.fn(),
        };

        // Setup IndexedDB mock
        (window as any).indexedDB = mockIndexedDB;
        mockIndexedDB.open.mockReturnValue(mockRequest);
        mockRequest.result = mockDatabase;
        mockDatabase.transaction.mockReturnValue(mockTransaction);
        mockTransaction.objectStore.mockReturnValue(mockObjectStore);
    });

    describe('init', () => {
        it('initializes IndexedDB when supported', async () => {
            await storageManager.init();

            expect(mockIndexedDB.open).toHaveBeenCalledWith('MoleculeDB', 1);
            expect(mockDatabase.createObjectStore).toHaveBeenCalledWith('molecules', { keyPath: 'id' });
        });

        it('falls back to localStorage when IndexedDB is not supported', async () => {
            (window as any).indexedDB = undefined;
            const consoleSpy = jest.spyOn(console, 'warn');

            await storageManager.init();

            expect(consoleSpy).toHaveBeenCalledWith('IndexedDB not supported, falling back to localStorage');
        });
    });

    describe('getMolecules', () => {
        it('retrieves all molecules from storage', async () => {
            const mockMolecules: Molecule[] = [
                { id: 1, title: 'Test 1', coverImage: '', files: [] },
                { id: 2, title: 'Test 2', coverImage: '', files: [] },
            ];

            mockObjectStore.getAll.mockReturnValue({
                result: mockMolecules,
                onsuccess: jest.fn(),
            });

            const molecules = await storageManager.getMolecules();

            expect(mockObjectStore.getAll).toHaveBeenCalled();
            expect(molecules).toEqual(mockMolecules);
        });

        it('returns empty array when no molecules exist', async () => {
            mockObjectStore.getAll.mockReturnValue({
                result: [],
                onsuccess: jest.fn(),
            });

            const molecules = await storageManager.getMolecules();

            expect(molecules).toEqual([]);
        });
    });

    describe('saveMolecule', () => {
        it('saves a new molecule', async () => {
            const molecule: Molecule = {
                id: 1,
                title: 'Test Molecule',
                coverImage: '',
                files: [],
            };

            mockObjectStore.put.mockReturnValue({
                result: undefined,
                onsuccess: jest.fn(),
            });

            await storageManager.saveMolecule(molecule);

            expect(mockObjectStore.put).toHaveBeenCalledWith(molecule);
        });

        it('updates an existing molecule', async () => {
            const molecule: Molecule = {
                id: 1,
                title: 'Updated Molecule',
                coverImage: '',
                files: [],
            };

            mockObjectStore.put.mockReturnValue({
                result: undefined,
                onsuccess: jest.fn(),
            });

            await storageManager.saveMolecule(molecule);

            expect(mockObjectStore.put).toHaveBeenCalledWith(molecule);
        });
    });

    describe('deleteMolecule', () => {
        it('deletes a molecule by id', async () => {
            mockObjectStore.delete.mockReturnValue({
                result: undefined,
                onsuccess: jest.fn(),
            });

            await storageManager.deleteMolecule(1);

            expect(mockObjectStore.delete).toHaveBeenCalledWith(1);
        });
    });

    describe('clearAll', () => {
        it('clears all molecules from storage', async () => {
            mockObjectStore.clear.mockReturnValue({
                result: undefined,
                onsuccess: jest.fn(),
            });

            await storageManager.clearAll();

            expect(mockObjectStore.clear).toHaveBeenCalled();
        });
    });

    describe('getStorageInfo', () => {
        it('returns storage information', async () => {
            mockObjectStore.count.mockReturnValue({
                result: 5,
                onsuccess: jest.fn(),
            });

            const info = await storageManager.getStorageInfo();

            expect(info).toEqual({
                size: 5,
                maxSize: 5,
            });
        });
    });
}); 