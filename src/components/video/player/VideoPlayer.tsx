import styles from "./VideoPlayer.module.css";
import {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import {motion, useMotionValue, useTransform} from "framer-motion";
import {animate, MotionStyle} from "motion";
import { useMediaQuery } from 'usehooks-ts'

export interface VideoPlayerProps {
    src?: string;
    onToggleDetails?: () => void;
    mini: boolean;
    muted: boolean;
    toggleMute: () => void;
}

export type VideoPlayerRef = {
    play: () => void;
    stop: () => void;
};

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>((props, ref) => {
    const isMobile = useMediaQuery('(max-width: 650px)')
    const videoPlayerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const frameId = useRef<number>(null);
    const videoProgress = useMotionValue(0);
    const detailsScaling = useMotionValue(0);

    const windowWidth = useRef(0);
    const windowHeight = useRef(0);

    const play = () => {
        if (!videoRef.current) return;
        watchVideoProgress();
        videoRef.current.play();
    }

    const stop = () => {
        if (!videoRef.current) return;
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        unwatchVideoProgress();
    }

    const updateVideoProgress = () => {
        if (!videoRef.current) return;
        videoProgress.set(videoRef.current.currentTime / videoRef.current.duration);
        watchVideoProgress();
    }

    const watchVideoProgress = () => {
        frameId.current = requestAnimationFrame(updateVideoProgress);
    }

    const unwatchVideoProgress = () => {
        if (frameId.current) cancelAnimationFrame(frameId.current);
        videoProgress.set(0);
    }

    const handleResize = () => {
        windowWidth.current = window.innerWidth;
        windowHeight.current = window.innerHeight;
    }

    useImperativeHandle(ref, () => ({
        play,
        stop,
    }), []);

    useEffect(() => {
        handleResize();
        document.addEventListener("resize", handleResize);
        return () => {
            document.removeEventListener("resize", handleResize);
            unwatchVideoProgress();
        }
    }, []);

    useEffect(() => {
        animate(
            detailsScaling,
            props.mini ? 1 : 0,
            {
                type: "spring",
                stiffness: 400,
                damping: 50,
            }
        )
    }, [detailsScaling, props.mini]);

    const videoPlayerAnimatedStyle: MotionStyle = {
        width: useTransform(
            detailsScaling,
            [0, 1],
            [windowWidth.current, 113]
        ),
        height: useTransform(
            detailsScaling,
            [0, 1],
            [windowHeight.current, 200]
        ),
        borderRadius: useTransform(
            detailsScaling,
            [0, 1],
            [0, 10]
        ),
        marginTop: useTransform(
            detailsScaling,
            [0, 1],
            [0, 20]
        ),
    }

    useEffect(() => {
        if (!isMobile && videoPlayerRef.current) {
            videoPlayerRef.current.style.removeProperty('width')
            videoPlayerRef.current.style.removeProperty('height')
            videoPlayerRef.current.style.removeProperty('border-radius')
            videoPlayerRef.current.style.removeProperty('margin-top')
        }

    }, [isMobile])

    return (
        <motion.div
            ref={videoPlayerRef}
            className={styles.videoPlayer}
            style={isMobile ? videoPlayerAnimatedStyle : {
                width: undefined,
                height: undefined,
                borderRadius: undefined,
                marginTop: undefined,
            }}
        >
            <video
                ref={videoRef}
                src={props.src}
                loop
                muted={props.muted}
            />
            <button onClick={props.onToggleDetails}>Toggle comment</button>
            <button onClick={props.toggleMute}>Toggle mute</button>
            <motion.span style={{ scaleX: videoProgress }}/>
        </motion.div>
    )
});
VideoPlayer.displayName = "VideoList";

export default VideoPlayer;