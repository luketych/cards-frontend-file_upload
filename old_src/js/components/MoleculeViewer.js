import { formatFileSize, getFileIcon } from '../utils/file-helpers.js';

export class MoleculeViewer {
    constructor(storage) {
        this.storage = storage;
        this.pendingMolecules = new Map();
    }

    async displayMolecules() {
        const molecules = await this.storage.getMolecules();
        const allMolecules = [...molecules, ...Array.from(this.pendingMolecules.values())];
        const grid = document.getElementById('moleculesGrid');
        
        grid.innerHTML = allMolecules.map(molecule => `
            <div class="molecule-card ${molecule.isLoading ? 'loading' : ''}" data-id="${molecule.id}">
                <div class="molecule-cover">
                    ${molecule.coverImage 
                        ? `<img src="${molecule.coverImage}" alt="${molecule.title}">`
                        : '<div class="loading-placeholder"></div>'
                    }
                </div>
                <h3 class="molecule-title">${molecule.title}</h3>
                ${molecule.isLoading ? '<div class="loading-indicator">Processing...</div>' : ''}
            </div>
        `).join('');

        grid.querySelectorAll('.molecule-card').forEach(card => {
            card.addEventListener('click', () => this.viewMolecule(card.dataset.id));
        });
    }

    async viewMolecule(id) {
        const molecules = await this.storage.getMolecules();
        const molecule = molecules.find(m => m.id === parseInt(id)) || 
                        this.pendingMolecules.get(parseInt(id));
                        
        if (!molecule) return;

        const modal = document.createElement('div');
        modal.className = `modal visible ${molecule.isLoading ? 'loading' : ''}`;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${molecule.title}</h2>
                    <div class="header-actions">
                        ${!molecule.isLoading ? `
                            <input type="file" id="addFiles" multiple style="display: none">
                            <button class="add-files-button">Add Files</button>
                            <button class="delete-molecule">Delete Molecule</button>
                        ` : ''}
                        <button class="close-button">&times;</button>
                    </div>
                </div>
                ${molecule.isLoading ? 
                    `<div class="loading-indicator">
                        Processing files...
                        <div class="loading-progress"></div>
                    </div>` :
                    `<div class="file-grid">
                        ${molecule.files.map((file, index) => `
                            <div class="file-item" data-index="${index}">
                                <div class="file-preview">
                                    ${file.type.startsWith('image/') && file.thumbnail ? 
                                        `<img src="${file.thumbnail}" alt="${file.name}">` :
                                        `<div class="placeholder-icon">${getFileIcon(file.type)}</div>`
                                    }
                                </div>
                                <div class="file-info">
                                    <p class="file-name" title="${file.name}">${file.name}</p>
                                    <p class="file-size">${formatFileSize(file.size)}</p>
                                    <button class="remove-file" data-index="${index}">&times;</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        `;

        document.body.appendChild(modal);

        if (molecule.isLoading) {
            const closeBtn = modal.querySelector('.close-button');
            closeBtn.addEventListener('click', () => modal.remove());
            return;
        }

        this.setupModalHandlers(modal, molecule);
    }

    setupModalHandlers(modal, molecule) {
        const closeBtn = modal.querySelector('.close-button');
        const addFilesBtn = modal.querySelector('.add-files-button');
        const addFilesInput = modal.querySelector('#addFiles');
        const deleteBtn = modal.querySelector('.delete-molecule');

        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Delete molecule handler
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this molecule? This cannot be undone.')) {
                await this.storage.deleteMolecule(molecule.id);
                modal.remove();
                this.displayMolecules();
            }
        });

        // Add files handler
        addFilesBtn.addEventListener('click', () => addFilesInput.click());
        addFilesInput.addEventListener('change', async (e) => {
            modal.classList.add('loading');
            const newFiles = Array.from(e.target.files);
            try {
                for (const file of newFiles) {
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                    };
                    
                    if (file.type.startsWith('image/')) {
                        fileData.thumbnail = await getFilePreview(file);
                    }
                    molecule.files.push(fileData);
                }
                await this.storage.saveMolecule(molecule);
                modal.remove();
                this.viewMolecule(molecule.id);
            } catch (error) {
                console.error('Error adding files:', error);
                alert('Error adding files. Please try again.');
            }
            modal.classList.remove('loading');
        });

        // Remove file handler
        modal.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const index = parseInt(button.dataset.index);
                if (confirm('Remove this file?')) {
                    molecule.files.splice(index, 1);
                    await this.storage.saveMolecule(molecule);
                    modal.remove();
                    this.viewMolecule(molecule.id);
                }
            });
        });
    }

    addPendingMolecule(molecule) {
        this.pendingMolecules.set(molecule.id, molecule);
    }

    removePendingMolecule(id) {
        this.pendingMolecules.delete(id);
    }
}
