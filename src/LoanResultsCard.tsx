import React from 'react';
import { LoanMonthlyPayments } from './loanTypes';
import './Loan.css';

interface LoanResultsCardProps {
  payments?: LoanMonthlyPayments | null;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const LoanResultsCard: React.FC<LoanResultsCardProps> = ({ payments }) => {
  const totalMonthlyPayment = payments ? payments.main + payments.extra + payments.offset : 0;

  return (
    <div className="loan-card loan-card--results">
      <h4 className="loan-results-title">Monthly Payments</h4>
      {payments ? (
        <div className="loan-results-content">
          <div className="loan-result-item">
            <span className="loan-result-label">Standard Payment</span>
            <span className="loan-result-value">${formatCurrency(payments.main)}</span>
          </div>
          {payments.extra > 0 && (
            <div className="loan-result-item">
              <span className="loan-result-label">Additional Repayment</span>
              <span className="loan-result-value">${formatCurrency(payments.extra)}</span>
            </div>
          )}
          {payments.offset > 0 && (
            <div className="loan-result-item">
              <span className="loan-result-label">Offset Payment</span>
              <span className="loan-result-value">${formatCurrency(payments.offset)}</span>
            </div>
          )}
          <div className="loan-result-item loan-result-item--total">
            <span className="loan-result-label">Total Monthly</span>
            <span className="loan-result-value">${formatCurrency(totalMonthlyPayment)}</span>
          </div>
        </div>
      ) : (
        <div className="loan-results-empty">
          <p>Enter loan details and click Calculate to see monthly payments.</p>
        </div>
      )}
    </div>
  );
};
