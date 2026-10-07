import Stack from "@/components/ui/Stack";
import {Providers} from "@/lib/auth";
import SignupForm from "@/components/auth/SignupForm";

export default function LoginPage() {
    return (
        <Stack
            component={"main"}
            direction={"horizontal"}
            width={"100%"}
            hAlign={"center"}
            height={"calc(100dvh - 60px)"}
        >
            <Stack padding={[40, 20, 20, 20]} maxWidth={600} width={"100%"} gap={30} wrap={false}>
                <SignupForm
                    providers={Object.entries(Providers).map(([name, provider]) => ({
                        id: name,
                        name: provider.name,
                        backgroundColor: provider.backgroundColor,
                        textColor: provider.textColor,
                    }))}
                />
            </Stack>
        </Stack>
    );
}