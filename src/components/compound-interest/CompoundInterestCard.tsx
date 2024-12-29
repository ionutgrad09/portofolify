import React, { FC } from "react";
import { Box } from "@mui/material";
import CompoundInterestChartContainer from "@/components/compound-interest/CompoundInterestChartContainer";
import { CompoundInterest } from "@/app/compound-interest/page";
import CompoundInterestCardForm from "@/components/compound-interest/CompoundInterestCardForm";
import SimpleMenu from "@/components/menu/SimpleMenu";
import { ChartType } from "@/types/types";

const DELETE = "Delete";
const DUPLICATE = "Duplicate";
const COMPARE = "Compare";

interface CompoundInterestProps {
  uuid: string;
  compoundInterest: CompoundInterest;
  updateCompoundInterest: (
    uuid: string,
    compoundInterest: CompoundInterest,
  ) => void;
  handleDelete: (uuid: string) => void;
  handleDuplicate: (uuid: string) => void;
  handleChartTypeChange: (uuid: string, chartType: ChartType) => void;
}

const CompoundInterestCard: FC<CompoundInterestProps> = ({
  uuid,
  compoundInterest,
  updateCompoundInterest,
  handleDelete,
  handleDuplicate,
  handleChartTypeChange,
}) => {
  const onClick = (option: string) => {
    if (option === DELETE) {
      handleDelete(uuid);
    } else if (option === DUPLICATE) {
      handleDuplicate(uuid);
    }
  };
  console.log("=== uuid ===", uuid);

  return (
    <Box className="rounded relative p-8 mx-auto flex gap-10 bg-gray-100 w-full shadow-lg custom-shadow-top">
      <SimpleMenu
        className="absolute top-[10px] right-[10px]"
        options={[DUPLICATE, COMPARE, DELETE]}
        onClick={onClick}
      />
      <CompoundInterestCardForm
        uuid={uuid}
        compoundInterest={compoundInterest}
        updateCompoundInterest={updateCompoundInterest}
      />
      <CompoundInterestChartContainer
        uuid={uuid}
        handleChartTypeChange={handleChartTypeChange}
        compoundInterest={compoundInterest}
      />
    </Box>
  );
};

export default CompoundInterestCard;
