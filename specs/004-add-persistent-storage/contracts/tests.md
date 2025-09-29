# Contract Test Specifications

## API Contract Tests

### POST /api/transactions/import

```typescript
// tests/contract/import.test.ts
describe('POST /api/transactions/import', () => {
  test('should accept valid CSV file', async () => {
    const formData = new FormData();
    formData.append('file', validCSVFile);

    const response = await fetch('/api/transactions/import', {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchSchema(ImportResultSchema);
  });

  test('should reject invalid CSV format', async () => {
    const formData = new FormData();
    formData.append('file', invalidCSVFile);

    const response = await fetch('/api/transactions/import', {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchSchema(ValidationErrorSchema);
  });

  test('should reject files over 10MB', async () => {
    const formData = new FormData();
    formData.append('file', largeFile);

    const response = await fetch('/api/transactions/import', {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(413);
  });
});
```

### GET /api/transactions

```typescript
// tests/contract/transactions.test.ts
describe('GET /api/transactions', () => {
  test('should return paginated transaction list', async () => {
    const response = await fetch('/api/transactions?page=1&limit=10');

    expect(response.status).toBe(200);
    expect(response.body).toMatchSchema({
      transactions: [TransactionSchema],
      pagination: PaginationSchema
    });
  });

  test('should filter by date range', async () => {
    const response = await fetch('/api/transactions?startDate=2025-01-01&endDate=2025-01-31');

    expect(response.status).toBe(200);
    const data = await response.json();
    data.transactions.forEach(t => {
      expect(new Date(t.date)).toBeWithinRange('2025-01-01', '2025-01-31');
    });
  });

  test('should validate query parameters', async () => {
    const response = await fetch('/api/transactions?limit=10000');

    expect(response.status).toBe(400);
  });
});
```

### GET /api/transactions/stats

```typescript
// tests/contract/stats.test.ts
describe('GET /api/transactions/stats', () => {
  test('should return aggregated statistics', async () => {
    const response = await fetch('/api/transactions/stats');

    expect(response.status).toBe(200);
    expect(response.body).toMatchSchema(StatisticsSchema);
  });

  test('should group by specified period', async () => {
    const response = await fetch('/api/transactions/stats?groupBy=month');

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.byPeriod).toBeDefined();
    expect(data.byPeriod[0]).toHaveProperty('period');
  });
});
```

## Database Contract Tests

### Transaction Table Schema

```typescript
// tests/contract/database.test.ts
describe('transactions table', () => {
  test('should enforce unique constraint', async () => {
    const tx1 = { date: '2025-01-01', amount: 100, description: 'Test' };
    const tx2 = { date: '2025-01-01', amount: 100, description: 'Test' };

    await db.insert('transactions', tx1);
    await expect(db.insert('transactions', tx2))
      .rejects.toThrow('UNIQUE constraint');
  });

  test('should reject zero amounts', async () => {
    const tx = { date: '2025-01-01', amount: 0, description: 'Test' };

    await expect(db.insert('transactions', tx))
      .rejects.toThrow('CHECK constraint');
  });

  test('should reject empty descriptions', async () => {
    const tx = { date: '2025-01-01', amount: 100, description: '' };

    await expect(db.insert('transactions', tx))
      .rejects.toThrow('CHECK constraint');
  });
});
```

## CSV Format Contract Tests

### Expected CSV Format

```typescript
// tests/contract/csv-format.test.ts
describe('CSV format validation', () => {
  test('should accept standard format', () => {
    const csv = 'Date,Amount,Description,Category\n2025-01-01,100.50,Store,Shopping';
    const result = parseCSV(csv);

    expect(result.valid).toBe(true);
    expect(result.rows).toHaveLength(1);
  });

  test('should accept format without category', () => {
    const csv = 'Date,Amount,Description\n2025-01-01,100.50,Store';
    const result = parseCSV(csv);

    expect(result.valid).toBe(true);
    expect(result.rows[0].category).toBeNull();
  });

  test('should reject missing required columns', () => {
    const csv = 'Date,Description\n2025-01-01,Store';
    const result = parseCSV(csv);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing required column: Amount');
  });
});
```

## Data Transformation Contract Tests

### CSV to Transaction Mapping

```typescript
// tests/contract/transformation.test.ts
describe('CSV to Transaction transformation', () => {
  test('should map CSV row to Transaction entity', () => {
    const csvRow = {
      Date: '2025-01-01',
      Amount: '100.50',
      Description: 'Test Store',
      Category: 'Shopping'
    };

    const transaction = mapToTransaction(csvRow);

    expect(transaction).toEqual({
      date: '2025-01-01',
      amount: 100.50,
      description: 'Test Store',
      category: 'Shopping'
    });
  });

  test('should handle negative amounts', () => {
    const csvRow = {
      Date: '2025-01-01',
      Amount: '-50.00',
      Description: 'Refund'
    };

    const transaction = mapToTransaction(csvRow);
    expect(transaction.amount).toBe(-50.00);
  });

  test('should validate date format', () => {
    const csvRow = {
      Date: '01/01/2025', // Wrong format
      Amount: '100',
      Description: 'Test'
    };

    expect(() => mapToTransaction(csvRow))
      .toThrow('Invalid date format');
  });
});
```

## Response Schema Definitions

```typescript
// tests/contract/schemas.ts
export const TransactionSchema = {
  type: 'object',
  required: ['id', 'date', 'amount', 'description', 'createdAt'],
  properties: {
    id: { type: 'number' },
    date: { type: 'string', format: 'date' },
    amount: { type: 'number' },
    description: { type: 'string' },
    category: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

export const ImportResultSchema = {
  type: 'object',
  required: ['session', 'imported', 'duplicates', 'errors'],
  properties: {
    session: { $ref: '#/definitions/ImportSession' },
    imported: { type: 'array', items: TransactionSchema },
    duplicates: { type: 'array' },
    errors: { type: 'array' }
  }
};

export const PaginationSchema = {
  type: 'object',
  required: ['page', 'limit', 'total', 'totalPages'],
  properties: {
    page: { type: 'number' },
    limit: { type: 'number' },
    total: { type: 'number' },
    totalPages: { type: 'number' }
  }
};
```