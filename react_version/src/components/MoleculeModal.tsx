import React, { useState, useRef, useCallback, useEffect } from 'react';
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
    const [title, setTitle] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [processingFiles, setProcessingFiles] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal is opened/closed or molecule changes
    useEffect(() => {
        if (open) {
            // Set initial state based on molecule prop
            setTitle(molecule?.title || '');
            setCoverPreview(molecule?.coverImage || '');
            
            // Convert existing FileData objects to File objects for display
            if (molecule?.files) {
                const existingFiles = molecule.files.map(fileData => {
                    // Create a File object from the FileData
                    const file = new File(
                        [], // Empty blob since we don't have the actual file content
                        fileData.name,
                        { type: fileData.type }
                    );
                    // Add the original properties
                    Object.defineProperty(file, 'size', { value: fileData.size });
                    Object.defineProperty(file, 'lastModified', { value: fileData.lastModified });
                    // Add the thumbnail data
                    if (fileData.thumbnail) {
                        Object.defineProperty(file, 'dataURL', { value: fileData.thumbnail });
                    }
                    return file;
                });
                setFiles(existingFiles);
            } else {
                setFiles([]);
            }
            
            setCoverImage(null);
            setProcessingFiles(0);
            setShowConfirmDialog(false);
        } else {
            // Reset all state when modal is closed
            setTitle('');
            setCoverImage(null);
            setCoverPreview('');
            setFiles([]);
            setProcessingFiles(0);
            setShowConfirmDialog(false);
            setIsSaving(false);
        }
    }, [open, molecule]);

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

    const handleFilesChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files || []);
        setProcessingFiles(prev => prev + newFiles.length);
        
        try {
            const processedFiles = await Promise.all(
                newFiles.map(async file => {
                    if (file.type.startsWith('image/')) {
                        const thumbnail = await getFilePreview(file);
                        if (thumbnail) {
                            Object.defineProperty(file, 'dataURL', { value: thumbnail });
                        }
                    }
                    return file;
                })
            );
            
            setFiles(prev => [...prev, ...processedFiles]);
        } finally {
            setProcessingFiles(prev => prev - newFiles.length);
        }
    }, []);

    const handleDrop = useCallback(async (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const droppedFiles = Array.from(event.dataTransfer.files);
        setProcessingFiles(prev => prev + droppedFiles.length);
        
        try {
            const processedFiles = await Promise.all(
                droppedFiles.map(async file => {
                    if (file.type.startsWith('image/')) {
                        const thumbnail = await getFilePreview(file);
                        if (thumbnail) {
                            Object.defineProperty(file, 'dataURL', { value: thumbnail });
                        }
                    }
                    return file;
                })
            );
            
            setFiles(prev => [...prev, ...processedFiles]);
        } finally {
            setProcessingFiles(prev => prev - droppedFiles.length);
        }
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
            
            // Process files, preserving existing file data for files that haven't changed
            const processedFiles = await Promise.all(
                files.map(async file => {
                    // If this is an existing file (has a dataURL property), use its data
                    if ('dataURL' in file) {
                        return {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            lastModified: file.lastModified,
                            thumbnail: (file as any).dataURL
                        };
                    }
                    
                    // Otherwise, process the new file
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
                                    <Typography>
                                        Click to select a cover image
                                    </Typography>
                                )}
                            </Box>
                            <input
                                type="file"
                                ref={coverInputRef}
                                onChange={handleCoverImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Files
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
                                    Drag and drop files here or click to select
                                </Typography>
                            </Box>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFilesChange}
                                multiple
                                style={{ display: 'none' }}
                            />
                        </Box>

                        {files.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Selected Files
                                </Typography>
                                <Grid container spacing={2}>
                                    {files.map((file, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <FileItem
                                                file={file}
                                                onRemove={() => handleRemoveFile(index)}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={isSaving || processingFiles > 0}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
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
                        You have unsaved changes. Are you sure you want to close?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmDialog(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmClose} color="error">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 