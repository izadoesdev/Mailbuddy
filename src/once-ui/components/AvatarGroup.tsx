"use client";

import type React from "react";
import { forwardRef } from "react";

import classNames from "classnames";
import { Avatar, type AvatarProps, Flex } from ".";
import styles from "./AvatarGroup.module.scss";

interface AvatarGroupProps extends React.ComponentProps<typeof Flex> {
    avatars: AvatarProps[];
    size?: "xs" | "s" | "m" | "l" | "xl";
    reverse?: boolean;
    limit?: number;
    className?: string;
    style?: React.CSSProperties;
}

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
    ({ avatars, size = "m", reverse = false, limit, className, style, ...rest }, ref) => {
        const displayedAvatars = limit ? avatars.slice(0, limit) : avatars;
        const remainingCount = limit && avatars.length > limit ? avatars.length - limit : 0;

        return (
            <Flex
                vertical="center"
                ref={ref}
                className={classNames(styles.avatarGroup, className)}
                style={style}
                zIndex={0}
                {...rest}
            >
                {displayedAvatars.map((avatarProps, index) => (
                    <Avatar
                        key={index}
                        size={size}
                        {...avatarProps}
                        className={styles.avatar}
                        style={{
                            ...avatarProps.style,
                            zIndex: reverse ? displayedAvatars.length - index : index + 1,
                        }}
                    />
                ))}
                {remainingCount > 0 && (
                    <Avatar
                        value={`+${remainingCount}`}
                        className={styles.avatar}
                        size={size}
                        style={{
                            ...style,
                            zIndex: reverse ? -1 : displayedAvatars.length + 1,
                        }}
                    />
                )}
            </Flex>
        );
    },
);

AvatarGroup.displayName = "AvatarGroup";

export { AvatarGroup };
export type { AvatarGroupProps };
