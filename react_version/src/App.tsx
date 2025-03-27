import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Typography,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MoleculeCard } from './components/MoleculeCard';
import { MoleculeModal } from './components/MoleculeModal';
import { storageManager } from './utils/storage';
import { Molecule } from './types/molecule';

function App() {
    const [molecules, setMolecules] = useState<Molecule[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMolecule, setSelectedMolecule] = useState<Molecule | undefined>();

    useEffect(() => {
        loadMolecules();
    }, []);

    const loadMolecules = async () => {
        const loadedMolecules = await storageManager.getMolecules();
        setMolecules(loadedMolecules);
    };

    const handleOpenModal = (molecule?: Molecule) => {
        setSelectedMolecule(molecule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedMolecule(undefined);
        setIsModalOpen(false);
    };

    const handleSaveMolecule = async (molecule: Omit<Molecule, 'id'>) => {
        if (selectedMolecule) {
            // Update existing molecule
            const updatedMolecule: Molecule = {
                ...molecule,
                id: selectedMolecule.id,
            };
            const updatedMolecules = molecules.map((m) =>
                m.id === selectedMolecule.id ? updatedMolecule : m
            );
            setMolecules(updatedMolecules);
            await storageManager.saveMolecule(updatedMolecule);
        } else {
            // Create new molecule
            const newMolecule: Molecule = {
                ...molecule,
                id: Date.now(),
            };
            setMolecules([...molecules, newMolecule]);
            await storageManager.saveMolecule(newMolecule);
        }
        handleCloseModal();
    };

    const handleDeleteMolecule = async (id: number) => {
        const updatedMolecules = molecules.filter((m) => m.id !== id);
        setMolecules(updatedMolecules);
        await storageManager.deleteMolecule(id);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Molecule Manager
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal()}
                >
                    New Molecule
                </Button>
            </Box>

            <Grid container spacing={3}>
                {molecules.map((molecule) => (
                    <Grid item key={molecule.id} xs={12} sm={6} md={4}>
                        <MoleculeCard
                            molecule={molecule}
                            onClick={() => handleOpenModal(molecule)}
                            onDelete={handleDeleteMolecule}
                        />
                    </Grid>
                ))}
            </Grid>

            <MoleculeModal
                open={isModalOpen}
                onClose={handleCloseModal}
                molecule={selectedMolecule}
                onSave={handleSaveMolecule}
                onDelete={handleDeleteMolecule}
            />
        </Container>
    );
}

export default App;
