import {Fragment, ReactElement} from "react";
import Stack from "@/components/ui/Stack";
import {Typography} from "@/components/ui/Typography";
import Divider from "@/components/ui/Divider";

export interface CounterProps {
    count: number;
    name: string;
}

type CounterElement = ReactElement<CounterProps, typeof Counter>;

export interface CountersProps {
    children: CounterElement | CounterElement[];
}

export function Counter({count, name}: CounterProps) {
    const simplifyNumber = (number: number): string => {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + "M";
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + "K";
        } else {
            return number.toString();
        }
    }

    return (
        <Stack
            flex
            direction={"vertical"}
            vAlign={"center"}
            gap={0}
            padding={[8, 0]}
        >
            <Typography
                fontSize={18}
                bold={500}
                lineLimit={1}
                color={"textLightSecondary"}
            >
                {simplifyNumber(count)}
            </Typography>
            <Typography
                fontSize={12}
                bold={200}
                lineLimit={1}
                color={"textLightTertiary"}
            >
                {name}
            </Typography>
        </Stack>
    )
}

export function Counters({children}: CountersProps) {
    const counters: CounterElement[] = Array.isArray(children) ? children : [children];

    return (
        <Stack
            direction={"horizontal"}
            gap={8}
        >
            {counters.map((counter, index) => (
                <Fragment key={index}>
                    {counter}
                    {index !== counters.length - 1 && (
                        <Divider
                            vertical
                            margin={8}
                        />
                    )}
                </Fragment>
            ))}
        </Stack>
    )
}