import Stack from "@/components/ui/Stack";
import {Typography} from "@/components/ui/Typography";
import {Color, ColorToCSS} from "@/components/ui/utils";

export interface DividerProps {
    vertical?: boolean;
    color?: Color;
    text?: string;
    opacity?: number;
    margin?: number;
}

export default function Divider(props: DividerProps) {
    const divider = <span
        style={{
            flex: 1,
            [props.vertical ? "width" : "height"]: 1,
            [props.vertical ? "maxWidth" : "maxHeight"]: 1,
            backgroundColor: props.color ? ColorToCSS(props.color) : "currentColor",
            opacity: props.opacity ?? 0.2,
            [props.vertical ? "marginTop" : "marginLeft"]: props.margin ?? 0,
            [props.vertical ? "marginBottom" : "marginRight"]: props.margin ?? 0,
        }}
    />

    if (!props.text) return divider;

    return (
        <Stack direction={"horizontal"} wrap={false} vAlign={"center"} hAlign={"center"}>
            {divider}
            <Typography uppercase style={{opacity: 0.5}}>{props.text}</Typography>
            {divider}
        </Stack>
    )
}