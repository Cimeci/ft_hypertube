import { motion } from "motion/react";
import {ColorToCSS} from "@/components/ui/utils";
import {Transition} from "motion";
import {ReactNode} from "react";

export interface SidebarIconButtonProps {
    isWrap: boolean;
    onClick: () => void;
    transition: Transition;
    children: ReactNode;
}

export function SidebarIconButton({isWrap, onClick, transition, children}: SidebarIconButtonProps) {
    return (
        <motion.button
            style={{
                width: 50,
                height: 50,
                padding: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "transparent",
                border: "none",
                color: ColorToCSS("textLightSecondary"),
                borderRadius: 10,
                outlineOffset: 0,
            }}
            animate={{
                width: isWrap ? 40 : 50
            }}
            whileTap={{
                scale: 0.9
            }}
            onClick={onClick}
            transition={transition}
            className={"outline"}
        >
            {children}
        </motion.button>
    )
}