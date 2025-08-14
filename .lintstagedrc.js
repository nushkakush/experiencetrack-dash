export default {
  // Lint and format TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Format other files
  '*.{json,md,yml,yaml,css,scss}': [
    'prettier --write',
  ],
};
