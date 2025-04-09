import { render, fireEvent, screen } from '@testing-library/react';

describe('UI Error Handling', () => {
    it('handles component rendering errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        // Simulate a component error
        const ErrorComponent = () => {
            throw new Error('Component error');
        };
        
        expect(() => {
            render(<ErrorComponent />);
        }).toThrow('Component error');
        
        consoleSpy.mockRestore();
    });

    it('handles event handler errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        const ErrorHandler = () => {
            const handleClick = () => {
                throw new Error('Event handler error');
            };
            
            return <button onClick={handleClick}>Click me</button>;
        };
        
        render(<ErrorHandler />);
        expect(() => {
            fireEvent.click(screen.getByText('Click me'));
        }).toThrow('Event handler error');
        
        consoleSpy.mockRestore();
    });
}); 