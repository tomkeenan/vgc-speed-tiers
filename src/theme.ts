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

const WHITE = '#ffffff';

/** The single MUI theme for the app, with light and dark color schemes. */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#ef4444', dark: '#b91c1c', contrastText: WHITE },
        success: { main: '#16a34a', dark: '#15803d', contrastText: WHITE },
        speed: { main: '#2563eb', dark: '#1d4ed8', contrastText: WHITE },
        text: { primary: '#18181b', secondary: '#71717a' },
        background: { paper: WHITE, default: '#f4f4f5' },
        divider: 'rgba(24, 24, 27, 0.1)',
      },
    },
    dark: {
      palette: {
        primary: { main: '#f87171', dark: '#ef4444', contrastText: '#18181b' },
        success: { main: '#22c55e', dark: '#16a34a', contrastText: '#18181b' },
        speed: { main: '#60a5fa', dark: '#3b82f6', contrastText: '#18181b' },
        text: { primary: '#f4f4f5', secondary: '#a1a1aa' },
        background: { paper: '#27272a', default: '#18181b' },
        divider: 'rgba(244, 244, 245, 0.12)',
      },
    },
  },
  breakpoints: { values: { xs: 0, sm: 768, md: 900, lg: 1200, xl: 1536 } },
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
        indicator: ({ theme }) => ({ backgroundColor: theme.vars.palette.text.primary }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 600,
          color: theme.vars.palette.text.secondary,
          '&.Mui-selected': { color: theme.vars.palette.text.primary },
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 600,
          color: theme.vars.palette.text.primary,
          '&.Mui-selected': {
            backgroundColor: theme.vars.palette.text.primary,
            color: theme.vars.palette.background.paper,
            '&:hover': { backgroundColor: theme.vars.palette.text.primary },
          },
        }),
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: ({ theme }) => ({
          '&.Mui-checked': {
            color: theme.vars.palette.text.primary,
            '& + .MuiSwitch-track': {
              backgroundColor: theme.vars.palette.primary.main,
              opacity: 1,
            },
          },
        }),
      },
    },
  },
});
