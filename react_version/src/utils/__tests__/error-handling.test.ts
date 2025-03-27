import { storageManager } from '../storage';
import { getFilePreview } from '../file-helpers';

describe('Error Handling', () => {
    describe('Storage Errors', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('handles IndexedDB errors gracefully', async () => {
            // Mock IndexedDB error
            (window as any).indexedDB = undefined;
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            await storageManager.init();
            expect(consoleSpy).toHaveBeenCalledWith('IndexedDB not supported, falling back to localStorage');
            consoleSpy.mockRestore();
        });

        it('handles localStorage errors gracefully', async () => {
            // Mock localStorage error
            const mockLocalStorage = {
                getItem: jest.fn().mockImplementation(() => {
                    throw new Error('localStorage error');
                }),
                setItem: jest.fn(),
                removeItem: jest.fn(),
            };
            (window as any).localStorage = mockLocalStorage;

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await storageManager.getMolecules();
            consoleSpy.mockRestore();

            expect(mockLocalStorage.getItem).toHaveBeenCalled();
        });

        it('handles storage quota exceeded errors', async () => {
            // Mock storage quota exceeded error
            const mockLocalStorage = {
                setItem: jest.fn().mockImplementation(() => {
                    throw new Error('QuotaExceededError');
                }),
            };
            (window as any).localStorage = mockLocalStorage;

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await storageManager.saveMolecule({
                id: 1,
                title: 'Test Molecule',
                coverImage: '',
                files: [],
            });
            consoleSpy.mockRestore();

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('File Handling Errors', () => {
        it('handles file read errors gracefully', async () => {
            const file = new File([], 'test.jpg', { type: 'image/jpeg' });
            const preview = await getFilePreview(file);
            expect(preview).toBeNull();
        });

        it('handles invalid file types gracefully', async () => {
            const file = new File(['test'], 'test.invalid', { type: 'invalid/type' });
            const preview = await getFilePreview(file);
            expect(preview).toBeNull();
        });

        it('handles corrupted image files gracefully', async () => {
            const file = new File(['not an image'], 'corrupted.jpg', { type: 'image/jpeg' });
            const preview = await getFilePreview(file);
            expect(preview).toBeNull();
        });

        it('handles large file errors gracefully', async () => {
            // Create a very large file
            const largeData = new Array(1024 * 1024 * 100).join('a'); // 100MB
            const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });
            const preview = await getFilePreview(file);
            expect(preview).toBeNull();
        });
    });

    describe('Network Error Handling', () => {
        it('handles offline state gracefully', async () => {
            // Mock offline state
            Object.defineProperty(navigator, 'onLine', {
                get: () => false,
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            await storageManager.init();
            consoleSpy.mockRestore();
        });

        it('handles network errors gracefully', async () => {
            // Mock network error
            const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
            (window as any).fetch = mockFetch;

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await storageManager.init();
            consoleSpy.mockRestore();
        });
    });

    describe('Data Validation', () => {
        it('handles invalid molecule data gracefully', async () => {
            const invalidMolecule = {
                id: 'invalid',
                title: '',
                coverImage: null,
                files: undefined,
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await storageManager.saveMolecule(invalidMolecule as any);
            consoleSpy.mockRestore();
        });

        it('handles invalid file data gracefully', async () => {
            const invalidFile = {
                name: '',
                type: null,
                size: 'invalid',
                lastModified: undefined,
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await storageManager.saveMolecule({
                id: 1,
                title: 'Test',
                coverImage: '',
                files: [invalidFile as any],
            });
            consoleSpy.mockRestore();
        });
    });
}); 