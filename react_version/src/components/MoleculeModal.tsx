import React, { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Grid,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { FileData, Molecule } from '../types';
import { getFilePreview } from '../utils/file-helpers';
import { FileItem } from './FileItem';

interface MoleculeModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (molecule: Omit<Molecule, 'id'>) => Promise<void>;
    molecule?: Molecule;
}

export const MoleculeModal: React.FC<MoleculeModalProps> = ({
    open,
    onClose,
    onSave,
    molecule,
}) => {
    const [title, setTitle] = useState(molecule?.title || '');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>(molecule?.coverImage || '');
    const [files, setFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [processingFiles, setProcessingFiles] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleCoverImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setCoverImage(file);
            try {
                setProcessingFiles(prev => prev + 1);
                const preview = await getFilePreview(file);
                setCoverPreview(preview || '');
            } finally {
                setProcessingFiles(prev => prev - 1);
            }
        }
    }, []);

    const handleFilesChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files || []);
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const droppedFiles = Array.from(event.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const handleRemoveFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSave = useCallback(async () => {
        if (!title.trim()) {
            alert('Please enter a title for your molecule');
            return;
        }

        if (!coverImage && !coverPreview) {
            alert('Please select a cover image');
            return;
        }

        if (files.length === 0) {
            alert('Please add at least one file');
            return;
        }

        if (processingFiles > 0) {
            alert('Please wait for all files to finish processing');
            return;
        }

        try {
            setIsSaving(true);
            const coverImageData = coverPreview || (await getFilePreview(coverImage!)) || '';
            
            const processedFiles = await Promise.all(
                files.map(async file => {
                    const fileData: FileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                    };
                    
                    if (file.type.startsWith('image/')) {
                        fileData.thumbnail = await getFilePreview(file) || undefined;
                    }
                    
                    return fileData;
                })
            );

            await onSave({
                title: title.trim(),
                coverImage: coverImageData,
                files: processedFiles,
            });

            onClose();
        } catch (error) {
            console.error('Error saving molecule:', error);
            alert('Error saving molecule. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [title, coverImage, coverPreview, files, processingFiles, onSave, onClose]);

    const handleClose = useCallback(() => {
        if (processingFiles > 0 || isSaving) {
            setShowConfirmDialog(true);
        } else {
            onClose();
        }
    }, [processingFiles, isSaving, onClose]);

    const handleConfirmClose = useCallback(() => {
        setShowConfirmDialog(false);
        onClose();
    }, [onClose]);

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {molecule ? 'Edit Molecule' : 'Create Molecule'}
                    <Button
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                    >
                        ×
                    </Button>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Molecule Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Cover Image
                            </Typography>
                            <Box
                                sx={{
                                    border: '2px dashed #ccc',
                                    borderRadius: 1,
                                    p: 2,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                    },
                                }}
                                onClick={() => coverInputRef.current?.click()}
                            >
                                {coverPreview ? (
                                    <Box
                                        component="img"
                                        src={coverPreview}
                                        alt="Cover Preview"
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: 200,
                                            objectFit: 'contain',
                                        }}
                                    />
                                ) : (
                                    <Typography>Click to select cover image</Typography>
                                )}
                            </Box>
                            <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                                style={{ display: 'none' }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Content Files
                            </Typography>
                            <Box
                                sx={{
                                    border: '2px dashed #ccc',
                                    borderRadius: 1,
                                    p: 2,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                    },
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <Typography>
                                    Drop files here or click to upload
                                </Typography>
                            </Box>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFilesChange}
                                style={{ display: 'none' }}
                            />

                            {files.length > 0 && (
                                <Grid container spacing={2} sx={{ mt: 2 }}>
                                    {files.map((file, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <FileItem
                                                file={{
                                                    name: file.name,
                                                    type: file.type,
                                                    size: file.size,
                                                    lastModified: file.lastModified,
                                                }}
                                                onRemove={() => handleRemoveFile(index)}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={isSaving || processingFiles > 0}
                    >
                        {isSaving ? 'Saving...' : processingFiles > 0 ? 'Processing Files...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
            >
                <DialogTitle>Confirm Close</DialogTitle>
                <DialogContent>
                    <Typography>
                        Files are still processing. Are you sure you want to close?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmClose} color="error">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 