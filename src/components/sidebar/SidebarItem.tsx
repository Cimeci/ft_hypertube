import {ReactNode, ComponentType} from "react";
import {Typography} from "@/components/ui/Typography";
import TransitionLink from "@/components/ui/TransitionLink";
import { motion } from "motion/react";
import {Transition} from "motion";
import {ColorToCSS} from "@/components/ui/utils";

export interface SidebarItemProps {
    isWrap: boolean;
    transition: Transition;
    icon?: ComponentType<{ size?: number }>;
    avatar?: ReactNode;
    title: string;
    href: string;
}

export function SidebarItem({
                                isWrap,
                                transition,
                                icon: Icon,
                                avatar,
                                title,
                                href
}: SidebarItemProps) {
    return (
        <TransitionLink href={href} tabIndex={-1} style={{ textDecoration: "none" }}>
            <motion.div
                style={{
                    height: 55,
                    display: "flex",
                    alignItems: "center",
                    gap: 15,
                    overflow: "hidden",
                    borderRadius: 10,
                    color: ColorToCSS("textLightSecondary"),
                }}
                animate={{
                    width: isWrap ? 40 : 340,
                }}
                whileTap={{
                    scale: 0.95,
                }}
                transition={transition}
                className={"outline"}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 15,
                        width: 340,
                    }}
                >
                    <motion.div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 32,
                        }}
                        animate={{
                            width: isWrap ? 40 : 32,
                        }}
                    >
                        {Icon && <Icon size={24}/>}
                        {avatar}
                    </motion.div>
                    <Typography variant={"sidebarItemText"}>{title}</Typography>
                </div>
            </motion.div>
        </TransitionLink>
    )
}