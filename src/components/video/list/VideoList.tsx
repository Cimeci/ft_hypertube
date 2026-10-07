"use client";
import styles from "./VideoList.module.css";
import {useEffect, useState, UIEvent, useCallback} from "react";
import {List} from "react-window";
import {VideoItem} from "@/components/video/item/VideoItem";

const VERTICAL_MARGIN = 80;
const MOBILE_QUERY_MAX_WIDTH = 600;

export interface VideoListProps {
    videoId?: string;
}

export default function VideoList(props: VideoListProps) {
    const [rowHeight, setRowHeight] = useState<number | null>(null);
    const [videos, setVideos] = useState<{ index: number }[]>([]);
    const [active, setActive] = useState(0);
    const [page, setPage] = useState(1);

    const fetchVideos = useCallback(() => {
        setTimeout(() => {
            console.log(props.videoId);
            if (page === 1 && props.videoId && !isNaN(Number(props.videoId))) {
                const index = Number(props.videoId);
                setVideos([
                    ...Array.from({ length: 5 }, (_, i) => ({ index: index + i }))
                ]);

            } else {
                setVideos((prev) => [
                    ...prev,
                    ...Array.from({ length: 5 }, (_, i) => ({ index: prev[prev.length - 1].index + i }))
                ]);
            }
            setPage((prev) => prev + 1);
        }, 500)
    }, [page, props.videoId]);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const margin = window.innerWidth > MOBILE_QUERY_MAX_WIDTH ? VERTICAL_MARGIN : 0;
        const currentActive = Math.round((scrollTop + (margin / 2)) / (window.innerHeight - margin));
        if (currentActive !== active) {
            setActive(currentActive);
            handleVideoChange(videos[currentActive]);
        }
    };

    const handleResize = useCallback(() => {
        setRowHeight(window.innerHeight - (window.innerWidth > MOBILE_QUERY_MAX_WIDTH ? VERTICAL_MARGIN : 0));
    }, [])

    const handleVideoChange = useCallback((video: { index: number }) => {
        // Update URL with video id
        window.history.pushState({}, "", `/explore/${video.index}`);

        // Check if the user is at the end of the list and load more videos
        if (active + 2 >= videos.length) fetchVideos();
    }, [active, fetchVideos, videos.length]);



    useEffect(() => {
        (() => handleResize())();
        (() => fetchVideos())();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [active, fetchVideos, handleResize, handleVideoChange, videos]);

    if (!rowHeight) return null;
    return (
        <List
            className={styles.list}
            rowCount={videos.length}
            rowHeight={rowHeight}
            rowProps={{ active, videos }}
            rowComponent={VideoItem}
            onScroll={handleScroll}
        />
    );
}