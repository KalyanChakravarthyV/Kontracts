export interface ASC842Schedule {
  paymentDate: string;
  period: number;
  leasePayment: number;
  interestExpense: number;
  principalPayment: number;
  leaseLIABILITY: number;
  routAssetValue: number;
  routAssetAmortization: number;
  cumulativeAmortization: number;
  shortTermLiability: number;
  longTermLiability: number;
  interestAmortized: number;
  accruedInterest: number;
  prepaidRent: number;
}

export interface IFRS16Schedule {
  period: string;
  leasePayment: number;
  interestExpense: number;
  principalReduction: number;
  rightOfUseAsset: number;
  leaseLIABILITY: number;
  depreciationExpense: number;
}

export function calculatePresentValue(
  cashFlows: number[],
  discountRate: number,
  periods: number[]
): number {
  return cashFlows.reduce((pv, cashFlow, index) => {
    const period = periods[index] || (index + 1);
    return pv + cashFlow / Math.pow(1 + discountRate, period);
  }, 0);
}

export function generateASC842Schedule(
  leaseAmount: number,
  annualPayment: number,
  leaseTerm: number,
  discountRate: number
): ASC842Schedule[] {
  const schedule: ASC842Schedule[] = [];
  let leaseLIABILITY = leaseAmount;
  let routAssetValue = leaseAmount;
  const annualAmortization = leaseAmount / leaseTerm;
  let cumulativeAmortization = 0;
  let interestAmortized = 0;
  
  for (let period = 1; period <= leaseTerm; period++) {
    const interestExpense = leaseLIABILITY * discountRate;
    const principalPayment = annualPayment - interestExpense;
    
    // Update balances after payment
    leaseLIABILITY = Math.max(0, leaseLIABILITY - principalPayment);
    cumulativeAmortization += annualAmortization;
    routAssetValue = Math.max(0, leaseAmount - cumulativeAmortization);
    interestAmortized += interestExpense;
    
    // Calculate short-term vs long-term liability
    const shortTermLiability = Math.min(leaseLIABILITY, annualPayment);
    const longTermLiability = Math.max(0, leaseLIABILITY - shortTermLiability);
    
    const paymentDate = new Date();
    paymentDate.setFullYear(paymentDate.getFullYear() + period);
    
    schedule.push({
      paymentDate: paymentDate.toISOString().split('T')[0],
      period,
      leasePayment: annualPayment,
      interestExpense: Math.round(interestExpense * 100) / 100,
      principalPayment: Math.round(principalPayment * 100) / 100,
      leaseLIABILITY: Math.round(leaseLIABILITY * 100) / 100,
      routAssetValue: Math.round(routAssetValue * 100) / 100,
      routAssetAmortization: Math.round(annualAmortization * 100) / 100,
      cumulativeAmortization: Math.round(cumulativeAmortization * 100) / 100,
      shortTermLiability: Math.round(shortTermLiability * 100) / 100,
      longTermLiability: Math.round(longTermLiability * 100) / 100,
      interestAmortized: Math.round(interestAmortized * 100) / 100,
      accruedInterest: 0, // Typically zero for annual payments
      prepaidRent: 0 // Typically zero under ASC 842
    });
  }
  
  return schedule;
}

export function generateIFRS16Schedule(
  leaseAmount: number,
  annualPayment: number,
  leaseTerm: number,
  discountRate: number
): IFRS16Schedule[] {
  const schedule: IFRS16Schedule[] = [];
  let leaseLIABILITY = leaseAmount;
  let rightOfUseAsset = leaseAmount;
  const monthlyDepreciation = leaseAmount / (leaseTerm * 12);
  
  for (let period = 1; period <= leaseTerm; period++) {
    const interestExpense = leaseLIABILITY * (discountRate / 12);
    const principalReduction = annualPayment - interestExpense;
    
    leaseLIABILITY = Math.max(0, leaseLIABILITY - principalReduction);
    rightOfUseAsset = Math.max(0, rightOfUseAsset - (monthlyDepreciation * 12));
    
    schedule.push({
      period: `Year ${period}`,
      leasePayment: annualPayment,
      interestExpense: Math.round(interestExpense * 100) / 100,
      principalReduction: Math.round(principalReduction * 100) / 100,
      rightOfUseAsset: Math.round(rightOfUseAsset * 100) / 100,
      leaseLIABILITY: Math.round(leaseLIABILITY * 100) / 100,
      depreciationExpense: Math.round(monthlyDepreciation * 12 * 100) / 100
    });
  }
  
  return schedule;
}

export function generateJournalEntries(
  contractData: any,
  scheduleType: 'ASC842' | 'IFRS16'
) {
  const entries = [];
  const baseDate = new Date();
  
  if (scheduleType === 'ASC842') {
    // Initial recognition
    entries.push({
      entryDate: baseDate.toISOString(),
      description: `Initial recognition of lease - ${contractData.name}`,
      debitAccount: 'Right-of-Use Asset',
      creditAccount: 'Lease Liability',
      amount: contractData.amount,
      reference: `ASC842-${contractData.id}`
    });
    
    // Monthly payment entry
    const monthlyDate = new Date(baseDate);
    monthlyDate.setMonth(monthlyDate.getMonth() + 1);
    
    entries.push({
      entryDate: monthlyDate.toISOString(),
      description: `Monthly lease payment - ${contractData.name}`,
      debitAccount: 'Lease Liability',
      creditAccount: 'Cash',
      amount: contractData.amount,
      reference: `ASC842-PMT-${contractData.id}`
    });
  }
  
  if (scheduleType === 'IFRS16') {
    // Similar entries for IFRS 16
    entries.push({
      entryDate: baseDate.toISOString(),
      description: `IFRS 16 lease recognition - ${contractData.name}`,
      debitAccount: 'Right-of-Use Asset',
      creditAccount: 'Lease Liability',
      amount: contractData.amount,
      reference: `IFRS16-${contractData.id}`
    });
  }
  
  return entries;
}
