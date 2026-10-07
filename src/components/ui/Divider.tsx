import Stack from "@/components/ui/Stack";
import {Typography} from "@/components/ui/Typography";
import {Color, ColorToCSS} from "@/components/ui/utils";

export interface DividerProps {
    color?: Color;
    text?: string;
}

export default function Divider(props: DividerProps) {
    const divider = <span
        style={{
            width: "100%",
            height: "1px",
            backgroundColor: props.color ? ColorToCSS(props.color) : "currentColor",
            maxWidth: props.text ? 100 : 150,
        }}
    />

    return (
        <Stack direction={"horizontal"} wrap={false} vAlign={"center"} hAlign={"center"} style={{opacity: 0.5}}>
            {divider}
            {props.text && (
                <>
                    <Typography uppercase>{props.text}</Typography>
                    {divider}
                </>
            )}
        </Stack>
    )
}