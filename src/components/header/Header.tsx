import React from "react";
import {Divider} from "@mui/material";


const Header = () => {

    return (
        <>
            <div className="h-[64px] flex justify-start pl-[10%]">
                <h2 className="flex flex-col justify-center">PORTOFOLIFY</h2>
            </div>
            <Divider color="grey"/>
        </>
    )
}

export default Header;