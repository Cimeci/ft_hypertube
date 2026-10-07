"use client";
import {AnchorHTMLAttributes, ReactNode} from "react";
import Link from "next/link";
import usePageTransition from "@/components/ui/PageTransition";

export interface TransitionLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: ReactNode;
}

export default function TransitionLink(props: TransitionLinkProps) {
    const { navigate } = usePageTransition();

    return <Link
        {...props}
        onClick={(e) => {
            e.preventDefault();

            navigate(props.href)
        }}
    />
}