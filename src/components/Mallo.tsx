import Image from "next/image"

export interface MalloProps {
    mallo: "angry" | "cool" | "crying" | "dead" | "grimace" | "grin" | "heart-eyes" | "joyful-smiley" | "joyful" | "kiss-heart" | "kissy" | "large-grin" | "licking-lips" | "lit" | "meh" | "pensive" | "post-cool" | "purterbed" | "shocked" | "smiley" | "smirk" | "squink-stuck-out-tongue" | "squished" | "stuck-out-tongue" | "super-smiley" | "surprised" | "wink-stuck-out-tongue" | "wink"
    size?: number;
}

export function Mallo({mallo, size}: MalloProps) {
    return <Image
        src={`/mallo/${mallo}.png`}
        alt={`Mallo ${mallo}`}
        width={size}
        height={size}
    />
}