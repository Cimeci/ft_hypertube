"use client";
import {ReactElement, ReactNode, useState} from "react";
import Stack from "@/components/ui/Stack";
import Icon, {IconName} from "@/components/ui/Icon";
import {AnimatePresence, motion} from "motion/react";
import {ColorToCSS} from "@/components/ui/utils";

export interface TabProps {
    id: string
    icon: IconName
    children?: ReactNode;
}

type TabElement = ReactElement<TabProps, typeof Tab>;

export interface TabsProps {
    children: TabElement | TabElement[];
}

export function Tab({children}: TabProps) {
    return <>{children}</>;
}

export default function Tabs({children}: TabsProps) {
    const tabs: TabElement[] = Array.isArray(children) ? children : [children];

    const [selectedTab, setSelectedTab] = useState(tabs[0].props.id);
    const [direction, setDirection] = useState(1);

    const selectTab = (id: string) => {
        const currentIndex = tabs.findIndex((tab) => tab.props.id === selectedTab);
        const nextIndex = tabs.findIndex((tab) => tab.props.id === id);

        setDirection(nextIndex >= currentIndex ? 1 : -1);
        setSelectedTab(id);
    };

    return (
        <Stack
            direction={"vertical"}
            gap={0}
            style={{
                position: "relative"
            }}
        >
            <Stack
                direction={"horizontal"}
                gap={0}
                animatedLayout
                background={"background"}
                style={{ zIndex: 1 }}
            >
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.props.id}
                        style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            padding: 0,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: ColorToCSS(selectedTab === tab.props.id ? "primary" : "white"),
                            opacity: selectedTab === tab.props.id ? 1 : 0.3,
                            position: "relative"
                        }}
                        whileTap={"tapping"}
                        onClick={() => selectTab(tab.props.id)}
                    >
                        <motion.div
                            variants={{
                                tapping: {
                                    scale: 0.9
                                }
                            }}
                            transition={{ type: "spring", stiffness: 800, damping: 20 }}
                        >
                            <Icon
                                name={tab.props.icon}
                                size={24}
                            />
                        </motion.div>
                        {selectedTab === tab.props.id && (
                            <motion.span
                                layoutId={"selectedIndicator"}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: 2,
                                    backgroundColor: ColorToCSS("primary")
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </Stack>
            <AnimatePresence initial={false} custom={direction}>
                {tabs.map((tab) => {
                    if (tab.props.id !== selectedTab) return null;

                    return (
                        <motion.div
                            key={tab.props.id}
                            style={{
                                position: "absolute",
                                top: 40,
                                left: 0,
                                right: 0
                            }}
                            custom={direction}
                            variants={{
                                enter: (direction: number) => ({
                                    x: direction * 100,
                                    opacity: 0,
                                }),
                                center: {
                                    x: 0,
                                    opacity: 1,
                                },
                                exit: (direction: number) => ({
                                    x: direction * -100,
                                    opacity: 0,
                                })
                            }}
                            initial={"enter"}
                            animate={"center"}
                            exit={"exit"}
                            transition={{
                                type: "spring",
                                stiffness: 600,
                                damping: 50
                            }}
                        >
                            {tab}
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </Stack>
    )
}