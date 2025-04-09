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
    const [isLoading, setIsLoading] = useState(false);


    const handleGoogleLogin = () => {
        setIsLoading(true);
        signIn.social({
            provider: "google",
            fetchOptions: {
                onSuccess: () => {
                    addToast({
                        variant: "success",
                        message: "Login successful!",
                    });
                    router.push("/inbox");
                },
                onError: () => {
                    setIsLoading(false)
                    addToast({
                        variant: "danger",
                        message: "Google login failed. Please try again.",
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
                               
                            </Column>
                        </Column>
                    </Row>
                </Column>
            </Column>
        </Column>
    );
}
