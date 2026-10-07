"use client"
import {ReactNode, useCallback, useContext, useEffect, createContext, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import { motion } from "motion/react";

type TransitionState = "initial" | "pending" | "done";
type PageTransitionContextProps = {
    navigate: (href: string) => void;
    state: TransitionState;
    isPending: boolean;
};

const PageTransitionContext = createContext<PageTransitionContextProps | null>(null);

export function PageTransitionProvider({children}: { children: ReactNode; }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<TransitionState>("initial");

    const navigate = useCallback((href: string) => {
        startTransition(() => {
            router.push(href);
        });
    }, [router]);

    useEffect(() => {
        if (isPending) {
            setState("pending");
        } else {
            setState("done");
            setTimeout(() => {
                setState("initial");
            }, 500);
        }
    }, [isPending]);

    return (
        <PageTransitionContext.Provider
            value={{
                navigate,
                state,
                isPending,
            }}
        >
            {children}
            <motion.span
                className={"loadingBar"}
                variants={{
                    initial: {
                        left: 0,
                        width: 5,
                        scale: 0.5,
                        opacity: 0,
                        transition: {
                            duration: 0,
                        }
                    },
                    pending: {
                        left: 0,
                        width: "calc(70% - 20px)",
                        scale: 1,
                        opacity: 1,
                    },
                    done: {
                        left: "calc(100% - 5px)",
                        width: 5,
                        scale: 1,
                        opacity: 0,
                    }
                }}
                initial={"initial"}
                animate={state}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 30,
                }}
            />
        </PageTransitionContext.Provider>

    );
}

export default function usePageTransition() {
    const context = useContext(PageTransitionContext);

    if (!context) {
        throw new Error("usePageTransition must be used inside PageTransitionProvider");
    }

    return context;
}