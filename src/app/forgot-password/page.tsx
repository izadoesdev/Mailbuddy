"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Heading,
  Text,
  Button,
  Icon,
  Logo,
  Input,
  Row,
  Column,
  Background,
  SmartLink,
  useToast,
} from "@/once-ui/components";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return "Email is invalid.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateEmail();
    if (validationError) {
      addToast({
        variant: "danger",
        message: validationError,
      });
      return;
    }

    setIsLoading(true);
    try {
      // This is a placeholder for the actual password reset functionality
      // In a real application, you would call an API to send a reset email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
      addToast({
        variant: "success",
        message: "Password reset instructions sent to your email.",
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

  return (
    <Column fillWidth paddingY="80" paddingX="s" horizontal="center" flex={1}>
      <Row position="fixed" top="0" fillWidth horizontal="center" zIndex={3}>
        <Row
          data-border="rounded"
          horizontal="space-between"
          maxWidth="l"
          paddingRight="64"
          paddingLeft="32"
          paddingY="20"
        >
          <Link href="/">
            <Logo size="s" icon={false} />
          </Link>
        </Row>
      </Row>

      <Column
        overflow="hidden"
        as="main"
        maxWidth="l"
        position="relative"
        radius="xl"
        horizontal="center"
        border="neutral-alpha-weak"
        fillWidth
      >
        <Column
          fillWidth
          horizontal="center"
          gap="48"
          radius="xl"
          paddingTop="80"
          position="relative"
        >
          <Background
            mask={{
              x: 0,
              y: 48,
            }}
            position="absolute"
            grid={{
              display: true,
              width: "0.25rem",
              color: "neutral-alpha-medium",
              height: "0.25rem",
            }}
          />
          <Background
            mask={{
              x: 80,
              y: 0,
              radius: 100,
            }}
            position="absolute"
            gradient={{
              display: true,
              tilt: -35,
              height: 50,
              width: 75,
              x: 100,
              y: 40,
              colorStart: "accent-solid-medium",
              colorEnd: "static-transparent",
            }}
          />
          <Background
            mask={{
              x: 100,
              y: 0,
              radius: 100,
            }}
            position="absolute"
            gradient={{
              display: true,
              opacity: 100,
              tilt: -35,
              height: 20,
              width: 120,
              x: 120,
              y: 35,
              colorStart: "brand-solid-strong",
              colorEnd: "static-transparent",
            }}
          />
          <Column fillWidth horizontal="center" gap="32" padding="32" position="relative">
            <Logo wordmark={false} size="l" />
            <Heading as="h1" variant="display-default-l" align="center">
              Reset your password
            </Heading>
            <Text onBackground="neutral-medium" marginBottom="24" align="center">
              Enter your email to receive reset instructions
            </Text>
          </Column>

          <Row
            marginY="32"
            background="overlay"
            fillWidth
            radius="xl"
            border="neutral-alpha-weak"
            overflow="hidden"
          >
            <Row fill hide="m">
              <Background
                fill
                position="absolute"
                gradient={{
                  display: true,
                  tilt: -45,
                  height: 150,
                  width: 100,
                  x: 75,
                  y: -50,
                  colorStart: "brand-solid-strong",
                  colorEnd: "accent-solid-weak",
                }}
              />
            </Row>
            <Column fillWidth horizontal="center" gap="20" padding="32" position="relative">
              <Background
                mask={{
                  x: 100,
                  y: 0,
                  radius: 75,
                }}
                position="absolute"
                grid={{
                  display: true,
                  opacity: 50,
                  width: "0.5rem",
                  color: "neutral-alpha-medium",
                  height: "1rem",
                }}
              />
              
              {isSubmitted ? (
                <Column fillWidth horizontal="center" gap="24">
                  <Icon name="checkCircle" size="xl" />
                  <Heading as="h2" variant="display-default-s" align="center">
                    Check your email
                  </Heading>
                  <Text onBackground="neutral-medium" align="center">
                    We've sent password reset instructions to {email}
                  </Text>
                  <Button
                    label="Back to login"
                    arrowIcon
                    fillWidth
                    onClick={() => router.push("/login")}
                  />
                </Column>
              ) : (
                <>
                  <Input
                    id="email"
                    label="Email"
                    labelAsPlaceholder
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    validate={validateEmail}
                    errorMessage={false}
                    radius="top"
                    disabled={isLoading}
                  />
                  <Button
                    id="submit"
                    label={isLoading ? "Sending..." : "Send reset instructions"}
                    arrowIcon
                    fillWidth
                    onClick={handleSubmit}
                    disabled={isLoading}
                  />
                  <Row fillWidth horizontal="center" paddingTop="16">
                    <Text onBackground="neutral-medium">
                      Remember your password?{" "}
                      <SmartLink href="/login">Log in</SmartLink>
                    </Text>
                  </Row>
                </>
              )}
            </Column>
          </Row>
        </Column>
      </Column>
    </Column>
  );
} 