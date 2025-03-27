export function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getFileIcon(fileType) {
    const icons = {
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

export function getFilePreview(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(null);
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
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
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
