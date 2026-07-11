import React from 'react';
import {
  calculateExtraPaymentPercentFromMonthlyRepayment,
  calculateMaturityDateFromTermYears,
  calculateMonthlyPayment,
  calculateMonthlyRepaymentFromPercent,
  calculateTermYearsFromMaturityDate,
} from './utilities';
import './Loan.css';

export type TermMode = 'years' | 'maturity';
export type ExtraPaymentMode = 'percent' | 'amount';

export interface LoanData {
  id: string;
  amount: string;
  rate: string;
  termMode: TermMode;
  termYears: string;
  maturityDate: string;
  extraPaymentMode: ExtraPaymentMode;
  extraPaymentPercent: string;
  monthlyRepaymentAmount: string;
  offsetAmount: string;
}

interface LoanProps {
  loanNumber: number;
  loan: LoanData;
  onUpdate: (loan: LoanData) => void;
  onRemove?: () => void;
  canRemove: boolean;
}

export const Loan: React.FC<LoanProps> = ({ loanNumber, loan, onUpdate, onRemove, canRemove }) => {
  const handleChange = (field: keyof LoanData, value: string) => {
    onUpdate({ ...loan, [field]: value });
  };

  const handleTermModeChange = (mode: TermMode) => {
    if (mode === loan.termMode) {
      return;
    }

    if (mode === 'maturity') {
      const termYears = parseFloat(loan.termYears);
      const maturityDate =
        loan.maturityDate ||
        (termYears > 0 ? calculateMaturityDateFromTermYears(termYears) : '');
      onUpdate({ ...loan, termMode: mode, maturityDate });
      return;
    }

    const termYears = loan.maturityDate
      ? String(
          Math.round(calculateTermYearsFromMaturityDate(loan.maturityDate) * 10) / 10
        )
      : loan.termYears;
    onUpdate({ ...loan, termMode: mode, termYears });
  };

  const calculatedTermYears =
    loan.termMode === 'maturity' && loan.maturityDate
      ? calculateTermYearsFromMaturityDate(loan.maturityDate)
      : 0;

  const getStandardMonthlyPayment = () => {
    const amount = parseFloat(loan.amount);
    const rate = parseFloat(loan.rate);
    const term =
      loan.termMode === 'maturity'
        ? calculateTermYearsFromMaturityDate(loan.maturityDate)
        : parseFloat(loan.termYears);

    if (amount > 0 && rate >= 0 && term > 0) {
      return calculateMonthlyPayment(amount, rate, term);
    }
    return 0;
  };

  const standardMonthlyPayment = getStandardMonthlyPayment();

  const handleExtraPaymentModeChange = (mode: ExtraPaymentMode) => {
    if (mode === loan.extraPaymentMode) {
      return;
    }

    if (mode === 'amount') {
      const percent = parseFloat(loan.extraPaymentPercent) || 0;
      const monthlyRepaymentAmount =
        loan.monthlyRepaymentAmount ||
        (standardMonthlyPayment > 0
          ? String(
              Math.round(calculateMonthlyRepaymentFromPercent(standardMonthlyPayment, percent) * 100) /
                100
            )
          : '');
      onUpdate({ ...loan, extraPaymentMode: mode, monthlyRepaymentAmount });
      return;
    }

    const percent =
      standardMonthlyPayment > 0 && loan.monthlyRepaymentAmount
        ? String(
            Math.round(
              calculateExtraPaymentPercentFromMonthlyRepayment(
                standardMonthlyPayment,
                parseFloat(loan.monthlyRepaymentAmount)
              ) * 10
            ) / 10
          )
        : loan.extraPaymentPercent;
    onUpdate({ ...loan, extraPaymentMode: mode, extraPaymentPercent: percent });
  };

  const calculatedExtraPayment =
    loan.extraPaymentMode === 'amount' && standardMonthlyPayment > 0 && loan.monthlyRepaymentAmount
      ? Math.max(parseFloat(loan.monthlyRepaymentAmount) - standardMonthlyPayment, 0)
      : 0;

  const calculatedTotalRepayment =
    loan.extraPaymentMode === 'percent' && standardMonthlyPayment > 0
      ? calculateMonthlyRepaymentFromPercent(
          standardMonthlyPayment,
          parseFloat(loan.extraPaymentPercent) || 0
        )
      : 0;

  return (
    <div className="loan-component">
      <div className="loan-header">
        <h3>Loan {loanNumber}</h3>
        {canRemove && onRemove && (
          <button type="button" onClick={onRemove} className="btn-remove-loan">
            Remove
          </button>
        )}
      </div>

      <div className="loan-form">
        <div className="form-group">
          <label htmlFor={`loanAmount-${loan.id}`}>Loan Amount ($)</label>
          <input
            id={`loanAmount-${loan.id}`}
            type="number"
            min="0"
            step="1"
            value={loan.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="e.g., 500000"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor={`interestRate-${loan.id}`}>Annual Interest Rate (%)</label>
          <input
            id={`interestRate-${loan.id}`}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={loan.rate}
            onChange={(e) => handleChange('rate', e.target.value)}
            placeholder="e.g., 4.5"
            required
          />
        </div>

        <div className="form-group">
          <label>Loan Duration</label>
          <div className="term-mode-toggle" role="group" aria-label="Loan duration input mode">
            <button
              type="button"
              className={`term-mode-btn ${loan.termMode === 'years' ? 'active' : ''}`}
              onClick={() => handleTermModeChange('years')}
            >
              Loan Term
            </button>
            <button
              type="button"
              className={`term-mode-btn ${loan.termMode === 'maturity' ? 'active' : ''}`}
              onClick={() => handleTermModeChange('maturity')}
            >
              Maturity Date
            </button>
          </div>
        </div>

        {loan.termMode === 'years' ? (
          <div className="form-group">
            <label htmlFor={`termYears-${loan.id}`}>Loan Term (Years)</label>
            <input
              id={`termYears-${loan.id}`}
              type="number"
              min="1"
              max="50"
              step="1"
              value={loan.termYears}
              onChange={(e) => handleChange('termYears', e.target.value)}
              placeholder="e.g., 30"
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor={`maturityDate-${loan.id}`}>Maturity Date</label>
            <input
              id={`maturityDate-${loan.id}`}
              type="date"
              value={loan.maturityDate}
              onChange={(e) => handleChange('maturityDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {calculatedTermYears > 0 && (
              <small className="form-help-text">
                Calculated loan term: {calculatedTermYears.toFixed(1)} years
              </small>
            )}
          </div>
        )}

        <div className="form-section-divider">
          <h4>Optional: Accelerate Your Payoff</h4>
        </div>

        <div className="form-group">
          <label>Additional Repayment</label>
          <div className="term-mode-toggle" role="group" aria-label="Additional repayment input mode">
            <button
              type="button"
              className={`term-mode-btn ${loan.extraPaymentMode === 'percent' ? 'active' : ''}`}
              onClick={() => handleExtraPaymentModeChange('percent')}
            >
              Extra %
            </button>
            <button
              type="button"
              className={`term-mode-btn ${loan.extraPaymentMode === 'amount' ? 'active' : ''}`}
              onClick={() => handleExtraPaymentModeChange('amount')}
            >
              Monthly Repayment
            </button>
          </div>
        </div>

        {loan.extraPaymentMode === 'percent' ? (
          <div className="form-group">
            <label htmlFor={`extraPaymentPercent-${loan.id}`}>
              Extra Payment (% of monthly payment, max 20%)
            </label>
            <input
              id={`extraPaymentPercent-${loan.id}`}
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={loan.extraPaymentPercent}
              onChange={(e) => handleChange('extraPaymentPercent', e.target.value)}
              placeholder="e.g., 10"
            />
            <small className="form-help-text">
              Extra amount paid directly to principal each month
            </small>
            {calculatedTotalRepayment > standardMonthlyPayment && (
              <small className="form-help-text">
                Total monthly repayment: $
                {calculatedTotalRepayment.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </small>
            )}
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor={`monthlyRepaymentAmount-${loan.id}`}>Monthly Repayment ($)</label>
            <input
              id={`monthlyRepaymentAmount-${loan.id}`}
              type="number"
              min="0"
              step="0.01"
              value={loan.monthlyRepaymentAmount}
              onChange={(e) => handleChange('monthlyRepaymentAmount', e.target.value)}
              placeholder="e.g., 3500"
            />
            <small className="form-help-text">
              Total amount you want to pay each month, including the standard repayment
            </small>
            {standardMonthlyPayment > 0 && (
              <small className="form-help-text">
                Standard monthly payment: $
                {standardMonthlyPayment.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </small>
            )}
            {calculatedExtraPayment > 0 && (
              <small className="form-help-text">
                Additional repayment: $
                {calculatedExtraPayment.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </small>
            )}
          </div>
        )}

        <div className="form-section-divider">
          <h4>Optional: Offset Account</h4>
        </div>

        <div className="form-group">
          <label htmlFor={`offsetAmount-${loan.id}`}>Offset Amount ($)</label>
          <input
            id={`offsetAmount-${loan.id}`}
            type="number"
            min="0"
            step="1"
            value={loan.offsetAmount}
            onChange={(e) => handleChange('offsetAmount', e.target.value)}
            placeholder="e.g., 50000"
          />
          <small className="form-help-text">
            Amount in offset account that reduces interest on this loan
          </small>
        </div>
      </div>
    </div>
  );
};

