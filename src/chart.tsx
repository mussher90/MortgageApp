import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearlyPayment } from './utilities';

interface ChartProps {
  data: YearlyPayment[];
  loanIds?: string[];
}

const COLORS = [
  { principal: '#667eea', interest: '#764ba2' }, // Purple/Blue
  { principal: '#48bb78', interest: '#38a169' }, // Green
  { principal: '#ed8936', interest: '#dd6b20' }, // Orange
  { principal: '#4299e1', interest: '#3182ce' }, // Blue
  { principal: '#9f7aea', interest: '#805ad5' }, // Purple
];

export const Chart: React.FC<ChartProps> = ({ data, loanIds = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Enter loan details to see the payment breakdown chart
      </div>
    );
  }

  // Check if we have multiple loans with loanPayments
  const hasMultipleLoans = data.some(d => d.loanPayments && Object.keys(d.loanPayments).length > 0);
  
  // Check legacy offset loan data
  const hasOffsetLoan = data.some(d => (d.offsetLoanPrincipal && d.offsetLoanPrincipal > 0) || (d.offsetLoanInterest && d.offsetLoanInterest > 0));

  // Transform data for multiple loans - flatten loanPayments to top level
  const transformedData = hasMultipleLoans && loanIds.length > 0
    ? data.map(item => {
        const transformed: any = { ...item };
        loanIds.forEach(loanId => {
          if (item.loanPayments && item.loanPayments[loanId]) {
            transformed[`loan${loanId}Principal`] = item.loanPayments[loanId].principal;
            transformed[`loan${loanId}Interest`] = item.loanPayments[loanId].interest;
          }
        });
        return transformed;
      })
    : data;

  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
        data={transformedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="year" 
          label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          labelFormatter={(label) => `Year ${label}`}
        />
        <Legend />
        {hasMultipleLoans && loanIds.length > 0 ? (
          <>
            {/* Multiple loans: stack principal first, then interest */}
            {loanIds.map((loanId, index) => {
              const colorIndex = index % COLORS.length;
              const loanNumber = index + 1;
              return (
                <React.Fragment key={loanId}>
                  <Bar
                    dataKey={`loan${loanId}Principal`}
                    fill={COLORS[colorIndex].principal}
                    name={`Loan ${loanNumber} Principal`}
                    stackId="stack"
                  />
                </React.Fragment>
              );
            })}
            {loanIds.map((loanId, index) => {
              const colorIndex = index % COLORS.length;
              const loanNumber = index + 1;
              return (
                <React.Fragment key={`${loanId}-interest`}>
                  <Bar
                    dataKey={`loan${loanId}Interest`}
                    fill={COLORS[colorIndex].interest}
                    name={`Loan ${loanNumber} Interest`}
                    stackId="stack"
                  />
                </React.Fragment>
              );
            })}
          </>
        ) : hasOffsetLoan ? (
          <>
            {/* Legacy: Stacked bars in order: Main Principal (bottom), Offset Principal, Main Interest, Offset Interest (top) */}
            <Bar 
              dataKey="mainLoanPrincipal" 
              fill="#667eea" 
              name="Main Loan Principal"
              stackId="stack"
            />
            <Bar 
              dataKey="offsetLoanPrincipal" 
              fill="#48bb78" 
              name="Offset Loan Principal"
              stackId="stack"
            />
            <Bar 
              dataKey="mainLoanInterest" 
              fill="#764ba2" 
              name="Main Loan Interest"
              stackId="stack"
            />
            <Bar 
              dataKey="offsetLoanInterest" 
              fill="#38a169" 
              name="Offset Loan Interest"
              stackId="stack"
            />
          </>
        ) : (
          <>
            {/* Fallback to combined view */}
            <Bar dataKey="principal" fill="#667eea" name="Principal" stackId="stack" />
            <Bar dataKey="interest" fill="#764ba2" name="Interest" stackId="stack" />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

