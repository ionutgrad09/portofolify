"use client";

import React, { useEffect, useState } from "react";
import { MapType } from "@/types/types";
import CompoundInterestCard from "@/components/compound-interest/CompoundInterestCard";
import { getFromLocalStorage, setToLocalStorage } from "@/util/localStorage";
import { Box, Button } from "@mui/material";

export type CompoundInterest = {
  initialContribution: number;
  monthlyContribution: number;
  yearsToInvest: number;
  expectedInterest: number;
};

const initialState: CompoundInterest = {
  initialContribution: 0,
  monthlyContribution: 0,
  yearsToInvest: 0,
  expectedInterest: 0,
};

export default function CompoundInterestCalculator() {
  const [compoundInterestCharts, setCompoundInterestCharts] = useState<
    MapType<string, CompoundInterest>
  >({});

  useEffect(() => {
    const uuid = crypto.randomUUID();
    const initialValue: MapType<string, CompoundInterest> = {};
    initialValue[uuid] = initialState;

    const compoundInterestCharts = getFromLocalStorage<
      MapType<string, CompoundInterest>
    >("compoundInterestCharts", initialValue);
    setCompoundInterestCharts(compoundInterestCharts);
  }, []);

  const handleUpdateCompoundInterest = (
    uuid: string,
    compoundInterest: CompoundInterest,
  ) => {
    const newCompoundInterestCharts = {
      ...compoundInterestCharts,
      [uuid]: compoundInterest,
    };

    // Save to local storage
    setToLocalStorage("compoundInterestCharts", newCompoundInterestCharts);

    // Update state
    setCompoundInterestCharts(newCompoundInterestCharts);
  };

  const handleAddNewCompoundInterest = () => {
    const uuid = crypto.randomUUID();
    const newCompoundInterestCharts = {
      ...compoundInterestCharts,
      [uuid]: initialState,
    };

    // Save to local storage
    setToLocalStorage("compoundInterestCharts", newCompoundInterestCharts);

    // Update state
    setCompoundInterestCharts(newCompoundInterestCharts);
  };

  const handleDelete = (uuid: string) => {
    const newCompoundInterestCharts = { ...compoundInterestCharts };
    delete newCompoundInterestCharts[uuid];

    // Save to local storage
    setToLocalStorage("compoundInterestCharts", newCompoundInterestCharts);

    // Update state
    setCompoundInterestCharts(newCompoundInterestCharts);
  };

  const handleDuplicate = (uuid: string) => {
    const newCompoundInterestCharts = {
      ...compoundInterestCharts,
      [crypto.randomUUID()]: compoundInterestCharts[uuid],
    };

    // Save to local storage
    setToLocalStorage("compoundInterestCharts", newCompoundInterestCharts);

    // Update state
    setCompoundInterestCharts(newCompoundInterestCharts);
  };

  return (
    <Box className="pl-[5%] pr-[5%] mt-4 flex flex-col">
      <Box className="h-[50px] w-full flex justify-end mb-[20px]">
        <Button variant="outlined" onClick={handleAddNewCompoundInterest}>
          Add New Card
        </Button>
      </Box>
      <Box className=" flex flex-wrap gap-4 mt-4">
        {
          Object.entries(compoundInterestCharts).map(
            ([uuid, compoundInterest]) => (
              <CompoundInterestCard
                key={uuid}
                uuid={uuid}
                handleDuplicate={handleDuplicate}
                handleDelete={handleDelete}
                compoundInterest={compoundInterest}
                updateCompoundInterest={handleUpdateCompoundInterest}
              />
            ),
          ) as React.ReactNode[]
        }
      </Box>
    </Box>
  );
}
