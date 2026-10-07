"use client";
import {
    Alignment,
    ColorToCSS,
    Color,
    extractCSSPropertiesWithState,
    CSSPropertiesWithState, SpacingValue, SpacingValueToCSS
} from "@/components/ui/utils";
import {Typography, TypographyProps} from "@/components/ui/Typography";
import {motion} from "motion/react"
import Stack from "@/components/ui/Stack";
import {Property} from "csstype";
import Link from "next/link";
import TransitionLink from "@/components/ui/TransitionLink";

export type ButtonVariant = "primary" | "secondary" | "borderless";

export interface ButtonProps {
    width?: Property.Width<string | number>,
    left?: React.ReactNode,
    right?: React.ReactNode,
    children: string | React.ReactNode,
    align?: Alignment,
    backgroundColor?: Color,
    color?: Color,
    variant?: ButtonVariant,
    square?: boolean,
    scale?: number,
    href?: string,
    padding?: SpacingValue,
    radius?: number,
    onClick?: () => void,
    submit?: boolean,
    disabled?: boolean,
    style?: CSSPropertiesWithState,
    layoutId?: string,
    tabIndex?: number,
    transitionHref?: boolean
}

interface CSSPropertiesWithTypographyProps extends CSSPropertiesWithState {
    typography?: TypographyProps
}

export function Button(props: ButtonProps) {
    const variants: Record<ButtonVariant, CSSPropertiesWithTypographyProps> = {
        primary: {
            backgroundColor: ColorToCSS("primary"),
            color: ColorToCSS("textDark"),
            borderStyle: "none",
            typography: {bold: true},
            hover: {color: ColorToCSS("textLight")},
            active: {scale: props.scale ?? 0.96},
        },
        secondary: {
            backgroundColor: props.backgroundColor ?? ColorToCSS("lightTertiary"),
            color: props.color ?? ColorToCSS("textLight"),
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: ColorToCSS("borderLight"),
            backdropFilter: "blur(10px) brightness(0.5)",
            hover: props.backgroundColor ?
                {filter: "brightness(1.2)"}
                :
                {backgroundColor: ColorToCSS("lightTertiaryHighlighted")},
            active: {scale: props.scale ?? 0.96},
        },
        borderless: {
            background: "transparent",
            borderStyle: "none",
            color: ColorToCSS("textLightSecondary"),
            padding: props.padding === undefined ? 10 : SpacingValueToCSS(props.padding),
            minWidth: undefined,
            height: 30,
            typography: {bold: true},
            hover: {color: ColorToCSS("textLightSecondaryHighlighted")},
            active: {scale: props.scale ?? 0.96},
        }
    }

    const {typography: typographyProps, ...cssProperties} = variants[props.variant ?? "secondary"]
    const Component = props.href ? motion(props.transitionHref ? TransitionLink : Link) : motion.button;

    return (
        <Component
            {...extractCSSPropertiesWithState({
                position: "relative",
                height: 45,
                width: props.width ?? (props.square ? 45 : undefined),
                minWidth: typeof props.children === "string" ? 120 : undefined,
                padding: props.square ? "0px" : SpacingValueToCSS(props.padding ?? [0, 10]),
                display: "flex",
                alignItems: "center",
                justifyContent: props.align ?? "center",
                overflow: "hidden",
                outline: `1px solid ${ColorToCSS("primary")}00`,
                outlineOffset: 2,
                textDecoration: "none",
                borderRadius: props.radius,
                focus: {
                    outline: `2px solid ${ColorToCSS("primary")}`,
                },
                ...cssProperties,
                ...props.style,
                opacity: props.disabled ? 0.5 : 1,
                pointerEvents: props.disabled ? "none" : undefined,
            }, {variantHover: "hover"})}
            initial="initial"
            onClick={props.onClick}
            href={props.href}
            type={props.submit ? "submit" : "button"}
            layoutId={props.layoutId}
            tabIndex={props.tabIndex}
            disabled={props.disabled}
        >
            {props.variant === "primary" && (["yellow", "orange", "red", "pink", "purple"] as Color[]).map((color, index) => (
                <motion.span
                    key={index}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: ColorToCSS(color),
                    }}
                    variants={{
                        initial: {
                            y: "100%",
                            transition: {ease: "linear", delay: (5 - index) / 20}
                        },
                        hover: {
                            y: "0%",
                            transition: {ease: [.2, 0, 0, 1], duration: 0.2, delay: index / 20}
                        },
                    }}
                />
            ))}
            <Stack direction={"horizontal"} style={{zIndex: 1}} vAlign={"center"} gap={12} wrap={false}>
                {props.left}
                {typeof props.children === "string" ?
                    <Typography {...typographyProps}>{props.children}</Typography> : props.children}
                {props.right}
            </Stack>
        </Component>
    )
}