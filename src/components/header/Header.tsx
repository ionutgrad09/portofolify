import React from "react";
import {Divider} from "@mui/material";
import Image from "next/image";


const Header = () => {

    return (
        <>
            <div className="bg-[#1976d2] h-[64px] flex justify-start pl-[5%]">
                <h2 style={{color: "white"}} className="flex flex-col justify-center">PORTOFOLIFY</h2>
                {/*<Image height={100} width={100} src="/portofolifyLogo.png" alt="logo" />*/}
            </div>
            <Divider color="grey"/>
        </>
    )
}

export default Header;