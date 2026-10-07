"use client";
import Icon, { IconProps } from "@/components/ui/Icon";
import {ComponentPropsWithRef, RefObject, useState} from "react";
import Stack from "@/components/ui/Stack";
import {ColorToCSS} from "@/components/ui/utils";
import {AnimatePresence, motion} from "motion/react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/Button";

export interface TextInputProps extends ComponentPropsWithRef<"input"> {
    ref?: RefObject<HTMLInputElement>
    icon?: IconProps["name"]
    secured?: boolean
}

export default function TextInput({secured, icon, ...props}: TextInputProps) {
    const t = useTranslations();

    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Stack
            direction={"horizontal"}
            height={50}
            background={"lightTertiary"}
            padding={[0, 10]}
            style={{position: "relative"}}
            vAlign={"center"}
        >
            {icon && <Icon
                name={icon}
                color={focused ? ColorToCSS("primary") : ColorToCSS("textLight")}
                opacity={focused ? 1 : 0.5}
                style={{ transition: ".2s cubic-bezier(1, 0, 0, 1)" }}
            /> }
            <input
                type={secured && !showPassword ? "password" : "text"}
                style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    font: "1rem var(--font-body)",
                    color: ColorToCSS("textLight"),
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={props.placeholder ?? t("action.enter_text")}
                {...props}
            />
            {secured && (
                <Button
                    square
                    variant={"borderless"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    padding={0}
                    width={30}
                    radius={15}
                    tabIndex={1}
                >
                    <Icon name={showPassword ? "eye-off" : "eye"}/>
                </Button>
            )}
            <AnimatePresence>
                {focused &&
                    <motion.div
                        key="underline"
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            background: ColorToCSS("primary"),
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1, transformOrigin: "left" }}
                        exit={{ scaleX: 0, transformOrigin: "right" }}
                        transition={{ duration: .2, ease: [1, 0, 0, 1] }}
                    />
                }
            </AnimatePresence>
        </Stack>
    )
}