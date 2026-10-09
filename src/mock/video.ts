import {Video} from "@/types/Video";
import {
    HASHTAG_FRANK,
    HASHTAG_FYP,
    HASHTAG_LEBOEUF,
    HASHTAG_VENDEZVOTREVOITURE,
    HASHTAG_EDIT,
    HASHTAG_FOOTBALL,
    HASHTAG_VIRAL,
    HASHTAG_LOSTMEDIA,
    HASHTAG_PRESIDENT,
    HASHTAG_FRANCE,
    HASHTAG_BASED,
    HASHTAG_LEGEND,
    HASHTAG_FUNNY
} from "@/mock/hashtag";

export const VIDEO_FRANK_00: Video = {
    id: "eb574a3e-e7e5-415f-bfa2-fba99b417ebf",
    title: "Frank l'edit",
    description: "This is a sample video for testing LostMedia. (and yes we love Frank at LostMedia)",
    thumbnail: "/sample.jpg",
    duration: 120,
    postedAt: new Date("01-09-2026"),
    views: 17392,
    likes: 284,
    comments: 2,
    hashtags: [
        HASHTAG_FRANK,
        HASHTAG_LEBOEUF,
        HASHTAG_VENDEZVOTREVOITURE,
        HASHTAG_FYP,
        HASHTAG_EDIT
    ],
    medias: [
        {
            src: "/video/frank00.mp4",
            type: "video/mp4",
            ratio: 9/16
        }
    ]
}

export const VIDEO_FRANK_01: Video = {
    id: "91bcea92-01f8-43dc-9d05-69b248bd72c3",
    title: "Frank LeBœuf aura prévenu",
    description: "Un autre edit de notre Frank national. On ne s'en lasse toujours pas.",
    thumbnail: "/sample.jpg",
    duration: 120,
    postedAt: new Date("02-09-2026"),
    views: 12847,
    likes: 391,
    comments: 14,
    hashtags: [
        HASHTAG_FRANK,
        HASHTAG_LEBOEUF,
        HASHTAG_FOOTBALL,
        HASHTAG_EDIT,
        HASHTAG_FYP,
        HASHTAG_LOSTMEDIA
    ],
    medias: [
        {
            src: "/video/frank01.mp4",
            type: "video/mp4",
            ratio: 1
        }
    ]
};

export const VIDEO_FRANK_02: Video = {
    id: "f4c7a2e1-6b93-4d85-9f21-8a37c5e0b614",
    title: "Frank en roue libre",
    description: "Quand Frank commence à parler, il n'y a plus de retour en arrière.",
    thumbnail: "/sample.jpg",
    duration: 120,
    postedAt: new Date("03-09-2026"),
    views: 24691,
    likes: 672,
    comments: 31,
    hashtags: [
        HASHTAG_FRANK,
        HASHTAG_LEBOEUF,
        HASHTAG_FRANCE,
        HASHTAG_FOOTBALL,
        HASHTAG_FUNNY,
        HASHTAG_EDIT,
        HASHTAG_FYP
    ],
    medias: [
        {
            src: "/video/frank02.mp4",
            type: "video/mp4",
            ratio: 1
        }
    ]
};

export const VIDEO_FRANK_03: Video = {
    id: "2d8e5f91-a473-4c06-b829-1e65f7a3c902",
    title: "Le grand Frank",
    description: "Petit edit, grosse énergie. Frank LeBœuf dans toute sa splendeur.",
    thumbnail: "/sample.jpg",
    duration: 120,
    postedAt: new Date("04-09-2026"),
    views: 31904,
    likes: 914,
    comments: 47,
    hashtags: [
        HASHTAG_FRANK,
        HASHTAG_LEBOEUF,
        HASHTAG_EDIT,
        HASHTAG_FOOTBALL,
        HASHTAG_LEGEND,
        HASHTAG_FYP
    ],
    medias: [
        {
            src: "/video/frank03.mp4",
            type: "video/mp4",
            ratio: 3 / 4
        }
    ]
};

export const VIDEO_FRANK_04: Video = {
    id: "7a31d9c4-e582-46bf-b107-3c94e8f25a61",
    title: "Frank avait raison",
    description: "Impossible de regarder cet extrait sans se dire qu'il avait peut-être raison.",
    thumbnail: "/sample.jpg",
    duration: 120,
    postedAt: new Date("05-09-2026"),
    views: 18753,
    likes: 528,
    comments: 26,
    hashtags: [
        HASHTAG_FRANK,
        HASHTAG_LEBOEUF,
        HASHTAG_FOOTBALL,
        HASHTAG_FRANCE,
        HASHTAG_BASED,
        HASHTAG_EDIT,
        HASHTAG_FYP
    ],
    medias: [
        {
            src: "/video/frank04.mp4",
            type: "video/mp4",
            ratio: 3 / 4
        }
    ]
};

export const VIDEO_FRANK_05: Video = {
    id: "b6e24f73-1c95-4a08-d537-9f62e8b41c05",
    title: "Frank président",
    description: "On demande officiellement à Frank de prendre les commandes.",
    thumbnail: "/sample.jpg",
    duration: 120,
    postedAt: new Date("06-09-2026"),
    views: 42158,
    likes: 1387,
    comments: 83,
    hashtags: [
        HASHTAG_FRANK,
        HASHTAG_LEBOEUF,
        HASHTAG_PRESIDENT,
        HASHTAG_FRANCE,
        HASHTAG_FOOTBALL,
        HASHTAG_EDIT,
        HASHTAG_FYP
    ],
    medias: [
        {
            src: "/video/frank05.mp4",
            type: "video/mp4",
            ratio: 1
        }
    ]
};

export const VIDEO_FRANK_06: Video = {
    id: "c93f18a6-5e72-4b09-8d34-6a27f0e51bc8",
    title: "Frank, tout simplement",
    description: "Pas besoin de contexte. C'est Frank.",
    thumbnail: "/sample.jpg",
    duration: 120,
    postedAt: new Date("07-09-2026"),
    views: 56321,
    likes: 1942,
    comments: 106,
    hashtags: [
        HASHTAG_FRANK,
        HASHTAG_LEBOEUF,
        HASHTAG_FOOTBALL,
        HASHTAG_FYP,
        HASHTAG_VIRAL,
        HASHTAG_LOSTMEDIA
    ],
    medias: [
        {
            src: "/video/frank06.mp4",
            type: "video/mp4",
            ratio: 1
        }
    ]
};