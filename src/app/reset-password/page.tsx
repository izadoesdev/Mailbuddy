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
    PasswordInput,
} from "@/once-ui/components";
import { authClient } from "../../../auth-client";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) {
            addToast({ variant: "danger", message: "Invalid token" });
            return;
        }

        setIsLoading(true);
        try {
            // This is a placeholder for the actual password reset functionality
            // In a real application, you would call an API to send a reset email
            const { data, error } = await authClient.resetPassword({
                token,
                newPassword: password,
            });

            if (error || data.status === false) {
                console.log(error);
                addToast({ variant: "danger", message: error?.statusText || "An unexpected error occurred" });
                return;
            }

            setIsSubmitted(true);
            addToast({
                variant: "success",
                message: "Password reset successful!",
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
                            Enter your new password
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

                            {isSubmitted ? (
                                <Column fillWidth horizontal="center" gap="24">
                                    <Icon name="checkCircle" size="xl" />
                                    <Heading as="h2" variant="display-default-s" align="center">
                                        Password reset complete
                                    </Heading>
                                    <Text onBackground="neutral-medium" align="center">
                                        You can now log in to your account
                                    </Text>
                                    <Button
                                        label="Go to login"
                                        arrowIcon
                                        fillWidth
                                        onClick={() => router.push("/login")}
                                    />
                                </Column>
                            ) : (
                                <>
                                    <PasswordInput
                                        id="password"
                                        label="Password"
                                        labelAsPlaceholder
                                        onChange={(e) => setPassword(e.target.value)}
                                        value={password}
                                        errorMessage={false}
                                        type="password"
                                        radius="top"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        id="submit"
                                        label={isLoading ? "Resetting..." : "Reset password"}
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
