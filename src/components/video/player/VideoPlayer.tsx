import styles from "./VideoPlayer.module.css";
import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from "react";
import {motion, useMotionValue, useTransform} from "framer-motion";
import {animate, MotionStyle} from "motion";
import { useMediaQuery } from 'usehooks-ts'
import MuteButton from "@/components/MuteButton";

export interface VideoPlayerProps {
    src?: string;
    ratio?: number;
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

    const [windowWidth, setWindowWidth] = useState(0);
    const [windowHeight, setWindowHeight] = useState(0);

    const speedUpTimeout = useRef<NodeJS.Timeout | null>(null);

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
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
    }

    const getRelativeTouchPosition = (e: TouchEvent): number => {
        if (!videoRef.current) return -1;

        const touch = e.touches[0];
        const rect = videoRef.current.getBoundingClientRect();
        return ((touch.clientX - rect.x) / rect.width);
    }

    const handleVideoTouchStart = useCallback((e: TouchEvent) => {
        if (!videoRef.current) return;

        const posY = getRelativeTouchPosition(e);

        if (speedUpTimeout.current) clearTimeout(speedUpTimeout.current);

        speedUpTimeout.current = setTimeout(() => {
            if (posY < 0.8) return;
            speedUpTimeout.current = null;
            if (!videoRef.current) return;
            videoRef.current.playbackRate = 2.0;
        }, 500);
    }, []);

    const handleVideoTouchEnd = useCallback((e: TouchEvent) => {
        if (!videoRef.current) return;
        e.preventDefault();

        if (speedUpTimeout.current) {
            clearTimeout(speedUpTimeout.current);
            speedUpTimeout.current = null;
            videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        } else {
            videoRef.current.playbackRate = 1.0;
        }
    }, []);


    useImperativeHandle(ref, () => ({
        play,
        stop,
    }), [play, stop]);

    useEffect(() => {
        if (!videoRef.current) return;
        handleResize();
        document.addEventListener("resize", handleResize);
        videoRef.current.addEventListener("touchstart", handleVideoTouchStart, { passive: false });
        videoRef.current.addEventListener("touchend", handleVideoTouchEnd, { passive: false });

        return () => {
            document.removeEventListener("resize", handleResize);
            if (videoRef.current) {
                videoRef.current.removeEventListener("touchstart", handleVideoTouchStart);
                videoRef.current.removeEventListener("touchend", handleVideoTouchEnd);
            }
            unwatchVideoProgress();
        }
    }, [handleVideoTouchEnd, handleVideoTouchStart, unwatchVideoProgress]);

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
            [windowWidth, 113]
        ),
        height: useTransform(
            detailsScaling,
            [0, 1],
            [windowHeight, 200]
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

    const topActionsAnimatedStyle: MotionStyle = {
        width: windowWidth,
        opacity: useTransform(
            detailsScaling,
            [0, 1],
            [1, 0]
        ),
        y: useTransform(
            detailsScaling,
            [0, 1],
            [0, -80]
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
                playsInline
                style={{
                    objectFit: (props.ratio ?? 0) >= 1 ? 'contain' : undefined,
                }}
            />
            <motion.div
                className={styles.topAction}
                style={topActionsAnimatedStyle}
            >
                <MuteButton isMuted={props.muted} onClick={props.toggleMute} />
                <button>Subtitle</button>
                <button>Fullscreen</button>
            </motion.div>
            <button onClick={props.onToggleDetails}>
                Toggle comment
            </button>

            <motion.span style={{ scaleX: videoProgress }}/>
        </motion.div>
    )
});
VideoPlayer.displayName = "VideoList";

export default VideoPlayer;