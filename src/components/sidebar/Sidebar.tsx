"use client";
import {ReactNode, useState} from "react";
import { motion } from "motion/react";
import {Transition} from "motion";
import {SidebarHeader} from "@/components/sidebar/SidebarHeader";
import {Typography} from "@/components/ui/Typography";

export interface SidebarProps {
    children: ReactNode;
}

export function Sidebar({
    children
                        }: SidebarProps) {
    const [isWrap, setIsWrap] = useState(false);

    const toggleWrap = () => {
        setIsWrap(!isWrap);
    }

    const transition: Transition = {
        type: "spring",
        stiffness: 300,
        damping: 28,
    }

    return (
        <>
            <motion.nav
                style={{
                    position: "fixed",
                    top: 0,
                    bottom: 0,
                    width: 400,
                    padding: 30,
                    display: "flex",
                    flexDirection: "column",
                    gap: 25,
                }}
                animate={{
                    width: isWrap ? 100 : 400
                }}
                transition={transition}
            >
                <SidebarHeader
                    isWrap={isWrap}
                    toggleWrap={toggleWrap}
                    transition={transition}
                />
                <Typography>Test</Typography>
            </motion.nav>
            <motion.main
                style={{
                    background: "green",
                    marginLeft: 400,
                }}
                animate={{
                    marginLeft: isWrap ? 100 : 400
                }}
                transition={transition}
            >
                {children}
            </motion.main>
        </>
    )
}