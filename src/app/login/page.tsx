"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    Heading,
    Text,
    Button,
    Logo,
    Row,
    Column,
    Background,
    useToast,
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
                    setIsLoading(false);
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
                            padding="xl"
                            position="relative"
                        >
                            <Column fillWidth gap="8" horizontal="center">
                                <Logo size="s" icon={false} href="/" />
                                <Heading
                                    as="h1"
                                    variant="display-strong-xs"
                                    align="center"
                                    marginTop="24"
                                >
                                    Welcome back
                                </Heading>
                                <Text
                                    onBackground="neutral-medium"
                                    marginBottom="24"
                                    align="center"
                                >
                                    Log in to your account
                                </Text>
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
