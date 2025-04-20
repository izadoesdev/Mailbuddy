"use client";

import classNames from "classnames";
import type React from "react";
import { forwardRef } from "react";
import { Flex } from "./Flex";
import styles from "./StatusIndicator.module.scss";

interface StatusIndicatorProps extends React.ComponentProps<typeof Flex> {
    size?: "s" | "m" | "l";
    color:
        | "blue"
        | "indigo"
        | "violet"
        | "magenta"
        | "pink"
        | "red"
        | "orange"
        | "yellow"
        | "moss"
        | "green"
        | "emerald"
        | "aqua"
        | "cyan"
        | "gray";
    ariaLabel?: string;
    className?: string;
    style?: React.CSSProperties;
}

const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
    (
        { size = "m", color, ariaLabel = `${color} status indicator`, className, style, ...rest },
        ref,
    ) => {
        return (
            <Flex
                ref={ref}
                style={style}
                className={classNames(
                    styles.statusIndicator,
                    styles[size],
                    styles[color],
                    className,
                )}
                aria-label={ariaLabel}
                radius="full"
                {...rest}
            />
        );
    },
);

StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator };
