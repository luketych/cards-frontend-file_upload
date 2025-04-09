import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MoleculeModal } from '../MoleculeModal';
import { getFilePreview } from '../../utils/file-helpers';
import { Molecule } from '../../types/molecule';

// Mock the file-helpers module
jest.mock('../../utils/file-helpers', () => ({
    getFilePreview: jest.fn(),
}));

const theme = createTheme();

describe('MoleculeModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const mockMolecule: Molecule = {
        id: 1,
        title: 'Test Molecule',
        coverImage: 'data:image/jpeg;base64,test',
        files: [],
        isLoading: false,
    };

    const renderMoleculeModal = (props = {}) => {
        return render(
            <ThemeProvider theme={theme}>
                <MoleculeModal
                    open={true}
                    onClose={mockOnClose}
                    onSave={mockOnSave}
                    molecule={mockMolecule}
                    {...props}
                />
            </ThemeProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getFilePreview as jest.Mock).mockResolvedValue('data:image/jpeg;base64,test');
    });

    it('renders with initial values when editing', () => {
        renderMoleculeModal();
        
        expect(screen.getByLabelText(/name/i)).toHaveValue('Test Molecule');
        expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });

    it('renders empty form when creating new', () => {
        renderMoleculeModal({ molecule: undefined });
        
        expect(screen.getByLabelText(/name/i)).toHaveValue('');
        expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });

    it('calls onClose when cancel button is clicked', () => {
        renderMoleculeModal();
        
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
        
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onSave with form data when save button is clicked', async () => {
        renderMoleculeModal();
        
        const nameInput = screen.getByLabelText(/name/i);
        const descriptionInput = screen.getByLabelText(/description/i);
        
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
        fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
        
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                title: 'Updated Name',
                coverImage: '',
                files: [],
            });
        });
    });

    it('handles file upload and preview', async () => {
        renderMoleculeModal();
        
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const fileInput = screen.getByLabelText(/upload files/i);
        
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        await waitFor(() => {
            expect(getFilePreview).toHaveBeenCalledWith(file);
        });
    });

    it('removes file when delete button is clicked', async () => {
        const moleculeWithFile: Molecule = {
            ...mockMolecule,
            files: [{
                name: 'test.jpg',
                type: 'image/jpeg',
                size: 1024,
                lastModified: Date.now(),
            }],
        };
        
        renderMoleculeModal({ molecule: moleculeWithFile });
        
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);
        
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                title: 'Test Molecule',
                coverImage: 'data:image/jpeg;base64,test',
                files: [],
            });
        });
    });

    it('validates required fields', async () => {
        renderMoleculeModal({ molecule: undefined });
        
        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
            expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        });
        
        await waitFor(() => {
            expect(mockOnSave).not.toHaveBeenCalled();
        });
    });
}); 