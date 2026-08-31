const https = require('https');

// Set env vars before requiring the service so ACCOUNTS is populated
process.env.JDOODLE_CLIENT_ID_1 = 'test_id_1';
process.env.JDOODLE_CLIENT_SECRET_1 = 'test_secret_1';
process.env.JDOODLE_CLIENT_ID_2 = 'test_id_2';
process.env.JDOODLE_CLIENT_SECRET_2 = 'test_secret_2';
process.env.JDOODLE_CLIENT_ID_3 = 'test_id_3';
process.env.JDOODLE_CLIENT_SECRET_3 = 'test_secret_3';
process.env.JDOODLE_CLIENT_ID_4 = 'test_id_4';
process.env.JDOODLE_CLIENT_SECRET_4 = 'test_secret_4';

const executionService = require('../services/executionService');

jest.mock('https');

describe('executionService JDoodle Failover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset exhausted state for accounts before each test
    executionService._ACCOUNTS.forEach(a => {
      a.exhaustedUntil = 0;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Helper to mock sequential https.request responses
  const mockHttpsRequest = (responses) => {
    let callCount = 0;
    https.request.mockImplementation((opts, callback) => {
      const responseConfig = responses[callCount] || responses[responses.length - 1];
      callCount++;

      if (responseConfig.networkError) {
        return {
          on: jest.fn((event, handler) => {
            if (event === 'error') {
              setTimeout(() => handler(new Error(responseConfig.networkError)), 10);
            }
          }),
          write: jest.fn(),
          end: jest.fn()
        };
      }

      const res = {
        statusCode: responseConfig.statusCode || 200,
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(JSON.stringify(responseConfig.data));
          }
          if (event === 'end') {
            handler();
          }
        })
      };

      if (callback) callback(res);

      return {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };
    });
  };

  it('Account 1 succeeds -> account 1 result returned', async () => {
    mockHttpsRequest([
      { data: { output: 'Hello World', statusCode: 200 } }
    ]);
    
    const result = await executionService.run({ language: 'javascript', code: 'console.log("Hello World")' });
    
    expect(result.output).toBe('Hello World');
    expect(https.request).toHaveBeenCalledTimes(1);
  });

  it('Account 1 quota/rate-limit failure -> account 2 succeeds', async () => {
    mockHttpsRequest([
      { data: { error: 'Daily limit reached' }, statusCode: 429 },
      { data: { output: 'Hello World from 2', statusCode: 200 } }
    ]);
    
    const result = await executionService.run({ language: 'javascript', code: 'console.log("Hello World")' });
    
    expect(result.output).toBe('Hello World from 2');
    expect(https.request).toHaveBeenCalledTimes(2);
    expect(executionService._ACCOUNTS[0].exhaustedUntil).toBeGreaterThan(Date.now());
    expect(executionService._ACCOUNTS[1].exhaustedUntil).toBe(0);
  });

  it('Account 1 compilation error -> account 2 is NOT used', async () => {
    mockHttpsRequest([
      // JDoodle returns 200 even for compilation errors, error is in output, API error field is absent.
      { data: { output: 'SyntaxError: Unexpected token', statusCode: 200 } }
    ]);
    
    const result = await executionService.run({ language: 'javascript', code: 'console.log(' });
    
    expect(result.output).toContain('SyntaxError');
    expect(https.request).toHaveBeenCalledTimes(1);
  });

  it('Account 1 infrastructure failure -> account 2 is attempted', async () => {
    mockHttpsRequest([
      { networkError: 'ECONNRESET' },
      { data: { output: 'Recovered execution', statusCode: 200 } }
    ]);
    
    const result = await executionService.run({ language: 'python', code: 'print("Recovered")' });
    
    expect(result.output).toBe('Recovered execution');
    expect(https.request).toHaveBeenCalledTimes(2);
  });

  it('All accounts fail -> meaningful error returned', async () => {
    mockHttpsRequest([
      { data: { error: 'Daily limit reached' }, statusCode: 429 },
      { data: { error: 'Daily limit reached' }, statusCode: 429 },
      { data: { error: 'Daily limit reached' }, statusCode: 429 },
      { data: { error: 'Daily limit reached' }, statusCode: 429 },
    ]);
    
    const result = await executionService.run({ language: 'python', code: 'print("Failed")' });
    
    expect(result.error).toContain('Execution API error after trying available accounts: API Error: Daily limit reached');
    expect(https.request).toHaveBeenCalledTimes(4);
  });
  
  it('Credentials are never exposed in returned responses/logs', async () => {
    mockHttpsRequest([
      { data: { error: 'Unauthorized' }, statusCode: 401 },
      { data: { error: 'Unauthorized' }, statusCode: 401 },
    ]);
    
    const result = await executionService.run({ language: 'cpp', code: 'int main(){}' });
    
    expect(result.error).not.toContain('test_secret_1');
    expect(result.error).not.toContain('test_secret_2');
    expect(result.error).not.toContain('test_id_1');
    expect(result.error).not.toContain('test_id_2');
  });
});
