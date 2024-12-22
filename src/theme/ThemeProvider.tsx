"use client"

import {purple} from "@mui/material/colors";
import {createTheme, ThemeProvider as MUIThemeProvider} from '@mui/material/styles';


const theme = createTheme({
    palette: {
        primary: {
            main: purple[500],
        },
        secondary: {
            main: '#f44336',
        },
    },
});

export default function ThemeProvider({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    return (
        <MUIThemeProvider theme={theme}>
            {children}
        </MUIThemeProvider>
    )
}