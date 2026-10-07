import styles from "./VideoItem.module.css";
import {RowComponentProps} from "react-window";
import Stack from "@/components/ui/Stack";
import {Typography} from "@/components/ui/Typography";

export interface VideoItemProps {
    videos: { index: number }[];
    active: number;
}

export function VideoItem(
    {
        index,
        style,
        videos,
        active,
    }: RowComponentProps<VideoItemProps>
) {
    const video = videos[index];
    const colors = ["red", "blue", "green", "yellow"];
    const color = colors[index % colors.length];

    return (
        <div style={style} className={styles.item}>
            <Stack
                direction="horizontal"
                hAlign={"center"}
                vAlign={"center"}
                background={active === index ? color : "lightTertiary"}
                style={{
                    height: "100%",
                }}
            >
                <Typography variant={"title"}>{video.index.toString()}</Typography>
            </Stack>
        </div>
    )
}