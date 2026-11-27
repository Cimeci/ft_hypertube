import {Mallo} from "@/components/Mallo";
import Stack from "@/components/ui/Stack";
import {Typography} from "@/components/ui/Typography";

export function Maintenance() {
    return (
        <Stack
            flex={1}
            hAlign={"center"}
            vAlign={"center"}
            padding={30}
            gap={25}
        >
            <Mallo mallo={"dead"} size={120} />
            <Stack vAlign={"center"} gap={5}>
                <Typography
                    variant={"title2"}
                >
                    This page is currently under maintenance...
                </Typography>
                <Typography color={"textLightSecondary"}>
                    But we promise that we will make something better than before.
                </Typography>
            </Stack>
        </Stack>
    )
}