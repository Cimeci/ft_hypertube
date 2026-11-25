import {FollowingProfile as FollowingProfileType} from "@/types/FollowingProfile";
import Stack from "@/components/ui/Stack";
import {Avatar} from "@/components/Avatar";
import {Typography} from "@/components/ui/Typography";
import {AnimatePresence, motion} from "motion/react";

export interface FollowingProfileProps {
    profile?: FollowingProfileType
}

export function FollowingProfile({ profile }: FollowingProfileProps) {
    return (
        <Stack
            direction={"horizontal"}
            height={60}
            vAlign={"center"}
            wrap={false}
        >
            <Avatar
                src={profile?.avatarUrl ?? null}
                alt={profile?.username ?? ""}
                size={40}
            />
            <Stack gap={0} flex>
                <Typography
                    variant={"accountsItemTitle"}
                    skeleton={profile === undefined}
                    lineLimit={1}
                >
                    {profile?.name ?? "NAME"}
                </Typography>
                <Typography
                    variant={"accountsItemUsername"}
                    color={"textLightSecondary"}
                    skeleton={profile === undefined}
                    lineLimit={1}
                >
                    {`@${profile?.username ?? "USERNAME"}`}
                </Typography>
            </Stack>
            <AnimatePresence>
            {profile && profile.unseenVideos > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Typography
                        bold
                        color={"primary"}
                        lineLimit={1}
                    >
                        {`${profile.unseenVideos} new`}
                    </Typography>
                </motion.div>
            )}
            </AnimatePresence>
        </Stack>
    )
}