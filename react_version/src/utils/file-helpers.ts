export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getFileIcon(fileType: string): string {
    const icons: Record<string, string> = {
        'application/pdf': '📄',
        'text/': '📝',
        'video/': '🎥',
        'audio/': '🎵'
    };

    for (const [type, icon] of Object.entries(icons)) {
        if (fileType.startsWith(type)) return icon;
    }
    return '📁';
}

export function getFilePreview(file: File): Promise<string | null> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(null);
            return;
        }

        console.log('Starting preview generation for:', file.name, 'type:', file.type, 'size:', file.size);

        const img = new Image();
        const reader = new FileReader();

        img.onerror = (error) => {
            console.error('Image loading error:', error);
            reject(error);
        };

        reader.onload = (e) => {
            console.log('FileReader loaded data for:', file.name);
            const dataUrl = e.target?.result as string;
            console.log('DataURL starts with:', dataUrl.substring(0, 50) + '...');
            
            img.src = dataUrl;
            img.onload = () => {
                console.log('Image loaded with dimensions:', img.width, 'x', img.height);
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Failed to get canvas context');
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Set a background color to help identify if drawing fails
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                try {
                    ctx.drawImage(img, 0, 0, width, height);
                    const resultDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    console.log('Successfully generated preview for:', file.name);
                    console.log('Result DataURL starts with:', resultDataUrl.substring(0, 50) + '...');
                    resolve(resultDataUrl);
                } catch (error) {
                    console.error('Error drawing image:', error);
                    reject(error);
                }
            };
        };
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            reject(error);
        };
        reader.readAsDataURL(file);
    });
} 