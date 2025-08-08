module.exports = {
  // Lint and format TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
    'git add',
  ],
  
  // Format other files
  '*.{json,md,yml,yaml,css,scss}': [
    'prettier --write',
    'git add',
  ],
  
  // Run type check on TypeScript files
  '*.{ts,tsx}': () => 'npm run type-check',
  
  // Run tests related to changed files
  '*.{ts,tsx}': (filenames) => {
    const files = filenames.join(' ');
    return `npm run test:run -- --findRelatedTests ${files}`;
  },
};
