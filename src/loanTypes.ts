export type TermMode = 'years' | 'maturity';
export type ExtraPaymentMode = 'percent' | 'amount';

export interface LumpSumPaymentData {
  id: string;
  amount: string;
  paymentMonth: string;
}

export interface LoanData {
  id: string;
  amount: string;
  startDate: string;
  rate: string;
  termMode: TermMode;
  termYears: string;
  maturityDate: string;
  extraPaymentMode: ExtraPaymentMode;
  extraPaymentPercent: string;
  monthlyRepaymentAmount: string;
  lumpSumPayments: LumpSumPaymentData[];
  offsetAmount: string;
}

export interface LoanMonthlyPayments {
  main: number;
  extra: number;
  offset: number;
}
