"use client";

import classNames from "classnames";
import type React from "react";
import { type ReactNode, forwardRef } from "react";
import { Icon } from ".";
import type { IconName } from "../icons";
import { ElementType } from "./ElementType";

interface CommonProps {
    prefixIcon?: IconName;
    suffixIcon?: IconName;
    fillWidth?: boolean;
    iconSize?: "xs" | "s" | "m" | "l" | "xl";
    selected?: boolean;
    unstyled?: boolean;
    children: ReactNode;
    href?: string;
    style?: React.CSSProperties;
    className?: string;
}

export type SmartLinkProps = CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

const SmartLink = forwardRef<HTMLAnchorElement, SmartLinkProps>(
    (
        {
            href,
            prefixIcon,
            suffixIcon,
            fillWidth = false,
            iconSize = "xs",
            style,
            className,
            selected,
            unstyled = false,
            children,
            ...props
        },
        ref,
    ) => {
        const content = (
            <>
                {prefixIcon && <Icon name={prefixIcon} size={iconSize} />}
                {children}
                {suffixIcon && <Icon name={suffixIcon} size={iconSize} />}
            </>
        );

        const commonProps = {
            ref,
            className: classNames(
                className,
                "reset-button-styles focus-ring align-center display-inline-flex g-8 radius-s",
                {
                    "fill-width": fillWidth,
                    "fit-width": !fillWidth,
                    "px-2 mx-2": !unstyled,
                },
            ),
            style: !unstyled
                ? {
                      ...(selected && {
                          textDecoration: "underline",
                      }),
                      ...style,
                  }
                : {
                      textDecoration: "none",
                      ...style,
                  },
            ...props,
        };

        return (
            <ElementType href={href} {...commonProps}>
                {content}
            </ElementType>
        );
    },
);

SmartLink.displayName = "SmartLink";

export { SmartLink };
