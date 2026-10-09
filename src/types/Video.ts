import {Hashtag} from "@/types/Hashtag";
import {Media} from "@/types/Media";

export interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    duration: number;
    postedAt: Date;
    views: number;
    likes: number;
    comments: number;
    hashtags: Hashtag[];
    medias: Media[];
}