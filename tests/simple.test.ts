import { describe, it, expect } from '@jest/globals';

describe('Basic Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test string operations', () => {
    const greeting = 'Hello World';
    expect(greeting).toBe('Hello World');
    expect(greeting.length).toBe(11);
  });

  it('should test array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers.length).toBe(5);
    expect(numbers[0]).toBe(1);
    expect(numbers.includes(3)).toBe(true);
  });

  it('should test object operations', () => {
    const user = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com'
    };

    expect(user.name).toBe('John Doe');
    expect(user.age).toBe(30);
    expect(Object.keys(user)).toEqual(['name', 'age', 'email']);
  });

  it('should test async operations', async () => {
    const promise = Promise.resolve('async result');
    const result = await promise;
    expect(result).toBe('async result');
  });

  it('should test error handling', () => {
    expect(() => {
      throw new Error('Test error');
    }).toThrow('Test error');
  });
});