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
    <Box className="flex flex-col justify-center w-[450px] space-y-8">
      <TextField
        label="Initial Investing"
        helperText={
          <b>The initial amount of money available for investment.</b>
        }
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
        label="Estimated Interest Rate"
        variant="outlined"
        helperText={<b>The annual interest rate you expect.</b>}
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
        helperText={<b>The number of years you plan to invest.</b>}
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
        helperText={
          <b>
            The amount you intend to contribute to the principal each month, or
            a negative value if you plan to withdraw from it monthly.
          </b>
        }
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
