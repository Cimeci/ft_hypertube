import {ComponentPropsWithRef, CSSProperties} from "react";
import {Color, ColorToCSS} from "@/components/ui/utils";
import {motion} from "motion/react";
import {TargetAndTransition} from "motion";
import TransitionLink from "@/components/ui/TransitionLink";

export type TypographyVariant =
    | "title"
    | "caption"
    | "body"

export interface TypographyProps extends ComponentPropsWithRef<"p"> {
    href?: string;
    variant?: TypographyVariant;
    bold?: number | boolean;
    fontSize?: number;
    color?: Color;
    children?: string;
    uppercase?: boolean;
    animated?: boolean;
    key?: string;
    initial?: TargetAndTransition,
    animate?: TargetAndTransition,
    exit?: TargetAndTransition,
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
    caption: {
        component: "span",
        fontSize: "1rem",
        fontWeight: 400,
    },
    body: {
        component: "p",
        fontSize: "1rem",
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

    const { component, ...style } = computedStyle;
    const Component = props.animated ? motion[component] : component;
    const motionProps = props.animated ? {
        initial: props.initial,
        animate: props.animate,
        exit: props.exit,
    } : {}

    const typography = <Component
        style={{...style, ...props.style}}
        {...motionProps}
    >
        {props.children}
    </Component>

    return props.href ? (
        <TransitionLink href={props.href} key={props.key} style={{ color: style.color, textDecoration: "none" }}>{typography}</TransitionLink>
    ) : typography
}