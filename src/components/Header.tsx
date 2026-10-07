import Logo from "@/components/ui/Logo";
import Stack from "@/components/ui/Stack";
import {Button} from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import {useTranslations} from "next-intl";

export default function Header() {
    const t = useTranslations();

    return (
        <Stack height={80} vAlign={"center"} padding={20} background={"gradientBackgroundBottom"} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
            <Stack
                direction={"horizontal"}
                width={"100%"}
                maxWidth={1200}
                vAlign={"center"}
                gap={"auto"}
            >
                <Logo size={30} />

                <Stack direction={"horizontal"} vAlign={"center"}>
                    <Button
                        variant={"borderless"}
                        href={"/auth/register"}
                        transitionHref
                    >
                        {t("auth.register.action")}
                    </Button>
                    <Button
                        variant={"primary"}
                        left={ <Icon name={"arrow-right"} /> }
                        href={"/auth/login"}
                        transitionHref
                    >
                        {t("auth.login.action")}
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    )
}