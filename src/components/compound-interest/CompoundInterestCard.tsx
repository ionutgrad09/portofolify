import React, { FC } from "react";
import { Box } from "@mui/material";
import CompoundInterestChart from "@/components/compound-interest/charts/CompoundInterestChart";
import { CompoundInterest } from "@/app/compound-interest/page";
import CompoundInterestCardForm from "@/components/compound-interest/CompoundInterestCardForm";
import SimpleMenu from "@/components/menu/SimpleMenu";

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
}

const CompoundInterestCard: FC<CompoundInterestProps> = ({
  uuid,
  compoundInterest,
  updateCompoundInterest,
  handleDelete,
  handleDuplicate,
}) => {
  const onClick = (option: string) => {
    if (option === DELETE) {
      handleDelete(uuid);
    } else if (option === DUPLICATE) {
      handleDuplicate(uuid);
    }
  };

  return (
    <Box className="rounded relative p-8 mx-auto flex gap-10 bg-gray-200 w-full">
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
      <CompoundInterestChart compoundInterest={compoundInterest} />
    </Box>
  );
};

export default CompoundInterestCard;
