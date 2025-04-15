"use client";

import {
  Card,
  Column,
  Heading,
  Text,
  Row,
  Button,
  StylePanel
} from "@/once-ui/components";

export default function Preferences() {
  return (
    <Column gap="24" fill>
      <Column gap="16" padding="24" fill>
      <StylePanel/>
      </Column>
    </Column>
  );
} 