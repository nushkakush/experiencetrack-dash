# Testing Infrastructure Documentation

This document provides a comprehensive guide to the testing infrastructure for the ExperienceTrack Dashboard application.

## 🏗️ Testing Architecture

Our testing infrastructure is built with scalability in mind and follows a pyramid approach:

```
┌─────────────────────────────────────┐
│           E2E Tests                 │  ← Fewer, slower, more expensive
│      (Playwright)                   │
├─────────────────────────────────────┤
│        Integration Tests            │  ← Medium number, medium speed
│      (Component + API)              │
├─────────────────────────────────────┤
│          Unit Tests                 │  ← Many, fast, cheap
│    (Services, Utils, Hooks)         │
└─────────────────────────────────────┘
```

## 🛠️ Testing Stack

### Unit & Integration Tests
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking
- **@testing-library/user-event** - User interaction simulation

### End-to-End Tests
- **Playwright** - Cross-browser E2E testing
- **Multiple browsers** - Chrome, Firefox, Safari, Mobile

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

## 📁 Test Structure

```
src/test/
├── setup.ts                 # Global test setup
├── utils/
│   ├── test-utils.tsx      # Test utilities and helpers
│   └── validation.test.ts  # Utility tests
├── mocks/
│   └── handlers.ts         # MSW API handlers
├── unit/
│   ├── services/           # Service layer tests
│   ├── hooks/              # Custom hooks tests
│   └── utils/              # Utility function tests
├── components/             # Component tests
└── e2e/                    # End-to-end tests
    ├── global-setup.ts
    ├── global-teardown.ts
    └── *.spec.ts
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all unit tests
npm run test

# Run unit tests with UI
npm run test:ui

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run all tests
npm run test:all

# Run tests in CI mode
npm run test:ci
```

## 📝 Writing Tests

### Unit Tests

#### Service Tests
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cohortsService } from '@/services/cohorts.service';

describe('CohortsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of cohorts', async () => {
    // Test implementation
  });
});
```

#### Hook Tests
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useCohorts } from '@/hooks/useCohorts';

describe('useCohorts', () => {
  it('should fetch and return cohorts', async () => {
    const { result } = renderHook(() => useCohorts(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

#### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/test-utils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Workflow', () => {
  test('should complete user journey', async ({ page }) => {
    await page.goto('/cohorts');
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
```

## 🎯 Testing Patterns

### Test Data Factories
Use the provided test data factories for consistent test data:

```typescript
import { createTestUser, createTestCohort, createTestStudent } from '@/test/utils/test-utils';

const user = createTestUser({ role: 'admin' });
const cohort = createTestCohort({ name: 'Test Cohort' });
const student = createTestStudent({ email: 'test@example.com' });
```

### Mocking Strategies

#### Service Mocking
```typescript
vi.mock('@/services/cohorts.service', () => ({
  cohortsService: {
    listAll: vi.fn(),
    getById: vi.fn(),
  },
}));
```

#### API Mocking with MSW
```typescript
import { handlers } from '@/test/mocks/handlers';

// Use in tests
const { server } = setupServer(...handlers);
server.listen();
```

### Custom Render Function
Use `renderWithProviders` for components that need context:

```typescript
import { renderWithProviders } from '@/test/utils/test-utils';

renderWithProviders(<Component />, {
  route: '/cohorts',
  queryClient: customQueryClient,
});
```

## 📊 Coverage Requirements

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Core user journeys

### Coverage Commands
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

## 🔄 CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Manual triggers

### Pre-commit Hooks
Automated checks run before each commit:
- Type checking
- Linting
- Formatting
- Related tests

## 🐛 Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm run test:run -- src/test/unit/services/cohorts.service.test.ts

# Run with debug output
npm run test:run -- --reporter=verbose

# Run in watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run with headed browser
npm run test:e2e:headed

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test cohorts.spec.ts
```

### Debug Mode
```typescript
// Add debugger statement in tests
test('debug test', async ({ page }) => {
  await page.goto('/cohorts');
  debugger; // Will pause execution
});
```

## 📋 Test Checklist

### Before Writing Tests
- [ ] Understand the component/function behavior
- [ ] Identify edge cases and error scenarios
- [ ] Plan test data requirements
- [ ] Consider accessibility requirements

### Writing Tests
- [ ] Use descriptive test names
- [ ] Test happy path and error cases
- [ ] Mock external dependencies
- [ ] Use proper assertions
- [ ] Follow AAA pattern (Arrange, Act, Assert)

### After Writing Tests
- [ ] Run tests locally
- [ ] Check coverage
- [ ] Ensure tests are maintainable
- [ ] Update documentation if needed

## 🎨 Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow the pattern: "should [expected behavior] when [condition]"

### Mocking
- Mock at the right level (service vs API)
- Use realistic mock data
- Reset mocks between tests

### Assertions
- Test behavior, not implementation
- Use specific assertions
- Avoid testing multiple things in one test

### Performance
- Keep tests fast and focused
- Use proper cleanup
- Avoid unnecessary setup/teardown

## 🚨 Common Issues

### Async Testing
```typescript
// ❌ Wrong
expect(result.current.data).toBe(expectedData);

// ✅ Correct
await waitFor(() => {
  expect(result.current.data).toBe(expectedData);
});
```

### Component Testing
```typescript
// ❌ Wrong - testing implementation
expect(screen.getByTestId('internal-id')).toBeInTheDocument();

// ✅ Correct - testing behavior
expect(screen.getByText('User Name')).toBeInTheDocument();
```

### Mock Cleanup
```typescript
// Always clean up mocks
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed

For questions or issues with testing, please refer to the team's testing guidelines or create an issue in the repository.
