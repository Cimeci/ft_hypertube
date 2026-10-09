"use server";
import {Video} from "@/types/Video";
import {
    VIDEO_FRANK_00,
    VIDEO_FRANK_01,
    VIDEO_FRANK_02,
    VIDEO_FRANK_03,
    VIDEO_FRANK_04,
    VIDEO_FRANK_05,
    VIDEO_FRANK_06
} from "@/mock/video";

export const getVideoFeed = async (): Promise<Video[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
        VIDEO_FRANK_00,
        VIDEO_FRANK_01,
        VIDEO_FRANK_02,
        VIDEO_FRANK_03,
        VIDEO_FRANK_04,
        VIDEO_FRANK_05,
        VIDEO_FRANK_06,
    ];
}