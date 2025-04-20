"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";

import { effects } from "@/app/resources/config";
import { authClient, signIn } from "@/libs/auth/client";
import {
    Background,
    Button,
    Column,
    Feedback,
    Heading,
    Icon,
    Input,
    Logo,
    PasswordInput,
    Row,
    SmartLink,
    Spinner,
    Text,
    useToast,
} from "@/once-ui/components";

function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [view, setView] = useState<
        "password" | "magic" | "forgot" | "magic-sent" | "verification-needed"
    >("password");
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
            callbackURL: "/inbox",
            fetchOptions: {
                onSuccess: () => {
                    addToast({
                        variant: "success",
                        message: "Login successful!",
                    });
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
            callbackURL: "/inbox",
            fetchOptions: {
                onSuccess: () => {
                    addToast({
                        variant: "success",
                        message: "Login successful!",
                    });
                },
                onError: (error: any) => {
                    setIsLoading(false);
                    // Check if this is an email verification error
                    if (
                        error?.code === "EMAIL_NOT_VERIFIED" ||
                        error?.message?.toLowerCase().includes("not verified") ||
                        error?.code === "auth/email-not-verified"
                    ) {
                        // Show verification needed view instead of error toast
                        setView("verification-needed");
                        // Send verification email automatically - no need to show an extra toast since we're showing the verification screen
                        // sendVerificatio nEmail();
                    } else {
                        addToast({
                            variant: "danger",
                            message:
                                error?.message ||
                                "Login failed. Please check your credentials and try again.",
                        });
                    }
                },
            },
        });
    };

    /**
     * Send verification email to the user
     */
    const sendVerificationEmail = async () => {
        try {
            // First check if the API has a dedicated email verification sending method
            await authClient.sendVerificationEmail({
                email,
                callbackURL: "/inbox",
                fetchOptions: {
                    onSuccess: () => {
                        addToast({
                            variant: "success",
                            message: "Verification email sent!",
                        });
                    },
                    onError: () => {
                        addToast({
                            variant: "danger",
                            message: "Failed to send verification email. Please try again later.",
                        });
                    },
                },
            });
            // Fallback to using the auth provider's method
            console.log("Email verification method not available");
        } catch (error) {
            console.error("Error sending verification email:", error);
        }
    };

    const handleMagicLinkLogin = async (e: FormEvent) => {
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
            callbackURL: "/inbox",
            fetchOptions: {
                onSuccess: () => {
                    setIsLoading(false);
                    addToast({
                        variant: "success",
                        message: "Magic link sent! Please check your email.",
                    });
                    setView("magic-sent");
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
            <Column fillWidth horizontal="center" vertical="center" gap="20">
                <Spinner size="l" />
                <Text>Verifying your login...</Text>
            </Column>
        );
    }

    // Render different forms based on the current view
    const renderForm = () => {
        switch (view) {
            case "magic-sent":
                return (
                    <Column gap="24" fillWidth horizontal="center">
                        <Button
                            variant="tertiary"
                            weight="default"
                            prefixIcon="chevronLeft"
                            data-border="rounded"
                            label="Back to login"
                            onClick={() => {
                                setView("password");
                                setIsLoading(false);
                            }}
                        />
                        <Button
                            variant="secondary"
                            label="Resend magic link"
                            fillWidth
                            disabled={isLoading}
                            onClick={(e: React.MouseEvent) => handleMagicLinkLogin(e as any)}
                        />
                    </Column>
                );
            case "verification-needed":
                return (
                    <Column gap="24" fillWidth>
                        <Button
                            variant="secondary"
                            label="Resend verification email"
                            fillWidth
                            disabled={isLoading}
                            onClick={() => sendVerificationEmail()}
                        />
                        <Button
                            variant="tertiary"
                            weight="default"
                            prefixIcon="chevronLeft"
                            data-border="rounded"
                            onClick={() => {
                                setView("password");
                                setIsLoading(false);
                            }}
                        />
                    </Column>
                );
            case "forgot":
                return (
                    <form onSubmit={handleForgotPassword}>
                        <Column gap="24" fillWidth horizontal="center">
                            <Button
                                variant="tertiary"
                                weight="default"
                                label="Back to login"
                                prefixIcon="chevronLeft"
                                data-border="rounded"
                                onClick={() => setView("password")}
                            />
                            <Input
                                id="forgot-email"
                                label="Email address"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                label={isLoading ? "Sending reset link..." : "Send reset link"}
                                fillWidth
                                disabled={isLoading}
                            />
                        </Column>
                    </form>
                );
            case "magic":
                return (
                    <form onSubmit={handleMagicLinkLogin}>
                        <Column gap="24" fillWidth horizontal="center">
                            <Button
                                variant="tertiary"
                                weight="default"
                                label="Back to login"
                                prefixIcon="chevronLeft"
                                data-border="rounded"
                                onClick={() => setView("password")}
                            />
                            <Input
                                id="magic-email"
                                label="Email address"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                label={isLoading ? "Sending magic link..." : "Send magic link"}
                                fillWidth
                                disabled={isLoading}
                            />
                        </Column>
                    </form>
                );
            default:
                return (
                    <form onSubmit={handleEmailPasswordLogin}>
                        <Column fillWidth gap="32">
                            <Column gap="-1" fillWidth>
                                <Input
                                    id="login-email"
                                    label="Email address"
                                    radius="top"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <PasswordInput
                                    id="login-password"
                                    radius="bottom"
                                    label="Password"
                                    name="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Row fillWidth horizontal="end" paddingTop="12" paddingRight="12">
                                    <SmartLink onClick={() => setView("forgot")}>
                                        <Text onBackground="brand-medium">Forgot password?</Text>
                                    </SmartLink>
                                </Row>
                            </Column>

                            <Button
                                type="submit"
                                variant="primary"
                                label={isLoading ? "Signing in..." : "Sign in"}
                                fillWidth
                                disabled={isLoading}
                            />

                            <Column gap="16" fillWidth>
                                <Row horizontal="center" gap="16" vertical="center">
                                    <div
                                        style={{
                                            height: 1,
                                            background: "var(--neutral-alpha-medium)",
                                            flex: 1,
                                        }}
                                    />
                                    <Text variant="label-default-s" onBackground="neutral-medium">
                                        OR
                                    </Text>
                                    <div
                                        style={{
                                            height: 1,
                                            background: "var(--neutral-alpha-medium)",
                                            flex: 1,
                                        }}
                                    />
                                </Row>

                                <Row gap="12" fillWidth>
                                    <Button
                                        variant="secondary"
                                        fillWidth
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading}
                                    >
                                        <Row gap="8" vertical="center" horizontal="center">
                                            <Icon name="google" size="s" />
                                            <Text>Google</Text>
                                        </Row>
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        fillWidth
                                        onClick={() => setView("magic")}
                                    >
                                        <Row gap="8" vertical="center" horizontal="center">
                                            <Icon name="sparkles" size="s" />
                                            <Text>Magic Link</Text>
                                        </Row>
                                    </Button>
                                </Row>
                            </Column>

                            <Row horizontal="center" gap="8" center>
                                <Text variant="body-default-s" onBackground="neutral-medium">
                                    Don't have an account?
                                </Text>
                                <Button variant="tertiary" label="Sign up" href="/register" />
                            </Row>
                        </Column>
                    </form>
                );
        }
    };

    // Page title and header content based on current view
    const getHeaderContent = () => {
        switch (view) {
            case "magic-sent":
                return (
                    <Column gap="8" padding="16">
                        <Heading as="h1" variant="heading-strong-xl">
                            Check your email
                        </Heading>
                        <Text variant="body-default-m" onBackground="neutral-medium">
                            We've sent a magic link to <strong>{email}</strong>. Click the link to
                            sign in.
                        </Text>
                    </Column>
                );
            case "verification-needed":
                return (
                    <Column gap="8" padding="16">
                        <Heading as="h1" variant="heading-strong-xl">
                            Verify your email
                        </Heading>
                        <Text variant="body-default-m" onBackground="neutral-medium">
                            Please check your email at <strong>{email}</strong> and click the
                            verification link to activate your account.
                        </Text>
                    </Column>
                );
            case "forgot":
                return (
                    <Column gap="8" padding="16" center>
                        <Heading as="h1" variant="heading-strong-xl">
                            Reset your password
                        </Heading>
                        <Text variant="body-default-m" onBackground="neutral-medium">
                            Enter your email and we'll send you a link to reset your password.
                        </Text>
                    </Column>
                );
            case "magic":
                return (
                    <Column gap="8" padding="16" center>
                        <Heading as="h1" variant="heading-strong-xl">
                            Sign in with magic link
                        </Heading>
                        <Text variant="body-default-m" onBackground="neutral-medium">
                            Enter your email and we'll send you a one-time sign in link.
                        </Text>
                    </Column>
                );
            default:
                return (
                    <Column gap="8" paddingX="32" paddingTop="16" center>
                        <Heading variant="display-strong-xs" marginBottom="24">
                            Access your account
                        </Heading>
                        <Feedback icon gap="8" vertical="center">
                            If you're part of the hackathon testing crew, please DM me on Discord
                            (@.hyteq) for demo instructions to get the full experience!
                        </Feedback>
                    </Column>
                );
        }
    };

    return (
        <Column fillWidth center fillHeight padding="8">
            <Background
                pointerEvents="none"
                position="fixed"
                mask={{
                    cursor: effects.mask.cursor,
                    x: effects.mask.x,
                    y: effects.mask.y,
                    radius: effects.mask.radius,
                }}
                gradient={{
                    display: effects.gradient.display,
                    x: effects.gradient.x,
                    y: effects.gradient.y,
                    width: effects.gradient.width,
                    height: effects.gradient.height,
                    tilt: effects.gradient.tilt,
                    colorStart: effects.gradient.colorStart,
                    colorEnd: effects.gradient.colorEnd,
                    opacity: effects.gradient.opacity as
                        | 0
                        | 10
                        | 20
                        | 30
                        | 40
                        | 50
                        | 60
                        | 70
                        | 80
                        | 90
                        | 100,
                }}
                dots={{
                    display: effects.dots.display,
                    color: effects.dots.color,
                    size: effects.dots.size as any,
                    opacity: effects.dots.opacity as any,
                }}
            />

            {verifyingToken ? (
                <Column gap="24" horizontal="center" padding="32">
                    <Spinner size="l" />
                    <Text>Verifying your magic link...</Text>
                </Column>
            ) : (
                <Row horizontal="center" maxWidth="xl" paddingX="16">
                    <Column
                        shadow="m"
                        radius="xl"
                        border="neutral-alpha-weak"
                        direction="column"
                        horizontal="center"
                        maxWidth={40}
                        padding="0"
                        background="overlay"
                        overflow="hidden"
                    >
                        <Column fillWidth>
                            <Row horizontal="center" paddingTop="48" paddingBottom="8">
                                <Logo size="l" href="/" />
                            </Row>
                            {getHeaderContent()}
                            <Column padding="32" gap="32" fillWidth>
                                {renderForm()}
                            </Column>
                            <Row horizontal="center" padding="16" gap="8">
                                <Button
                                    data-border="rounded"
                                    weight="default"
                                    variant="tertiary"
                                    size="s"
                                    label="Terms"
                                    href="/terms"
                                />
                                <Button
                                    data-border="rounded"
                                    weight="default"
                                    variant="tertiary"
                                    size="s"
                                    label="Privacy"
                                    href="/privacy"
                                />
                            </Row>
                        </Column>
                    </Column>
                </Row>
            )}
        </Column>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<Spinner />}>
            <LoginPage />
        </Suspense>
    );
}
