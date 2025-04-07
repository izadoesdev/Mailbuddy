"use client";

import { Column, Heading, Text } from "@/once-ui/components";

export default function TestPage() {
  return (
    <Column fillWidth paddingY="32" paddingX="32" horizontal="center">
      <Column maxWidth="l" gap="16">
        <Heading variant="display-strong-xl">Test Page</Heading>
        <Text variant="body-default-l" onBackground="neutral-medium">
          This is a test page with a custom layout that includes an auth-aware navigation bar.
        </Text>
      </Column>
    </Column>
  );
} 