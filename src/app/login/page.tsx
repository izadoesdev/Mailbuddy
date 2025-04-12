"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import {
    Heading,
    Text,
    Button,
    Logo,
    Row,
    Column,
    Background,
    Input,
    PasswordInput,
    useToast,
    Spinner,
} from "@/once-ui/components";
import { authClient, signIn } from "@/libs/auth/client";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [view, setView] = useState<"options" | "password" | "magic" | "forgot">("options");
    const [verifyingToken, setVerifyingToken] = useState(false);

    // Check for magic link token in URL
    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            setVerifyingToken(true);
            verifyMagicLink(token);
        }
    }, [searchParams]);

    const verifyMagicLink = async (token: string) => {
        try {
            const { error } = await authClient.magicLink.verify({
                query: {
                    token,
                },
            });

            if (error) {
                addToast({
                    variant: "danger",
                    message: "Invalid or expired magic link. Please try again.",
                });
                // Clear the token from URL to prevent repeated verification attempts
                router.push("/login");
            } else {
                addToast({
                    variant: "success",
                    message: "Login successful!",
                });
                router.push("/inbox");
            }
        } catch (error) {
            addToast({
                variant: "danger",
                message: "Failed to verify magic link. Please try again.",
            });
            router.push("/login");
        } finally {
            setVerifyingToken(false);
        }
    };

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

    const handleEmailPasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            addToast({
                variant: "danger",
                message: "Please enter both email and password",
            });
            return;
        }

        setIsLoading(true);
        signIn.email({
            email,
            password,
            fetchOptions: {
                onSuccess: () => {
                    addToast({
                        variant: "success",
                        message: "Login successful!",
                    });
                    router.push("/inbox");
                },
                onError: (error) => {
                    setIsLoading(false);
                    console.log(error);
                    addToast({
                        variant: "danger",
                        message: "Login failed. Please check your credentials and try again.",
                    });
                },
            },
        });
    };

    const handleMagicLinkLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            addToast({
                variant: "danger",
                message: "Please enter your email address",
            });
            return;
        }

        setIsLoading(true);
        signIn.magicLink({
            email,
            fetchOptions: {
                onSuccess: () => {
                    setIsLoading(false);
                    addToast({
                        variant: "success",
                        message: "Magic link sent! Please check your email.",
                    });
                },
                onError: (error) => {
                    setIsLoading(false);
                    addToast({
                        variant: "danger",
                        message: "Failed to send magic link. Please try again.",
                    });
                },
            },
        });
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            addToast({
                variant: "danger",
                message: "Please enter your email address",
            });
            return;
        }

        setIsLoading(true);
        try {
            await authClient.forgetPassword({
                email,
                fetchOptions: {
                    onSuccess: () => {
                        setIsLoading(false);
                        addToast({
                            variant: "success",
                            message: "Password reset instructions sent to your email.",
                        });
                    },
                    onError: (error) => {
                        setIsLoading(false);
                        addToast({
                            variant: "danger",
                            message: "Failed to send reset instructions. Please try again.",
                        });
                    },
                },
            });
        } catch (error) {
            setIsLoading(false);
            addToast({
                variant: "danger",
                message: "An error occurred. Please try again later.",
            });
        }
    };

    // Show loading spinner while verifying token
    if (verifyingToken) {
        return (
            <Column fillWidth fillHeight horizontal="center" vertical="center" gap="20">
                <Spinner size="l" />
                <Text>Verifying your login...</Text>
            </Column>
        );
    }

    // Render different forms based on the current view
    const renderForm = () => {
        switch(view) {
            case "password":
                return (
                    <form onSubmit={handleEmailPasswordLogin} style={{ width: "100%" }}>
                        <Column gap="16" fillWidth>
                            <Input
                                id="email"
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <PasswordInput
                                id="password"
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button
                                label="Sign in"
                                fillWidth
                                variant="primary"
                                size="l"
                                type="submit"
                                loading={isLoading}
                                disabled={isLoading}
                            />
                            <Row horizontal="space-between">
                                <Button
                                    label="Back"
                                    variant="tertiary"
                                    onClick={() => setView("options")}
                                    type="button"
                                />
                                <Button
                                    label="Forgot password?"
                                    variant="tertiary"
                                    onClick={() => setView("forgot")}
                                    type="button"
                                />
                            </Row>
                        </Column>
                    </form>
                );
                
            case "magic":
                return (
                    <form onSubmit={handleMagicLinkLogin} style={{ width: "100%" }}>
                        <Column gap="16" fillWidth>
                            <Input
                                id="email"
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Text variant="body-default-s" align="center">
                                We'll send a magic link to your email that will sign you in instantly.
                            </Text>
                            <Button
                                label="Send magic link"
                                fillWidth
                                variant="primary"
                                size="l"
                                type="submit"
                                loading={isLoading}
                                disabled={isLoading}
                            />
                            <Button
                                label="Back"
                                variant="tertiary"
                                onClick={() => setView("options")}
                                type="button"
                            />
                        </Column>
                    </form>
                );
                
            case "forgot":
                return (
                    <form onSubmit={handleForgotPassword} style={{ width: "100%" }}>
                        <Column gap="16" fillWidth>
                            <Input
                                id="email"
                                label="Email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Text variant="body-default-s" align="center">
                                We'll send password reset instructions to your email.
                            </Text>
                            <Button
                                label="Reset password"
                                fillWidth
                                variant="primary"
                                size="l"
                                type="submit"
                                loading={isLoading}
                                disabled={isLoading}
                            />
                            <Button
                                label="Back"
                                variant="tertiary"
                                onClick={() => setView("options")}
                                type="button"
                            />
                        </Column>
                    </form>
                );
                
            default: // options
                return (
                    <Column gap="16" fillWidth>
                        <Button
                            label="Sign in with email"
                            fillWidth
                            variant="primary"
                            size="l"
                            onClick={() => setView("password")}
                            prefixIcon="mail"
                        />
                        <Button
                            label="Sign in with magic link"
                            fillWidth
                            variant="secondary"
                            size="l"
                            onClick={() => setView("magic")}
                            prefixIcon="link"
                        />
                        
                        <Row paddingY="16" fillWidth>
                            <Column fillWidth>
                                <Row horizontal="center" gap="16" vertical="center">
                                    <div style={{ height: 1, background: "var(--neutral-alpha-medium)", flex: 1 }} />
                                    <Text variant="label-default-s" onBackground="neutral-medium">OR</Text>
                                    <div style={{ height: 1, background: "var(--neutral-alpha-medium)", flex: 1 }} />
                                </Row>
                            </Column>
                        </Row>
                        
                        <Button
                            label="Continue with Google"
                            fillWidth
                            variant="secondary"
                            prefixIcon="google"
                            size="l"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        />
                    </Column>
                );
        }
    };

    return (
        <Column fillWidth paddingX="s" horizontal="center" paddingTop="80" flex={1}>
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
                    position="relative"
                >
                    <Row
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

                                {renderForm()}

                                <Row paddingTop="32" horizontal="center">
                                    <Text variant="body-default-s" onBackground="neutral-medium">
                                        Don't have an account?&nbsp;
                                    </Text>
                                    <Link href="/register" style={{ textDecoration: 'none' }}>
                                        <Text variant="body-strong-s" onBackground="brand-strong">Sign up</Text>
                                    </Link>
                                </Row>
                            </Column>
                        </Column>
                    </Row>
                </Column>
            </Column>
        </Column>
    );
}
