"use client";
import {useTranslations} from "next-intl";
import {SubmitEvent, useState} from "react";
import {authClient} from "@/lib/auth-client";
import TextInput from "@/components/ui/TextInput";
import Stack from "@/components/ui/Stack";
import {Button} from "@/components/ui/Button";
import AuthErrorTypography from "@/components/auth/AuthErrorTypography";
import {Typography} from "@/components/ui/Typography";
import OAuthButtons, {OAuthButton} from "@/components/auth/OAuthButtons";
import Divider from "@/components/ui/Divider";
import {AnimatePresence} from "motion/react";
import {TargetAndTransition} from "motion";
import {useRouter} from "next/navigation";

export default function SignupForm({ providers }: { providers: OAuthButton[] }) {
    const t = useTranslations();
    const router = useRouter();

    const [page, setPage] = useState<number>(0);

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [name, setName] = useState<string>("");

    const [error, setError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);

    const initialPageTransition: TargetAndTransition = { translateX: 30, opacity: 0 }
    const currentPageTransition: TargetAndTransition = { translateX: 0, opacity: 1 }
    const exitPageTransition: TargetAndTransition = { translateX: -30, opacity: 0 }

    const backPage = () => {
        setError(undefined);
        setLoading(false);
        setPage(page - 1);
    }
    const nextPage = () => {
        setError(undefined);
        setLoading(false);
        setPage(page + 1);
    }

    const handleEmailVerification = async (e: SubmitEvent<HTMLDivElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(undefined);

        const valid_email: boolean = !!(email
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            ));

        if (!valid_email) {
            setError("invalid_email");
            setLoading(false);
            return;
        }

        nextPage();
    }

    const handlePasswordVerification = async (e: SubmitEvent<HTMLDivElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(undefined);

        if (password !== confirmPassword) {
            setError("passwords_dont_match");
            setLoading(false);
            return;
        }

        nextPage();
    }

    const handleNameVerification = async (e: SubmitEvent<HTMLDivElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(undefined);

        if (name.length < 3) {
            setError("name_too_short");
            setLoading(false);
            return;
        }

        handleEmailSignup();
    }

    const handleEmailSignup = async () => {
        setTimeout(async () => {
            const {error} = await authClient.signUp.email({
                email,
                password,
                name,
                callbackURL: "/explore"
            })
            if (error) {
                setError((error.code ?? "UNEXPECTED_ERROR").toLowerCase())
                setLoading(false);
                return
            }
            nextPage()
            setTimeout(() => router.push("/explore"), 500)
        }, 400)
    }

    return (
        <AnimatePresence mode={"wait"}>
            {page === 0 && (
                <Stack animated initial={initialPageTransition} animate={currentPageTransition} exit={exitPageTransition} key={"page0_email"}>
                    <Stack>
                        <Typography variant={"title"}>{t("auth.register.title.step0")}</Typography>
                        <Typography variant={"caption"} color={"lightSecondary"}>{t("auth.register.description")}</Typography>
                    </Stack>

                    <OAuthButtons providers={providers}/>

                    <Divider text={t("action.or")}/>

                    <Stack component={"form"} gap={30} onSubmit={handleEmailVerification}>
                        <Stack>
                            <TextInput
                                autoFocus
                                icon={"at-symbol"}
                                placeholder={t("auth.email.nousername.placeholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <AuthErrorTypography error={error} />
                            <Typography
                                variant={"caption"}
                                color={"lightSecondary"}
                                href={"/auth/login"}
                                bold={400}
                            >
                                {t("auth.login.accountexist.action")}
                            </Typography>
                        </Stack>


                        <Button
                            variant={"primary"}
                            disabled={loading}
                            key={"page0_next"}
                            submit
                        >
                            {t("action.next")}
                        </Button>
                    </Stack>
                </Stack>
            )}

            {page === 1 && (
                <Stack
                    animated
                    initial={initialPageTransition}
                    animate={currentPageTransition}
                    exit={exitPageTransition}
                    key={"page1_password"}
                    gap={30}
                    component={"form"}
                    onSubmit={handlePasswordVerification}
                >
                    <Stack>
                        <Typography variant={"title"}>{t("auth.register.title.step1")}</Typography>
                        <Typography variant={"caption"} color={"lightSecondary"}>{t("auth.register.description")}</Typography>
                    </Stack>

                    <Stack gap={20}>
                        <TextInput
                            autoFocus
                            icon={"key"}
                            placeholder={t("auth.password.placeholder")}
                            secured={true}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <TextInput
                            icon={"key"}
                            placeholder={t("auth.password.confirm.placeholder")}
                            secured={true}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <AuthErrorTypography error={error}/>
                    </Stack>

                    <Stack direction={"horizontal"} width={"100%"} wrap={false}>
                        <Button
                            disabled={loading}
                            key={"page1_back"}
                            onClick={backPage}
                            width={"50%"}
                            tabIndex={1}
                        >
                            {t("action.back")}
                        </Button>
                        <Button
                            variant={"primary"}
                            disabled={loading || !(password.length) || !(confirmPassword.length)}
                            key={"page1_next"}
                            onClick={nextPage}
                            width={"50%"}
                            submit
                        >
                            {t("action.next")}
                        </Button>
                    </Stack>
                </Stack>
            )}

            {page === 2 && (
                <Stack
                    animated
                    initial={initialPageTransition}
                    animate={currentPageTransition}
                    exit={exitPageTransition}
                    key={"page2_name"}
                    gap={30}
                    component={"form"}
                    onSubmit={handleNameVerification}
                    animatedLayout
                    height={"100dvh"}
                >
                    <Stack>
                        <Typography variant={"title"}>{t("auth.register.title.step2")}</Typography>
                        <Typography variant={"caption"} color={"lightSecondary"}>{t("auth.register.description")}</Typography>
                    </Stack>

                    <Stack>
                        <TextInput
                            icon={"user"}
                            placeholder={t("auth.name.placeholder")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />

                        <AuthErrorTypography error={error}/>
                    </Stack>

                    <Stack direction={"horizontal"} width={"100%"} wrap={false} >
                        <Button
                            disabled={loading}
                            key={"page2_back"}
                            layoutId={"page2_back"}
                            onClick={backPage}
                            width={"50%"}
                        >
                            {t("action.back")}
                        </Button>
                        <Button
                            variant={"primary"}
                            disabled={loading || !(name.length)}
                            key={"page2_next"}
                            layoutId={"page2_next"}
                            onClick={nextPage}
                            width={"50%"}
                        >
                            {t("auth.register.action")}
                        </Button>
                    </Stack>
                </Stack>
            )}
        </AnimatePresence>
    )
}