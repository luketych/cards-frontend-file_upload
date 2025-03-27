import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    IconButton,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ErrorIcon from '@mui/icons-material/Error';
import BugReportIcon from '@mui/icons-material/BugReport';
import { Molecule } from '../types/molecule';

interface MoleculeCardProps {
    molecule: Molecule;
    onClick: () => void;
    onDelete: (id: number) => void;
}

export const MoleculeCard: React.FC<MoleculeCardProps> = ({
    molecule,
    onClick,
    onDelete,
}) => {
    const [showDebugDialog, setShowDebugDialog] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(molecule.id);
    };

    const handleDebugClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDebugDialog(true);
    };

    const getUploadStatusIcon = () => {
        if (!molecule.uploadResponses?.length) return null;
        
        const hasErrors = molecule.uploadResponses.some(response => response.error);
        const isUploading = molecule.uploadResponses.some(response => response.status === 'uploading');
        
        console.log('Upload status:', {
            moleculeId: molecule.id,
            title: molecule.title,
            hasErrors,
            isUploading,
            responsesCount: molecule.uploadResponses.length,
            responses: molecule.uploadResponses
        });
        
        if (isUploading) {
            return <CloudUploadIcon color="primary" />;
        } else if (hasErrors) {
            return <ErrorIcon color="error" />;
        } else {
            return <CloudDoneIcon color="success" />;
        }
    };

    const formatUploadResponse = (response: any) => {
        if (response.error) {
            return `Error: ${response.error}`;
        }
        return JSON.stringify(response, null, 2);
    };

    return (
        <>
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                        bgcolor: 'action.hover',
                    },
                }}
                onClick={onClick}
            >
                <CardMedia
                    component="img"
                    height="140"
                    image={molecule.coverImage || '/placeholder.jpg'}
                    alt={molecule.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography gutterBottom variant="h6" component="div">
                            {molecule.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getUploadStatusIcon()}
                            {molecule.uploadResponses?.length > 0 && (
                                <IconButton
                                    size="small"
                                    onClick={handleDebugClick}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    <BugReportIcon />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {molecule.files.length} files
                    </Typography>
                </CardContent>
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                    }}
                    onClick={handleDelete}
                >
                    <DeleteIcon />
                </IconButton>
            </Card>

            <Dialog
                open={showDebugDialog}
                onClose={() => setShowDebugDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Upload Debug Information</DialogTitle>
                <DialogContent>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Molecule Details"
                                secondary={
                                    <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify({
                                            id: molecule.id,
                                            title: molecule.title,
                                            filesCount: molecule.files.length,
                                        }, null, 2)}
                                    </Typography>
                                }
                            />
                        </ListItem>
                        {molecule.uploadResponses?.map((response, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={`File ${index + 1}: ${molecule.files[index]?.name}`}
                                    secondary={
                                        <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {formatUploadResponse(response)}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDebugDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 