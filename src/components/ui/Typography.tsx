"use client";
import {Children, ComponentPropsWithRef, CSSProperties, ReactNode} from "react";
import {Color, ColorToCSS} from "@/components/ui/utils";
import {AnimatePresence, motion} from "motion/react";
import {TargetAndTransition, Transition} from "motion";
import TransitionLink from "@/components/ui/TransitionLink";

export type TypographyVariant =
    | "title"
    | "title2"
    | "caption"
    | "body"
    | "footer"
    | "accountsItemTitle"
    | "accountsItemUsername"
    | "sidebarItemText"

export interface TypographyProps extends ComponentPropsWithRef<"p"> {
    href?: string;
    variant?: TypographyVariant;
    bold?: number | boolean;
    fontSize?: number;
    color?: Color;
    children?: ReactNode;
    uppercase?: boolean;
    animated?: boolean;
    lineLimit?: number;
    key?: string;
    initial?: TargetAndTransition,
    animate?: TargetAndTransition,
    exit?: TargetAndTransition,
    transition?: Transition,
    skeleton?: boolean;
}

interface TypographyStyleProps extends CSSProperties {
    component: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span"
}

const TypographyVariants: Record<TypographyVariant, TypographyStyleProps> = {
    title: {
        component: "h1",
        fontSize: "2rem",
        fontWeight: 700,
    },
    title2: {
        component: "h2",
        fontSize: "1.3rem",
        fontWeight: 500,
    },
    caption: {
        component: "span",
        fontSize: "1rem",
        fontWeight: 400,
    },
    body: {
        component: "p",
        fontSize: "1rem",
        fontWeight: 400,
    },
    footer: {
        component: "span",
        fontSize: "0.8rem",
        fontWeight: 400,
    },
    accountsItemTitle: {
        component: "p",
        fontSize: "1.2rem",
        fontWeight: 600,
    },
    accountsItemUsername: {
        component: "span",
        fontSize: "1rem",
        fontWeight: 400,
    },
    sidebarItemText: {
        component: "span",
        fontSize: "1.1rem",
        fontWeight: 400,
    }
}

export function Typography(props: TypographyProps) {
    const computedStyle: TypographyStyleProps = {
        fontFamily: "var(--font-body)",
        margin: 0,
        ...TypographyVariants[props.variant ?? "body"],
        textTransform: props.uppercase ? "uppercase" : undefined,
    }

    if (props.bold) computedStyle.fontWeight = typeof props.bold === "number" ? props.bold : 600
    if (props.fontSize) computedStyle.fontSize = `${props.fontSize}px`
    if (props.color) computedStyle.color = ColorToCSS(props.color);
    if (props.lineLimit) {
        computedStyle.overflow = "hidden";
        computedStyle.display = "-webkit-box";
        computedStyle.WebkitLineClamp = props.lineLimit;
        computedStyle.WebkitBoxOrient = "vertical";
        computedStyle.lineClamp = props.lineLimit;
    }

    const {component, ...style} = computedStyle;
    const Component = motion[component];

    const typography = (
        <AnimatePresence mode={"popLayout"} initial={false}>
            {props.skeleton ? (
                <Component
                    key={"skeleton"}
                    style={{
                        ...style,
                        ...props.style,
                        color: "transparent",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                >
                    {Children.map(props.children, (child, index) => (
                        <motion.span
                            style={{position: "relative"}}
                            key={index}
                            className="skeleton-text"
                        >
                            {child}
                        </motion.span>
                    ))}
                </Component>
            ) : (
                <Component
                    key={"text"}
                    style={{...style, ...props.style}}
                    initial={props.initial ?? {opacity: 0}}
                    animate={props.animate ?? {opacity: 1 }}
                    exit={props.exit ?? {opacity: 0}}
                    transition={props.transition}
                >
                    {props.children}
                </Component>
            )}
        </AnimatePresence>
    )

    return props.href ? (
        <TransitionLink href={props.href} key={props.key}
                        style={{color: style.color, textDecoration: "none"}}>{typography}</TransitionLink>
    ) : typography
}