import styles from "./VideoItem.module.css";
import {RowComponentProps} from "react-window";
import VideoPlayer, {VideoPlayerRef} from "@/components/video/player/VideoPlayer";
import {useEffect, useRef, useState} from "react";
import Stack from "@/components/ui/Stack";
import {motion, AnimatePresence} from "motion/react";
import {Video} from "@/types/Video";
import VideoDetails from "@/components/video/details/VideoDetails";
import {SwitchActionButton} from "@/components/SwitchActionButton";

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

    const DetailsActions = (
        <>
            <SwitchActionButton
                active={showDetails}
                onChange={setShowDetails}
                icon={"chat-line"}
            />
        </>
    )

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
                medias={video.medias}
                mini={showDetails}
                muted={muteVideo}
                toggleMute={toggleMute}
                bottom={
                    <VideoDetails
                        video={video}
                        actions={DetailsActions}
                    />
                }
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
                        <VideoDetails
                            video={video}
                            actions={DetailsActions}
                        />
                        <Stack height={1000} background={"red"} width={5}></Stack>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}