import React from 'react';
import {
  calculateExtraPaymentPercentFromMonthlyRepayment,
  calculateMaturityDateFromTermYears,
  calculateMaxPaymentMonth,
  calculateMonthlyPayment,
  calculateMonthlyRepaymentFromPercent,
  calculateTermYearsFromMaturityDate,
  getMinPaymentMonth,
  parseLoanStartDate,
} from './utilities';
import { ExtraPaymentMode, LoanData, LumpSumPaymentData, TermMode } from './loanTypes';
import './Loan.css';

interface LoanInputCardProps {
  loan: LoanData;
  onUpdate: (loan: LoanData) => void;
}

export const LoanInputCard: React.FC<LoanInputCardProps> = ({ loan, onUpdate }) => {
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
        (termYears > 0
          ? calculateMaturityDateFromTermYears(termYears, parseLoanStartDate(loan.startDate))
          : '');
      onUpdate({ ...loan, termMode: mode, maturityDate });
      return;
    }

    const termYears = loan.maturityDate
      ? String(
          Math.round(
            calculateTermYearsFromMaturityDate(
              loan.maturityDate,
              parseLoanStartDate(loan.startDate)
            ) * 10
          ) / 10
        )
      : loan.termYears;
    onUpdate({ ...loan, termMode: mode, termYears });
  };

  const getStandardMonthlyPayment = () => {
    const amount = parseFloat(loan.amount);
    const rate = parseFloat(loan.rate);
    const term =
      loan.termMode === 'maturity'
        ? calculateTermYearsFromMaturityDate(loan.maturityDate, parseLoanStartDate(loan.startDate))
        : parseFloat(loan.termYears);

    if (amount > 0 && rate >= 0 && term > 0) {
      return calculateMonthlyPayment(amount, rate, term);
    }
    return 0;
  };

  const standardMonthlyPayment = getStandardMonthlyPayment();
  const loanStartDate = parseLoanStartDate(loan.startDate);
  const loanTermYears =
    loan.termMode === 'maturity'
      ? calculateTermYearsFromMaturityDate(loan.maturityDate, loanStartDate)
      : parseFloat(loan.termYears) || 0;
  const minPaymentMonth = getMinPaymentMonth(loanStartDate);
  const maxPaymentMonth =
    loanTermYears > 0 ? calculateMaxPaymentMonth(loanTermYears, loanStartDate) : undefined;

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

  const handleLumpSumChange = (
    lumpSumId: string,
    field: keyof Omit<LumpSumPaymentData, 'id'>,
    value: string
  ) => {
    onUpdate({
      ...loan,
      lumpSumPayments: loan.lumpSumPayments.map((lumpSum) =>
        lumpSum.id === lumpSumId ? { ...lumpSum, [field]: value } : lumpSum
      ),
    });
  };

  const handleAddLumpSum = () => {
    onUpdate({
      ...loan,
      lumpSumPayments: [
        ...loan.lumpSumPayments,
        {
          id: `${loan.id}-lump-${Date.now()}`,
          amount: '',
          paymentMonth: '',
        },
      ],
    });
  };

  const handleRemoveLumpSum = (lumpSumId: string) => {
    onUpdate({
      ...loan,
      lumpSumPayments: loan.lumpSumPayments.filter((lumpSum) => lumpSum.id !== lumpSumId),
    });
  };

  return (
    <div className="loan-card loan-card--input">
      <div className="loan-form">
        <div className="loan-form-row loan-form-row--paired">
          <div className="form-group">
            <label htmlFor={`loanAmount-${loan.id}`}>Loan Amount ($)</label>
            <input
              id={`loanAmount-${loan.id}`}
              type="number"
              min="0"
              step="1"
              value={loan.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="500000"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor={`startDate-${loan.id}`}>Loan Start Date</label>
            <input
              id={`startDate-${loan.id}`}
              type="date"
              value={loan.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor={`interestRate-${loan.id}`}>Interest Rate (%)</label>
          <input
            id={`interestRate-${loan.id}`}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={loan.rate}
            onChange={(e) => handleChange('rate', e.target.value)}
            placeholder="4.5"
            required
          />
        </div>

        <div className="loan-form-row loan-form-row--paired">
          <div className="form-group form-group--toggle">
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
              <label htmlFor={`termYears-${loan.id}`}>Term (Years)</label>
              <input
                id={`termYears-${loan.id}`}
                type="number"
                min="1"
                max="50"
                step="1"
                value={loan.termYears}
                onChange={(e) => handleChange('termYears', e.target.value)}
                placeholder="30"
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
                min={loan.startDate || undefined}
                required
              />
            </div>
          )}
        </div>

        <div className="form-section-divider">
          <h4>Optional: Accelerate Your Payoff</h4>
        </div>

        <div className="loan-form-row loan-form-row--paired">
          <div className="form-group form-group--toggle">
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
              <label htmlFor={`extraPaymentPercent-${loan.id}`}>Extra Payment (%)</label>
              <input
                id={`extraPaymentPercent-${loan.id}`}
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={loan.extraPaymentPercent}
                onChange={(e) => handleChange('extraPaymentPercent', e.target.value)}
                placeholder="10"
              />
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
                placeholder="3500"
              />
            </div>
          )}
        </div>

        <div className="lump-sum-section">
          {loan.lumpSumPayments.map((lumpSum) => (
            <div key={lumpSum.id} className="lump-sum-entry">
              <div className="loan-form-row loan-form-row--paired">
                <div className="form-group">
                  <label htmlFor={`lumpSumAmount-${lumpSum.id}`}>Lump Sum Amount ($)</label>
                  <input
                    id={`lumpSumAmount-${lumpSum.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={lumpSum.amount}
                    onChange={(e) => handleLumpSumChange(lumpSum.id, 'amount', e.target.value)}
                    placeholder="10000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`lumpSumMonth-${lumpSum.id}`}>Payment Month</label>
                  <input
                    id={`lumpSumMonth-${lumpSum.id}`}
                    type="month"
                    value={lumpSum.paymentMonth}
                    onChange={(e) => handleLumpSumChange(lumpSum.id, 'paymentMonth', e.target.value)}
                    min={minPaymentMonth}
                    max={maxPaymentMonth}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-remove-lump-sum"
                onClick={() => handleRemoveLumpSum(lumpSum.id)}
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" className="btn-add-lump-sum" onClick={handleAddLumpSum}>
            + Add Lump Sum Payment
          </button>
        </div>

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
            placeholder="50000"
          />
          <small className="form-help-text">
            Amount in offset account that reduces interest on this loan
          </small>
        </div>
      </div>
    </div>
  );
};
