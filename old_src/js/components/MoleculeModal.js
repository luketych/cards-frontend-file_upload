import { formatFileSize, getFileIcon, getFilePreview } from '../utils/file-helpers.js';

export class MoleculeModal {
    constructor(onSave, onClose) {
        this.onSave = onSave;
        this.onClose = onClose;
        this.files = new Set();
        this.coverImage = null;
        this.processingFiles = 0;
        this.isSaving = false;
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.modal = document.getElementById('uploadModal');
        this.titleInput = document.getElementById('moleculeTitle');
        this.coverImageInput = document.getElementById('coverImageInput');
        this.coverPreview = document.getElementById('coverPreview');
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.querySelector('.upload-area');
        this.fileGrid = document.getElementById('fileGrid');
        this.saveButton = document.getElementById('saveMolecule');
        this.closeButton = document.querySelector('.close-button');
    }

    initializeEventListeners() {
        this.closeButton.addEventListener('click', () => this.close());
        this.saveButton.addEventListener('click', async () => {
            if (this.isSaving) return; // Prevent multiple saves
            await this.save();
        });
        this.coverImageInput.addEventListener('change', (e) => this.handleCoverImage(e));
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop handling
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
    }

    updateSaveButton() {
        const isProcessing = this.processingFiles > 0;
        this.saveButton.disabled = isProcessing || this.isSaving;
        this.saveButton.textContent = isProcessing ? 'Processing Files...' : 
                                    this.isSaving ? 'Creating...' : 'Create Molecule';
    }

    async handleCoverImage(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.coverImage = file;
            try {
                this.processingFiles++;
                this.updateSaveButton();
                const preview = await getFilePreview(file);
                this.coverPreview.innerHTML = `<img src="${preview}" alt="Cover Preview">`;
            } finally {
                this.processingFiles--;
                this.updateSaveButton();
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');
        this.handleFiles(e.dataTransfer.files);
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
        fileItem.className = 'file-item loading';

        const preview = document.createElement('div');
        preview.className = 'file-preview';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            preview.appendChild(img);
            try {
                this.processingFiles++;
                this.updateSaveButton();
                img.src = await getFilePreview(file);
            } finally {
                this.processingFiles--;
                this.updateSaveButton();
            }
        } else {
            const icon = document.createElement('div');
            icon.className = 'placeholder-icon';
            icon.textContent = getFileIcon(file.type);
            preview.appendChild(icon);
        }
        fileItem.classList.remove('loading');

        const info = document.createElement('div');
        info.className = 'file-info';
        
        const name = document.createElement('p');
        name.className = 'file-name';
        name.title = file.name;
        name.textContent = file.name;
        name.appendChild(document.createElement('br'));
        name.appendChild(document.createTextNode(formatFileSize(file.size)));
        
        info.appendChild(name);
        fileItem.appendChild(preview);
        fileItem.appendChild(info);
        this.fileGrid.appendChild(fileItem);
    }

    async validate() {
        const title = this.titleInput.value.trim();
        if (!title) {
            alert('Please enter a title for your molecule');
            return false;
        }

        if (this.processingFiles > 0) {
            alert('Please wait for all files to finish processing');
            return false;
        }

        if (!this.coverImage) {
            alert('Please select a cover image');
            return false;
        }

        if (this.files.size === 0) {
            alert('Please add at least one file');
            return false;
        }

        return true;
    }

    async save() {
        if (!await this.validate()) return;

        try {
            this.isSaving = true;
            this.updateSaveButton();

            const title = this.titleInput.value.trim();
            const coverImageData = await getFilePreview(this.coverImage);
            
            // Process files and generate thumbnails
            const processedFiles = await Promise.all(Array.from(this.files).map(async file => {
                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                };
                
                if (file.type.startsWith('image/')) {
                    fileData.thumbnail = await getFilePreview(file);
                }
                
                return fileData;
            }));

            await this.onSave({
                id: Date.now(),
                title,
                coverImage: coverImageData,
                files: processedFiles
            });

            this.close();
        } catch (error) {
            alert(error.message);
            throw error;
        } finally {
            this.isSaving = false;
            this.updateSaveButton();
        }
    }

    open() {
        this.modal.classList.add('visible');
        this.reset();
    }

    close() {
        if (this.processingFiles > 0 || this.isSaving) {
            if (!confirm('Files are still processing. Are you sure you want to close?')) {
                return;
            }
        }
        this.modal.classList.remove('visible');
        this.reset();
        this.onClose?.();
    }

    reset() {
        this.titleInput.value = '';
        this.coverPreview.innerHTML = '';
        this.fileGrid.innerHTML = '';
        this.files.clear();
        this.coverImage = null;
        this.processingFiles = 0;
        this.isSaving = false;
        this.updateSaveButton();
    }
}
