"use client";

import React, {useState} from 'react';
import { TextField, Typography, Box } from '@mui/material';
import CompoundInterestChart from "@/components/compound-interest/CompoundInterestChart";

export type CompoundInterest = {
    initialContribution: number,
    monthlyContribution: number,
    yearsToInvest: number
    expectedInterest: number
}

const initialState: CompoundInterest = {
    initialContribution: 0,
    monthlyContribution: 0,
    yearsToInvest: 0,
    expectedInterest: 0
}

export default function CompoundInterestCalculator() {
    const [compoundInterest, setCompoundInterest] = useState<CompoundInterest>(initialState);

    return (
        <Box className="p-8 mx-auto flex flex-col bg-white gap-10">
            <Typography variant="h4" className="text-center mb-6">
                Compound Interest Calculator
            </Typography>

            <Box className="flex">
                <div className="w-[300px] space-y-4">
                    <TextField
                        label="Initial Amount"
                        variant="outlined"
                        type="number"
                        fullWidth
                        value={compoundInterest.initialContribution}
                        onChange={(e) => setCompoundInterest(current => ({...current, initialContribution: parseFloat(e.target.value)}))}
                        required
                    />
                    <TextField
                        label="Annual Interest Rate (%)"
                        variant="outlined"
                        type="number"
                        fullWidth
                        value={compoundInterest.expectedInterest}
                        onChange={(e) => setCompoundInterest(current => ({...current, expectedInterest: parseFloat(e.target.value)}))}
                        required
                    />
                    <TextField
                        label="Time Period (years)"
                        variant="outlined"
                        type="number"
                        fullWidth
                        value={compoundInterest.yearsToInvest}
                        onChange={(e) => setCompoundInterest(current => ({...current, yearsToInvest: parseFloat(e.target.value)}))}
                        required
                    />
                    <TextField
                        label="Monthly Contribution"
                        variant="outlined"
                        type="number"
                        fullWidth
                        value={compoundInterest.monthlyContribution}
                        onChange={(e) => setCompoundInterest(current => ({...current, monthlyContribution: parseFloat(e.target.value)}))}
                        required
                    />
                </div>

                <Box className="flex-1 mt-6 text-center">
                    <CompoundInterestChart compoundInterest={compoundInterest} />
                </Box>
            </Box>
        </Box>
    );
};
