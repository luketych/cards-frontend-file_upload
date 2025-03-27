import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FileData } from '../types';
import { formatFileSize, getFileIcon } from '../utils/file-helpers';

interface FileItemProps {
    file: FileData;
    onRemove: () => void;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
    return (
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
                    }}
                >
                    {file.type.startsWith('image/') && file.thumbnail ? (
                        <Box
                            component="img"
                            src={file.thumbnail}
                            alt={file.name}
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <Typography variant="h4">{getFileIcon(file.type)}</Typography>
                    )}
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
    );
}; 