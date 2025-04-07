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
  PasswordInput,
  Row,
  Column,
  Background,
  SmartLink,
  useToast,
  Line,
} from "@/once-ui/components";
import { signIn } from "@/libs/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateLogin = () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return "Email is invalid.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return null;
  };

  const handleLogin = async () => {
    const validationError = validateLogin();
    if (validationError) {
      addToast({
        variant: "danger",
        message: validationError,
      });
      return;
    }

    setIsLoading(true);
    try {
      await signIn.email({
        email,
        password,
        fetchOptions: {
          onSuccess: () => {
            addToast({
              variant: "success",
              message: "Login successful!",
            });
            router.push("/test");
          },
          onError: () => {
            addToast({
              variant: "danger",
              message: "Login failed. Please check your credentials.",
            });
          },
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

  const handleGoogleLogin = () => {
    signIn.social({
      provider: "google",
      fetchOptions: {
        onSuccess: () => {
          addToast({
            variant: "success",
            message: "Login successful!",
          });
          router.push("/test");
        },
        onError: () => {
          addToast({
            variant: "danger",
            message: "Google login failed. Please try again.",
          });
        },
      },
    });
  };

  const handleGithubLogin = () => {
    signIn.social({
      provider: "github",
      fetchOptions: {
        onSuccess: () => {
          addToast({
            variant: "success",
            message: "Login successful!",
          });
          router.push("/test");
        },
        onError: () => {
          addToast({
            variant: "danger",
            message: "GitHub login failed. Please try again.",
          });
        },
      },
    });
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
              Welcome back
            </Heading>
            <Text onBackground="neutral-medium" marginBottom="24" align="center">
              Log in to your account
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
              <Column fillWidth gap="8">
                <Button
                  label="Continue with Google"
                  fillWidth
                  variant="secondary"
                  weight="default"
                  prefixIcon="google"
                  size="l"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                />
                <Button
                  label="Continue with GitHub"
                  fillWidth
                  variant="secondary"
                  weight="default"
                  prefixIcon="github"
                  size="l"
                  onClick={handleGithubLogin}
                  disabled={isLoading}
                />
              </Column>
              <Row fillWidth paddingY="24">
                <Row onBackground="neutral-weak" fillWidth gap="24" vertical="center">
                  <Line />/<Line />
                </Row>
              </Row>
              <Column gap="-1" fillWidth>
                <Input
                  id="email"
                  label="Email"
                  labelAsPlaceholder
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  validate={validateLogin}
                  errorMessage={false}
                  radius="top"
                  disabled={isLoading}
                />
                <PasswordInput
                  autoComplete="current-password"
                  id="password"
                  label="Password"
                  labelAsPlaceholder
                  radius="bottom"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  validate={validateLogin}
                  disabled={isLoading}
                />
              </Column>
              <Button
                id="login"
                label={isLoading ? "Logging in..." : "Log in"}
                arrowIcon
                fillWidth
                onClick={handleLogin}
                disabled={isLoading}
              />
              <Row fillWidth horizontal="center" paddingTop="16">
                <Text onBackground="neutral-medium">
                  Don't have an account?{" "}
                  <SmartLink href="/register">Sign up</SmartLink>
                </Text>
              </Row>
              <Row fillWidth horizontal="center">
                <SmartLink href="/forgot-password">Forgot your password?</SmartLink>
              </Row>
            </Column>
          </Row>
        </Column>
      </Column>
    </Column>
  );
} 