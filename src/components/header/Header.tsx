import React, {FC} from "react";
import {Divider} from "@mui/material";

interface HeaderProps {

}

const Header: FC<HeaderProps> = () => {

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