import {Transition} from "motion";
import { motion } from "motion/react";
import Logo from "@/components/ui/Logo";
import {Placeholder} from "@getpapillon/papicons";
import {SidebarIconButton} from "@/components/sidebar/SidebarIconButton";
import {SidebarSearchBar} from "@/components/sidebar/SidebarSearchBar";

export interface SidebarHeaderProps {
    isWrap: boolean;
    toggleWrap: () => void;
    transition: Transition;
}

export function SidebarHeader({isWrap, toggleWrap, transition}: SidebarHeaderProps) {
    return (
        <motion.header
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
            }}
        >
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center"
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        left: 0,
                        pointerEvents: "none"
                    }}
                    animate={{
                        opacity: isWrap ? 0 : 1
                    }}
                    transition={transition}
                >
                    <Logo size={30} />
                </motion.div>
                <SidebarIconButton isWrap={isWrap} onClick={toggleWrap} transition={transition}>
                    <Placeholder />
                </SidebarIconButton>
            </div>
            <SidebarSearchBar
                isWrap={isWrap}
                toggleWrap={toggleWrap}
                transition={transition}
            />
        </motion.header>
    )
}