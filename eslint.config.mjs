import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'node_modules/**', 'ADMIN_PANEL_BLUEPRINT/**', 'idel/**', 'inspiration/**']),
  { rules: { 'react-hooks/set-state-in-effect': 'warn', 'react-hooks/immutability': 'warn', 'react-hooks/refs': 'warn', 'react-hooks/purity': 'warn', 'react-hooks/preserve-manual-memoization': 'warn', 'react/no-unescaped-entities': 'warn' } }
]);
