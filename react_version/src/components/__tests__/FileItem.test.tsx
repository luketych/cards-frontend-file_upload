import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { FileItem } from '../FileItem';

const theme = createTheme();

describe('FileItem', () => {
    const mockFile = {
        id: '1',
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
        dataURL: 'data:image/jpeg;base64,test',
        lastModified: Date.now(),
    };

    const mockOnRemove = jest.fn();

    const renderFileItem = (props = {}) => {
        return render(
            <ThemeProvider theme={theme}>
                <FileItem file={mockFile} onRemove={mockOnRemove} {...props} />
            </ThemeProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders file information correctly', () => {
        renderFileItem();
        
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
        expect(screen.getByText('1.0 KB')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', mockFile.dataURL);
    });

    it('shows preview dialog when clicking image', () => {
        renderFileItem();
        
        const thumbnail = screen.getByRole('img');
        fireEvent.click(thumbnail);
        
        // Check if dialog is opened
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /preview/i })).toHaveAttribute('src', mockFile.dataURL);
    });

    it('closes preview dialog when clicking close button', () => {
        renderFileItem();
        
        // Open dialog
        const thumbnail = screen.getByRole('img');
        fireEvent.click(thumbnail);
        
        // Close dialog
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        
        // Check if dialog is closed
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes preview dialog when clicking outside', () => {
        renderFileItem();
        
        // Open dialog
        const thumbnail = screen.getByRole('img');
        fireEvent.click(thumbnail);
        
        // Click outside (on the backdrop)
        const backdrop = screen.getByTestId('preview-dialog-backdrop');
        fireEvent.click(backdrop);
        
        // Check if dialog is closed
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onRemove when delete button is clicked', () => {
        renderFileItem();
        
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);
        
        expect(mockOnRemove).toHaveBeenCalled();
    });

    it('renders non-image files correctly', () => {
        const textFile = {
            ...mockFile,
            name: 'test.txt',
            type: 'text/plain',
            dataURL: undefined,
        };
        
        renderFileItem({ file: textFile });
        
        expect(screen.getByText('test.txt')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
}); 