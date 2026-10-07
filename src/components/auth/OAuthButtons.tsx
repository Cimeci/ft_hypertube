"use client"
import Stack from "@/components/ui/Stack";
import {Button} from "@/components/ui/Button";
import {useTranslations} from "next-intl";
import {useState} from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import {authClient} from "@/lib/auth-client";
import AuthErrorTypography from "@/components/auth/AuthErrorTypography";

export interface OAuthButton {
    id: string;
    name: string;
    backgroundColor: string;
    textColor: string;
}

export interface OAuthButtonsProps {
    providers: OAuthButton[];
}

export default function OAuthButtons({ providers }: OAuthButtonsProps) {
    const t = useTranslations();

    const [showMore, setShowMore] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    const handleLogin = async (providerId: string) => {
        setError(undefined);
        const { error } = await authClient.signIn.social({
            provider: providerId,
            callbackURL: "/home"
        });
        setTimeout(() => {
            if (error) setError((error.code ?? "UNEXPECTED_ERROR").toLowerCase())
        }, 80)
    }

    return (
        <Stack>
            {providers.slice(0, showMore ? undefined : 3).map((provider) => (
                <Button
                    key={provider.id}
                    backgroundColor={provider.backgroundColor}
                    color={provider.textColor}
                    scale={0.98}
                    align={"start"}
                    padding={[0, 20]}
                    left={ <Image
                        src={`/social/${provider.id}.png`}
                        alt={`${provider.name} logo`}
                        width={22}
                        height={22}
                    />}
                    onClick={() => handleLogin(provider.id)}
                >
                    {t("auth.oauth.login_with", {provider: provider.name})}
                </Button>
            ))}
            {providers.length > 3 && (
                <Button
                    left={ <Icon name={showMore ? "chevron-up" : "chevron-down"} size={24}/> }
                    scale={0.98}
                    align={"start"}
                    padding={[0, 20]}
                    onClick={() => setShowMore((prev) => !prev)}
                >
                    {showMore ? t("action.showless") : t("action.showmore")}
                </Button>
            )}
            <AuthErrorTypography error={error} />
        </Stack>
    )
}