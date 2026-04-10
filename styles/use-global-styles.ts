import { useMemo } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { createGlobalStyles } from './globals';

export function useGlobalStyles() {
  const theme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  return useMemo(() => createGlobalStyles(theme), [theme]);
}
