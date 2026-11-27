import { NextRequest, NextResponse } from "next/server";
import {getSession} from "@/lib/session";

export async function proxy(request: NextRequest) {
    const url = request.nextUrl.pathname;

    const session = await getSession();


    if (url.startsWith("/auth")) {
        console.log(new URL("/popular", request.url))
        if (session) return NextResponse.redirect(new URL("/popular", request.url));
        return NextResponse.next();
    }

    if (!session) return NextResponse.redirect(new URL("/auth/login", request.url));
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/auth/:path*',
        '/popular/:path*',
        '/explore/:path*',
        '/following/:path*',
        '/profile/:path*',
    ],
};