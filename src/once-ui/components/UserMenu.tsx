"use client";

import classNames from "classnames";
import type React from "react";
import { DropdownWrapper, Flex, User, type UserProps } from ".";
import type { DropdownWrapperProps } from "./DropdownWrapper";
import styles from "./UserMenu.module.scss";

interface UserMenuProps
    extends UserProps,
        Pick<DropdownWrapperProps, "minHeight" | "minWidth" | "maxWidth"> {
    selected?: boolean;
    dropdown?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const UserMenu: React.FC<UserMenuProps> = ({
    selected = false,
    dropdown,
    minWidth,
    maxWidth,
    minHeight,
    className,
    style,
    ...userProps
}) => {
    return (
        <DropdownWrapper
            minWidth={minWidth}
            maxWidth={maxWidth}
            minHeight={minHeight}
            style={{
                borderRadius: "var(--radius-full)",
            }}
            trigger={
                <Flex
                    tabIndex={0}
                    direction="column"
                    padding="4"
                    radius="full"
                    cursor="interactive"
                    border={selected ? "neutral-medium" : "transparent"}
                    background={selected ? "neutral-strong" : "transparent"}
                    className={classNames(
                        className || "",
                        selected ? styles.selected : "",
                        styles.wrapper,
                    )}
                    style={style}
                >
                    <User {...userProps} />
                </Flex>
            }
            dropdown={<>{dropdown}</>}
        />
    );
};

UserMenu.displayName = "UserMenu";
export { UserMenu };
