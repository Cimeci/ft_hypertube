"use client";
import {AnimatePresence, motion} from "motion/react";
import {Transition} from "motion";
import {Search} from "@getpapillon/papicons";
import {ColorToCSS} from "@/components/ui/utils";
import {KeyboardShortcut} from "@/components/KeyboardShortcut";
import {useCallback, useRef, KeyboardEvent} from "react";

export interface SidebarSearchBarProps {
    isWrap: boolean;
    toggleWrap: () => void;
    transition: Transition;
}

export function SidebarSearchBar({isWrap, toggleWrap, transition}: SidebarSearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, [inputRef]);

    const onInputKeydown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") inputRef.current?.blur();
    }, [inputRef])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: 50,
                display: "flex",
                alignItems: "center",
            }}
        >
            <AnimatePresence mode={"wait"} initial={false}>
                {!isWrap && (
                    <>
                        <motion.input
                            key={"input"}
                            ref={inputRef}
                            style={{
                                minWidth: 0,
                                height: 50,
                                width: 340,
                                backgroundColor: ColorToCSS("lightTertiary"),
                                border: `1px solid ${ColorToCSS("borderLight")}`,
                                borderRadius: 100,
                                padding: "0px 45px",
                                outline: `0px solid transparent`,
                                outlineOffset: 3,
                                color: ColorToCSS("textLight"),
                                font: "var(--font-body)",
                                fontWeight: 400,
                                fontSize: "1rem",
                                transition: "outline 0.2s ease"
                            }}
                            whileFocus={{
                                outline: `2px solid ${ColorToCSS("primary")}`,
                                outlineOffset: 3,
                            }}
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            placeholder="Search"
                            transition={{
                                ...transition,
                                stiffness: 1000,
                            }}
                            onKeyDown={onInputKeydown}
                        />
                    </>
                )}
                {isWrap && (
                    <motion.hr
                        key={"hr"}
                        style={{
                            margin: 0,
                            position: "absolute",
                            bottom: 0,
                            border: "2px solid var(--border-light)",
                            width: 40,
                            y: 2,
                        }}
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{
                            duration: 0.15,
                        }}
                    />
                )}
            </AnimatePresence>
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    right: 0,
                    padding: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                }}
                animate={{
                    opacity: isWrap ? 0 : 1,
                    scale: isWrap ? 0.5 : 1,
                }}
            >
                <KeyboardShortcut
                    ctrl
                    keyboardKey={"k"}
                    onShortcut={() => {
                        if (isWrap) {
                            toggleWrap();
                            setTimeout(() => focusInput(), 200);
                        } else {
                            focusInput();
                        }
                    }}
                />
            </motion.div>
            <motion.button
                key={"search"}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 45,
                    height: 50,
                    background: "transparent",
                    border: "none",
                    color: ColorToCSS("textLightSecondary"),
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                animate={{
                    width: isWrap ? 40 : 45,
                    y: isWrap ? -10 : 0,
                }}
                disabled={!isWrap}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    toggleWrap();
                    setTimeout(() => focusInput(), 200);
                }}
            >
                <Search />
            </motion.button>
        </div>
    )
}