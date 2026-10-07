import {AnimatePresence, motion} from "motion/react";
import {Transition} from "motion";
import {ColorToCSS} from "@/components/ui/utils";

export interface MuteButtonProps {
    isMuted: boolean;
    onClick: () => void;
}

export default function MuteButton(props: MuteButtonProps) {
    const transition: Transition = {
        type: "spring",
        stiffness: 800,
        damping: 40,
    }

    return (
        <motion.button
            onClick={props.onClick}
            style={{
                border: "1px solid var(--border-light)",
                height: 42,
                width: 42,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: ColorToCSS("darkSecondary"),
                color: ColorToCSS("textLight"),
                backdropFilter: "blur(15px)",
            }}
            whileTap={{
                scale: 0.9,
            }}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={"currentColor"} xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M8.58579 5.99995C9.84572 4.74002 12 5.63236 12 7.41417V16.5857C12 18.3675 9.84572 19.2598 8.58579 17.9999L5.58579 14.9999H4C2.89543 14.9999 2 14.1045 2 12.9999V10.9999C2 9.89538 2.89543 8.99995 4 8.99995H5.58579L8.58579 5.99995Z"
                />
                <AnimatePresence initial={false} mode={"sync"}>
                    {props.isMuted ? (
                        <motion.path
                            key={"cross"}
                            d="M16.2071 8.7929C15.8166 8.40237 15.1834 8.40237 14.7929 8.7929C14.4024 9.18342 14.4024 9.81659 14.7929 10.2071L16.5858 12L14.7929 13.7929C14.4024 14.1834 14.4024 14.8166 14.7929 15.2071C15.1834 15.5976 15.8166 15.5976 16.2071 15.2071L18 13.4142L19.7929 15.2071C20.1834 15.5976 20.8166 15.5976 21.2071 15.2071C21.5976 14.8166 21.5976 14.1834 21.2071 13.7929L19.4142 12L21.2071 10.2071C21.5976 9.81659 21.5976 9.18342 21.2071 8.7929C20.8166 8.40237 20.1834 8.40237 19.7929 8.7929L18 10.5858L16.2071 8.7929Z"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{delay: props.isMuted ? .2 : 0, ...transition}}
                        />
                    ):(
                        <>
                            <motion.path
                                key={"wave_1"}
                                d="M14 10C14 9.44772 14.4477 9 15 9C16.6569 9 18 10.3431 18 12C18 13.6569 16.6569 15 15 15C14.4477 15 14 14.5523 14 14C14 13.4477 14.4477 13 15 13C15.5523 13 16 12.5523 16 12C16 11.4477 15.5523 11 15 11C14.4477 11 14 10.5523 14 10Z"
                                initial={{ scale: 0.8, opacity: 0, x: -1 }}
                                animate={{ scale: 1, opacity: 1, x: 0 }}
                                exit={{ scale: 0.8, opacity: 0, x: -1 }}
                                transition={{delay: props.isMuted ? 0 : 0, ...transition}}
                            />
                            <motion.path
                                key={"wave_2"}
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M14 6C14 5.44772 14.4477 5 15 5C18.866 5 22 8.13401 22 12C22 15.866 18.866 19 15 19C14.4477 19 14 18.5523 14 18C14 17.4477 14.4477 17 15 17C17.7614 17 20 14.7614 20 12C20 9.23858 17.7614 7 15 7C14.4477 7 14 6.55228 14 6Z"
                                initial={{ scale: 0.8, opacity: 0, x: -1 }}
                                animate={{ scale: 1, opacity: 1, x: 0 }}
                                exit={{ scale: 0.8, opacity: 0, x: -1 }}
                                transition={{delay: props.isMuted ? 0 : 0.1, ...transition}}
                            />
                        </>
                    )}
                </AnimatePresence>
            </svg>
        </motion.button>
    )
}