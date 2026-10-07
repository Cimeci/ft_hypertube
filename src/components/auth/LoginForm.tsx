"use client";
import {useTranslations} from "next-intl";
import {SubmitEvent, useState} from "react";
import {authClient} from "@/lib/auth-client";
import TextInput from "@/components/ui/TextInput";
import Stack from "@/components/ui/Stack";
import {Button} from "@/components/ui/Button";
import AuthErrorTypography from "@/components/auth/AuthErrorTypography";
import {Typography} from "@/components/ui/Typography";

export default function LoginForm() {
    const t = useTranslations();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);

    const handleEmailLogin = async (event: SubmitEvent<HTMLDivElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(undefined);
        setTimeout(async () => {
            const {error} = await authClient.signIn.email({
                email,
                password,
                callbackURL: "/home"
            })
            if (error) setError((error.code ?? "UNEXPECTED_ERROR").toLowerCase())
            setLoading(false);
        }, 400)
    }

    return (
        <Stack
            flex={1}
            height={300}
            component={"form"}
            onSubmit={(e) => handleEmailLogin(e)}
            gap={30}
            animatedLayout
        >
            <Stack>
                <TextInput
                    icon={"user"}
                    placeholder={t("auth.email.placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextInput
                    icon={"key"}
                    placeholder={t("auth.password.placeholder")}
                    secured={true}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <AuthErrorTypography error={error} />
                <Stack gap={5}>
                <Typography
                    variant={"caption"}
                    color={"lightSecondary"}
                    href={"/auth/register"}
                    bold={400}
                >
                    {t("auth.password.forgot.action")}
                </Typography>
                <Typography
                    variant={"caption"}
                    color={"lightSecondary"}
                    href={"/auth/register"}
                    bold={400}
                >
                    {t("auth.login.noaccount.action")}
                </Typography>
                </Stack>
            </Stack>
            <Button
                variant={"primary"}
                submit
                disabled={loading}
                layoutId={"login_button"}
            >
                {t("auth.login.action")}
            </Button>
        </Stack>
    )
}