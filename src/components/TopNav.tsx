"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Row,
  Column,
  UserMenu,
  Button,
  Text,
  SmartLink,
  useToast,
} from "@/once-ui/components";
import { signOut } from "@/libs/auth/client";
import { useSession } from "@/libs/auth/client";

export default function TopNav() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);


  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      
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
        data-border="rounded"
        horizontal="space-between"
        maxWidth="l"
        paddingRight="64"
        paddingLeft="32"
        paddingY="16"
        fillWidth
      >
        <Link href="/">
          <Text variant="heading-strong-m">Mailer</Text>
        </Link>
        <UserMenu
          name={session?.user?.name}
          subline={session?.user?.email}
          avatarProps={{
            src: session?.user?.image || undefined,
            value: session?.user?.image ? undefined : (session?.user?.name?.charAt(0) || ""),
          }}
          dropdown={userDropdown}
        />
      </Row>
    </Row>
  );
} 