import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme, MantineColorScheme } from '@mantine/core';
import App from './App';
import { useThemeStore, selectColorScheme } from './store';
import './index.css';
import '@mantine/core/styles.css';

/**
 * Custom Mantine theme for HazOp Assistant.
 * Professional, regulatory-document aesthetic with clean typography.
 */
const theme = createTheme({
  primaryColor: 'blue',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'sm',
});

/**
 * Theme-aware provider component that syncs Zustand state with Mantine.
 */
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const colorScheme = useThemeStore(selectColorScheme);

  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme={colorScheme as MantineColorScheme}
      forceColorScheme={colorScheme as MantineColorScheme}
    >
      {children}
    </MantineProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeWrapper>
      <App />
    </ThemeWrapper>
  </React.StrictMode>
);
