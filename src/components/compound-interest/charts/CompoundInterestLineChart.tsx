import React, { FC } from "react";
import { Box } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { getLargeNumberWithCurrency } from "@/util/numbers";

interface CompoundInterestChartProps {
  dataSet: number[];
  series: any[];
}

const CompoundInterestLineChart: FC<CompoundInterestChartProps> = ({
  dataSet,
  series,
}) => {
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
            data: dataSet,
            label: "Year",
            tickInterval: dataSet,
          },
        ]}
        height={400}
        series={series}
      />
    </Box>
  );
};

export default CompoundInterestLineChart;
