import { Icon as IconifyIcon, IconProps as IconifyIconProps } from "@iconify/react";
import majesticons from "@iconify/json/json/majesticons.json";
import {Color, ColorToCSS} from "@/components/ui/utils";

export type IconName = keyof typeof majesticons.icons;

export interface IconProps extends Omit<IconifyIconProps, "icon"> {
    icon?: string;
    name: IconName,
    size?: number
    color?: Color
}

export default function Icon({icon, name, size = 20, color, ...props}: IconProps) {
    return <IconifyIcon
        icon={icon ?? `majesticons:${name}`}
        width={size}
        height={size}
        color={ColorToCSS(color ?? "currentColor")}
        {...props}
    />
}