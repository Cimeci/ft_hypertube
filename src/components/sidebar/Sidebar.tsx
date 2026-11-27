"use client";
import {ReactNode, useState} from "react";
import { motion } from "motion/react";
import {Transition} from "motion";
import {SidebarHeader} from "@/components/sidebar/SidebarHeader";
import Stack from "@/components/ui/Stack";
import {SidebarItem} from "@/components/sidebar/SidebarItem";
import {Dots, Placeholder, User} from "@getpapillon/papicons";
import {KeyboardShortcut} from "@/components/KeyboardShortcut";
import useUser from "@/components/UserProvider";
import {Avatar} from "@/components/Avatar";

export interface SidebarProps {
    children: ReactNode;
}

export function Sidebar({
    children
                        }: SidebarProps) {
    const { user } = useUser();

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
        <KeyboardShortcut ctrl keyboardKey={"b"} onShortcut={toggleWrap}>
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
                <Stack gap={5}>
                    <SidebarItem isWrap={isWrap} icon={Placeholder} title="Popular" href="/popular" transition={transition} />
                    <SidebarItem isWrap={isWrap} icon={Placeholder} title="Explore" href="/explore" transition={transition} />
                    <SidebarItem isWrap={isWrap} icon={User} title="Following" href="/following" transition={transition} />
                    <SidebarItem isWrap={isWrap} icon={Placeholder} title="Activity" href="#" transition={transition} />
                    <SidebarItem isWrap={isWrap} avatar={<Avatar src={user?.image ?? null} alt={user?.name ?? null} />} title="You" href={`/profile/${user?.id}`} transition={transition} />
                    <SidebarItem isWrap={isWrap} icon={Dots} title="More" href="#" transition={transition} />
                </Stack>
            </motion.nav>
            <motion.main
                style={{
                    minHeight: "100dvh",
                    display: "flex",
                    flexDirection: "column",
                    marginLeft: 400,
                }}
                animate={{
                    marginLeft: isWrap ? 100 : 400
                }}
                transition={transition}
            >
                {children}
            </motion.main>
        </KeyboardShortcut>
    )
}