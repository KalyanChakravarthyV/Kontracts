import { describe, it, expect } from '@jest/globals';

describe('Compliance Calculator Tests', () => {
  describe('Present Value Calculation', () => {
    function calculatePresentValue(monthlyPayment: number, leaseTerm: number, annualDiscountRate: number): number {
      if (monthlyPayment <= 0 || leaseTerm <= 0 || annualDiscountRate < 0) {
        throw new Error('Invalid input parameters');
      }

      const monthlyRate = annualDiscountRate / 100 / 12;

      if (monthlyRate === 0) {
        return monthlyPayment * leaseTerm;
      }

      return monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -leaseTerm)) / monthlyRate);
    }

    it('should calculate present value correctly', () => {
      const monthlyPayment = 5000;
      const leaseTerm = 60; // 5 years
      const annualDiscountRate = 3.5;

      const presentValue = calculatePresentValue(monthlyPayment, leaseTerm, annualDiscountRate);

      expect(presentValue).toBeGreaterThan(0);
      expect(presentValue).toBeLessThan(monthlyPayment * leaseTerm);
      expect(typeof presentValue).toBe('number');
      expect(Math.round(presentValue)).toBe(274850); // Correct expected value for these parameters
    });

    it('should handle zero discount rate', () => {
      const monthlyPayment = 5000;
      const leaseTerm = 60;
      const annualDiscountRate = 0;

      const presentValue = calculatePresentValue(monthlyPayment, leaseTerm, annualDiscountRate);

      expect(presentValue).toBe(monthlyPayment * leaseTerm);
    });

    it('should handle single payment', () => {
      const monthlyPayment = 5000;
      const leaseTerm = 1;
      const annualDiscountRate = 3.5;

      const presentValue = calculatePresentValue(monthlyPayment, leaseTerm, annualDiscountRate);

      expect(presentValue).toBeCloseTo(monthlyPayment / (1 + (annualDiscountRate / 100) / 12), 2);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculatePresentValue(-5000, 12, 3.5)).toThrow('Invalid input parameters');
      expect(() => calculatePresentValue(5000, 0, 3.5)).toThrow('Invalid input parameters');
      expect(() => calculatePresentValue(5000, 12, -3.5)).toThrow('Invalid input parameters');
    });
  });

  describe('Lease Schedule Generation', () => {
    interface ScheduleEntry {
      period: number;
      payment: number;
      interest: number;
      principal: number;
      balance: number;
    }

    function generateSchedule(leaseAmount: number, leaseTerm: number, discountRate: number): ScheduleEntry[] {
      if (leaseAmount <= 0 || leaseTerm <= 0 || discountRate < 0) {
        throw new Error('Invalid input parameters');
      }

      const monthlyRate = discountRate / 100 / 12;
      const presentValue = leaseAmount * ((1 - Math.pow(1 + monthlyRate, -leaseTerm)) / monthlyRate);

      const schedule: ScheduleEntry[] = [];
      let remainingBalance = presentValue;

      for (let period = 1; period <= leaseTerm; period++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = leaseAmount - interestPayment;
        remainingBalance -= principalPayment;

        schedule.push({
          period,
          payment: leaseAmount,
          interest: Math.round(interestPayment * 100) / 100,
          principal: Math.round(principalPayment * 100) / 100,
          balance: Math.round(remainingBalance * 100) / 100
        });
      }

      return schedule;
    }

    it('should generate correct lease schedule', () => {
      const leaseAmount = 5000;
      const leaseTerm = 12;
      const discountRate = 3.5;

      const schedule = generateSchedule(leaseAmount, leaseTerm, discountRate);

      expect(schedule).toBeDefined();
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBe(leaseTerm);

      schedule.forEach((entry, index) => {
        expect(entry.period).toBe(index + 1);
        expect(entry.payment).toBe(leaseAmount);
        expect(entry.interest).toBeGreaterThanOrEqual(0);
        expect(entry.principal).toBeGreaterThan(0);
        expect(entry.balance).toBeGreaterThanOrEqual(0);
      });

      // Final balance should be close to zero
      expect(Math.abs(schedule[schedule.length - 1].balance)).toBeLessThan(1);
    });

    it('should handle single payment lease', () => {
      const leaseAmount = 5000;
      const leaseTerm = 1;
      const discountRate = 3.5;

      const schedule = generateSchedule(leaseAmount, leaseTerm, discountRate);

      expect(schedule.length).toBe(1);
      expect(schedule[0].period).toBe(1);
      expect(schedule[0].payment).toBe(leaseAmount);
      expect(Math.abs(schedule[0].balance)).toBeLessThan(1);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => generateSchedule(-5000, 12, 3.5)).toThrow('Invalid input parameters');
      expect(() => generateSchedule(5000, 0, 3.5)).toThrow('Invalid input parameters');
      expect(() => generateSchedule(5000, 12, -3.5)).toThrow('Invalid input parameters');
    });
  });

  describe('Journal Entry Generation', () => {
    interface JournalEntry {
      contractId: string;
      userId: string;
      entryDate: string;
      description: string;
      debitAccount: string;
      creditAccount: string;
      amount: number;
      reference: string;
    }

    function generateJournalEntries(contractId: string, userId: string, amount: number): JournalEntry[] {
      const entries: JournalEntry[] = [];
      const entryDate = new Date().toISOString();

      // Lease liability entry
      entries.push({
        contractId,
        userId,
        entryDate,
        description: 'Lease liability recognition',
        debitAccount: 'Right-of-Use Asset',
        creditAccount: 'Lease Liability',
        amount,
        reference: `Contract: ${contractId}`
      });

      // Monthly payment entry
      entries.push({
        contractId,
        userId,
        entryDate,
        description: 'Monthly lease payment',
        debitAccount: 'Lease Liability',
        creditAccount: 'Cash',
        amount,
        reference: `Contract: ${contractId}`
      });

      return entries;
    }

    it('should generate journal entries for lease', () => {
      const contractId = 'test-contract-1';
      const userId = 'test-user-1';
      const amount = 5000;

      const entries = generateJournalEntries(contractId, userId, amount);

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);

      entries.forEach(entry => {
        expect(entry.contractId).toBe(contractId);
        expect(entry.userId).toBe(userId);
        expect(entry.amount).toBe(amount);
        expect(entry.debitAccount).toBeTruthy();
        expect(entry.creditAccount).toBeTruthy();
        expect(entry.description).toBeTruthy();
        expect(entry.reference).toContain(contractId);
      });
    });

    it('should generate appropriate accounting entries', () => {
      const entries = generateJournalEntries('contract-1', 'user-1', 1000);

      const liabilityEntry = entries.find(e => e.description.includes('liability'));
      const paymentEntry = entries.find(e => e.description.includes('payment'));

      expect(liabilityEntry).toBeDefined();
      expect(paymentEntry).toBeDefined();

      expect(liabilityEntry?.debitAccount).toBe('Right-of-Use Asset');
      expect(liabilityEntry?.creditAccount).toBe('Lease Liability');

      expect(paymentEntry?.debitAccount).toBe('Lease Liability');
      expect(paymentEntry?.creditAccount).toBe('Cash');
    });
  });
});