import Stack from "@/components/ui/Stack";
import {Typography} from "@/components/ui/Typography";
import {useTranslations} from "next-intl";
import {Providers} from "@/lib/auth";
import OAuthButtons from "@/components/auth/OAuthButtons";
import Divider from "@/components/ui/Divider";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
    const t = useTranslations();

    return (
        <Stack
            component={"main"}
            direction={"horizontal"}
            width={"100%"}
            hAlign={"center"}
            height={"calc(100dvh - 60px)"}
        >
            <Stack padding={[40, 20, 20, 20]} maxWidth={600} width={"100%"} gap={30} wrap={false}>
                <Stack>
                    <Typography variant={"title"}>{t("auth.login.title")}</Typography>
                    <Typography variant={"caption"} color={"lightSecondary"}>{t("auth.login.description")}</Typography>
                </Stack>

                <OAuthButtons
                    providers={Object.entries(Providers).map(([name, provider]) => ({
                        id: name,
                        name: provider.name,
                        backgroundColor: provider.backgroundColor,
                        textColor: provider.textColor,
                    }))}
                />

                <Divider text={t("action.or")}/>

                <LoginForm />
            </Stack>
        </Stack>
    );
}