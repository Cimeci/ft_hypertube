import {notFound} from 'next/navigation'
import Stack from "@/components/ui/Stack";
import VideoList from "@/components/video/list/VideoList";

export default async function Explore({ params }: { params: { video_id: string[] }}) {
    const { video_id } = await params;
    if (video_id?.length > 1) return notFound();
    const videoId: string | undefined = video_id?.[0];

    return (
        <Stack>
            <VideoList videoId={videoId} />
        </Stack>
    )
}