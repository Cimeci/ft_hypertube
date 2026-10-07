"use client";
import Stack from "@/components/ui/Stack";
import {useEffect, useState} from "react";
import Logo from "@/components/ui/Logo";
import {AnimatePresence} from "motion/react";

export default function Home() {
    const videoUrl = "/video/sample_video_large.m4v";

    const [src, setSrc] = useState<string | undefined>(undefined);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let objectUrl: string;
        (async () => {
            const res = await fetch(videoUrl);
            const total = Number(res.headers.get("Content-Length")) || 0;
            if (!res.body) return;
            const reader = res.body.getReader();
            let received = 0;
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;
                if (total) setProgress(Math.round((received / total) * 100)); // real % downloaded
            }

            objectUrl = URL.createObjectURL(new Blob(chunks));
            setSrc(objectUrl);
        })();

        return () => {
            if (src) URL.revokeObjectURL(objectUrl);
        }
    }, [src, videoUrl]);

    return (
        <Stack height={"100dvh"} style={{ position: "relative", overflow: "hidden" }}>
            <AnimatePresence>
            {!src && (
                <Stack
                    background={"background"}
                    vAlign={"center"}
                    hAlign={"center"}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1000,
                    }}
                    animated
                    initial={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    key={"entry_loading"}
                >
                    <Stack
                        width={80}
                        height={80}
                        background={"purple"}
                        vAlign={"start"}
                        hAlign={"end"}
                        padding={7}
                        style={{ position: "relative", scale: 1 + (progress / 100) * 0.2, transition: ".2s ease-in-out"}}
                    >
                        <Logo size={24} color={"#EA76FF"} />
                        <Stack
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: 200,
                                transform: `scaleY(${1 - (progress / 100)})`,
                                transformOrigin: "top",
                                backdropFilter: "grayscale(1) brightness(0.5)",
                                transition: ".2s ease-in-out",
                            }}
                        />
                    </Stack>
                </Stack>
            )}
            </AnimatePresence>
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: "absolute",
                    inset: 0,
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    zIndex: -1,
                }}
                src={src}
            />
            <Stack background={"gradientBackgroundTop"} height={"100dvh"} flex={1}>
            </Stack>
        </Stack>
    );
}
