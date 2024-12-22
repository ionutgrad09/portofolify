import React, { useState, useEffect, FC } from "react";
import { Box } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { CompoundInterest } from "@/app/compound-interest/page";
import { getLargeNumberWithCurrency } from "@/utils/numbers";

interface CompoundInterestChartProps {
  compoundInterest: CompoundInterest;
}

// type ChartData = {
//   data: number[];
//   label: string;
//   color: string;
//   valueFormatter: (value: number | string) => string;
// };

const valueFormatter = (value: number | string) => `$${value}`;

const CompoundInterestChart: FC<CompoundInterestChartProps> = ({
  compoundInterest,
}) => {
  const {
    initialContribution,
    expectedInterest,
    monthlyContribution,
    yearsToInvest,
  } = compoundInterest;

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const actualAmountData = [];
    const investedAmountData = [];

    let investedAmount = initialContribution;
    let actualAmount = initialContribution;

    for (let year = 1; year <= yearsToInvest; year++) {
      investedAmount = investedAmount + monthlyContribution * 12;
      actualAmount = monthlyContribution * 12 + actualAmount;

      if (year > 1) {
        actualAmount = actualAmount + actualAmount * (expectedInterest / 100.0);
      }

      investedAmountData.push(parseFloat(investedAmount.toFixed(2)));
      actualAmountData.push(parseFloat(actualAmount.toFixed(2)));
    }
    const dataToSet = [
      {
        data: actualAmountData,
        label: "Total sum",
        color: "green",
        valueFormatter,
      },
      {
        data: investedAmountData,
        label: "Invested sum",
        color: "lightblue",
        valueFormatter,
      },
    ];
    setChartData(dataToSet);
  }, [
    initialContribution,
    expectedInterest,
    monthlyContribution,
    yearsToInvest,
  ]);

  console.log("=== chartData ===", chartData);
  return (
    <Box sx={{ padding: 4 }}>
      <LineChart
        yAxis={[
          {
            valueFormatter: (value) => getLargeNumberWithCurrency(value),
          },
        ]}
        // xAxis={[
        //   {
        //     valueFormatter: () => {
        //       return "test"
        //     }
        //   },
        // ]}
        sx={{ padding: "20px" }}
        height={500}
        series={chartData}
        // dataset={chartData}
      />
    </Box>
  );
};

export default CompoundInterestChart;
