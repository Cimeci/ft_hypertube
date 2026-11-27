"use client";

import {createContext, useContext, type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth-client";

export interface ContextUser {
    id: string;
    name: string;
    email: string;
    image: string | null;
}

interface UserContextValue {
    user: ContextUser | null;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({user, children}: {user: ContextUser | null; children: ReactNode}) {
    const router = useRouter();

    const logout = async () => {
        const {error} = await authClient.signOut();
        if (error) return;
        router.push("/auth/login");
        router.refresh();
    };

    return (
        <UserContext.Provider value={{user, logout}}>
            {children}
        </UserContext.Provider>
    );
}

export default function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used inside UserProvider");
    return context;
}
