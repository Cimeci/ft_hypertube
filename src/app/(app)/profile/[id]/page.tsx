import {authClient} from "@/lib/auth-client";
import {Auth} from "@/lib/auth";
import {getSession} from "@/lib/session";
import {Suspense} from "react";
import {Typography} from "@/components/ui/Typography";

async function Content() {
    const session = await getSession();
    if (!session) return <p>Not logged in.</p>;

    return (
        <p>{session.user.id}</p>
    )
}

export default function ProfilePage() {
    return (
        <main>
            <Typography>Hello</Typography>
            <Suspense fallback={<Typography skeleton>XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</Typography>}>
                <Content/>
            </Suspense>
        </main>
    )
}