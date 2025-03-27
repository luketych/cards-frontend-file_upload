import React, { useState, useEffect } from 'react';
import { Container, Button, Box, Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import { MoleculeCard } from './components/MoleculeCard';
import { MoleculeModal } from './components/MoleculeModal';
import { Molecule } from './types';
import { storageManager } from './utils/storage';

function App() {
    const [molecules, setMolecules] = useState<Molecule[]>([]);
    const [selectedMolecule, setSelectedMolecule] = useState<Molecule | undefined>();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [storageInfo, setStorageInfo] = useState<{ size: number; maxSize: number }>({ size: 0, maxSize: 0 });

    useEffect(() => {
        const init = async () => {
            await storageManager.init();
            await storageManager.migrateFromLocalStorage();
            const molecules = await storageManager.getMolecules();
            setMolecules(molecules);
            const info = await storageManager.getStorageInfo();
            setStorageInfo(info);
        };
        init();
    }, []);

    const handleCreateMolecule = async (molecule: Omit<Molecule, 'id'>) => {
        const newMolecule: Molecule = {
            ...molecule,
            id: Date.now(),
        };
        await storageManager.saveMolecule(newMolecule);
        setMolecules(prev => [...prev, newMolecule]);
        const info = await storageManager.getStorageInfo();
        setStorageInfo(info);
    };

    const handleUpdateMolecule = async (molecule: Omit<Molecule, 'id'>) => {
        if (!selectedMolecule) return;
        const updatedMolecule: Molecule = {
            ...molecule,
            id: selectedMolecule.id,
        };
        await storageManager.saveMolecule(updatedMolecule);
        setMolecules(prev => prev.map(m => m.id === updatedMolecule.id ? updatedMolecule : m));
        const info = await storageManager.getStorageInfo();
        setStorageInfo(info);
    };

    const handleDeleteMolecule = async (id: number) => {
        await storageManager.deleteMolecule(id);
        setMolecules(prev => prev.filter(m => m.id !== id));
        const info = await storageManager.getStorageInfo();
        setStorageInfo(info);
    };

    const handleClearStorage = async () => {
        if (window.confirm('Are you sure you want to remove all molecules? This cannot be undone.')) {
            await storageManager.clearAll();
            setMolecules([]);
            setStorageInfo({ size: 0, maxSize: 0 });
            alert('All molecules have been removed.');
        }
    };

    const formatFileSize = (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant="contained"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    Create Molecule
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearStorage}
                >
                    Clear Storage
                </Button>
                <Typography
                    sx={{
                        ml: 'auto',
                        color: (storageInfo.size / storageInfo.maxSize) > 0.8 ? 'error.main' : 'inherit'
                    }}
                >
                    Storage: {formatFileSize(storageInfo.size)} / {formatFileSize(storageInfo.maxSize)}
                    ({((storageInfo.size / storageInfo.maxSize) * 100).toFixed(1)}%)
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {molecules.map(molecule => (
                    <Grid item xs={12} sm={6} md={4} key={molecule.id}>
                        <MoleculeCard
                            molecule={molecule}
                            onClick={() => {
                                setSelectedMolecule(molecule);
                                setIsViewModalOpen(true);
                            }}
                            onDelete={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this molecule?')) {
                                    handleDeleteMolecule(molecule.id);
                                }
                            }}
                        />
                    </Grid>
                ))}
            </Grid>

            <MoleculeModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateMolecule}
            />

            <MoleculeModal
                open={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedMolecule(undefined);
                }}
                onSave={handleUpdateMolecule}
                molecule={selectedMolecule}
            />
        </Container>
    );
}

export default App;
