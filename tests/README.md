# Testing Guide

This directory contains comprehensive tests for the Kontracts application, covering backend APIs, frontend components, services, and integration flows.

## Test Structure

```
tests/
├── backend/           # Backend-specific tests
│   ├── api/          # API endpoint tests
│   ├── services/     # Service layer tests
│   └── unit/         # Unit tests for backend utilities
├── frontend/         # Frontend-specific tests
│   ├── components/   # React component tests
│   └── hooks/        # Custom hook tests
├── integration/      # End-to-end integration tests
├── mocks/           # Mock data and utilities
├── utils/           # Test helper functions
├── fixtures/        # Test data fixtures
└── setup.ts         # Global test setup
```

## Running Tests

### Prerequisites

Install testing dependencies:
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only backend tests
npm run test:backend

# Run only frontend tests
npm run test:frontend

# Run only integration tests
npm run test:integration
```

## Test Categories

### Backend Tests

#### API Tests (`tests/backend/api/`)
- **Contract API** (`contracts.test.ts`): Tests CRUD operations for contracts
- **Document API** (`documents.test.ts`): Tests file upload and document processing
- **Compliance API** (`compliance.test.ts`): Tests ASC842/IFRS16 schedule generation

#### Service Tests (`tests/backend/services/`)
- **OpenAI Service** (`openai.test.ts`): Tests AI-powered document extraction and recommendations
- **Compliance Calculator** (`complianceCalculator.test.ts`): Tests lease accounting calculations
- **Document Processor** (`documentProcessor.test.ts`): Tests PDF, Word, and Excel processing

#### Unit Tests (`tests/backend/unit/`)
- **Storage Layer** (`storage.test.ts`): Tests database operations and data access

### Frontend Tests

#### Component Tests (`tests/frontend/components/`)
- **ContractManagement** (`ContractManagement.test.tsx`): Tests contract list, creation, editing
- **DocumentUpload** (`DocumentUpload.test.tsx`): Tests file upload interface and validation
- **AIRecommendations** (`AIRecommendations.test.tsx`): Tests recommendation display and actions

### Integration Tests

#### Full Workflow Tests (`tests/integration/`)
- **Contract Flow** (`contractFlow.test.ts`): Tests complete contract lifecycle from document upload to compliance reporting

## Test Features Covered

### Backend Features
✅ **Contract Management**
- CRUD operations for contracts
- Contract validation and business rules
- Status management and filtering

✅ **Document Processing**
- Multi-format file upload (PDF, Word, Excel)
- AI-powered data extraction
- File validation and error handling

✅ **Compliance Calculations**
- ASC842 lease accounting schedules
- IFRS16 compliance calculations
- Present value calculations with various discount rates

✅ **AI Services**
- OpenAI integration for document processing
- AI recommendation generation
- Error handling for API failures

✅ **Database Operations**
- Data persistence and retrieval
- Referential integrity
- Error handling and fallbacks

### Frontend Features
✅ **User Interface**
- React component rendering and interactions
- Form validation and submission
- File upload with drag-and-drop
- Filtering and sorting functionality

✅ **State Management**
- TanStack Query integration
- Loading and error states
- Optimistic updates

✅ **User Experience**
- Responsive design elements
- Accessibility features
- User feedback and notifications

### Integration Features
✅ **End-to-End Workflows**
- Complete contract creation process
- Document upload to contract creation
- Compliance schedule generation
- Journal entry automation
- AI recommendation workflows

✅ **Data Consistency**
- Cross-entity relationships
- Cascade operations
- Transaction integrity

✅ **Error Handling**
- Graceful degradation
- Fallback data mechanisms
- User-friendly error messages

## Mock Data

Test data is centralized in `tests/mocks/`:

- `database.ts`: Mock contract, document, and compliance data
- `openai.ts`: Mock AI service responses
- Test utilities in `tests/utils/testHelpers.ts`

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Supports both Node.js and jsdom environments
- ESM module support
- TypeScript compilation with ts-jest
- Path mapping for project aliases

### Setup Files
- `tests/setup.ts`: Global backend test setup
- `tests/frontend-setup.ts`: Frontend-specific setup (DOM mocking)

## Writing New Tests

### Backend API Tests
```typescript
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../../server/app';

describe('New API Endpoint', () => {
  it('should handle valid requests', async () => {
    const response = await request(app)
      .post('/api/new-endpoint')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('result');
  });
});
```

### Frontend Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from '../../../client/src/components/MyComponent';

describe('MyComponent', () => {
  it('should render and respond to user interaction', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Expected Result')).toBeInTheDocument();
  });
});
```

## Coverage Goals

The test suite aims for:
- **80%+ code coverage** across all modules
- **100% coverage** for critical business logic (compliance calculations, payment processing)
- **Complete API coverage** for all endpoints
- **Key user journey coverage** in integration tests

## Continuous Integration

Tests are designed to run in CI environments with:
- Database mocking for unit tests
- Test isolation and cleanup
- Deterministic test execution
- Fast feedback loops

## Best Practices

1. **Test Independence**: Each test should be able to run in isolation
2. **Clear Naming**: Use descriptive test names that explain the scenario
3. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
4. **Mock External Dependencies**: Keep tests fast and reliable by mocking external services
5. **Test Edge Cases**: Include error conditions and boundary value testing
6. **Keep Tests Simple**: Focus on one behavior per test
7. **Use Realistic Data**: Test with data that resembles production scenarios