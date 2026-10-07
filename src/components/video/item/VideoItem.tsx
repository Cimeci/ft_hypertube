import styles from "./VideoItem.module.css";
import {RowComponentProps} from "react-window";
import VideoPlayer, {VideoPlayerRef} from "@/components/video/player/VideoPlayer";
import {useEffect, useRef, useState} from "react";
import {Typography} from "@/components/ui/Typography";
import Stack from "@/components/ui/Stack";
import {motion, AnimatePresence} from "motion/react";
import {Video} from "@/api/mock/video";

export interface VideoItemProps {
    videos: Video[];
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

    const toggleDetails = () => setShowDetails(!showDetails);

    useEffect(() => {
        if (!videoPlayerRef.current) return;
        if (active) {
            videoPlayerRef.current.play();
        } else {
            videoPlayerRef.current.stop();
        }
    }, [active]);

    console.log(video.details.title)

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
                src={video.src}
                ratio={video.ratio}
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
                        <Typography>{video.details.title}</Typography>
                        <Stack height={1000} background={"red"} width={5}></Stack>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}