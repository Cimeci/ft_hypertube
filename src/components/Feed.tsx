import {notFound} from "next/navigation";
import {getVideoFeed} from "@/api/mock/video";
import VideoList from "@/components/video/list/VideoList";

export interface FeedProps {
    params: Promise<{ video_id: string[] }>
}

export default async function Feed({ params }: FeedProps) {
    const { video_id } = await params;
    if (video_id?.length > 1) notFound();
    const videoId: string | undefined = video_id?.[0];

    const videos = await getVideoFeed();

    await new Promise(resolve => setTimeout(resolve, 2000));

    return (
        <VideoList
            videos={videos}
        />
    )
}