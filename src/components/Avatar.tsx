"use client";
import {AnimatePresence, motion} from "motion/react";
import {useCallback, useEffect, useState} from "react";
import {Alert} from "@getpapillon/papicons";
import {ColorToCSS} from "@/components/ui/utils";

export interface AvatarProps {
    src: string | null;
    alt: string | null;
    size?: number;
}

export function Avatar({ src, alt, ...props }: AvatarProps) {
    const size = props.size ?? 28;

    const [imageBlob, setImageBlob] = useState<string | null>(null);
    const [error, setError] = useState<boolean>(false);

    const fetchImage = useCallback(async () => {
        if (!src) return null;
        const response = await fetch(src);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }, [src]);

    useEffect(() => {
        fetchImage()
            .then(setImageBlob)
            .catch(() => setError(true));
    }, [fetchImage, src]);

    return (
        <motion.button
            style={{
                width: size,
                height: size,
                overflow: "hidden",
                borderRadius: "50%",
                outline: "1px solid var(--border-light)",
                outlineOffset: "-1px",
                backgroundColor: "var(--surface-light-tertiary)",
                animation: imageBlob ? undefined : "pulse 2s infinite",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 800, damping: 17 }}
            disabled={!error}
            onClick={() => {
                setError(false);
                setImageBlob(null);
                fetchImage()
                    .then(setImageBlob)
                    .catch(() => setError(true));
            }}
        >
            <AnimatePresence mode={"wait"}>
                {imageBlob && !error && (
                    <motion.img
                        key="image"
                        src={imageBlob}
                        onError={() => setError(true)}
                        alt={alt ?? "Avatar"}
                        style={{
                            width: size,
                            height: size,
                            objectFit: "cover",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                )}
                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        transition={{ type: "spring", stiffness: 800, damping: 40 }}
                    >
                        <Alert
                            size={size * 0.75}
                            color={ColorToCSS("red")}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    )
}