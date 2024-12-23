import React from "react";
import {Divider} from "@mui/material";


const Header = () => {

    return (
        <>
            <div className="bg-[#1976d2] h-[64px] flex justify-start pl-[5%]">
                <h2 style={{color: "white"}} className="flex flex-col justify-center">PORTOFOLIFY</h2>
            </div>
            <Divider color="grey"/>
        </>
    )
}

export default Header;