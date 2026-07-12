export interface YearlyPayment {
  year: number;
  principal: number;
  interest: number;
  total: number;
  remainingBalance: number;
  extraPayments?: number;
  // Separate tracking for main loan vs offset loan (legacy)
  mainLoanPrincipal?: number;
  mainLoanInterest?: number;
  offsetLoanPrincipal?: number;
  offsetLoanInterest?: number;
  // Dynamic loan tracking for multiple loans
  loanPayments?: { [loanId: string]: { principal: number; interest: number } };
}

export interface OffsetAccount {
  amount: number;
  termYears: number;
  rate: number;
  offsetAmount: number;
}

export interface MortgageComparison {
  standardPayments: YearlyPayment[];
  acceleratedPayments: YearlyPayment[];
  standardMonths: number;
  acceleratedMonths: number;
  monthsSaved: number;
  yearsSaved: number;
  monthsSavedDecimal: number;
  totalMonthlyPayment: number;
  mainLoanMonthlyPayment: number;
  offsetLoanMonthlyPayment: number;
  totalExtraPayments: number;
  loanMonthlyPayments?: { [loanId: string]: { main: number; extra: number; offset: number } };
}

/**
 * Calculates loan term in years from a maturity date relative to a start date (defaults to today)
 */
export function calculateTermYearsFromMaturityDate(
  maturityDate: string,
  startDate: Date = getLoanStartDate()
): number {
  if (!maturityDate) {
    return 0;
  }

  const maturity = new Date(maturityDate + 'T00:00:00');
  if (isNaN(maturity.getTime())) {
    return 0;
  }

  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  if (maturity <= start) {
    return 0;
  }

  let months =
    (maturity.getFullYear() - start.getFullYear()) * 12 +
    (maturity.getMonth() - start.getMonth());

  if (maturity.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(months / 12, 1 / 12);
}

/**
 * Formats a date as YYYY-MM-DD for use in date inputs
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLoanStartDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function getDefaultLoanStartDateString(): string {
  return formatDateForInput(getLoanStartDate());
}

export function parseLoanStartDate(dateStr: string): Date {
  if (!dateStr) {
    return getLoanStartDate();
  }

  const parsed = new Date(`${dateStr}T00:00:00`);
  if (isNaN(parsed.getTime())) {
    return getLoanStartDate();
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

export function calculatePaymentMonthFromDate(
  paymentDate: Date,
  startDate: Date = getLoanStartDate()
): number {
  const paymentMonthStart = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
  const startMonthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  if (paymentMonthStart < startMonthStart) {
    return 0;
  }

  return (
    (paymentMonthStart.getFullYear() - startMonthStart.getFullYear()) * 12 +
    (paymentMonthStart.getMonth() - startMonthStart.getMonth()) +
    1
  );
}

/**
 * Formats a year-month string for use in month inputs (YYYY-MM)
 */
export function formatYearMonthForInput(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Converts a calendar month (YYYY-MM) to a loan payment month number
 * (month 1 = first month of the loan, based on the loan start date)
 */
export function calculatePaymentMonthFromYearMonth(
  paymentMonth: string,
  startDate: Date = getLoanStartDate()
): number {
  if (!paymentMonth || !/^\d{4}-\d{2}$/.test(paymentMonth)) {
    return 0;
  }

  const [yearStr, monthStr] = paymentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (!year || month < 1 || month > 12) {
    return 0;
  }

  return calculatePaymentMonthFromDate(new Date(year, month - 1, 1), startDate);
}

/**
 * Returns the latest allowable payment month (YYYY-MM) for a loan term
 */
export function calculateMaxPaymentMonth(
  termYears: number,
  startDate: Date = getLoanStartDate()
): string {
  const totalMonths = Math.max(Math.floor(termYears * 12), 1);
  const targetDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + totalMonths - 1,
    1
  );
  return formatYearMonthForInput(targetDate.getFullYear(), targetDate.getMonth() + 1);
}

/**
 * Returns the first allowable payment month (YYYY-MM)
 */
export function getMinPaymentMonth(startDate: Date = getLoanStartDate()): string {
  return formatYearMonthForInput(startDate.getFullYear(), startDate.getMonth() + 1);
}

/**
 * Calculates a maturity date from a loan term in years
 */
export function calculateMaturityDateFromTermYears(
  termYears: number,
  startDate: Date = getLoanStartDate()
): string {
  if (termYears <= 0) {
    return '';
  }

  const months = Math.round(termYears * 12);
  const maturity = new Date(startDate.getFullYear(), startDate.getMonth() + months, startDate.getDate());
  return formatDateForInput(maturity);
}

/**
 * Gets the number of days in a month (accounting for leap years)
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculates the monthly mortgage payment using daily compounding
 * This matches New Zealand bank mortgage calculations (e.g., Westpac)
 * Uses daily compounding with average days per month (365/12 ≈ 30.4167)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || annualRate < 0 || termYears <= 0) {
    return 0;
  }

  if (annualRate === 0) {
    // No interest case
    return principal / (termYears * 12);
  }

  // Daily compounding: daily rate = annual rate / 365
  const dailyRate = annualRate / 100 / 365;
  const averageDaysPerMonth = 365 / 12;

  // Effective monthly rate with daily compounding
  // This accounts for interest compounding daily within each month
  const effectiveMonthlyRate = Math.pow(1 + dailyRate, averageDaysPerMonth) - 1;
  const numberOfMonths = termYears * 12;

  const monthlyPayment =
    (principal * effectiveMonthlyRate * Math.pow(1 + effectiveMonthlyRate, numberOfMonths)) /
    (Math.pow(1 + effectiveMonthlyRate, numberOfMonths) - 1);

  return monthlyPayment;
}

/**
 * Calculates extra payment amount from a percentage of the standard monthly payment
 */
export function calculateExtraPaymentFromPercent(
  mainMonthlyPayment: number,
  extraPaymentPercent: number
): number {
  const percent = Math.min(Math.max(extraPaymentPercent, 0), 20);
  return (mainMonthlyPayment * percent) / 100;
}

/**
 * Calculates extra payment amount from a target total monthly repayment
 */
export function calculateExtraPaymentFromMonthlyRepayment(
  mainMonthlyPayment: number,
  monthlyRepaymentAmount: number
): number {
  if (mainMonthlyPayment <= 0) {
    return 0;
  }
  return Math.max(monthlyRepaymentAmount - mainMonthlyPayment, 0);
}

/**
 * Calculates extra payment percent from a target total monthly repayment
 */
export function calculateExtraPaymentPercentFromMonthlyRepayment(
  mainMonthlyPayment: number,
  monthlyRepaymentAmount: number
): number {
  if (mainMonthlyPayment <= 0) {
    return 0;
  }
  const percent = ((monthlyRepaymentAmount - mainMonthlyPayment) / mainMonthlyPayment) * 100;
  return Math.min(Math.max(percent, 0), 20);
}

/**
 * Calculates total monthly repayment from a standard payment and extra percent
 */
export function calculateMonthlyRepaymentFromPercent(
  mainMonthlyPayment: number,
  extraPaymentPercent: number
): number {
  return mainMonthlyPayment + calculateExtraPaymentFromPercent(mainMonthlyPayment, extraPaymentPercent);
}

/**
 * Calculates yearly breakdown of principal and interest payments
 * Uses daily compounding to match New Zealand bank calculations
 * Returns an array of YearlyPayment objects for each year of the loan
 */
export function calculateYearlyPayments(
  principal: number,
  annualRate: number,
  termYears: number,
  startDate: Date = getLoanStartDate()
): YearlyPayment[] {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const dailyRate = annualRate / 100 / 365;
  const yearlyPayments: YearlyPayment[] = [];

  let remainingBalance = principal;
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  for (let year = 1; year <= termYears; year++) {
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;

    // Calculate payments for each month in the year
    for (let month = 0; month < 12; month++) {
      if (remainingBalance <= 0.01) {
        break;
      }

      // Get the number of days in the current month
      const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
      
      // Calculate interest using daily compounding for this month
      // Interest = balance * ((1 + dailyRate)^days - 1)
      const interestForMonth = remainingBalance * (Math.pow(1 + dailyRate, daysInMonth) - 1);
      
      // Principal payment is the monthly payment minus interest
      const principalPayment = Math.min(
        monthlyPayment - interestForMonth,
        remainingBalance
      );

      yearlyInterest += interestForMonth;
      yearlyPrincipal += principalPayment;
      remainingBalance -= principalPayment;

      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    yearlyPayments.push({
      year,
      principal: Math.round(yearlyPrincipal * 100) / 100,
      interest: Math.round(yearlyInterest * 100) / 100,
      total: Math.round((yearlyPrincipal + yearlyInterest) * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
    });
  }

  return yearlyPayments;
}

/**
 * Calculates yearly breakdown with extra payments and/or offset account
 * Extra payments: up to 20% of monthly payment, goes directly to principal
 * Offset account: treated as separate loan with its own amount, term, rate, and offset amount
 * Returns comparison data showing how much sooner the mortgage is paid off
 */
export function calculateYearlyPaymentsWithExtras(
  principal: number,
  annualRate: number,
  termYears: number,
  extraPaymentPercent: number = 0,
  offsetAccount: OffsetAccount | null = null,
  startDate: Date = getLoanStartDate()
): MortgageComparison {
  const mainLoanMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const dailyRate = annualRate / 100 / 365;
  
  // Calculate offset account monthly payment if provided
  let offsetLoanMonthlyPayment = 0;
  if (offsetAccount && offsetAccount.amount > 0) {
    offsetLoanMonthlyPayment = calculateMonthlyPayment(
      offsetAccount.amount,
      offsetAccount.rate,
      offsetAccount.termYears
    );
  }
  
  const totalMonthlyPayment = mainLoanMonthlyPayment + offsetLoanMonthlyPayment;
  
  // Calculate standard payments (no extras, no offset)
  const standardPayments = calculateYearlyPayments(principal, annualRate, termYears, startDate);
  
  // Calculate accelerated payments (with extras and/or offset)
  const extraPaymentAmount = (mainLoanMonthlyPayment * extraPaymentPercent) / 100;
  const acceleratedPayments: YearlyPayment[] = [];
  
  let remainingBalance = principal;
  let offsetRemainingBalance = offsetAccount && offsetAccount.amount > 0 ? offsetAccount.amount : 0;
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  let totalMonths = 0;
  let totalExtraPayments = 0;
  const maxMonths = Math.max(termYears * 12, offsetAccount ? offsetAccount.termYears * 12 : 0);

  for (let year = 1; year <= termYears && (remainingBalance > 0.01 || offsetRemainingBalance > 0.01); year++) {
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let yearlyExtraPayments = 0;
    let mainLoanYearlyPrincipal = 0;
    let mainLoanYearlyInterest = 0;
    let offsetLoanYearlyPrincipal = 0;
    let offsetLoanYearlyInterest = 0;

    for (let month = 0; month < 12 && (remainingBalance > 0.01 || offsetRemainingBalance > 0.01) && totalMonths < maxMonths; month++) {
      totalMonths++;
      
      // Calculate main loan interest
      let mainLoanInterest = 0;
      let mainLoanPrincipalPayment = 0;
      if (remainingBalance > 0.01) {
        // Get the number of days in the current month
        const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
        
        // Calculate interest using daily compounding on the full remaining balance
        // Note: offset amount only applies to offset loan, not main loan
        mainLoanInterest = remainingBalance * (Math.pow(1 + dailyRate, daysInMonth) - 1);
        
        // Regular principal payment
        const regularPrincipalPayment = Math.min(
          mainLoanMonthlyPayment - mainLoanInterest,
          remainingBalance
        );
        
        // Add extra payment (goes directly to principal)
        const actualExtraPayment = Math.min(extraPaymentAmount, remainingBalance - regularPrincipalPayment);
        mainLoanPrincipalPayment = Math.min(
          regularPrincipalPayment + extraPaymentAmount,
          remainingBalance
        );
        
        // Track total extra payments
        totalExtraPayments += actualExtraPayment;
        yearlyExtraPayments += actualExtraPayment;

        mainLoanYearlyPrincipal += mainLoanPrincipalPayment;
        mainLoanYearlyInterest += mainLoanInterest;
        yearlyPrincipal += mainLoanPrincipalPayment;
        remainingBalance -= mainLoanPrincipalPayment;
      }
      
      // Calculate offset loan interest and payments
      // The offset amount reduces the interest-bearing balance of the offset loan
      let offsetLoanInterest = 0;
      let offsetLoanPrincipalPayment = 0;
      if (offsetRemainingBalance > 0.01 && offsetAccount) {
        const offsetDailyRate = offsetAccount.rate / 100 / 365;
        const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
        
        // Calculate interest-bearing balance: offset loan balance minus offset amount
        // If offset amount >= offset loan balance, then interest = 0
        const offsetInterestBearingBalance = Math.max(0, offsetRemainingBalance - offsetAccount.offsetAmount);
        offsetLoanInterest = offsetInterestBearingBalance * (Math.pow(1 + offsetDailyRate, daysInMonth) - 1);
        
        offsetLoanPrincipalPayment = Math.min(
          offsetLoanMonthlyPayment - offsetLoanInterest,
          offsetRemainingBalance
        );
        
        offsetLoanYearlyPrincipal += offsetLoanPrincipalPayment;
        offsetLoanYearlyInterest += offsetLoanInterest;
        yearlyPrincipal += offsetLoanPrincipalPayment;
        yearlyInterest += offsetLoanInterest;
        offsetRemainingBalance -= offsetLoanPrincipalPayment;
      }

      yearlyInterest += mainLoanInterest;

      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      
      // If both balances are paid off, break
      if (remainingBalance <= 0.01 && offsetRemainingBalance <= 0.01) {
        break;
      }
    }

    if (yearlyPrincipal > 0 || yearlyInterest > 0) {
      acceleratedPayments.push({
        year,
        principal: Math.round(yearlyPrincipal * 100) / 100,
        interest: Math.round(yearlyInterest * 100) / 100,
        total: Math.round((yearlyPrincipal + yearlyInterest) * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
        extraPayments: yearlyExtraPayments > 0 ? Math.round(yearlyExtraPayments * 100) / 100 : 0,
        mainLoanPrincipal: Math.round(mainLoanYearlyPrincipal * 100) / 100,
        mainLoanInterest: Math.round(mainLoanYearlyInterest * 100) / 100,
        offsetLoanPrincipal: offsetLoanYearlyPrincipal > 0 ? Math.round(offsetLoanYearlyPrincipal * 100) / 100 : 0,
        offsetLoanInterest: offsetLoanYearlyInterest > 0 ? Math.round(offsetLoanYearlyInterest * 100) / 100 : 0,
      });
    }
  }

  // Calculate actual months to pay off standard loan
  let standardMonths = termYears * 12;
  let standardBalance = principal;
  let standardDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  let standardMonthCount = 0;
  
  const standardMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const standardDailyRate = annualRate / 100 / 365;
  
  while (standardBalance > 0.01 && standardMonthCount < termYears * 12) {
    standardMonthCount++;
    const daysInMonth = getDaysInMonth(standardDate.getFullYear(), standardDate.getMonth() + 1);
    const interestForMonth = standardBalance * (Math.pow(1 + standardDailyRate, daysInMonth) - 1);
    const principalPayment = Math.min(
      standardMonthlyPayment - interestForMonth,
      standardBalance
    );
    standardBalance -= principalPayment;
    standardDate = new Date(standardDate.getFullYear(), standardDate.getMonth() + 1, 1);
  }
  
  standardMonths = standardMonthCount;
  const acceleratedMonths = totalMonths;
  const monthsSaved = standardMonths - acceleratedMonths;
  const yearsSaved = Math.floor(monthsSaved / 12);
  const monthsSavedDecimal = monthsSaved / 12;

  return {
    standardPayments,
    acceleratedPayments,
    standardMonths,
    acceleratedMonths,
    monthsSaved,
    yearsSaved,
    monthsSavedDecimal,
    totalMonthlyPayment,
    mainLoanMonthlyPayment,
    offsetLoanMonthlyPayment,
    totalExtraPayments: Math.round(totalExtraPayments * 100) / 100,
  };
}

export interface LoanInput {
  id: string;
  amount: number;
  startDate: Date;
  rate: number;
  termYears: number;
  extraPaymentAmount: number;
  lumpSumPayments: LumpSumPayment[];
  offsetAccount: OffsetAccount | null;
}

export interface LumpSumPayment {
  amount: number;
  month: number;
}

/**
 * Calculates yearly breakdown for multiple loans
 * Returns combined payments with separate tracking per loan for chart display
 */
export function calculateMultipleLoans(loans: LoanInput[]): {
  yearlyPayments: YearlyPayment[];
  totalMonthlyPayment: number;
  loanMonthlyPayments: { [loanId: string]: { main: number; extra: number; offset: number } };
} {
  if (loans.length === 0) {
    return { yearlyPayments: [], totalMonthlyPayment: 0, loanMonthlyPayments: {} };
  }

  const loanMonthlyPayments: { [loanId: string]: { main: number; extra: number; offset: number } } = {};
  const loanCalculations: Array<{
    id: string;
    startDate: Date;
    monthlyPayment: number;
    extraPaymentAmount: number;
    lumpSumPayments: LumpSumPayment[];
    offsetMonthlyPayment: number;
    dailyRate: number;
    offsetDailyRate: number | null;
    termYears: number;
    offsetTermYears: number;
    offsetAccount: OffsetAccount | null;
  }> = [];

  let totalMonthlyPayment = 0;

  // Calculate monthly payments for each loan
  for (const loan of loans) {
    const mainMonthlyPayment = calculateMonthlyPayment(loan.amount, loan.rate, loan.termYears);
    const extraPaymentAmount = Math.max(loan.extraPaymentAmount, 0);

    // Offset account is just an amount that reduces interest on the main loan
    // It doesn't have its own separate loan - it just offsets the main loan balance

    loanMonthlyPayments[loan.id] = {
      main: mainMonthlyPayment,
      extra: extraPaymentAmount,
      offset: 0, // Offset doesn't have separate payments
    };

    totalMonthlyPayment += mainMonthlyPayment + extraPaymentAmount;

    loanCalculations.push({
      id: loan.id,
      startDate: loan.startDate,
      monthlyPayment: mainMonthlyPayment,
      extraPaymentAmount,
      lumpSumPayments: loan.lumpSumPayments,
      offsetMonthlyPayment: 0, // No separate offset payments
      dailyRate: loan.rate / 100 / 365,
      offsetDailyRate: null, // Not used for offset account
      termYears: loan.termYears,
      offsetTermYears: 0, // Not used for offset account
      offsetAccount: loan.offsetAccount,
    });
  }

  // Calculate yearly payments grouped by calendar year
  const yearlyByCalendar = new Map<
    number,
    {
      principal: number;
      interest: number;
      loanPayments: { [loanId: string]: { principal: number; interest: number } };
    }
  >();
  const loanBalances: { [loanId: string]: number } = {};

  // Initialize balances
  for (const loan of loans) {
    loanBalances[loan.id] = loan.amount;
  }

  const earliestStartDate = loanCalculations.reduce((earliest, calc) => {
    return calc.startDate < earliest ? calc.startDate : earliest;
  }, loanCalculations[0].startDate);

  let maxSimulationMonths = 0;
  for (const calc of loanCalculations) {
    const monthsUntilStart =
      (calc.startDate.getFullYear() - earliestStartDate.getFullYear()) * 12 +
      (calc.startDate.getMonth() - earliestStartDate.getMonth());
    const loanDurationMonths = Math.ceil(calc.termYears * 12);
    maxSimulationMonths = Math.max(maxSimulationMonths, monthsUntilStart + loanDurationMonths);
  }

  let currentDate = new Date(earliestStartDate);

  for (let monthIndex = 0; monthIndex < maxSimulationMonths; monthIndex++) {
    const calendarYear = currentDate.getFullYear();
    let monthHasPayments = false;
    let monthPrincipal = 0;
    let monthInterest = 0;
    const monthLoanPayments: { [loanId: string]: { principal: number; interest: number } } = {};

    for (const calc of loanCalculations) {
      const loanBalance = loanBalances[calc.id] || 0;
      const paymentMonth = calculatePaymentMonthFromDate(currentDate, calc.startDate);
      const maxPaymentMonth = Math.ceil(calc.termYears * 12);

      if (loanBalance <= 0.01 || paymentMonth < 1 || paymentMonth > maxPaymentMonth) continue;

      monthHasPayments = true;
      const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);

      let loanInterest = 0;
      let loanPrincipal = 0;
      const offsetAmount = calc.offsetAccount ? calc.offsetAccount.offsetAmount : 0;
      const interestBearingBalance = Math.max(0, loanBalance - offsetAmount);

      loanInterest = interestBearingBalance * (Math.pow(1 + calc.dailyRate, daysInMonth) - 1);
      const regularPrincipal = Math.min(calc.monthlyPayment - loanInterest, loanBalance);
      loanPrincipal = Math.min(regularPrincipal + calc.extraPaymentAmount, loanBalance);

      let remainingBalance = loanBalance - loanPrincipal;

      const lumpSumsThisMonth = calc.lumpSumPayments.filter(
        (lumpSum) => lumpSum.month === paymentMonth
      );
      for (const lumpSum of lumpSumsThisMonth) {
        if (remainingBalance <= 0.01) break;
        const lumpSumPrincipal = Math.min(lumpSum.amount, remainingBalance);
        loanPrincipal += lumpSumPrincipal;
        remainingBalance -= lumpSumPrincipal;
      }

      monthLoanPayments[calc.id] = {
        principal: loanPrincipal,
        interest: loanInterest,
      };
      monthPrincipal += loanPrincipal;
      monthInterest += loanInterest;
      loanBalances[calc.id] = remainingBalance;
    }

    if (!monthHasPayments) break;

    const yearBucket = yearlyByCalendar.get(calendarYear) || {
      principal: 0,
      interest: 0,
      loanPayments: {},
    };
    yearBucket.principal += monthPrincipal;
    yearBucket.interest += monthInterest;

    for (const [loanId, payments] of Object.entries(monthLoanPayments)) {
      if (!yearBucket.loanPayments[loanId]) {
        yearBucket.loanPayments[loanId] = { principal: 0, interest: 0 };
      }
      yearBucket.loanPayments[loanId].principal += payments.principal;
      yearBucket.loanPayments[loanId].interest += payments.interest;
    }

    yearlyByCalendar.set(calendarYear, yearBucket);
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  const yearlyPayments: YearlyPayment[] = Array.from(yearlyByCalendar.entries())
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([calendarYear, totals]) => {
      const totalRemainingBalance = Object.values(loanBalances).reduce((sum, bal) => sum + bal, 0);

      return {
        year: calendarYear,
        principal: Math.round(totals.principal * 100) / 100,
        interest: Math.round(totals.interest * 100) / 100,
        total: Math.round((totals.principal + totals.interest) * 100) / 100,
        remainingBalance: Math.round(totalRemainingBalance * 100) / 100,
        loanPayments: Object.fromEntries(
          Object.entries(totals.loanPayments).map(([id, payments]) => [
            id,
            {
              principal: Math.round(payments.principal * 100) / 100,
              interest: Math.round(payments.interest * 100) / 100,
            },
          ])
        ),
      };
    });

  return { yearlyPayments, totalMonthlyPayment, loanMonthlyPayments };
}

