import React from 'react';
import './Loan.css';

export interface LoanData {
  id: string;
  amount: string;
  rate: string;
  termYears: string;
  extraPaymentPercent: string;
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

        <div className="form-section-divider">
          <h4>Optional: Accelerate Your Payoff</h4>
        </div>

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

