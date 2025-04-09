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
    CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { MoleculeCard } from './components/MoleculeCard';
import { MoleculeModal } from './components/MoleculeModal';
import { storageManager } from './utils/storage';
import { Molecule } from './types/molecule';
import { FileData } from './types/file';

// Extend FileData to include dataURL
interface FileWithDataURL extends FileData {
    dataURL: string;
}

function App() {
    const [molecules, setMolecules] = useState<Molecule[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMolecule, setSelectedMolecule] = useState<Molecule | undefined>();
    const [isUploading, setIsUploading] = useState(false);

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

    const handleUploadAll = async () => {
        setIsUploading(true);
        try {
                const moleculesWithPendingUploads = molecules.filter(molecule => {
                const hasFiles = molecule.files.length > 0;
                const hasNoUploads = !molecule.uploadResponses?.length;
                const hasErrors = molecule.uploadResponses?.some(response => response.error);
                return hasFiles && (hasNoUploads || hasErrors);
            });

            for (const molecule of moleculesWithPendingUploads) {
                const responses = [];

                for (const file of molecule.files) {
                    const formData = new FormData();
                    
                    try {
                        // Check if file is empty
                        if (file.size === 0) {
                            console.error('File is empty:', file.name);
                            responses.push({ 
                                error: 'File is empty',
                                status: 'error',
                                file: file.name
                            });
                            continue;
                        }

                        // Log file details before upload
                        console.log('Uploading file:', {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            lastModified: file.lastModified
                        });

                        // if filetype is image
                        if (file.thumbnail) {
                            try {
                                // Convert base64 to blob
                                const response = await fetch(file.thumbnail);
                                const imageBlob = await response.blob();
                                formData.append('files', imageBlob, file.name);
                            } catch (error) {
                                console.error('Error converting thumbnail to blob:', error);
                                throw new Error('Failed to process file thumbnail');
                            }
                        } else { // if filetype is not image
                            const resp = await fetch(file.name)
                            const fileBlob = await resp.blob()
                            
                            formData.append('files', fileBlob, file.name);
                        }
                        
                        // Verify formData content
                        console.log('FormData entries:');
                        for (const pair of formData.entries()) {
                            console.log(pair[0], pair[1]);
                            const value = pair[1];
                            if (value instanceof Blob) {
                                console.log('File/Blob size in FormData:', value.size);
                            }
                        }

                        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_UPLOAD_PATH}`, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'Authorization': `Bearer ${import.meta.env.STRAPI_UPLOAD_TOKEN}`
                            },
                        });

                        // Log the full response details
                        console.log('Response status:', response.status);
                        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Upload error details:', {
                                status: response.status,
                                statusText: response.statusText,
                                headers: Object.fromEntries(response.headers.entries()),
                                errorText
                            });

                            let errorMessage;
                            try {
                                // Try to parse error as JSON
                                const errorJson = JSON.parse(errorText);
                                errorMessage = errorJson.error?.message || errorJson.message || errorText;
                            } catch {
                                // If not JSON, use text directly
                                errorMessage = errorText;
                            }

                            throw new Error(`Upload failed (${response.status}): ${errorMessage}`);
                        }

                        const data = await response.json();
                        console.log('Upload success response:', data);
                        responses.push(data);
                    } catch (error) {
                        console.error('Upload error:', {
                            file: file.name,
                            error: error instanceof Error ? {
                                message: error.message,
                                stack: error.stack
                            } : error
                        });

                        responses.push({ 
                            error: error instanceof Error ? error.message : 'Upload failed',
                            status: 'error',
                            file: file.name
                        });
                    }
                }

                // Update molecule with upload responses
                const updatedMolecule = {
                    ...molecule,
                    uploadResponses: responses
                };

                // Save the updated molecule
                await storageManager.saveMolecule(updatedMolecule);
                
                // Update molecules state
                setMolecules(prev => 
                    prev.map(m => m.id === molecule.id ? updatedMolecule : m)
                );

                // Log final state for this molecule
                console.log('Final upload responses for molecule:', molecule.title, responses);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const hasPendingUploads = molecules.some(molecule => {
        const hasFiles = molecule.files.length > 0;
        const hasNoUploads = !molecule.uploadResponses?.length;
        const hasErrors = molecule.uploadResponses?.some(response => response.error);
        return hasFiles && (hasNoUploads || hasErrors);
    });

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Molecule Manager
                </Typography>
                <Box display="flex" gap={2}>
                    {hasPendingUploads && (
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                            onClick={handleUploadAll}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Upload All'}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                    >
                        New Molecule
                    </Button>
                </Box>
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
