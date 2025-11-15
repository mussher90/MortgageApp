import React, { useState } from 'react';
import { Chart } from './chart';
import { Loan, LoanData } from './Loan';
import { calculateMultipleLoans, LoanInput, OffsetAccount } from './utilities';
import './App.css';

function App() {
  const [loans, setLoans] = useState<LoanData[]>([
    {
      id: '1',
      amount: '',
      rate: '',
      termYears: '',
      extraPaymentPercent: '0',
      offsetAmount: '',
    },
  ]);
  const [results, setResults] = useState<{
    yearlyPayments: any[];
    totalMonthlyPayment: number;
    loanMonthlyPayments: { [loanId: string]: { main: number; extra: number; offset: number } };
  } | null>(null);

  const handleLoanUpdate = (index: number, updatedLoan: LoanData) => {
    const newLoans = [...loans];
    newLoans[index] = updatedLoan;
    setLoans(newLoans);
  };

  const handleAddLoan = () => {
    const newLoanId = String(loans.length + 1);
    setLoans([
      ...loans,
      {
        id: newLoanId,
        amount: '',
        rate: '',
        termYears: '',
        extraPaymentPercent: '0',
        offsetAmount: '',
      },
    ]);
  };

  const handleRemoveLoan = (index: number) => {
    if (loans.length > 1) {
      const newLoans = loans.filter((_, i) => i !== index);
      setLoans(newLoans);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    const loanInputs: LoanInput[] = loans
      .map((loan) => {
        const amount = parseFloat(loan.amount);
        const rate = parseFloat(loan.rate);
        const term = parseFloat(loan.termYears);
        const extraPercent = Math.min(Math.max(parseFloat(loan.extraPaymentPercent) || 0, 0), 20);

        if (amount > 0 && rate >= 0 && term > 0) {
          const offsetAmount = Math.max(parseFloat(loan.offsetAmount) || 0, 0);
          
          // Offset account is just an amount that offsets the main loan
          // It uses the same rate and term as the main loan
          const offsetAccount: OffsetAccount | null = offsetAmount > 0 ? {
            amount: offsetAmount,
            termYears: term,
            rate: rate,
            offsetAmount: offsetAmount,
          } : null;

          return {
            id: loan.id,
            amount,
            rate,
            termYears: term,
            extraPaymentPercent: extraPercent,
            offsetAccount,
          };
        }
        return null;
      })
      .filter((loan): loan is LoanInput => loan !== null);

    if (loanInputs.length > 0) {
      const calculationResults = calculateMultipleLoans(loanInputs);
      setResults(calculationResults);
    } else {
      alert('Please enter valid values for at least one loan');
    }
  };

  const handleReset = () => {
    setLoans([
      {
        id: '1',
        amount: '',
        rate: '',
        termYears: '',
        extraPaymentPercent: '0',
        offsetAmount: '',
      },
    ]);
    setResults(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mortgage Repayment Calculator</h1>
        <p>Calculate your mortgage repayments over the life of your loan</p>
      </header>

      <main className="app-main">
        <section className="input-section">
          <form onSubmit={handleCalculate} className="mortgage-form">
            {loans.map((loan, index) => (
              <Loan
                key={loan.id}
                loanNumber={index + 1}
                loan={loan}
                onUpdate={(updatedLoan) => handleLoanUpdate(index, updatedLoan)}
                onRemove={loans.length > 1 ? () => handleRemoveLoan(index) : undefined}
                canRemove={loans.length > 1}
              />
            ))}

            <div className="form-actions-loans">
              <button type="button" onClick={handleAddLoan} className="btn btn-add-loan">
                + Add Another Loan
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Calculate
              </button>
              <button type="button" onClick={handleReset} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </section>

        {results && (
          <section className="results-section">
            <h2>Yearly Payment Breakdown</h2>

            {results.totalMonthlyPayment > 0 && (
              <div className="monthly-payment-display">
                {Object.entries(results.loanMonthlyPayments).map(([loanId, payments], index) => {
                  const loanNumber = loans.findIndex(l => l.id === loanId) + 1;
                  return (
                    <React.Fragment key={loanId}>
                      <div className="monthly-payment-item">
                        <span className="monthly-payment-label">Loan {loanNumber} Monthly Payment:</span>
                        <span className="monthly-payment-value">
                          ${payments.main.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {payments.extra > 0 && (
                        <div className="monthly-payment-item">
                          <span className="monthly-payment-label">Loan {loanNumber} Additional Repayment:</span>
                          <span className="monthly-payment-value">
                            ${payments.extra.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
                <div className="monthly-payment-item highlight">
                  <span className="monthly-payment-label">Total Monthly Payment:</span>
                  <span className="monthly-payment-value">
                    ${results.totalMonthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <Chart data={results.yearlyPayments} loanIds={loans.map(l => l.id)} />

            <div className="summary">
              <h3>Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Principal:</span>
                  <span className="summary-value">
                    ${results.yearlyPayments.reduce((sum, p) => sum + p.principal, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Interest:</span>
                  <span className="summary-value">
                    ${results.yearlyPayments.reduce((sum, p) => sum + p.interest, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Payments:</span>
                  <span className="summary-value">
                    ${results.yearlyPayments.reduce((sum, p) => sum + p.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
