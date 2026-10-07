import {AnimatePresence} from "motion/react";
import {Typography} from "@/components/ui/Typography";
import {useTranslations} from "next-intl";

export interface AuthErrorTypographyProps {
    error?: string;
}

export default function AuthErrorTypography({error}: AuthErrorTypographyProps) {
    const t = useTranslations();

    return (
        <AnimatePresence>
            {error && (
                <Typography
                    variant={"caption"}
                    color={"red"}
                    animated
                    key={"auth_error"}
                    initial={{ translateY: -20, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    exit={{ translateY: 5, opacity: 0, transition: { duration: .1 } }}
                >
                    {t(`auth.error.${error}`)}
                </Typography>
            )}
        </AnimatePresence>
    )
}