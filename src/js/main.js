// Try to import StorageManager as a module, fall back to global if needed
let StorageManagerClass;
try {
    const module = await import('./storage-manager.js');
    StorageManagerClass = module.default;
} catch (error) {
    console.warn('Module import failed, falling back to global:', error);
    StorageManagerClass = window.StorageManager;
}

if (!StorageManagerClass) {
    throw new Error('StorageManager not found. Make sure storage-manager.js is loaded.');
}

class MoleculeCreator {
    constructor() {
        this.files = new Set();
        this.coverImage = null;
        this.storage = new StorageManagerClass();
    }

    async initialize() {
        try {
            // Initialize storage first
            await this.storage.init();
            
            // Then initialize UI elements and event listeners
            this.initializeElements();
            this.initializeEventListeners();
            
            // Finally, load data and display
            await this.storage.migrateFromLocalStorage();
            await this.displayMolecules();
            await this.updateStorageDisplay();
            
            console.log('MoleculeCreator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MoleculeCreator:', error);
            alert('There was an error initializing the application. Please refresh the page.');
        }
    }

    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('uploadModal');
        this.createButton = document.getElementById('createMolecule');
        this.closeButton = document.querySelector('.close-button');
        this.saveButton = document.getElementById('saveMolecule');
        this.clearStorageButton = document.createElement('button');
        this.clearStorageButton.id = 'clearStorage';
        this.clearStorageButton.textContent = 'Clear Storage';
        this.clearStorageButton.style.marginLeft = '10px';
        this.createButton.parentNode.insertBefore(this.clearStorageButton, this.createButton.nextSibling);
        
        // Create storage info element
        this.storageInfo = document.createElement('div');
        this.storageInfo.style.marginLeft = '10px';
        this.storageInfo.style.display = 'inline-block';
        this.createButton.parentNode.insertBefore(this.storageInfo, this.clearStorageButton.nextSibling);
        
        // Form elements
        this.titleInput = document.getElementById('moleculeTitle');
        this.coverImageInput = document.getElementById('coverImageInput');
        this.coverPreview = document.getElementById('coverPreview');
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.querySelector('.upload-area');
        this.fileGrid = document.getElementById('fileGrid');
        
        // Main grid
        this.moleculesGrid = document.getElementById('moleculesGrid');
    }

    initializeEventListeners() {
        // Modal controls
        this.createButton.addEventListener('click', () => this.openModal());
        this.closeButton.addEventListener('click', () => this.closeModal());
        this.saveButton.addEventListener('click', () => this.saveMolecule());
        this.clearStorageButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to remove all molecules? This cannot be undone.')) {
                await this.storage.clearAll();
                this.displayMolecules();
                this.updateStorageDisplay();
                alert('All molecules have been removed.');
            }
        });
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Cover image handling
        this.coverImageInput.addEventListener('change', (e) => this.handleCoverImage(e));

        // File input handling
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop handling for content files
        const handleDrag = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.dataTransfer.types.includes('Files')) {
                this.uploadArea.classList.add('drag-over');
            }
        };

        this.uploadArea.addEventListener('dragenter', handleDrag);
        this.uploadArea.addEventListener('dragover', handleDrag);
        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === this.uploadArea) {
                this.uploadArea.classList.remove('drag-over');
            }
        });
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Prevent default drag behavior outside upload area
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    async updateStorageDisplay() {
        const { size, maxSize } = await this.storage.getStorageInfo();
        const usagePercentage = (size / maxSize) * 100;
        this.storageInfo.textContent = `Storage: ${this.formatFileSize(size)} / ${this.formatFileSize(maxSize)} (${usagePercentage.toFixed(1)}%)`;
        this.storageInfo.style.color = usagePercentage > 80 ? 'red' : 'inherit';
    }

    async handleCoverImage(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.coverImage = file;
            const preview = await this.getFilePreview(file);
            this.coverPreview.innerHTML = `<img src="${preview}" alt="Cover Preview">`;
        }
    }

    openModal() {
        this.modal.classList.add('visible');
        this.resetForm();
    }

    closeModal() {
        this.modal.classList.remove('visible');
        this.resetForm();
    }

    resetForm() {
        this.titleInput.value = '';
        this.coverPreview.innerHTML = '';
        this.fileGrid.innerHTML = '';
        this.files.clear();
        this.coverImage = null;
    }

    handleDragEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        this.handleFiles(files);
    }

    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (!this.files.has(file)) {
                this.files.add(file);
                this.createFilePreview(file);
            }
        });
    }

    async createFilePreview(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const preview = document.createElement('div');
        preview.className = 'file-preview';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = await this.getFilePreview(file);
            preview.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.className = 'placeholder-icon';
            icon.textContent = this.getFileIcon(file.type);
            preview.appendChild(icon);
        }

        const info = document.createElement('div');
        info.className = 'file-info';
        
        const name = document.createElement('p');
        name.className = 'file-name';
        name.title = file.name;
        name.textContent = file.name;
        name.appendChild(document.createElement('br'));
        name.appendChild(document.createTextNode(this.formatFileSize(file.size)));
        
        info.appendChild(name);
        fileItem.appendChild(preview);
        fileItem.appendChild(info);
        this.fileGrid.appendChild(fileItem);
    }

    getFileIcon(fileType) {
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

    getFilePreview(file) {
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

    async saveMolecule() {
        const title = this.titleInput.value.trim();
        if (!title) {
            alert('Please enter a title for your molecule');
            return;
        }

        if (!this.coverImage) {
            alert('Please select a cover image');
            return;
        }

        if (this.files.size === 0) {
            alert('Please add at least one file');
            return;
        }

        try {
            const coverImageData = await this.getFilePreview(this.coverImage);
            const molecule = {
                id: Date.now(),
                title,
                coverImage: coverImageData,
                files: Array.from(this.files).map(file => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified
                }))
            };

            await this.storage.saveMolecule(molecule);
            this.closeModal();
            await this.displayMolecules();
            this.updateStorageDisplay();

        } catch (error) {
            alert(error.message);
            throw error;
        }
    }

    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    async displayMolecules() {
        const molecules = await this.storage.getMolecules();
        this.moleculesGrid.innerHTML = molecules.map(molecule => `
            <div class="molecule-card" data-id="${molecule.id}">
                <div class="molecule-cover">
                    <img src="${molecule.coverImage}" alt="${molecule.title}">
                </div>
                <h3 class="molecule-title">${molecule.title}</h3>
            </div>
        `).join('');

        this.moleculesGrid.querySelectorAll('.molecule-card').forEach(card => {
            card.addEventListener('click', () => this.viewMolecule(card.dataset.id));
        });
        
        this.updateStorageDisplay();
    }

    async viewMolecule(id) {
        const molecules = await this.storage.getMolecules();
        const molecule = molecules.find(m => m.id === parseInt(id));
        if (!molecule) return;

        const modal = document.createElement('div');
        modal.className = 'modal visible';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${molecule.title}</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="file-grid">
                    ${molecule.files.map(file => `
                        <div class="file-item">
                            <div class="file-preview">
                                <div class="placeholder-icon">${this.getFileIcon(file.type)}</div>
                            </div>
                            <div class="file-info">
                                <p class="file-name" title="${file.name}">${file.name}</p>
                                <p class="file-size">${this.formatFileSize(file.size)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const closeBtn = modal.querySelector('.close-button');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

// Initialize when DOM is loaded
const init = async () => {
    try {
        const creator = new MoleculeCreator();
        await creator.initialize();
        window.moleculeCreator = creator;
    } catch (error) {
        console.error('Failed to start application:', error);
        alert('Failed to start the application. Please refresh the page.');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
