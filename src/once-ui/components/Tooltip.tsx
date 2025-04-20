"use client";

import classNames from "classnames";
import type React from "react";
import { type ReactNode, forwardRef } from "react";

import { Flex, Icon } from ".";
import type { IconName } from "../icons";

type TooltipProps = {
    label: ReactNode;
    prefixIcon?: IconName;
    suffixIcon?: IconName;
    className?: string;
    style?: React.CSSProperties;
};

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
    ({ label, prefixIcon, suffixIcon, className, style }, ref) => {
        return (
            <Flex
                hide="m"
                ref={ref}
                style={{
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    ...style,
                }}
                vertical="center"
                gap="4"
                zIndex={1}
                background="surface"
                paddingY="4"
                paddingX="8"
                radius="s"
                border="neutral-medium"
                role="tooltip"
                className={classNames(className)}
            >
                {prefixIcon && <Icon name={prefixIcon} size="xs" />}
                <Flex
                    paddingX="2"
                    vertical="center"
                    textVariant="body-default-xs"
                    onBackground="neutral-strong"
                >
                    {label}
                </Flex>
                {suffixIcon && <Icon name={suffixIcon} size="xs" />}
            </Flex>
        );
    },
);

Tooltip.displayName = "Tooltip";

export { Tooltip };
