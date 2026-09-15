import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    speed: Palette['primary'];
  }
  interface PaletteOptions {
    speed?: PaletteOptions['primary'];
  }
  interface Theme {
    tokens: {
      cardShadow: string;
      emphasisLabelColor: string;
    };
  }
  interface ThemeOptions {
    tokens?: {
      cardShadow?: string;
      emphasisLabelColor?: string;
    };
  }
}

const INK = '#18181b';
const WHITE = '#ffffff';

/** The single MUI theme for the app. */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ef4444', dark: '#b91c1c', contrastText: WHITE },
    success: { main: '#16a34a', dark: '#15803d', contrastText: WHITE },
    speed: { main: '#2563eb', dark: '#1d4ed8', contrastText: WHITE },
    text: { primary: INK, secondary: '#71717a' },
    background: { paper: WHITE, default: '#f4f4f5' },
    divider: 'rgba(24, 24, 27, 0.1)',
  },
  shape: { borderRadius: 12 },
  tokens: {
    cardShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    emphasisLabelColor: 'rgba(255, 255, 255, 0.8)',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: INK },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 600,
          color: theme.palette.text.secondary,
          '&.Mui-selected': { color: theme.palette.text.primary },
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          color: INK,
          '&.Mui-selected': {
            backgroundColor: INK,
            color: WHITE,
            '&:hover': { backgroundColor: INK },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: WHITE,
            '& + .MuiSwitch-track': {
              backgroundColor: INK,
              opacity: 1,
            },
          },
        },
      },
    },
  },
});
