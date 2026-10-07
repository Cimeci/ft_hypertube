import {ReactNode} from "react";
import Stack from "@/components/ui/Stack";
import Logo from "@/components/ui/Logo";
import TransitionLink from "@/components/ui/TransitionLink";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main style={{ marginTop: 60 }}>
            <Stack height={80} vAlign={"center"} padding={20} background={"gradientBackgroundBottom"} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
                <TransitionLink href={"/"}>
                    <Logo size={30}/>
                </TransitionLink>
            </Stack>
            {children}
        </main>
    )
}