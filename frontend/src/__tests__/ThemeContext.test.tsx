import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const TestThemeComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe('ThemeContext Infrastructure Unit Test', () => {
  it('provides default dark theme state', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
  });

  it('toggles theme state between dark and light', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    );

    const btn = screen.getByText('Toggle Theme');

    act(() => {
      btn.click();
    });
    expect(screen.getByTestId('theme-val').textContent).toBe('light');

    act(() => {
      btn.click();
    });
    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
  });
});
