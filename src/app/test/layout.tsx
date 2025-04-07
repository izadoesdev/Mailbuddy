"use client";

import { useSession } from "@/libs/auth/helper-utils";
import { useRouter } from "next/navigation";
import {
  Row,
  Column,
  UserMenu,
  Button,
  Text,
  SmartLink,
  useToast,
  Background,
} from "@/once-ui/components";
import { logout } from "@/libs/auth/helper-utils";
import { useState } from "react";

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout({
        redirectUrl: "/login",
        router,
        onError: (error) => {
          addToast({
            variant: "danger",
            message: "Logout failed. Please try again.",
          });
        },
      });
    } catch (error) {
      addToast({
        variant: "danger",
        message: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userDropdown = (
    <Column padding="8" gap="8" minWidth={16}>
      <Column padding="8" gap="4">
        <Text variant="heading-strong-xs" onBackground="neutral-strong">
          {session?.user?.name}
        </Text>
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {session?.user?.email}
        </Text>
      </Column>
      <Column gap="1">
        <SmartLink href="/profile">
          <Button
            label="Profile"
            variant="secondary"
            fillWidth
            size="s"
            radius="top"
          />
        </SmartLink>
        <SmartLink href="/settings">
          <Button
            label="Settings"
            variant="secondary"
            fillWidth
            size="s"
            radius="none"
          />
        </SmartLink>
        <Button
          label={isLoading ? "Logging out..." : "Log out"}
          variant="danger"
          fillWidth
          size="s"
          radius="bottom"
          onClick={handleLogout}
          disabled={isLoading}
        />
      </Column>
    </Column>
  );

  return (
    <Column fillWidth>
      {/* Navigation */}
      <Row
        position="fixed"
        top="0"
        fillWidth
        horizontal="center"
        zIndex={3}
        background="overlay"
        border="neutral-alpha-weak"
      >
        <Row
          horizontal="space-between"
          maxWidth="l"
          paddingRight="64"
          paddingLeft="32"
          paddingY="16"
          fillWidth
        >
          <SmartLink href="/">
            <Text variant="heading-strong-m">Mailer</Text>
          </SmartLink>
          <Row gap="16" vertical="center">
            {session ? (
              <UserMenu
                name={session.user?.name || ""}
                subline={session.user?.email}
                avatarProps={{
                  src: session.user?.image || "",
                  value: session.user?.name?.charAt(0) || "",
                }}
                dropdown={userDropdown}
              />
            ) : (
              <SmartLink href="/login">
                <Button label="Sign in" variant="secondary" />
              </SmartLink>
            )}
          </Row>
        </Row>
      </Row>

      {/* Main Content */}
      <Column paddingTop="64" fillWidth>
        <Background
          position="absolute"
          mask={{
            x: 100,
            y: 0,
            radius: 100,
          }}
          gradient={{
            display: true,
            x: 100,
            y: 60,
            width: 70,
            height: 50,
            tilt: -40,
            opacity: 90,
            colorStart: "accent-background-strong",
            colorEnd: "page-background",
          }}
          grid={{
            display: true,
            opacity: 100,
            width: "0.25rem",
            color: "neutral-alpha-medium",
            height: "0.25rem",
          }}
        />
        {children}
      </Column>
    </Column>
  );
} 