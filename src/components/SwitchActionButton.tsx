import Icon from "@/components/ui/Icon";
import type {IconProps} from "@/components/ui/Icon";
import {ColorToCSS} from "@/components/ui/utils";
import { motion } from "motion/react";

export interface SwitchActionButtonProps {
    active: boolean;
    onChange: (active: boolean) => void;
    icon: IconProps["name"];
}

export function SwitchActionButton({ active, onChange, icon }: SwitchActionButtonProps) {
    return (
        <motion.button
            onClick={() => onChange(!active)}
            style={{
                border: "1px solid var(--border-light)",
                height: 42,
                width: 42,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: ColorToCSS("darkSecondary"),
                color: ColorToCSS("textLight"),
                backdropFilter: "blur(15px)",
            }}
            initial={false}
            whileTap={"tap"}
            animate={active ? "active" : "inactive"}
            variants={{
                tap: {
                    scale: 0.9,
                },
                active: {
                    background: ColorToCSS("white"),
                    color: ColorToCSS("black"),
                }
            }}
        >
            <Icon name={icon} size={20} />
        </motion.button>
    )
}