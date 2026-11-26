"use client";
import {CSSProperties, ReactNode, useEffect, useSyncExternalStore} from "react";

export type KeyboardKey = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "Enter" | "Backspace" | "Tab" | "Shift"  | "Meta" | "Escape" | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Space" | "PageUp" | "PageDown" | "Home" | "End" | "Insert" | "Delete" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11" | "F12";

export interface KeyboardShortcutProps {
    keyboardKey: KeyboardKey;
    ctrl?: boolean;
    alt?: boolean;
    onShortcut?: () => void;
    children?: ReactNode;
    style?: CSSProperties;
}

const emptySubscribe = () => () => {};

function getIsMac() {
    return navigator.userAgent.includes('Mac OS X');
}

function getServerIsMac() {
    return false;
}

export function KeyboardShortcut({ keyboardKey, ctrl, alt, onShortcut, children, style }: KeyboardShortcutProps) {
    const isMac = useSyncExternalStore(
        emptySubscribe,
        getIsMac,
        getServerIsMac
    );

    const ctrlKey = isMac ? "⌘" : "Ctrl";
    const altKey = isMac ? "⌥" : "Alt";

    const keysList: string[] = [
        ...(ctrl ? [ctrlKey] : []),
        ...(alt ? [altKey] : []),
        keyboardKey
    ]

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;

            const ctrlPressed = isMac ? e.metaKey : e.ctrlKey;
            const altPressed = e.altKey;

            const hasCorrectCtrl = ctrlPressed === (ctrl ?? false);
            const hasCorrectAlt = altPressed === (alt ?? false);
            const hasCorrectKey = e.key === keyboardKey;

            if (hasCorrectCtrl && hasCorrectAlt && hasCorrectKey) {
                e.preventDefault();
                onShortcut?.()
            }
        }

        document.addEventListener("keydown", onKeyDown)

        return () => document.removeEventListener("keydown", onKeyDown)
    }, [ctrl, alt, keyboardKey, isMac, onShortcut])

    return children ?? (
        <kbd
            style={{
                width: "fit-content",
                padding: "6px 10px",
                background: "var(--surface-light-tertiary)",
                borderRadius: 40,
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 400,
                color: "var(--text-light-secondary)",
                userSelect: "none",
                WebkitUserSelect: "none",
                ...(style ?? {})
            }}
        >
            {keysList.join(" + ")}
        </kbd>
    );
}