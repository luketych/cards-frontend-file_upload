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
    Typography,
    IconButton,
    CircularProgress,
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { FileData } from '../types/file';
import { Molecule } from '../types/molecule';
import { getFilePreview } from '../utils/file-helpers';
import { FileItem } from './FileItem';

interface MoleculeModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (molecule: Omit<Molecule, 'id'>) => Promise<void>;
    molecule?: Molecule;
    onDelete?: (id: number) => void;
}

export const MoleculeModal: React.FC<MoleculeModalProps> = ({
    open,
    onClose,
    onSave,
    molecule,
    onDelete,
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
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResponses, setUploadResponses] = useState<any[]>([]);
    const [hasUnuploadedFiles, setHasUnuploadedFiles] = useState(false);
    const [showExitWarning, setShowExitWarning] = useState(false);

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
            setUploadResponses(molecule?.uploadResponses || []);
        } else {
            // Reset all state when modal is closed
            setTitle('');
            setCoverImage(null);
            setCoverPreview('');
            setFiles([]);
            setProcessingFiles(0);
            setShowConfirmDialog(false);
            setIsSaving(false);
            setUploadResponses([]);
        }
    }, [open, molecule]);

    useEffect(() => {
        const loadPreviews = async () => {
            const newPreviews = await Promise.all(
                files.map(file => getFilePreview(file))
            );
            setPreviews(newPreviews.filter((preview): preview is string => preview !== null));
        };
        loadPreviews();
    }, [files]);

    useEffect(() => {
        const hasUploaded = files.length > 0 && uploadResponses.length === files.length;
        setHasUnuploadedFiles(!hasUploaded);
    }, [files, uploadResponses]);

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
        setPreviews(prev => prev.filter((_, i) => i !== index));
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
        if (hasUnuploadedFiles) {
            setShowExitWarning(true);
        } else if (processingFiles > 0 || isSaving) {
            setShowConfirmDialog(true);
        } else {
            onClose();
        }
    }, [processingFiles, isSaving, onClose, hasUnuploadedFiles]);

    const handleConfirmClose = useCallback(() => {
        setShowConfirmDialog(false);
        onClose();
    }, [onClose]);

    const handleUpload = async () => {
        setIsUploading(true);
        const responses = [];

        for (const file of files) {
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

                // If this is a file that was previously loaded (has dataURL)
                const fileWithDataUrl = file as { dataURL?: string } & File;
                if (fileWithDataUrl.dataURL) {
                    // Convert base64 back to blob
                    const response = await fetch(fileWithDataUrl.dataURL);
                    const blob = await response.blob();
                    formData.append('files', blob, file.name);
                } else {
                    formData.append('files', file, file.name);
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

                const response = await fetch('http://localhost:1337/api/upload', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_API_TOKEN}`
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

        setUploadResponses(responses);
        setIsUploading(false);

        // Log final state
        console.log('Final upload responses:', responses);

        // Save the molecule with upload responses
        const updatedMolecule: Omit<Molecule, 'id'> = {
            title,
            coverImage: coverPreview || '',
            files: files.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                thumbnail: (file as any).dataURL
            })),
            uploadResponses: responses,
        };
        await onSave(updatedMolecule);
    };

    const handleUploadAll = async () => {
        if (!files.length) {
            return;
        }
        await handleUpload();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '80vh',
                        maxHeight: '90vh',
                        position: 'relative',
                    },
                }}
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {molecule ? 'Edit Molecule' : 'New Molecule'}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Button
                                startIcon={<CloudUploadIcon />}
                                variant="contained"
                                color="primary"
                                onClick={handleUploadAll}
                                disabled={isUploading || files.length === 0}
                            >
                                {isUploading ? <CircularProgress size={24} /> : 'Upload All'}
                            </Button>
                            <IconButton
                                edge="end"
                                color="inherit"
                                onClick={handleClose}
                                aria-label="close"
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {hasUnuploadedFiles && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            You have files that haven't been uploaded yet. Please upload them before saving.
                        </Alert>
                    )}
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
                    {onDelete && molecule && (
                        <Button onClick={() => onDelete(molecule.id)} color="error">
                            Delete
                        </Button>
                    )}
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

            <Dialog
                open={showExitWarning}
                onClose={() => setShowExitWarning(false)}
            >
                <DialogTitle>Unuploaded Files</DialogTitle>
                <DialogContent>
                    <Typography>
                        You have files that haven't been uploaded yet. Are you sure you want to exit without uploading them?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExitWarning(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleUploadAll} color="primary" variant="contained">
                        Upload All
                    </Button>
                    <Button 
                        onClick={() => {
                            setShowExitWarning(false);
                            onClose();
                        }} 
                        color="error"
                    >
                        Exit Without Uploading
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 