import React, { useState } from 'react';
import { Box, Typography, IconButton, Dialog, DialogContent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { FileData } from '../types/file';
import { formatFileSize } from '../utils/file-helpers';

interface FileItemProps {
    file: FileData;
    onRemove: () => void;
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 40 }} />;
    if (fileType === 'application/pdf') return <PictureAsPdfIcon sx={{ fontSize: 40, color: 'error.main' }} />;
    if (fileType.startsWith('text/')) return <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
    if (fileType.startsWith('video/')) return <VideoFileIcon sx={{ fontSize: 40, color: 'secondary.main' }} />;
    if (fileType.startsWith('audio/')) return <AudioFileIcon sx={{ fontSize: 40, color: 'info.main' }} />;
    return <InsertDriveFileIcon sx={{ fontSize: 40, color: 'text.secondary' }} />;
};

const ImagePreview = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
    <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
            sx: {
                bgcolor: 'transparent',
                boxShadow: 'none',
            }
        }}
    >
        <DialogContent 
            sx={{ 
                p: 0, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                position: 'relative',
                minHeight: '100vh',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
            }}
            onClick={onClose}
        >
            <IconButton
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    zIndex: 1,
                }}
            >
                <CloseIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <Box
                component="img"
                src={src}
                alt={alt}
                onClick={(e) => e.stopPropagation()}
                sx={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    borderRadius: 1,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    p: 1,
                }}
            />
        </DialogContent>
    </Dialog>
);

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
    const [showPreview, setShowPreview] = useState(false);
    const isImage = file.type.startsWith('image/') && 'dataURL' in file;
    const thumbnail = isImage ? (
        <Box
            component="img"
            src={(file as any).dataURL}
            alt={file.name}
            sx={{
                maxWidth: 200,
                maxHeight: 150,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                '&:hover': {
                    opacity: 0.9,
                },
            }}
            onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
            }}
        />
    ) : (
        getFileIcon(file.type)
    );

    return (
        <>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:hover': {
                        '& .remove-button': {
                            opacity: 1,
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            p: 2,
                            minHeight: 120,
                            maxHeight: 200,
                        }}
                    >
                        {thumbnail}
                    </Box>
                    <Box sx={{ p: 1, position: 'relative' }}>
                        <Typography
                            variant="body2"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    className="remove-button"
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        },
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            {isImage && showPreview && (
                <ImagePreview
                    src={(file as any).dataURL}
                    alt={file.name}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </>
    );
}; 