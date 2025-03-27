import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import App from '../App';
import { storageManager } from '../utils/storage';

// Mock the storage manager
jest.mock('../utils/storage', () => ({
    storageManager: {
        init: jest.fn(),
        migrateFromLocalStorage: jest.fn(),
        getMolecules: jest.fn(),
        saveMolecule: jest.fn(),
        deleteMolecule: jest.fn(),
        getStorageInfo: jest.fn(),
    },
}));

const theme = createTheme();

describe('App', () => {
    const mockMolecules = [
        {
            id: 1,
            title: 'Test Molecule 1',
            coverImage: '',
            files: [],
        },
        {
            id: 2,
            title: 'Test Molecule 2',
            coverImage: '',
            files: [],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (storageManager.getMolecules as jest.Mock).mockResolvedValue(mockMolecules);
        (storageManager.getStorageInfo as jest.Mock).mockResolvedValue({ size: 2, maxSize: 10 });
    });

    it('renders the app title', () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        expect(screen.getByText(/molecule manager/i)).toBeInTheDocument();
    });

    it('loads and displays molecules on mount', async () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        await waitFor(() => {
            expect(screen.getByText('Test Molecule 1')).toBeInTheDocument();
        });
        
        await waitFor(() => {
            expect(screen.getByText('Test Molecule 2')).toBeInTheDocument();
        });
    });

    it('opens create modal when create button is clicked', () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        const createButton = screen.getByRole('button', { name: /create molecule/i });
        fireEvent.click(createButton);
        
        expect(screen.getByText(/create new molecule/i)).toBeInTheDocument();
    });

    it('opens view modal when molecule card is clicked', async () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        await waitFor(() => {
            expect(screen.getByText('Test Molecule 1')).toBeInTheDocument();
        });
        
        const moleculeCard = screen.getByText('Test Molecule 1');
        fireEvent.click(moleculeCard);
        
        await waitFor(() => {
            expect(screen.getByText(/view molecule/i)).toBeInTheDocument();
        });
    });

    it('creates a new molecule', async () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        // Open create modal
        const createButton = screen.getByRole('button', { name: /create molecule/i });
        fireEvent.click(createButton);
        
        // Fill in the form
        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { value: 'New Molecule' } });
        
        // Save the molecule
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
            expect(storageManager.saveMolecule).toHaveBeenCalledWith({
                title: 'New Molecule',
                coverImage: '',
                files: [],
            });
        });
    });

    it('deletes a molecule', async () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        await waitFor(() => {
            expect(screen.getByText('Test Molecule 1')).toBeInTheDocument();
        });
        
        const moleculeCard = screen.getByText('Test Molecule 1');
        fireEvent.click(moleculeCard);
        
        await waitFor(() => {
            expect(screen.getByText(/view molecule/i)).toBeInTheDocument();
        });
        
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);
        
        await waitFor(() => {
            expect(storageManager.deleteMolecule).toHaveBeenCalledWith(1);
        });
    });

    it('displays storage information', async () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        await waitFor(() => {
            expect(screen.getByText(/storage: 2\/10/i)).toBeInTheDocument();
        });
    });

    it('handles file upload in molecule creation', async () => {
        render(
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        );
        
        // Open create modal
        const createButton = screen.getByRole('button', { name: /create molecule/i });
        fireEvent.click(createButton);
        
        // Upload a file
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByLabelText(/upload files/i);
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        // Save the molecule
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
            expect(storageManager.saveMolecule).toHaveBeenCalledWith(
                expect.objectContaining({
                    files: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'test.jpg',
                            type: 'image/jpeg',
                        }),
                    ]),
                })
            );
        });
    });
}); 