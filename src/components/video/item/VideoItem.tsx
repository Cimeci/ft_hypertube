import styles from "./VideoItem.module.css";
import {RowComponentProps} from "react-window";
import VideoPlayer, {VideoPlayerRef} from "@/components/video/player/VideoPlayer";
import {useEffect, useRef, useState} from "react";
import {Typography} from "@/components/ui/Typography";
import Stack from "@/components/ui/Stack";
import {motion, AnimatePresence} from "motion/react";

export interface VideoItemProps {
    videos: { index: number }[];
    active: number;
    muteVideo: boolean;
    toggleMute: () => void;
}

export function VideoItem(
    {
        index,
        style,
        videos,
        muteVideo,
        toggleMute,
        active: activeVideoIndex,
    }: RowComponentProps<VideoItemProps>
) {
    const video = videos[index];
    const active = activeVideoIndex === index;

    const videoPlayerRef = useRef<VideoPlayerRef>(null);

    const [showDetails, setShowDetails] = useState(false);

    const videosSources = [
        "/video/frank00.mp4",
        "/video/frank01.mp4",
        "/video/frank02.mp4",
        "/video/frank03.mp4",
        "/video/frank04.mp4",
        "/video/frank05.mp4",
        "/video/frank06.mp4",
    ]
    const videoSrc = videosSources[index % videosSources.length];

    const toggleDetails = () => setShowDetails(!showDetails);

    useEffect(() => {
        if (!videoPlayerRef.current) return;
        if (active) {
            videoPlayerRef.current.play();
        } else {
            videoPlayerRef.current.stop();
        }
    }, [active]);

    return (
        <div
            style={{
                ...style,
                overflow: showDetails ? "scroll" : "hidden",
                overscrollBehavior: showDetails ? "contain" : "auto",
            }}
            className={styles.item}
        >
            <VideoPlayer
                ref={videoPlayerRef}
                src={videoSrc}
                onToggleDetails={toggleDetails}
                mini={showDetails}
                muted={muteVideo}
                toggleMute={toggleMute}
            />
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        className={styles.details}
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 50,
                            delay: .2,
                        }}
                    >
                        <Typography>Details here</Typography>
                        <Stack height={1000} background={"red"} width={5}></Stack>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}