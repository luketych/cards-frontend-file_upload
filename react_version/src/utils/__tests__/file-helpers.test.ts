import { formatFileSize, getFilePreview } from '../file-helpers';

describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
        expect(formatFileSize(500)).toBe('500.0 B');
        expect(formatFileSize(1023)).toBe('1023.0 B');
    });

    it('formats kilobytes correctly', () => {
        expect(formatFileSize(1024)).toBe('1.0 KB');
        expect(formatFileSize(2048)).toBe('2.0 KB');
        expect(formatFileSize(1024 * 1023)).toBe('1023.0 KB');
    });

    it('formats megabytes correctly', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
        expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
        expect(formatFileSize(1023 * 1024 * 1024)).toBe('1023.0 MB');
    });

    it('formats gigabytes correctly', () => {
        expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
        expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
    });

    it('handles edge cases', () => {
        expect(formatFileSize(0)).toBe('0.0 B');
        expect(formatFileSize(1)).toBe('1.0 B');
        expect(formatFileSize(1023.5)).toBe('1023.5 B');
        expect(formatFileSize(1024.5)).toBe('1.0 KB');
    });

    it('handles large numbers', () => {
        expect(formatFileSize(Number.MAX_SAFE_INTEGER)).toBe('8.0 PB');
    });
});

describe('getFilePreview', () => {
    it('returns null for non-image files', async () => {
        const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const result = await getFilePreview(textFile);
        expect(result).toBeNull();
    });

    it('creates preview for image files', async () => {
        // Create a small test image
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob!);
            }, 'image/jpeg');
        });

        const imageFile = new File([blob], 'test.jpg', { type: 'image/jpeg' });
        const result = await getFilePreview(imageFile);
        
        expect(result).toBeTruthy();
        expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('resizes large images', async () => {
        // Create a large test image
        const canvas = document.createElement('canvas');
        canvas.width = 2000;
        canvas.height = 2000;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 2000, 2000);

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob!);
            }, 'image/jpeg');
        });

        const imageFile = new File([blob], 'large.jpg', { type: 'image/jpeg' });
        const result = await getFilePreview(imageFile);
        
        expect(result).toBeTruthy();
        expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });
}); 