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
import { signUp } from "@/libs/auth/client";

export default function RegisterPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        if (name.length < 2) {
            return "Name must be at least 2 characters long.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "Email is invalid.";
        }

        if (password.length < 6) {
            return "Password must be at least 6 characters.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        return null;
    };

    const handleRegister = async () => {
        const validationError = validateForm();
        if (validationError) {
            addToast({
                variant: "danger",
                message: validationError,
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await signUp.email({
                email,
                password,
                name,
                fetchOptions: {
                    onSuccess: () => {
                        addToast({
                            variant: "success",
                            message: "Registration successful!",
                        });
                        router.push("/inbox");
                    },
                    onError: () => {
                        addToast({
                            variant: "danger",
                            message: "Registration failed. Please try again.",
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
                            Create an account
                        </Heading>
                        <Text onBackground="neutral-medium" marginBottom="24" align="center">
                            Sign up to get started
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
                        <Column
                            fillWidth
                            horizontal="center"
                            gap="20"
                            padding="32"
                            position="relative"
                        >
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
                            <Column gap="-1" fillWidth>
                                <Input
                                    id="name"
                                    label="Full Name"
                                    labelAsPlaceholder
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    radius="top"
                                    disabled={isLoading}
                                />
                                <Input
                                    id="email"
                                    label="Email"
                                    labelAsPlaceholder
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                    radius="none"
                                    disabled={isLoading}
                                />
                                <PasswordInput
                                    autoComplete="new-password"
                                    id="password"
                                    label="Password"
                                    labelAsPlaceholder
                                    radius="none"
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    disabled={isLoading}
                                />
                                <PasswordInput
                                    autoComplete="new-password"
                                    id="confirmPassword"
                                    label="Confirm Password"
                                    labelAsPlaceholder
                                    radius="bottom"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    value={confirmPassword}
                                    disabled={isLoading}
                                />
                            </Column>
                            <Button
                                id="register"
                                label={isLoading ? "Creating account..." : "Create account"}
                                arrowIcon
                                fillWidth
                                onClick={handleRegister}
                                disabled={isLoading}
                            />
                            <Row fillWidth horizontal="center" paddingTop="16">
                                <Text onBackground="neutral-medium">
                                    Already have an account?{" "}
                                    <SmartLink href="/login">Log in</SmartLink>
                                </Text>
                            </Row>
                        </Column>
                    </Row>
                </Column>
            </Column>
        </Column>
    );
}
