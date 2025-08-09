module.exports = {
  // Lint and format TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Format other files
  '*.{json,md,yml,yaml,css,scss}': [
    'prettier --write',
  ],
  
  // Run type check on TypeScript files
  '*.{ts,tsx}': () => 'yarn type-check',
};
