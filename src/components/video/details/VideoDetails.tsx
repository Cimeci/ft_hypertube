import {Video} from "@/types/Video";
import Stack from "@/components/ui/Stack";
import {Typography} from "@/components/ui/Typography";
import {useTranslations} from "next-intl";
import {ReactNode} from "react";

export interface VideoDetails {
    video: Video;
    actions: ReactNode;
}

export default function VideoDetails({video, actions}: VideoDetails) {
    const t = useTranslations();

    const formatViews = (views: number) => {
        if (views < 1000) return views;
        if (views < 1000000) return `${(views / 1000).toFixed(1)}K`;
        return `${(views / 1000000).toFixed(1)}M`;
    }

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        return date.toLocaleDateString("en-US", options);
    }

    return (
        <Stack>
            <Stack direction={"horizontal"} gap={10}>
                <Stack flex={1} gap={0}>
                    <Typography variant={"title2"} lineLimit={1}>
                        {video.title}
                    </Typography>
                    <Typography variant={"footer"} lineLimit={1} color={"lightSecondary"}>
                        {`${t("video.details.view", { views: formatViews(video.views)})} - ${formatDate(video.postedAt)}`}
                    </Typography>
                </Stack>
                {actions}
            </Stack>
            <Typography color={"lightSecondary"} lineLimit={2}>
                {video.description}
            </Typography>
        </Stack>
    )
}
