import { describe, it, expect } from '@jest/globals';
import {
  generateASC842Schedule,
  generateIFRS16Schedule,
  calculatePresentValue,
  generateJournalEntries
} from '../../../server/services/complianceCalculator.js';

describe('Compliance Calculator Service', () => {
  describe('calculatePresentValue', () => {
    it('should calculate present value correctly', () => {
      const monthlyPayment = 5000;
      const leaseTerm = 60; // 5 years
      const annualDiscountRate = 3.5;

      const presentValue = calculatePresentValue(monthlyPayment, leaseTerm, annualDiscountRate);

      expect(presentValue).toBeGreaterThan(0);
      expect(presentValue).toBeLessThan(monthlyPayment * leaseTerm); // Should be less than total payments
      expect(typeof presentValue).toBe('number');
    });

    it('should handle zero discount rate', () => {
      const monthlyPayment = 5000;
      const leaseTerm = 60;
      const annualDiscountRate = 0;

      const presentValue = calculatePresentValue(monthlyPayment, leaseTerm, annualDiscountRate);

      expect(presentValue).toBe(monthlyPayment * leaseTerm); // No discounting
    });

    it('should handle single payment', () => {
      const monthlyPayment = 5000;
      const leaseTerm = 1;
      const annualDiscountRate = 3.5;

      const presentValue = calculatePresentValue(monthlyPayment, leaseTerm, annualDiscountRate);

      expect(presentValue).toBeCloseTo(monthlyPayment / (1 + (annualDiscountRate / 100) / 12));
    });

    it('should handle high discount rates', () => {
      const monthlyPayment = 5000;
      const leaseTerm = 60;
      const annualDiscountRate = 20;

      const presentValue = calculatePresentValue(monthlyPayment, leaseTerm, annualDiscountRate);

      expect(presentValue).toBeGreaterThan(0);
      expect(presentValue).toBeLessThan(monthlyPayment * leaseTerm * 0.7); // Significantly discounted
    });
  });

  describe('generateASC842Schedule', () => {
    it('should generate correct ASC842 lease schedule', () => {
      const leaseAmount = 5000;
      const leaseTerm = 12; // 1 year for easier testing
      const discountRate = 3.5;

      const schedule = generateASC842Schedule(leaseAmount, leaseTerm, discountRate);

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBe(leaseTerm);

      // Verify schedule structure
      schedule.forEach((entry, index) => {
        expect(entry).toHaveProperty('period');
        expect(entry).toHaveProperty('payment');
        expect(entry).toHaveProperty('interest');
        expect(entry).toHaveProperty('principal');
        expect(entry).toHaveProperty('balance');

        expect(entry.period).toBe(index + 1);
        expect(entry.payment).toBe(leaseAmount);
        expect(entry.interest).toBeGreaterThanOrEqual(0);
        expect(entry.principal).toBeGreaterThan(0);
        expect(entry.balance).toBeGreaterThanOrEqual(0);
      });

      // Verify balance decreases over time
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].balance).toBeLessThan(schedule[i - 1].balance);
      }

      // Final balance should be close to zero
      expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 2);
    });

    it('should handle zero discount rate', () => {
      const leaseAmount = 5000;
      const leaseTerm = 12;
      const discountRate = 0;

      const schedule = generateASC842Schedule(leaseAmount, leaseTerm, discountRate);

      expect(schedule).toBeDefined();
      expect(schedule.length).toBe(leaseTerm);

      // With zero discount rate, interest should be zero
      schedule.forEach(entry => {
        expect(entry.interest).toBe(0);
        expect(entry.principal).toBe(leaseAmount);
      });
    });

    it('should handle single payment lease', () => {
      const leaseAmount = 5000;
      const leaseTerm = 1;
      const discountRate = 3.5;

      const schedule = generateASC842Schedule(leaseAmount, leaseTerm, discountRate);

      expect(schedule).toBeDefined();
      expect(schedule.length).toBe(1);
      expect(schedule[0].period).toBe(1);
      expect(schedule[0].payment).toBe(leaseAmount);
      expect(schedule[0].balance).toBeCloseTo(0, 2);
    });
  });

  describe('generateIFRS16Schedule', () => {
    it('should generate correct IFRS16 lease schedule', () => {
      const leaseAmount = 5000;
      const leaseTerm = 12;
      const discountRate = 3.5;

      const schedule = generateIFRS16Schedule(leaseAmount, leaseTerm, discountRate);

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBe(leaseTerm);

      // IFRS16 should have same structure as ASC842 for basic calculation
      schedule.forEach((entry, index) => {
        expect(entry).toHaveProperty('period');
        expect(entry).toHaveProperty('payment');
        expect(entry).toHaveProperty('interest');
        expect(entry).toHaveProperty('principal');
        expect(entry).toHaveProperty('balance');

        expect(entry.period).toBe(index + 1);
        expect(entry.payment).toBe(leaseAmount);
      });
    });

    it('should match ASC842 for basic lease calculations', () => {
      const leaseAmount = 5000;
      const leaseTerm = 12;
      const discountRate = 3.5;

      const asc842Schedule = generateASC842Schedule(leaseAmount, leaseTerm, discountRate);
      const ifrs16Schedule = generateIFRS16Schedule(leaseAmount, leaseTerm, discountRate);

      expect(asc842Schedule.length).toBe(ifrs16Schedule.length);

      // For basic lease, calculations should be similar
      asc842Schedule.forEach((entry, index) => {
        const ifrs16Entry = ifrs16Schedule[index];
        expect(entry.payment).toBe(ifrs16Entry.payment);
        expect(entry.period).toBe(ifrs16Entry.period);
        // Interest and principal might have slight differences due to implementation
        expect(Math.abs(entry.interest - ifrs16Entry.interest)).toBeLessThan(1);
      });
    });
  });

  describe('generateJournalEntries', () => {
    it('should generate journal entries for lease payments', () => {
      const contractId = 'test-contract-1';
      const userId = 'test-user-1';
      const schedule = [
        {
          period: 1,
          payment: 5000,
          interest: 831.25,
          principal: 4168.75,
          balance: 280831.25
        },
        {
          period: 2,
          payment: 5000,
          interest: 819.08,
          principal: 4180.92,
          balance: 276650.33
        }
      ];

      const journalEntries = generateJournalEntries(contractId, userId, schedule);

      expect(journalEntries).toBeDefined();
      expect(Array.isArray(journalEntries)).toBe(true);
      expect(journalEntries.length).toBeGreaterThan(0);

      journalEntries.forEach(entry => {
        expect(entry).toHaveProperty('contractId');
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('entryDate');
        expect(entry).toHaveProperty('description');
        expect(entry).toHaveProperty('debitAccount');
        expect(entry).toHaveProperty('creditAccount');
        expect(entry).toHaveProperty('amount');
        expect(entry).toHaveProperty('reference');

        expect(entry.contractId).toBe(contractId);
        expect(entry.userId).toBe(userId);
        expect(entry.amount).toBeGreaterThan(0);
      });
    });

    it('should generate appropriate entries for lease interest and principal', () => {
      const contractId = 'test-contract-1';
      const userId = 'test-user-1';
      const schedule = [
        {
          period: 1,
          payment: 5000,
          interest: 831.25,
          principal: 4168.75,
          balance: 280831.25
        }
      ];

      const journalEntries = generateJournalEntries(contractId, userId, schedule);

      expect(journalEntries.length).toBeGreaterThan(0);

      // Should include entries for interest expense and lease liability reduction
      const interestEntry = journalEntries.find(entry =>
        entry.description.toLowerCase().includes('interest') ||
        entry.debitAccount.toLowerCase().includes('interest')
      );

      const principalEntry = journalEntries.find(entry =>
        entry.description.toLowerCase().includes('lease') ||
        entry.debitAccount.toLowerCase().includes('lease')
      );

      expect(interestEntry || principalEntry).toBeDefined();
    });

    it('should handle empty schedule', () => {
      const contractId = 'test-contract-1';
      const userId = 'test-user-1';
      const schedule: any[] = [];

      const journalEntries = generateJournalEntries(contractId, userId, schedule);

      expect(journalEntries).toBeDefined();
      expect(Array.isArray(journalEntries)).toBe(true);
      expect(journalEntries.length).toBe(0);
    });

    it('should handle schedule with zero amounts', () => {
      const contractId = 'test-contract-1';
      const userId = 'test-user-1';
      const schedule = [
        {
          period: 1,
          payment: 0,
          interest: 0,
          principal: 0,
          balance: 0
        }
      ];

      const journalEntries = generateJournalEntries(contractId, userId, schedule);

      expect(journalEntries).toBeDefined();
      expect(Array.isArray(journalEntries)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative lease amounts', () => {
      expect(() => {
        generateASC842Schedule(-5000, 12, 3.5);
      }).toThrow();
    });

    it('should handle zero lease term', () => {
      expect(() => {
        generateASC842Schedule(5000, 0, 3.5);
      }).toThrow();
    });

    it('should handle negative discount rates', () => {
      expect(() => {
        generateASC842Schedule(5000, 12, -3.5);
      }).toThrow();
    });

    it('should handle extremely high discount rates', () => {
      const leaseAmount = 5000;
      const leaseTerm = 12;
      const discountRate = 100; // 100% annual rate

      const presentValue = calculatePresentValue(leaseAmount, leaseTerm, discountRate);
      expect(presentValue).toBeGreaterThan(0);
      expect(presentValue).toBeLessThan(leaseAmount); // Should be heavily discounted
    });
  });
});