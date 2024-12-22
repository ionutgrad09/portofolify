"use client";

import React, { useEffect, useState } from "react";
import { UUID } from "crypto";
import { MapType } from "@/types/types";
import CompoundInterestView from "@/components/compound-interest/CompoundInterestView";
import { getFromLocalStorage, setToLocalStorage } from "@/util/localStorage";
import { Box } from "@mui/material";
import AddNewCompoundInterestView from "@/components/compound-interest/AddNewCompoundInterestView";

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
    MapType<UUID, CompoundInterest>
  >({});

  useEffect(() => {
    const uuid = crypto.randomUUID();
    const initialValue: MapType<UUID, CompoundInterest> = {};
    initialValue[uuid] = initialState;

    const compoundInterestCharts = getFromLocalStorage<
      MapType<UUID, CompoundInterest>
    >("compoundInterestCharts", initialValue);
    setCompoundInterestCharts(compoundInterestCharts);
  }, []);

  const handleUpdateCompoundInterest = (
    uuid: UUID,
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

  return (
    <Box className="flex flex-wrap gap-4 mt-4">
      {
        Object.entries(compoundInterestCharts).map(
          ([uuid, compoundInterest]) => (
            <CompoundInterestView
              key={uuid}
              uuid={uuid}
              compoundInterest={compoundInterest}
              updateCompoundInterest={handleUpdateCompoundInterest}
            />
          ),
        ) as React.ReactNode[]
      }
      <AddNewCompoundInterestView onAdd={handleAddNewCompoundInterest} />
    </Box>
  );
}
