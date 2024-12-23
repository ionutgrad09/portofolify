import React, { FC } from "react";
import { TextField, Box } from "@mui/material";
import { CompoundInterest } from "@/app/compound-interest/page";

interface CompoundInterestProps {
  uuid: string;
  compoundInterest: CompoundInterest;
  updateCompoundInterest: (
    uuid: string,
    compoundInterest: CompoundInterest,
  ) => void;
}

const CompoundInterestCardForm: FC<CompoundInterestProps> = ({
  uuid,
  compoundInterest,
  updateCompoundInterest,
}) => {
  return (
    <Box className="flex flex-col justify-center w-[200px] space-y-4">
      <TextField
        label="Initial Amount"
        variant="outlined"
        type="number"
        fullWidth
        value={compoundInterest.initialContribution}
        onChange={(e) =>
          updateCompoundInterest(uuid, {
            ...compoundInterest,
            initialContribution: parseFloat(e.target.value),
          })
        }
        required
      />
      <TextField
        label="Annual Interest Rate (%)"
        variant="outlined"
        type="number"
        fullWidth
        value={compoundInterest.expectedInterest}
        onChange={(e) =>
          updateCompoundInterest(uuid, {
            ...compoundInterest,
            expectedInterest: parseFloat(e.target.value),
          })
        }
        required
      />
      <TextField
        label="Time Period (years)"
        variant="outlined"
        type="number"
        fullWidth
        value={compoundInterest.yearsToInvest}
        onChange={(e) =>
          updateCompoundInterest(uuid, {
            ...compoundInterest,
            yearsToInvest: parseFloat(e.target.value),
          })
        }
        required
      />
      <TextField
        label="Monthly Contribution"
        variant="outlined"
        type="number"
        fullWidth
        value={compoundInterest.monthlyContribution}
        onChange={(e) =>
          updateCompoundInterest(uuid, {
            ...compoundInterest,
            monthlyContribution: parseFloat(e.target.value),
          })
        }
        required
      />
    </Box>
  );
};

export default CompoundInterestCardForm;
