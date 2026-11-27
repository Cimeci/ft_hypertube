import {Suspense} from "react";
import Feed from "@/components/Feed";

export default async function Explore({ params }: { params: Promise<{ video_id: string[] }>}) {
    return (
        <>
            <Suspense fallback={<p>Loading...</p>}>
                <Feed params={params}/>
            </Suspense>
        </>
    )
}