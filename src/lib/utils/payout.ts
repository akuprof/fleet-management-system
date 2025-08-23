/**
 * Calculate driver payout based on the business formula:
 * pay = min(revenue, 2250) * 0.30 + max(revenue - 2250, 0) * 0.70
 */
export function calculatePayout(revenue: number): number {
  const targetAmount = 2250
  const baseCommission = 0.30
  const incentiveCommission = 0.70
  
  const baseAmount = Math.min(revenue, targetAmount) * baseCommission
  const incentiveAmount = Math.max(revenue - targetAmount, 0) * incentiveCommission
  
  return baseAmount + incentiveAmount
}

/**
 * Calculate commission breakdown
 */
export function calculateCommissionBreakdown(revenue: number) {
  const targetAmount = 2250
  const baseCommission = 0.30
  const incentiveCommission = 0.70
  
  const baseRevenue = Math.min(revenue, targetAmount)
  const incentiveRevenue = Math.max(revenue - targetAmount, 0)
  
  const baseAmount = baseRevenue * baseCommission
  const incentiveAmount = incentiveRevenue * incentiveCommission
  
  return {
    baseRevenue,
    incentiveRevenue,
    baseAmount,
    incentiveAmount,
    totalPayout: baseAmount + incentiveAmount,
    targetAmount,
    baseCommissionRate: baseCommission,
    incentiveCommissionRate: incentiveCommission
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculate net payout after deductions
 */
export function calculateNetPayout(
  grossPayout: number,
  deductions: number = 0
): number {
  return Math.max(grossPayout - deductions, 0)
}

