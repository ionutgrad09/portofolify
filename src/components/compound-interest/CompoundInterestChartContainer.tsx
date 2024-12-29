import React, { useState, useEffect, FC } from "react";
import { Box } from "@mui/material";
import { CompoundInterest } from "@/app/compound-interest/page";
import CompoundInterestLineChart from "@/components/compound-interest/charts/CompoundInterestLineChart";
import { calculateCompoundInterest } from "@/util/compound-interest";
import CompoundInterestBarChart from "@/components/compound-interest/charts/CompoundInterestBarChart";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import BarChartIcon from "@mui/icons-material/BarChart";
import SsidChartIcon from "@mui/icons-material/SsidChart";
import LegendToggleIcon from "@mui/icons-material/LegendToggle";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";
import { ChartType } from "@/types/types";

interface CompoundInterestChartProps {
  compoundInterest: CompoundInterest;
  handleChartTypeChange: (uuid: string, chartType: ChartType) => void;
  uuid: string;
}

const valueFormatter = (value: number | string) => `$${value}`;

const CompoundInterestChartContainer: FC<CompoundInterestChartProps> = ({
  compoundInterest,
  handleChartTypeChange,
  uuid,
}) => {
  const {
    chartType,
    initialContribution,
    expectedInterest,
    monthlyContribution,
    yearsToInvest,
  } = compoundInterest;

  const [series, setSeries] = useState<any[]>([]);
  const [dataset, setDataSet] = useState<any[]>([]);

  useEffect(() => {
    const { investedAmountData, actualAmountData } = calculateCompoundInterest(
      initialContribution,
      yearsToInvest,
      monthlyContribution,
      expectedInterest,
    );

    const computedSeries = [
      {
        data: actualAmountData,
        label: "Future value",
        color: "red",
        valueFormatter,
        area: chartType === ChartType.LINE_AREA,
        showMark: chartType !== ChartType.LINE_AREA,
        stack:
          chartType === ChartType.STACKED_BAR ||
          chartType === ChartType.LINE_AREA
            ? "compoundValue"
            : undefined,
        stackOrder: "ascending",
      },
      {
        data: investedAmountData,
        label: "Your contribution",
        color: "#1976d2",
        valueFormatter,
        area: chartType === ChartType.LINE_AREA,
        showMark: chartType !== ChartType.LINE_AREA,
        stack:
          chartType === ChartType.STACKED_BAR ||
          chartType === ChartType.LINE_AREA
            ? "compoundValue"
            : undefined,
        stackOrder: "ascending",
      },
    ];

    setSeries(computedSeries);
    setDataSet(Array.from({ length: yearsToInvest }, (_, i) => i + 1));
  }, [
    initialContribution,
    expectedInterest,
    monthlyContribution,
    yearsToInvest,
    chartType,
  ]);

  const handleChartTypeSelect = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: ChartType,
  ) => {
    console.log("=== uuid ===", uuid);
    console.log("=== newChartType ===", newChartType);
    handleChartTypeChange(uuid, newChartType);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={handleChartTypeSelect}
        aria-label="text alignment"
      >
        <ToggleButton value={ChartType.LINE}>
          <SsidChartIcon />
        </ToggleButton>
        <ToggleButton value={ChartType.LINE_AREA}>
          <LegendToggleIcon />
        </ToggleButton>
        <ToggleButton value={ChartType.BAR}>
          <BarChartIcon />
        </ToggleButton>
        <ToggleButton value={ChartType.STACKED_BAR}>
          <StackedBarChartIcon />
        </ToggleButton>
      </ToggleButtonGroup>
      {chartType === ChartType.LINE_AREA || chartType === ChartType.LINE ? (
        <CompoundInterestLineChart dataSet={dataset} series={series} />
      ) : (
        <CompoundInterestBarChart dataSet={dataset} series={series} />
      )}
    </Box>
  );
};

export default CompoundInterestChartContainer;
