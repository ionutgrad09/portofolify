import React, { useState, useEffect, FC } from "react";
import { Box } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { CompoundInterest } from "@/app/compound-interest/page";
import { getLargeNumberWithCurrency } from "@/util/numbers";

interface CompoundInterestChartProps {
  compoundInterest: CompoundInterest;
}

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

  const [series, setSeries] = useState<any[]>([]);
  const [dataset, setDataSet] = useState<any[]>([]);

  useEffect(() => {
    const actualAmountData = [];
    const investedAmountData = [];
    const dataSet = [];

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
    const computedSeries = [
      {
        data: actualAmountData,
        label: "Total sum",
        color: "red",
        valueFormatter,
      },
      {
        data: investedAmountData,
        label: "Invested sum",
        color: "#1976d2",
        valueFormatter,
      },
    ];

    setSeries(computedSeries);
    setDataSet(Array.from({ length: yearsToInvest }, (_, i) => i + 1));
  }, [
    initialContribution,
    expectedInterest,
    monthlyContribution,
    yearsToInvest,
  ]);

  return (
    <Box sx={{ width: "100%" }}>
      <LineChart
        yAxis={[
          {
            valueFormatter: (value) => getLargeNumberWithCurrency(value),
          },
        ]}
        xAxis={[
          {
            data: dataset,
            label: "Year",
            tickInterval: dataset,
          },
        ]}
        height={400}
        series={series}
      />
    </Box>
  );
};

export default CompoundInterestChart;
