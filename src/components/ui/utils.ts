import {CSSProperties} from "react";
import {TargetAndTransition, Transition, VariantLabels, Variants} from "motion";
import {HTMLMotionProps} from "framer-motion";

// MARK: - Direction
export type Direction = "vertical" | "horizontal";
export const DirectionLinkedVariables: Record<Direction, CSSProperties["flexDirection"]> = {
    vertical: "column",
    horizontal: "row",
}
export function DirectionToCSS(direction: Direction): CSSProperties {
    return {
        flexDirection: DirectionLinkedVariables[direction],
    }
}

// MARK: - Spacing
export type SpacingValue = number | [number, number] | [number, number, number, number];
export function SpacingValueToCSS(spacing: SpacingValue): string {
    if (Array.isArray(spacing)) {
        return `${spacing[0]}px ${spacing[1]}px${spacing.length > 2 ? ` ${spacing[2]}px ${spacing[3]}px` : ''}`;
    } else {
        return `${spacing}px`;
    }
}

// MARK: - Flex
export type FlexValue = number | boolean;
export function FlexValueToCSS(flex?: FlexValue): CSSProperties {
    return {
        flex: typeof flex === "number" ? flex : flex ? 1 : undefined,
    }
}

// MARK: - Alignment
export type Alignment = "start" | "center" | "end";
export const AlignmentLinkedVariables: Record<Alignment, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
}
export function AlignmentToCSS(alignment: Alignment): string {
    return AlignmentLinkedVariables[alignment]
}

// MARK: - Color
export type ColorName =
    | "white"
    | "black"
    | "green"
    | "yellow"
    | "blue"
    | "red"
    | "purple"
    | "orange"
    | "cyan"
    | "light-yellow"
    | "pink"
    | "taupe"
    | "background"
    | "primary"
    | "gradientBackgroundTop"
    | "gradientBackgroundBottom"
    | "light"
    | "lightSecondary"
    | "lightTertiary"
    | "lightTertiaryHighlighted"
    | "dark"
    | "darkSecondary"
    | "darkTertiary"
    | "textLight"
    | "textLightSecondary"
    | "textLightSecondaryHighlighted"
    | "textLightTertiary"
    | "textLightTertiaryHighlighted"
    | "textDark"
    | "textDarkSecondary"
    | "textDarkSecondaryHighlighted"
    | "textDarkTertiary"
    | "textDarkTertiaryHighlighted"
    | "borderLight"
    | "borderDark";
export type Color = ColorName | (string & {});
const BackgroundColorLinkedVariables: Record<Color, string> = {
    white: "var(--color-white)",
    black: "var(--color-black)",
    green: "var(--color-green)",
    yellow: "var(--color-yellow)",
    blue: "var(--color-blue)",
    red: "var(--color-red)",
    purple: "var(--color-purple)",
    orange: "var(--color-orange)",
    cyan: "var(--color-cyan)",
    "light-yellow": "var(--color-light-yellow)",
    pink: "var(--color-pink)",
    taupe: "var(--color-taupe)",

    background: "var(--surface-background)",
    primary: "var(--surface-primary)",
    gradientBackgroundTop: "var(--surface-gradient-background-top)",
    gradientBackgroundBottom: "var(--surface-gradient-background-bottom)",

    light: "var(--surface-light)",
    lightSecondary: "var(--surface-light-secondary)",
    lightTertiary: "var(--surface-light-tertiary)",
    lightTertiaryHighlighted: "var(--surface-light-tertiary-highlighted)",

    dark: "var(--surface-dark)",
    darkSecondary: "var(--surface-dark-secondary)",
    darkTertiary: "var(--surface-dark-tertiary)",

    textLight: "var(--text-light)",
    textLightSecondary: "var(--text-light-secondary)",
    textLightSecondaryHighlighted: "var(--text-light-secondary-highlighted)",
    textLightTertiary: "var(--text-light-tertiary)",
    textLightTertiaryHighlighted: "var(--text-light-tertiary-highlighted)",
    textDark: "var(--text-dark)",
    textDarkSecondary: "var(--text-dark-secondary)",
    textDarkSecondaryHighlighted: "var(--text-dark-secondary-highlighted)",
    textDarkTertiary: "var(--text-dark-tertiary)",
    textDarkTertiaryHighlighted: "var(--text-dark-tertiary-highlighted)",

    borderLight: "var(--border-light)",
    borderDark: "var(--border-dark)",
}
export const ColorToCSS = (color: Color): string => BackgroundColorLinkedVariables[color as ColorName] ?? color;

// MARK: - CSS Properties and State
export interface CSSPropertiesWithState extends CSSProperties{
    hover?: TargetAndTransition
    active?: TargetAndTransition
    focus?: TargetAndTransition
}

export function extractCSSPropertiesWithState(
    css: CSSPropertiesWithState,
    options: {
        variantHover?: string
        variantActive?: string
        variantFocus?: string
    } = {}
): Pick<
    HTMLMotionProps<"div">,
    "style" | "transition" | "whileHover" | "whileTap" | "whileFocus" | "variants"
> {
    const { hover, active, focus, ...cssProperties } = css;
    let whileHover: TargetAndTransition | VariantLabels | undefined = hover;
    let whileTap: TargetAndTransition | VariantLabels | undefined = active;
    let whileFocus: TargetAndTransition | VariantLabels | undefined = focus;
    const variants: Variants = {};

    const spring: Transition = {
        type: "spring",
        stiffness: 2000,
        damping: 60,
        outline: { type: "tween", duration: 0.2 }
    }

    if (options.variantHover && hover) {
        whileHover = options.variantHover;
        variants[options.variantHover] = hover;
    }
    if (options.variantActive && active) {
        whileTap = options.variantActive;
        variants[options.variantActive] = active;
    }
    if (options.variantFocus && focus) {
        whileFocus = options.variantFocus;
        variants[options.variantFocus] = focus;
    }

    return {
        style: cssProperties,
        transition: spring,
        whileHover,
        whileTap,
        whileFocus,
        variants,
    }
}