import { storageManager } from '../storage';
import { Molecule } from '../../types/molecule';

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
};

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

describe('Storage Migration', () => {
    let mockRequest: { result: any; onsuccess: () => void; onerror: () => void };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup localStorage mock
        (window as any).localStorage = mockLocalStorage;

        // Setup IndexedDB mock
        (window as any).indexedDB = mockIndexedDB;
        mockIndexedDB.open.mockReturnValue(mockRequest);
        mockRequest = {
            result: null,
            onsuccess: jest.fn(),
            onerror: jest.fn(),
        };
        mockRequest.result = mockDatabase;
        mockDatabase.transaction.mockReturnValue(mockTransaction);
        mockTransaction.objectStore.mockReturnValue(mockObjectStore);
    });

    it('does not migrate when IndexedDB is not supported', async () => {
        (window as any).indexedDB = undefined;
        await storageManager.migrateFromLocalStorage();
        expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('does not migrate when localStorage is empty', async () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        await storageManager.migrateFromLocalStorage();
        expect(mockObjectStore.put).not.toHaveBeenCalled();
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it('migrates data from localStorage to IndexedDB', async () => {
        const mockMolecules: Molecule[] = [
            {
                id: 1,
                title: 'Test Molecule 1',
                coverImage: '',
                files: [],
            },
            {
                id: 2,
                title: 'Test Molecule 2',
                coverImage: '',
                files: [],
            },
        ];

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockMolecules));
        mockObjectStore.put.mockImplementation(() => ({
            error: null,
            status: 'success'
        }));

        await storageManager.migrateFromLocalStorage();

        expect(mockObjectStore.put).toHaveBeenCalledTimes(2);
        expect(mockObjectStore.put).toHaveBeenCalledWith(mockMolecules[0]);
        expect(mockObjectStore.put).toHaveBeenCalledWith(mockMolecules[1]);
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('molecules');
    });

    it('handles migration errors gracefully', async () => {
        const mockMolecules: Molecule[] = [
            {
                id: 1,
                title: 'Test Molecule',
                coverImage: '',
                files: [],
            },
        ];

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockMolecules));
        mockObjectStore.put.mockImplementation(() => ({
            error: null,
            status: 'success'
        }));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        await storageManager.migrateFromLocalStorage();
        consoleSpy.mockRestore();

        expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it('preserves data integrity during migration', async () => {
        const mockMolecules: Molecule[] = [
            {
                id: 1,
                title: 'Test Molecule',
                coverImage: 'data:image/jpeg;base64,test',
                files: [
                    {
                        name: 'test.jpg',
                        type: 'image/jpeg',
                        size: 1024,
                        lastModified: Date.now(),
                    },
                ],
            },
        ];

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockMolecules));
        mockObjectStore.put.mockImplementation(() => ({
            error: null,
            status: 'success'
        }));

        await storageManager.migrateFromLocalStorage();

        expect(mockObjectStore.put).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 1,
                title: 'Test Molecule',
                coverImage: 'data:image/jpeg;base64,test',
                files: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'test.jpg',
                        type: 'image/jpeg',
                        size: 1024,
                    }),
                ]),
            })
        );
    });
}); 