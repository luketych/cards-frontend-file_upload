import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MoleculeCard } from '../MoleculeCard';

const theme = createTheme();

describe('MoleculeCard', () => {
    const mockMolecule = {
        id: 1,
        title: 'Test Molecule',
        coverImage: 'data:image/jpeg;base64,test',
        files: [],
    };

    const mockOnClick = jest.fn();
    const mockOnDelete = jest.fn();

    const renderMoleculeCard = (props = {}) => {
        return render(
            <ThemeProvider theme={theme}>
                <MoleculeCard
                    molecule={mockMolecule}
                    onClick={mockOnClick}
                    onDelete={mockOnDelete}
                    {...props}
                />
            </ThemeProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders molecule title', () => {
        renderMoleculeCard();
        expect(screen.getByText('Test Molecule')).toBeInTheDocument();
    });

    it('renders cover image when available', () => {
        renderMoleculeCard();
        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,test');
        expect(image).toHaveAttribute('alt', 'Test Molecule');
    });

    it('renders placeholder when no cover image is available', () => {
        const moleculeWithoutCover = {
            ...mockMolecule,
            coverImage: '',
        };
        renderMoleculeCard({ molecule: moleculeWithoutCover });
        
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText(/no image/i)).toBeInTheDocument();
    });

    it('calls onClick when card is clicked', () => {
        renderMoleculeCard();
        
        const card = screen.getByRole('button');
        fireEvent.click(card);
        
        expect(mockOnClick).toHaveBeenCalled();
    });

    it('calls onDelete when delete button is clicked', () => {
        renderMoleculeCard();
        
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);
        
        expect(mockOnDelete).toHaveBeenCalled();
    });

    it('prevents event propagation when delete button is clicked', () => {
        renderMoleculeCard();
        
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        const clickEvent = {
            stopPropagation: jest.fn(),
        };
        fireEvent.click(deleteButton, clickEvent);
        
        expect(clickEvent.stopPropagation).toHaveBeenCalled();
        expect(mockOnDelete).toHaveBeenCalledWith(expect.objectContaining({
            stopPropagation: expect.any(Function),
        }));
    });

    it('displays file count when files are present', () => {
        const moleculeWithFiles = {
            ...mockMolecule,
            files: [
                { name: 'file1.jpg', type: 'image/jpeg', size: 1024, lastModified: Date.now() },
                { name: 'file2.pdf', type: 'application/pdf', size: 2048, lastModified: Date.now() },
            ],
        };
        renderMoleculeCard({ molecule: moleculeWithFiles });
        
        expect(screen.getByText(/2 files/i)).toBeInTheDocument();
    });

    it('displays no files message when files array is empty', () => {
        renderMoleculeCard();
        expect(screen.getByText(/no files/i)).toBeInTheDocument();
    });
}); 