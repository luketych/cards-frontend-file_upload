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

import { MoleculeModal } from './components/MoleculeModal.js';
import { MoleculeViewer } from './components/MoleculeViewer.js';

class MoleculeCreator {
    constructor() {
        this.storage = new StorageManagerClass();
        this.initializeComponents();
    }

    initializeComponents() {
        this.createButton = document.getElementById('createMolecule');
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

        // Initialize molecule viewer
        this.viewer = new MoleculeViewer(this.storage);

        // Initialize creation modal
        this.modal = new MoleculeModal(
            async (molecule) => await this.saveMolecule(molecule),
            () => this.updateStorageDisplay()
        );
    }

    async initialize() {
        try {
            // Initialize storage first
            await this.storage.init();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Migrate and load data
            await this.storage.migrateFromLocalStorage();
            await this.viewer.displayMolecules();
            await this.updateStorageDisplay();
            
            console.log('MoleculeCreator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MoleculeCreator:', error);
            alert('There was an error initializing the application. Please refresh the page.');
        }
    }

    initializeEventListeners() {
        this.createButton.addEventListener('click', () => this.modal.open());
        
        this.clearStorageButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to remove all molecules? This cannot be undone.')) {
                await this.storage.clearAll();
                this.viewer.displayMolecules();
                this.updateStorageDisplay();
                alert('All molecules have been removed.');
            }
        });
    }

    async saveMolecule(molecule) {
        // Check for duplicate title
        const molecules = await this.storage.getMolecules();
        if (molecules.some(m => m.title.toLowerCase() === molecule.title.toLowerCase())) {
            alert('A molecule with this title already exists. Please choose a different title.');
            return;
        }

        // Create placeholder
        this.viewer.addPendingMolecule({
            ...molecule,
            isLoading: true
        });

        await this.viewer.displayMolecules();

        try {
            await this.storage.saveMolecule(molecule);
            this.viewer.removePendingMolecule(molecule.id);
            await this.viewer.displayMolecules();
            await this.updateStorageDisplay();
        } catch (error) {
            this.viewer.removePendingMolecule(molecule.id);
            await this.viewer.displayMolecules();
            throw error;
        }
    }

    async updateStorageDisplay() {
        const { size, maxSize } = await this.storage.getStorageInfo();
        const usagePercentage = (size / maxSize) * 100;
        this.storageInfo.textContent = `Storage: ${this.formatFileSize(size)} / ${this.formatFileSize(maxSize)} (${usagePercentage.toFixed(1)}%)`;
        this.storageInfo.style.color = usagePercentage > 80 ? 'red' : 'inherit';
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
