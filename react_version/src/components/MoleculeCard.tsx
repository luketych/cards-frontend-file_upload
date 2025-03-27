import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { Molecule } from '../types';

interface MoleculeCardProps {
    molecule: Molecule;
    onClick: () => void;
}

export const MoleculeCard: React.FC<MoleculeCardProps> = ({ molecule, onClick }) => {
    return (
        <Card 
            sx={{ 
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: molecule.isLoading ? 0.7 : 1
            }}
            onClick={onClick}
        >
            <CardMedia
                component="img"
                height="140"
                image={molecule.coverImage}
                alt={molecule.title}
                sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                    {molecule.title}
                </Typography>
                {molecule.isLoading && (
                    <Box sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)'
                    }}>
                        <Typography>Processing...</Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}; 