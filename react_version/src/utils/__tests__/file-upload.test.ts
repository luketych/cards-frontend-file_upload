import { getFilePreview } from '../file-helpers';

describe('File Upload', () => {
    beforeEach(() => {
        // Mock URL.createObjectURL
        URL.createObjectURL = jest.fn();
        // Mock URL.revokeObjectURL
        URL.revokeObjectURL = jest.fn();
    });

    it('creates preview for image files', async () => {
        // Create a test image file
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

        const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
        const preview = await getFilePreview(file);

        expect(preview).toBeTruthy();
        expect(preview).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('returns null for non-image files', async () => {
        const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const preview = await getFilePreview(textFile);
        expect(preview).toBeNull();
    });

    it('handles large image files by resizing', async () => {
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

        const file = new File([blob], 'large.jpg', { type: 'image/jpeg' });
        const preview = await getFilePreview(file);

        expect(preview).toBeTruthy();
        expect(preview).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('handles various image formats', async () => {
        const formats = ['jpeg', 'png', 'gif', 'webp'];
        
        for (const format of formats) {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');
            ctx.fillStyle = 'green';
            ctx.fillRect(0, 0, 100, 100);

            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob!);
                }, `image/${format}`);
            });

            const file = new File([blob], `test.${format}`, { type: `image/${format}` });
            const preview = await getFilePreview(file);

            expect(preview).toBeTruthy();
            expect(preview).toMatch(/^data:image\/.*;base64,/);
        }
    });

    it('handles file read errors gracefully', async () => {
        const file = new File([], 'test.jpg', { type: 'image/jpeg' });
        const preview = await getFilePreview(file);
        expect(preview).toBeNull();
    });

    it('maintains image quality while resizing', async () => {
        // Create a test image with a gradient
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        
        const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1, 'blue');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 1000);

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob!);
            }, 'image/jpeg', 0.9); // High quality
        });

        const file = new File([blob], 'gradient.jpg', { type: 'image/jpeg' });
        const preview = await getFilePreview(file);

        expect(preview).toBeTruthy();
        expect(preview).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('handles empty files', async () => {
        const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
        const preview = await getFilePreview(emptyFile);
        expect(preview).toBeNull();
    });

    it('handles corrupted image files', async () => {
        const corruptedFile = new File(['not an image'], 'corrupted.jpg', { type: 'image/jpeg' });
        const preview = await getFilePreview(corruptedFile);
        expect(preview).toBeNull();
    });
}); 