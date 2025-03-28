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
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
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
    const [files, setFiles] = useState<File[]>([]);
    const [selectedCoverImageIndex, setSelectedCoverImageIndex] = useState<number>(-1);
    const [isSaving, setIsSaving] = useState(false);
    const [processingFiles, setProcessingFiles] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResponses, setUploadResponses] = useState<any[]>([]);
    const [showExitWarning, setShowExitWarning] = useState(false);

    // Reset state when modal is opened/closed or molecule changes
    useEffect(() => {
        if (open) {
            setTitle(molecule?.title || '');
            
            if (molecule?.files) {
                const existingFiles = molecule.files.map(fileData => {
                    const file = new File([], fileData.name, { type: fileData.type });
                    Object.defineProperty(file, 'size', { value: fileData.size });
                    Object.defineProperty(file, 'lastModified', { value: fileData.lastModified });
                    if (fileData.thumbnail) {
                        Object.defineProperty(file, 'dataURL', { value: fileData.thumbnail });
                    }
                    return file;
                });
                setFiles(existingFiles);
                
                // Find the index of the file that matches the cover image
                const coverIndex = existingFiles.findIndex(file => {
                    const fileData = molecule.files.find(f => f.name === file.name);
                    return fileData?.thumbnail === molecule.coverImage;
                });
                setSelectedCoverImageIndex(coverIndex);

                setUploadResponses(molecule.uploadResponses || []);
            } else {
                setFiles([]);
                setSelectedCoverImageIndex(-1);
                setUploadResponses([]);
            }
            
            setProcessingFiles(0);
            setShowConfirmDialog(false);
        } else {
            setTitle('');
            setFiles([]);
            setSelectedCoverImageIndex(-1);
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

    const handleClose = useCallback(() => {
        if (processingFiles > 0 || isSaving || isUploading) {
            setShowConfirmDialog(true);
        } else if (files.length > 0 && !molecule) {
            // Only show exit warning for new molecules with files
            setShowExitWarning(true);
        } else {
            onClose();
        }
    }, [processingFiles, isSaving, isUploading, onClose, files.length, molecule]);

    const handleConfirmClose = useCallback(() => {
        setShowConfirmDialog(false);
        onClose();
    }, [onClose]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        setProcessingFiles(prev => prev + selectedFiles.length);

        try {
            const processedFiles = await Promise.all(
                selectedFiles.map(async (file) => {
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
            
            // If this is the first image file and no cover is selected, automatically select it
            if (selectedCoverImageIndex === -1) {
                const firstImageIndex = files.length + processedFiles.findIndex(file => file.type.startsWith('image/'));
                if (firstImageIndex >= 0) {
                    setSelectedCoverImageIndex(firstImageIndex);
                }
            }
        } catch (error) {
            console.error('Error processing files:', error);
        } finally {
            setProcessingFiles(prev => prev - selectedFiles.length);
        }
    }, [files.length, selectedCoverImageIndex]);

    const handleSave = useCallback(async () => {
        if (!title.trim()) {
            alert('Please enter a title for your molecule');
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
            
            // Process files, preserving existing file data for files that haven't changed
            const processedFiles = await Promise.all(
                files.map(async (file, index) => {
                    if ('dataURL' in file) {
                        return {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            lastModified: file.lastModified,
                            thumbnail: (file as any).dataURL
                        };
                    }
                    
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

            // Get the cover image - either from selected image file or use default icon
            let coverImageData = '';
            if (selectedCoverImageIndex !== -1) {
                const selectedFile = processedFiles[selectedCoverImageIndex];
                if (selectedFile.thumbnail) {
                    coverImageData = selectedFile.thumbnail;
                } else {
                    // Create a data URL for a simple file icon
                    const svg = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24">
                            <path fill="#9e9e9e" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                    `;
                    coverImageData = `data:image/svg+xml;base64,${btoa(svg)}`;
                }
            } else {
                // Create a data URL for a simple file icon
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24">
                        <path fill="#9e9e9e" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                    </svg>
                `;
                coverImageData = `data:image/svg+xml;base64,${btoa(svg)}`;
            }

            await onSave({
                title,
                coverImage: coverImageData,
                files: processedFiles,
                uploadResponses,
                indexHtml: molecule?.indexHtml,
            });

            onClose();
        } catch (error) {
            console.error('Error saving molecule:', error);
            alert('Error saving molecule. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [title, files, selectedCoverImageIndex, processingFiles, onSave, onClose, uploadResponses, molecule?.indexHtml]);

    const handleUpload = async () => {
        if (!title.trim()) {
            alert('Please enter a title for your molecule');
            return;
        }

        if (files.length === 0) {
            alert('Please add at least one file');
            return;
        }

        setIsUploading(true);
        const responses: Array<{ url?: string; error?: string; status?: string; file?: string }> = [];

        try {
            // Upload each file
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

                    const response = await fetch('http://localhost:1337/api/upload', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': `Bearer ${import.meta.env.VITE_API_TOKEN}`
                        },
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMessage;
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.error?.message || errorJson.message || errorText;
                        } catch {
                            errorMessage = errorText;
                        }
                        throw new Error(`Upload failed (${response.status}): ${errorMessage}`);
                    }

                    const data = await response.json();
                    responses.push(data[0]); // Strapi returns an array with one item
                } catch (error) {
                    console.error('Upload error:', {
                        file: file.name,
                        error: error instanceof Error ? error.message : error
                    });

                    responses.push({ 
                        error: error instanceof Error ? error.message : 'Upload failed',
                        status: 'error',
                        file: file.name
                    });
                }
            }

            // Generate index.html after all uploads
            const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - File Index</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            background: white;
            margin-bottom: 10px;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        li:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .file-name {
            font-weight: 500;
            color: #2196f3;
            margin-bottom: 5px;
            text-decoration: none;
            display: block;
        }
        .file-name:hover {
            text-decoration: underline;
        }
        .file-info {
            font-size: 0.9em;
            color: #666;
        }
        .url {
            word-break: break-all;
            font-family: monospace;
            font-size: 0.85em;
            background: #f8f8f8;
            padding: 4px 8px;
            border-radius: 4px;
            margin-top: 4px;
            display: block;
        }
        .error {
            color: #d32f2f;
            font-size: 0.9em;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <ul>
        ${files.map((file, index) => {
            const uploadResponse = responses[index];
            const fileUrl = uploadResponse?.url;
            const hasError = uploadResponse?.error;
            
            return `
            <li>
                ${fileUrl ? `
                    <a href="${fileUrl}" class="file-name" target="_blank" rel="noopener noreferrer">
                        ${file.type.startsWith('image/') ? '🖼️' : '📄'} ${file.name}
                    </a>
                    <div class="url">${fileUrl}</div>
                ` : `
                    <span class="file-name">
                        ${file.type.startsWith('image/') ? '🖼️' : '📄'} ${file.name}
                    </span>
                `}
                <div class="file-info">
                    Type: ${file.type}<br>
                    Size: ${(file.size / 1024).toFixed(2)} KB<br>
                    Last Modified: ${new Date(file.lastModified).toLocaleString()}
                </div>
                ${hasError ? `<div class="error">Error: ${hasError}</div>` : ''}
            </li>
            `;
        }).join('')}
    </ul>
</body>
</html>`;

            // Get the cover image - either from selected image file or use default icon
            let coverImageData = '';
            if (selectedCoverImageIndex !== -1) {
                const selectedFile = files[selectedCoverImageIndex];
                const selectedFileData = selectedFile as { dataURL?: string } & File;
                if (selectedFileData.dataURL) {
                    coverImageData = selectedFileData.dataURL;
                } else {
                    // Create a data URL for a simple file icon
                    const svg = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24">
                            <path fill="#9e9e9e" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                    `;
                    coverImageData = `data:image/svg+xml;base64,${btoa(svg)}`;
                }
            } else {
                // Create a data URL for a simple file icon
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24">
                        <path fill="#9e9e9e" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                    </svg>
                `;
                coverImageData = `data:image/svg+xml;base64,${btoa(svg)}`;
            }

            // Save the molecule with upload responses and index.html
            await onSave({
                title,
                coverImage: coverImageData,
                files: files.map(file => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    thumbnail: (file as any).dataURL
                })),
                uploadResponses: responses,
                indexHtml,
            });

            onClose();
        } catch (error) {
            console.error('Error during upload process:', error);
            alert('Error uploading files. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        if (index === selectedCoverImageIndex) {
            // Find the next available image file
            const nextImageIndex = files.findIndex((file, i) => i !== index && file.type.startsWith('image/'));
            setSelectedCoverImageIndex(nextImageIndex);
        } else if (index < selectedCoverImageIndex) {
            setSelectedCoverImageIndex(prev => prev - 1);
        }
    }, [files, selectedCoverImageIndex]);

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
                    },
                }}
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {molecule ? 'Edit Molecule' : 'New Molecule'}
                        </Typography>
                        <IconButton edge="end" color="inherit" onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            margin="normal"
                        />

                        <Box
                            sx={{
                                mt: 2,
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
                        >
                            <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
                            <Typography>
                                Click or drag files here to upload
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Images can be selected as cover image
                            </Typography>
                        </Box>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            style={{ display: 'none' }}
                        />

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {files.map((file, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            '&:hover .cover-select': {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        <FileItem
                                            file={file as any}
                                            onRemove={() => handleRemoveFile(index)}
                                        />
                                        {file.type.startsWith('image/') && (
                                            <IconButton
                                                className="cover-select"
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    left: 4,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                    opacity: index === selectedCoverImageIndex ? 1 : 0,
                                                    transition: 'opacity 0.2s',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    },
                                                }}
                                                onClick={() => setSelectedCoverImageIndex(index)}
                                            >
                                                {index === selectedCoverImageIndex ? (
                                                    <StarIcon color="primary" />
                                                ) : (
                                                    <StarBorderIcon />
                                                )}
                                            </IconButton>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    {onDelete && molecule && (
                        <Button
                            color="error"
                            onClick={() => onDelete(molecule.id)}
                            sx={{ mr: 'auto' }}
                        >
                            Delete
                        </Button>
                    )}
                    <Button onClick={handleClose}>Cancel</Button>
                    {molecule ? (
                        // Edit mode - show Save button
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            color="primary"
                            disabled={isSaving || processingFiles > 0}
                        >
                            {isSaving ? <CircularProgress size={24} /> : 'Save'}
                        </Button>
                    ) : (
                        // Create mode - show Upload button
                        <Button
                            onClick={handleUpload}
                            variant="contained"
                            color="primary"
                            disabled={isUploading || processingFiles > 0 || files.length === 0}
                        >
                            {isUploading ? <CircularProgress size={24} /> : 'Upload'}
                        </Button>
                    )}
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
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to exit without saving your changes?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExitWarning(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => {
                            setShowExitWarning(false);
                            onClose();
                        }} 
                        color="error"
                    >
                        Exit Without Saving
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 