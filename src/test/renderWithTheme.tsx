import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';

/**
 * Renders a component wrapped in the app's MUI ThemeProvider.
 * Takes a React element, returns Testing Library's render result.
 */
export function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}
