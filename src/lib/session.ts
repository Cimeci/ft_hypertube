import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { Auth } from "@/lib/auth";

export const getSession = cache(async () =>
    Auth.api.getSession({ headers: await headers() })
);