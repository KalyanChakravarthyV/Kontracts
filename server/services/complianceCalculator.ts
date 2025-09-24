export interface ASC842Schedule {
  paymentDate: string;
  period: number;
  leasePayment: number;
  interestExpense: number;
  principalPayment: number;
  beginningLeaseLiability: number;
  endingLeaseLiability: number;
  shortTermLiability: number;
  longTermLiability: number;
  beginningRouAsset: number;
  rouAssetAmortization: number;
  endingRouAsset: number;
  cumulativeAmortization: number;
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
  
  for (let period = 1; period <= leaseTerm; period++) {
    const beginningLiability = leaseLiability;
    const beginningRouAsset = rouAssetValue;
    
    // Calculate interest expense on beginning liability balance
    const interestExpense = beginningLiability * discountRate;
    const principalPayment = annualPayment - interestExpense;
    
    // Update lease liability after payment
    leaseLiability = Math.max(0, beginningLiability - principalPayment);
    
    // Calculate ROU asset amortization
    const rouAssetAmortization = annualAmortization;
    cumulativeAmortization += rouAssetAmortization;
    rouAssetValue = Math.max(0, leaseAmount - cumulativeAmortization);
    
    // Calculate short-term vs long-term liability split
    // Short-term = portion due within 12 months (next period's principal)
    let shortTermLiability = 0;
    let longTermLiability = leaseLiability;
    
    if (period < leaseTerm && leaseLiability > 0) {
      const nextInterestExpense = leaseLiability * discountRate;
      const nextPrincipalPayment = Math.min(annualPayment - nextInterestExpense, leaseLiability);
      shortTermLiability = Math.max(0, nextPrincipalPayment);
      longTermLiability = Math.max(0, leaseLiability - shortTermLiability);
    } else if (period === leaseTerm) {
      // In final period, remaining liability is short-term
      shortTermLiability = leaseLiability;
      longTermLiability = 0;
    }
    
    const paymentDate = new Date();
    paymentDate.setFullYear(paymentDate.getFullYear() + period);
    
    schedule.push({
      paymentDate: paymentDate.toISOString().split('T')[0],
      period,
      leasePayment: annualPayment,
      interestExpense: Math.round(interestExpense * 100) / 100,
      principalPayment: Math.round(principalPayment * 100) / 100,
      beginningLeaseLiability: Math.round(beginningLiability * 100) / 100,
      endingLeaseLiability: Math.round(leaseLiability * 100) / 100,
      shortTermLiability: Math.round(shortTermLiability * 100) / 100,
      longTermLiability: Math.round(longTermLiability * 100) / 100,
      beginningRouAsset: Math.round(beginningRouAsset * 100) / 100,
      rouAssetAmortization: Math.round(rouAssetAmortization * 100) / 100,
      endingRouAsset: Math.round(rouAssetValue * 100) / 100,
      cumulativeAmortization: Math.round(cumulativeAmortization * 100) / 100
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

export async function generateJournalEntries(
  contractData: any,
  scheduleType: 'ASC842' | 'IFRS16',
  storage?: any,
  userId?: string
) {
  const entries = [];
  const baseDate = new Date();
  
  // If storage and userId are provided, use journal entry setups
  if (storage && userId) {
    try {
      const setups = await storage.getJournalEntrySetups(userId);
      
      if (setups && setups.length > 0 && scheduleType === 'ASC842') {
        // Try to load existing schedule from storage first
        const existingSchedules = await storage.getComplianceSchedules(contractData.id);
        const asc842Schedule = existingSchedules.find(s => s.type === 'ASC842');
        let schedule = [];
        
        if (asc842Schedule && asc842Schedule.scheduleData) {
          schedule = asc842Schedule.scheduleData;
        } else {
          // Generate new schedule with proper numeric parameters
          const amount = parseFloat(contractData.amount) || 0;
          const leaseTerm = 5; // Default 5 years
          const discountRate = 0.05; // Default 5%
          const annualPayment = amount / leaseTerm;
          schedule = generateASC842Schedule(amount, annualPayment, leaseTerm, discountRate);
        }
        
        for (const setup of setups) {
          // Skip if setup doesn't match trigger event
          if (setup.triggerEvent !== 'payment_due' && setup.triggerEvent !== 'contract_start') {
            continue;
          }
          
          // Calculate entries for each period based on setup
          for (let periodIndex = 0; periodIndex < schedule.length; periodIndex++) {
            const scheduleItem = schedule[periodIndex];
            let amount = 0;
            
            // Get amount based on setup's amount column and period reference
            const targetPeriodIndex = calculateTargetPeriodIndex(periodIndex, setup.periodReference, schedule.length);
            if (targetPeriodIndex >= 0 && targetPeriodIndex < schedule.length) {
              const targetItem = schedule[targetPeriodIndex];
              amount = getAmountFromScheduleItem(targetItem, setup.amountColumn);
            }
            
            if (amount > 0) {
              const entryDate = new Date(scheduleItem.paymentDate);
              const entryData = {
                entryDate: entryDate.toISOString(),
                description: `${setup.name} - ${contractData.name} (Period ${scheduleItem.period})`,
                debitAccount: setup.debitAccount,
                creditAccount: setup.creditAccount,
                amount: amount,
                reference: `SETUP-${setup.id}-${contractData.id}-P${scheduleItem.period}`
              };
              entries.push(entryData);
            }
          }
        }
        
        // If setups generated entries, return them
        if (entries.length > 0) {
          return entries;
        }
      }
    } catch (error) {
      console.error('Error generating journal entries from setups:', error);
      // Fall back to default behavior
    }
  }
  
  // Default behavior (legacy) if no setups or error
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

// Helper function to calculate target period index based on period reference
function calculateTargetPeriodIndex(currentPeriod: number, periodReference: string, totalPeriods: number): number {
  switch (periodReference) {
    case 'n':
      return currentPeriod;
    case 'n-1':
      return currentPeriod - 1;
    case 'n+1':
      return currentPeriod + 1;
    case '1':
      return 0; // First period
    case 'last':
      return totalPeriods - 1; // Last period
    default:
      // Try to parse as a number
      const num = parseInt(periodReference);
      if (!isNaN(num)) {
        return num - 1; // Convert to zero-based index
      }
      return currentPeriod; // Default to current period
  }
}

// Helper function to extract amount from schedule item based on column name
function getAmountFromScheduleItem(scheduleItem: any, amountColumn: string): number {
  // Try the requested column first, then fall back to alternative names
  const alternativeNames: { [key: string]: string } = {
    'principalPayment': 'principalReduction',
    'beginningLeaseLiability': 'beginningLeaseLIABILITY',
    'endingLeaseLiability': 'endingLeaseLIABILITY',
    'shortTermLiability': 'currentLeaseLIABILITY',
    'longTermLiability': 'nonCurrentLeaseLIABILITY',
    'beginningRouAsset': 'beginningRightOfUseAsset',
    'rouAssetAmortization': 'depreciationExpense',
    'endingRouAsset': 'endingRightOfUseAsset',
    'cumulativeAmortization': 'cumulativeDepreciation'
  };
  
  // First try the exact column name, then try the alternative
  const value = scheduleItem[amountColumn] ?? scheduleItem[alternativeNames[amountColumn]];
  
  return typeof value === 'number' ? Math.abs(value) : 0;
}
