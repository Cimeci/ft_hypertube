import {ComponentPropsWithoutRef, createElement, CSSProperties, ElementType} from "react";
import {Property} from "csstype";
import {
    Direction,
    Alignment,
    SpacingValue,
    DirectionToCSS,
    FlexValue,
    FlexValueToCSS,
    AlignmentToCSS, SpacingValueToCSS, ColorToCSS, Color
} from "@/components/ui/utils";
import {motion} from "motion/react";
import {TargetAndTransition, Transition} from "motion";

type StackComponent =
    | "div"
    | "main"
    | "section"
    | "article"
    | "aside"
    | "header"
    | "footer"
    | "form";

export interface StackProperties {
    component?: StackComponent
    direction?: Direction
    gap?: number | "auto"
    padding?: SpacingValue
    margin?: SpacingValue
    height?: Property.Height<string | number>
    width?: Property.Width<string | number>
    maxWidth?: 1200 | Property.Width<string | number>
    maxHeight?: Property.Height<string | number>
    vAlign?: Alignment;
    hAlign?: Alignment;
    flex?: FlexValue;
    background?: Color;
    border?: "light" | "dark",
    radius?: number;
    wrap?: boolean;
    animatedLayout?: boolean;
    animated?: boolean;
    initial?: TargetAndTransition;
    exit?: TargetAndTransition;
    animate?: TargetAndTransition;
    transition?: Transition;
}

type StackProps<T extends StackComponent> =
    StackProperties &
    Omit<ComponentPropsWithoutRef<T>, keyof StackProperties>;

export default function Stack<T extends StackComponent = "div">(
    {
        component = "div",
        direction = "vertical",
        gap = 10,
        padding,
        margin,
        width,
        height,
        hAlign,
        vAlign,
        flex,
        background,
        radius,
        border,
        maxWidth,
        maxHeight,
        wrap = true,
        animatedLayout = false,
        animated = false,
        ...props
    }: StackProps<T>
) {
    const computedStyle: CSSProperties = {
        display: "flex",
        ...DirectionToCSS(direction),
        flexWrap: wrap ? "wrap" : "nowrap",
        width,
        height,
        maxWidth,
        maxHeight,
        borderRadius: radius ? `${radius}px` : undefined,
        ...FlexValueToCSS(flex),
        border: border ? `1px solid ${ColorToCSS(border === "light" ? "borderLight" : "borderDark")}` : undefined,
        ...props.style
    }

    if (background) computedStyle.background = ColorToCSS(background);
    if (hAlign) computedStyle.justifyContent = AlignmentToCSS(hAlign);
    if (vAlign) computedStyle.alignItems = AlignmentToCSS(vAlign);
    if (gap) {
        if (gap === "auto") {
            computedStyle[direction === "horizontal" ? "justifyContent" : "alignItems"] = "space-between";
        } else {
            computedStyle.gap = `${gap}px`;
        }
    }

    if (padding) computedStyle.padding = SpacingValueToCSS(padding);
    if (margin) computedStyle.margin = SpacingValueToCSS(margin);

    const Component = animatedLayout || animated ? motion[component] : (component ?? "div") as ElementType;
    const AnimatedProps = animatedLayout ? { layout: true }:{}

    return createElement(Component, {
        ...props,
        ...AnimatedProps,
        style: computedStyle,
    });
}