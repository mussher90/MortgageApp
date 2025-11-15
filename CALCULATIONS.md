# Mortgage Calculator Calculations

This document describes the mathematical formulas and logic used in the mortgage repayment calculator.

## Overview

The calculator uses **daily compounding** to match New Zealand bank mortgage calculations (e.g., Westpac). This means interest is calculated daily and compounds within each month.

## Core Formulas

### Monthly Payment Calculation

The monthly mortgage payment is calculated using the standard amortization formula with daily compounding:

```
M = P × [r × (1 + r)^n] / [(1 + r)^n - 1]
```

Where:
- **M** = Monthly payment
- **P** = Principal (loan amount)
- **r** = Effective monthly interest rate (derived from daily compounding)
- **n** = Total number of payments (term in years × 12)

#### Daily Compounding Conversion

Since New Zealand mortgages use daily compounding, we first convert the annual rate to a daily rate:

```
daily_rate = annual_rate / 100 / 365
```

Then calculate the effective monthly rate accounting for daily compounding:

```
effective_monthly_rate = (1 + daily_rate)^(365/12) - 1
```

This accounts for interest compounding daily within each month (using average days per month = 365/12 ≈ 30.4167).

#### Special Cases

- **Zero Interest**: If annual rate = 0, monthly payment = Principal / (Term in years × 12)
- **No Principal**: If principal ≤ 0, monthly payment = 0

### Yearly Payment Breakdown

The calculator breaks down payments year by year, calculating interest and principal for each month.

#### Monthly Interest Calculation

For each month, interest is calculated using daily compounding:

```
days_in_month = actual days in the month (28, 29, 30, or 31)
interest_for_month = remaining_balance × [(1 + daily_rate)^days_in_month - 1]
```

#### Monthly Principal Payment

```
principal_payment = min(monthly_payment - interest_for_month, remaining_balance)
```

The remaining balance is then reduced by the principal payment.

## Additional Features

### Extra Payments

Users can pay up to 20% extra each month, which goes directly to principal:

```
extra_payment_amount = (main_loan_monthly_payment × extra_payment_percent) / 100
total_principal_payment = regular_principal_payment + extra_payment_amount
```

This accelerates the payoff by reducing the principal faster, which in turn reduces future interest charges.

### Offset Account

The offset account feature treats the offset account as a separate loan, and the offset amount only reduces interest on the offset loan itself.

#### Offset Loan as Separate Loan

The offset account is treated as a **separate loan** with its own:
- Amount
- Term (years)
- Interest rate
- Offset amount (reduces interest on both loans)

##### Offset Loan Monthly Payment

Calculated independently using the same formula as the main loan:

```
offset_monthly_payment = calculateMonthlyPayment(offset_amount, offset_rate, offset_term)
```

##### Offset Loan Interest Calculation

The offset amount reduces the interest on the offset loan itself (not the main loan):

```
offset_interest_bearing_balance = max(0, offset_loan_balance - offset_amount)
offset_loan_interest = offset_interest_bearing_balance × [(1 + offset_daily_rate)^days_in_month - 1]
```

**Important**: 
- The offset amount **only** applies to the offset loan, not the main loan
- If `offset_amount ≥ offset_loan_balance`, then `offset_loan_interest = 0`, meaning all offset loan payments go to principal
- The main loan interest is calculated on the full remaining balance without any offset reduction

##### Combined Payments

The total monthly payment is the sum of both loans:

```
total_monthly_payment = main_loan_monthly_payment + offset_loan_monthly_payment
```

In the yearly breakdown:
- Principal payments from both loans are combined
- Interest payments from both loans are combined
- The chart displays them separately for visualization

## Time Saved Calculation

The calculator compares two scenarios:

1. **Standard Payoff**: Main loan only, no extra payments, no offset account
2. **Accelerated Payoff**: With extra payments and/or offset account

### Standard Months Calculation

The calculator tracks month-by-month how long it takes to pay off the standard loan:

```
For each month:
  - Calculate interest on remaining balance
  - Calculate principal payment
  - Reduce balance
  - Count months until balance ≤ $0.01
```

### Accelerated Months Calculation

Similar process but includes:
- Extra payments on main loan
- Offset account payments
- Reduced interest due to offset amount

### Time Saved

```
months_saved = standard_months - accelerated_months
years_saved = floor(months_saved / 12)
```

## Data Structure

### YearlyPayment Interface

```typescript
{
  year: number;
  principal: number;        // Total principal paid this year
  interest: number;       // Total interest paid this year
  total: number;          // Total payments (principal + interest)
  remainingBalance: number;
  
  // Separate tracking for visualization
  mainLoanPrincipal?: number;
  mainLoanInterest?: number;
  offsetLoanPrincipal?: number;
  offsetLoanInterest?: number;
}
```

## Rounding

All monetary values are rounded to 2 decimal places (nearest cent):

```
rounded_value = round(value × 100) / 100
```

## Example Calculation

### Scenario
- Main Loan: $500,000 at 4.5% for 30 years
- Offset Loan: $30,000 at 4.5% for 30 years
- Offset Amount: $30,000
- Extra Payment: 10%

### Monthly Payments
1. Main loan monthly payment: ~$2,533.43
2. Offset loan monthly payment: ~$152.01
3. Total monthly payment: ~$2,685.44

### Interest Calculation (First Month)
1. **Main Loan**:
   - Interest-bearing balance: $500,000 (offset amount does NOT apply to main loan)
   - Interest (31 days): $500,000 × [(1 + 0.045/365)^31 - 1] ≈ $1,914.89
   - Principal: $2,533.43 - $1,914.89 = $618.54
   - Extra payment: $2,533.43 × 10% = $253.34
   - Total principal: $618.54 + $253.34 = $871.88

2. **Offset Loan**:
   - Interest-bearing balance: $30,000 - $30,000 = $0 (offset amount applies here)
   - Interest: $0 (fully offset)
   - Principal: $152.01 - $0 = $152.01 (entire payment goes to principal)

### Result
- Total principal paid: $871.88 + $152.01 = $1,023.89
- Total interest paid: $1,914.89 + $0 = $1,914.89
- New main loan balance: $500,000 - $871.88 = $499,128.12
- New offset loan balance: $30,000 - $152.01 = $29,847.99

## Notes

1. **Daily Compounding**: Interest compounds daily, which is why we use the effective monthly rate formula rather than simply dividing the annual rate by 12.

2. **Variable Month Lengths**: The calculator accounts for different month lengths (28-31 days) and leap years when calculating monthly interest.

3. **Offset Account Logic**: The offset amount **only** reduces interest on the offset loan itself, not the main loan. If the offset amount equals or exceeds the offset loan balance, all offset loan payments go to principal. The main loan interest is always calculated on the full remaining balance.

4. **Early Payoff**: The calculator tracks when loans are fully paid off and stops calculations at that point, even if the original term hasn't been reached.

5. **Precision**: Calculations use floating-point arithmetic with rounding to 2 decimal places for display. Balance checks use a threshold of $0.01 to account for rounding differences.

