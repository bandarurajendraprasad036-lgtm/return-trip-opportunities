import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { useState } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_KEY, restoreLanguage, setLanguage, translateText, useLanguage, validLanguage } from '@/lib/language';
import { jsx } from '@/lib/localized-jsx';

afterEach(() => { cleanup(); act(() => setLanguage('te')); localStorage.clear(); });
describe('account-independent interface language', () => {
  it('defaults to Telugu', () => { expect(DEFAULT_LANGUAGE).toBe('te'); });
  it('offers exactly the twelve requested languages', () => {
    expect(LANGUAGES.map(item => item.code)).toEqual(['te','hi','en','ta','kn','ml','mr','bn','or','pa','gu','ur']);
  });
  it('persists a selected language and restores it without accepting unsupported values', () => {
    setLanguage('ur'); expect(localStorage.getItem(LANGUAGE_KEY)).toBe('ur');
    setLanguage('te'); localStorage.setItem(LANGUAGE_KEY, 'hi'); restoreLanguage();
    expect(document.documentElement.lang).toBe('hi');
    localStorage.setItem(LANGUAGE_KEY, 'invalid'); restoreLanguage();
    expect(document.documentElement.lang).toBe('hi'); expect(validLanguage('invalid')).toBe(false);
  });
  it('preserves unlisted user content exactly', () => {
    for (const language of LANGUAGES) expect(translateText('My own village 123 / private message 987', language.code)).toBe('My own village 123 / private message 987');
  });
  it('updates the subscription without remounting controls or losing entered state', () => {
    function Form() { const language = useLanguage(); const [value, setValue] = useState('own village'); return jsx('input', { 'data-testid': 'entry', 'data-language': language, value, onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value) }); }
    const view = render(<Form />); const input = view.getByTestId('entry'); input.focus();
    act(() => setLanguage('ta'));
    expect(view.getByTestId('entry')).toBe(input); expect(document.activeElement).toBe(input);
    expect(input).toHaveValue('own village'); expect(input.getAttribute('data-language')).toBe('ta');
  });
});