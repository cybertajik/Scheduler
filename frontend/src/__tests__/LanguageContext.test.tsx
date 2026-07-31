import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

const TestComponent = () => {
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="app-title">{t('app_title')}</span>
      <span data-testid="lang-count">{supportedLanguages.length}</span>
      <button onClick={() => setLanguage('de')}>Switch to German</button>
    </div>
  );
};

describe('LanguageContext Infrastructure Unit Test', () => {
  it('provides default English language and translation lookup', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('app-title').textContent).toBe('Staff Scheduler');
    expect(Number(screen.getByTestId('lang-count').textContent)).toBeGreaterThan(0);
  });

  it('switches language state to German', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    const btn = screen.getByText('Switch to German');
    act(() => {
      btn.click();
    });

    expect(screen.getByTestId('current-lang').textContent).toBe('de');
  });
});
