"use server";

interface VideoDetails {
    title: string;
    description: string;
    hashtags: string[];
    posted_at: Date;
}

interface VideoStats {
    views: number;
    likes: number;
    comments: number;
}

export interface Video {
    id: string;
    src: string;
    ratio: number;
    details: VideoDetails;
    stats: VideoStats;
}

const videos: Video[] = [
    {
        id: "eb574a3e-e7e5-415f-bfa2-fba99b417ebf",
        src: "/video/frank00.mp4",
        ratio: 9/16,
        details: {
            title: "Frank l'edit",
            description: "This is a sample video for testing LostMedia. (and yes we love Frank at LostMedia)",
            hashtags: ["frank", "leboeuf", "vendez", "votre", "voiture", "fyp", "edit"],
            posted_at: new Date("01-09-2026")
        },
        stats: {
            views: 17392,
            likes: 284,
            comments: 2
        }
    },
    {
        id: "91bcea92-01f8-43dc-9d05-69b248bd72c3",
        src: "/video/frank01.mp4",
        ratio: 1,
        details: {
            title: "Frank LeBœuf aura prévenu",
            description: "Un autre edit de notre Frank national. On ne s'en lasse toujours pas.",
            hashtags: ["frank", "leboeuf", "football", "edit", "fyp", "lostmedia"],
            posted_at: new Date("02-09-2026")
        },
        stats: {
            views: 12847,
            likes: 391,
            comments: 14
        }
    },
    {
        id: "f4c7a2e1-6b93-4d85-9f21-8a37c5e0b614",
        src: "/video/frank02.mp4",
        ratio: 1,
        details: {
            title: "Frank en roue libre",
            description: "Quand Frank commence à parler, il n'y a plus de retour en arrière.",
            hashtags: ["frank", "leboeuf", "france", "football", "funny", "edit", "fyp"],
            posted_at: new Date("03-09-2026")
        },
        stats: {
            views: 24691,
            likes: 672,
            comments: 31
        }
    },
    {
        id: "2d8e5f91-a473-4c06-b829-1e65f7a3c902",
        src: "/video/frank03.mp4",
        ratio: 3/4,
        details: {
            title: "Le grand Frank",
            description: "Petit edit, grosse énergie. Frank LeBœuf dans toute sa splendeur.",
            hashtags: ["frank", "leboeuf", "edit", "football", "legend", "foryou", "fyp"],
            posted_at: new Date("04-09-2026")
        },
        stats: {
            views: 31904,
            likes: 914,
            comments: 47
        }
    },
    {
        id: "7a31d9c4-e582-46bf-b107-3c94e8f25a61",
        src: "/video/frank04.mp4",
        ratio: 3/4,
        details: {
            title: "Frank avait raison",
            description: "Impossible de regarder cet extrait sans se dire qu'il avait peut-être raison.",
            hashtags: ["frank", "leboeuf", "football", "france", "based", "edit", "fyp"],
            posted_at: new Date("05-09-2026")
        },
        stats: {
            views: 18753,
            likes: 528,
            comments: 26
        }
    },
    {
        id: "b6e24f73-1c95-4a08-d537-9f62e8b41c05",
        src: "/video/frank05.mp4",
        ratio: 1,
        details: {
            title: "Frank président",
            description: "On demande officiellement à Frank de prendre les commandes.",
            hashtags: ["frank", "leboeuf", "president", "france", "football", "edit", "fyp"],
            posted_at: new Date("06-09-2026")
        },
        stats: {
            views: 42158,
            likes: 1387,
            comments: 83
        }
    },
    {
        id: "c93f18a6-5e72-4b09-8d34-6a27f0e51bc8",
        src: "/video/frank06.mp4",
        ratio: 1,
        details: {
            title: "Frank, tout simplement",
            description: "Pas besoin de contexte. C'est Frank.",
            hashtags: ["frank", "leboeuf", "frankedit", "football", "fyp", "viral", "lostmedia"],
            posted_at: new Date("07-09-2026")
        },
        stats: {
            views: 56321,
            likes: 1942,
            comments: 106
        }
    }
];

export const getVideoFeed = async (): Promise<Video[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return videos;
}