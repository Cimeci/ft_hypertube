"use client"
import styles from "./Player.module.css";
import Stack from "@/components/ui/Stack";
import {ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import {useMotionValue} from "framer-motion";

export interface PlayerProps {
    src: string;
}

export default function Player({ src }: PlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressBarRef = useRef<HTMLInputElement>(null);

    const videoProgress = useMotionValue<number>(0);

    const frameId = useRef<number | null>(null);

    const [progress, setProgress] = useState<number>(0);

    const updateVideoProgress = useCallback(() => {
        const update = () => {
            if (!videoRef.current) return;
            videoProgress.set(videoRef.current.currentTime / videoRef.current.duration);
            setProgress(videoRef.current.currentTime / videoRef.current.duration);
            frameId.current = requestAnimationFrame(update);
        }
        frameId.current = requestAnimationFrame(update);
    }, [videoProgress]);

    const togglePlayPause = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    }, [])

    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case " ":
                togglePlayPause();
        }
    }, [togglePlayPause]);

    const handleProgressionChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        videoRef.current.pause();
        videoRef.current.currentTime = e.target.valueAsNumber * videoRef.current.duration;
    }

    const handleWheelProgression = useCallback((e: WheelEvent) => {
        e.preventDefault();
        if (!videoRef.current) return;
        videoRef.current.currentTime += (e.deltaX * 0.1) / videoRef.current.duration * -1;
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    useEffect(() => {
        updateVideoProgress();

        return () => {
            if (frameId.current) cancelAnimationFrame(frameId.current);
        }
    }, [updateVideoProgress]);

    useEffect(() => {
        if (!progressBarRef.current) return;
        progressBarRef.current.addEventListener("wheel", handleWheelProgression);
        return () => {
            if (!progressBarRef.current) return;
            progressBarRef.current.removeEventListener("wheel", handleWheelProgression);
        }
    }, [handleWheelProgression, progressBarRef]);

    return (
        <div
            style={{ position: "relative", background: "#F00", width: "fit-content", height: "fit-content" }}
        >
            <video
                ref={videoRef}
                src={src}
                loop
                onClick={togglePlayPause}
            />
            <Stack
                hAlign={"end"}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%)",
                    zIndex: 1,
                }}
            >
                <input
                    ref={progressBarRef}
                    type="range"
                    min={0}
                    max={1}
                    step={0.0001}
                    className={styles.progressBar}
                    value={progress}
                    onChange={handleProgressionChange}
                />
                <Stack
                    direction={"horizontal"}
                    vAlign={"center"}
                    gap={10}
                    padding={10}
                    height={50}
                    background={"pink"}
                    style={{ marginTop: -20 }}
                >

                </Stack>
            </Stack>
        </div>
    )
}