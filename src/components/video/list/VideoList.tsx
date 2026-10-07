"use client";
import styles from "./VideoList.module.css";
import {useEffect, useState, UIEvent, useCallback} from "react";
import {List} from "react-window";
import {VideoItem} from "@/components/video/item/VideoItem";
import {getVideoFeed, Video} from "@/api/mock/video";

const VERTICAL_MARGIN = 80;
const MOBILE_QUERY_MAX_WIDTH = 650;

export interface VideoListProps {
    videos: Video[],
}

export default function VideoList(props: VideoListProps) {
    const [rowHeight, setRowHeight] = useState<number | null>(null);

    const [videos, setVideos] = useState<Video[]>(props.videos);
    const [active, setActive] = useState(0);

    const [muteVideo, setMuteVideo] = useState(true);

    const updateUrl = (videoId: string) => {
        window.history.pushState({}, "", `/explore/${videoId}`);
    }

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
    }, []);

    const toggleMute = useCallback(() => {
        setMuteVideo((prev) => !prev);
    }, [])

    const handleVideoChange = useCallback((video: Video) => {
        updateUrl(video.id)
        if (active + 2 >= videos.length) {
            getVideoFeed().then((videos) => {
                setVideos((prev) => [
                    ...prev,
                    ...videos,
                ]);
            })
        }
    }, [active, videos.length]);

    useEffect(() => {
        (() => handleResize())();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    console.log(videos)

    if (!rowHeight) return null;
    return (
        <List
            className={styles.list}
            rowCount={videos.length}
            rowHeight={rowHeight}
            rowProps={{ active, videos, muteVideo, toggleMute }}
            rowComponent={VideoItem}
            onScroll={handleScroll}
        />
    );
}