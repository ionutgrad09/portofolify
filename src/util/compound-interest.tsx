type CompoundInterestResult = {
  investedAmountData: number[];
  actualAmountData: number[];
};

const calculateCompoundInterest = (
  initialContribution: number,
  yearsToInvest: number,
  monthlyContribution: number,
  expectedInterest: number,
): CompoundInterestResult => {
  const actualAmountData: number[] = [];
  const investedAmountData: number[] = [];

  let investedAmount = initialContribution;
  let actualAmount = initialContribution;

  for (let year = 1; year <= yearsToInvest; year++) {
    if (year > 1) {
      investedAmount = investedAmount + monthlyContribution * 12;
      actualAmount = monthlyContribution * 12 + actualAmount;
      actualAmount = actualAmount + actualAmount * (expectedInterest / 100.0);
    }

    actualAmountData.push(parseFloat(actualAmount.toFixed(2)));
    investedAmountData.push(parseFloat(investedAmount.toFixed(2)));
  }

  return {
    investedAmountData,
    actualAmountData,
  };
};

export { calculateCompoundInterest };
