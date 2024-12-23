"use client"

import {createTheme, ThemeProvider as MUIThemeProvider} from '@mui/material/styles';


const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#fff',
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