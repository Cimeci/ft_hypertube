import {NextIntlClientProvider} from "next-intl";
import {ContextUser, UserProvider} from "@/components/UserProvider";
import {Sidebar} from "@/components/sidebar/Sidebar";
import {getSession} from "@/lib/session";

export default async function AppLayout({children}: {children: React.ReactNode}) {
    const session = await getSession();
    const user: ContextUser | null = session ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
    } : null;

    return (
        <NextIntlClientProvider>
            <UserProvider user={user}>
                <Sidebar>
                {children}
                </Sidebar>
            </UserProvider>
        </NextIntlClientProvider>
    );
}