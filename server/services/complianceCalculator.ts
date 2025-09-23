export interface ASC842Schedule {
  paymentDate: string;
  period: number;
  leasePayment: number;
  interestExpense: number;
  principalPayment: number;
  leaseLiability: number;
  rouAssetValue: number;
  rouAssetAmortization: number;
  cumulativeAmortization: number;
  shortTermLiability: number;
  longTermLiability: number;
  interestAmortized: number;
  accruedInterest: number;
  prepaidRent: number;
}

export interface IFRS16Schedule {
  paymentDate: string;
  period: number;
  leasePayment: number;
  interestExpense: number;
  principalReduction: number;
  beginningLeaseLIABILITY: number;
  endingLeaseLIABILITY: number;
  currentLeaseLIABILITY: number;
  nonCurrentLeaseLIABILITY: number;
  beginningRightOfUseAsset: number;
  depreciationExpense: number;
  endingRightOfUseAsset: number;
  cumulativeDepreciation: number;
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
  let leaseLiability = leaseAmount;
  let rouAssetValue = leaseAmount;
  const annualAmortization = leaseAmount / leaseTerm;
  let cumulativeAmortization = 0;
  let interestAmortized = 0;
  
  for (let period = 1; period <= leaseTerm; period++) {
    const interestExpense = leaseLiability * discountRate;
    const principalPayment = annualPayment - interestExpense;
    
    // Calculate next period's principal payment for ST/LT liability split
    const nextPeriodLiability = Math.max(0, leaseLiability - principalPayment);
    const nextInterestExpense = nextPeriodLiability * discountRate;
    const nextPrincipalPayment = period < leaseTerm ? annualPayment - nextInterestExpense : 0;
    
    // Update balances after payment
    leaseLiability = nextPeriodLiability;
    cumulativeAmortization += annualAmortization;
    rouAssetValue = Math.max(0, leaseAmount - cumulativeAmortization);
    interestAmortized += interestExpense;
    
    // Calculate short-term vs long-term liability (ST = next period's principal payment)
    const shortTermLiability = Math.round(nextPrincipalPayment * 100) / 100;
    const longTermLiability = Math.round((nextPeriodLiability - nextPrincipalPayment) * 100) / 100;
    
    const paymentDate = new Date();
    paymentDate.setFullYear(paymentDate.getFullYear() + period);
    
    schedule.push({
      paymentDate: paymentDate.toISOString().split('T')[0],
      period,
      leasePayment: annualPayment,
      interestExpense: Math.round(interestExpense * 100) / 100,
      principalPayment: Math.round(principalPayment * 100) / 100,
      leaseLiability: Math.round(leaseLiability * 100) / 100,
      rouAssetValue: Math.round(rouAssetValue * 100) / 100,
      rouAssetAmortization: Math.round(annualAmortization * 100) / 100,
      cumulativeAmortization: Math.round(cumulativeAmortization * 100) / 100,
      shortTermLiability: Math.max(0, shortTermLiability),
      longTermLiability: Math.max(0, longTermLiability),
      interestAmortized: Math.round(interestAmortized * 100) / 100,
      accruedInterest: 0, // Zero for end-of-period annual payments
      prepaidRent: 0 // Zero under ASC 842 for operating leases
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
  const annualDepreciation = leaseAmount / leaseTerm;
  let cumulativeDepreciation = 0;
  
  for (let period = 1; period <= leaseTerm; period++) {
    const beginningLiability = leaseLIABILITY;
    const beginningROU = rightOfUseAsset;
    
    // Calculate interest expense on beginning liability balance
    const interestExpense = beginningLiability * discountRate;
    const principalReduction = annualPayment - interestExpense;
    
    // Update lease liability after payment
    leaseLIABILITY = Math.max(0, beginningLiability - principalReduction);
    
    // Calculate depreciation
    const depreciationExpense = annualDepreciation;
    cumulativeDepreciation += depreciationExpense;
    rightOfUseAsset = Math.max(0, leaseAmount - cumulativeDepreciation);
    
    // Calculate current vs non-current liability split
    // Current = next period's principal payment (if not final period)
    let currentLiability = 0;
    let nonCurrentLiability = leaseLIABILITY;
    
    if (period < leaseTerm && leaseLIABILITY > 0) {
      const nextInterestExpense = leaseLIABILITY * discountRate;
      const nextPrincipalPayment = Math.min(annualPayment - nextInterestExpense, leaseLIABILITY);
      currentLiability = Math.max(0, nextPrincipalPayment);
      nonCurrentLiability = Math.max(0, leaseLIABILITY - currentLiability);
    } else if (period === leaseTerm) {
      // In final period, remaining liability is current
      currentLiability = leaseLIABILITY;
      nonCurrentLiability = 0;
    }
    
    const paymentDate = new Date();
    paymentDate.setFullYear(paymentDate.getFullYear() + period);
    
    schedule.push({
      paymentDate: paymentDate.toISOString().split('T')[0],
      period,
      leasePayment: annualPayment,
      interestExpense: Math.round(interestExpense * 100) / 100,
      principalReduction: Math.round(principalReduction * 100) / 100,
      beginningLeaseLIABILITY: Math.round(beginningLiability * 100) / 100,
      endingLeaseLIABILITY: Math.round(leaseLIABILITY * 100) / 100,
      currentLeaseLIABILITY: Math.round(currentLiability * 100) / 100,
      nonCurrentLeaseLIABILITY: Math.round(nonCurrentLiability * 100) / 100,
      beginningRightOfUseAsset: Math.round(beginningROU * 100) / 100,
      depreciationExpense: Math.round(depreciationExpense * 100) / 100,
      endingRightOfUseAsset: Math.round(rightOfUseAsset * 100) / 100,
      cumulativeDepreciation: Math.round(cumulativeDepreciation * 100) / 100
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
