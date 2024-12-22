import React, { FC } from "react";
import { Box } from "@mui/material";

interface AddNewCompoundInterestViewProps {
  onAdd: () => void;
}

const AddNewCompoundInterestView: FC<AddNewCompoundInterestViewProps> = ({
  onAdd,
}) => {
  return (
    <Box
      className="p-8 mx-auto flex gap-10 bg-gray-400 w-[800px] h-[400px]"
      onClick={onAdd}
    >
      New compound interest calculator
    </Box>
  );
};

export default  AddNewCompoundInterestView
