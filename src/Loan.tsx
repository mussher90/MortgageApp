import React from 'react';
import { LoanInputCard } from './LoanInputCard';
import { LoanResultsCard } from './LoanResultsCard';
import { LoanData, LoanMonthlyPayments } from './loanTypes';
import './Loan.css';

export type { ExtraPaymentMode, LoanData, LoanMonthlyPayments, TermMode } from './loanTypes';

interface LoanProps {
  loanNumber: number;
  loan: LoanData;
  payments?: LoanMonthlyPayments | null;
  onUpdate: (loan: LoanData) => void;
  onRemove?: () => void;
  canRemove: boolean;
}

export const Loan: React.FC<LoanProps> = ({
  loanNumber,
  loan,
  payments,
  onUpdate,
  onRemove,
  canRemove,
}) => {
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

      <div className="loan-body">
        <LoanInputCard loan={loan} onUpdate={onUpdate} />
        <LoanResultsCard payments={payments} />
      </div>
    </div>
  );
};
