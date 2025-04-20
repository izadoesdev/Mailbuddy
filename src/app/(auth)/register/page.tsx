"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { effects } from "@/app/resources/config";
import { authClient, signIn, signUp } from "@/libs/auth/client";
import {
    Background,
    Badge,
    Button,
    Column,
    Heading,
    Icon,
    Input,
    Logo,
    OTPInput,
    PasswordInput,
    Row,
    Text,
    useToast,
} from "@/once-ui/components";

// Types for error handling
interface ApiError {
    message?: string;
    [key: string]: any;
}

export default function RegisterPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");

    // View state - default to password registration
    const [view, setView] = useState<
        "password" | "magic" | "otp" | "magic-sent" | "verification-sent"
    >("password");

    /**
     * Handle Google sign up
     */
    const handleGoogleSignup = () => {
        setIsLoading(true);
        signIn.social({
            provider: "google",
            callbackURL: "/inbox",
            fetchOptions: {
                onSuccess: () => {
                    addToast({
                        variant: "success",
                        message: "Account created successfully!",
                    });
                },
                onError: () => {
                    setIsLoading(false);
                    addToast({
                        variant: "danger",
                        message: "Google sign up failed. Please try again.",
                    });
                },
            },
        });
    };

    /**
     * Handle email/password signup
     */
    const handleEmailPasswordSignup = async (e: FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            addToast({
                variant: "danger",
                message: "Please fill in all required fields",
            });
            return;
        }

        if (password !== confirmPassword) {
            addToast({
                variant: "danger",
                message: "Passwords do not match",
            });
            return;
        }

        setIsLoading(true);

        try {
            await signUp.email({
                email,
                password,
                name: email.split("@")[0], // Default name from email
                fetchOptions: {
                    onSuccess: () => {
                        setIsLoading(false);
                        addToast({
                            variant: "success",
                            message: "Registration successful! Please verify your email.",
                        });
                        // Show verification sent view
                        setView("verification-sent");
                    },
                    onError: (error: ApiError) => {
                        setIsLoading(false);
                        addToast({
                            variant: "danger",
                            message: error?.message || "Registration failed. Please try again.",
                        });
                    },
                },
            });
        } catch (error) {
            setIsLoading(false);
            addToast({
                variant: "danger",
                message: "Registration failed. Please try again.",
            });
        }
    };

    /**
     * Handle magic link signup
     */
    const handleMagicLinkSignup = async (e: FormEvent) => {
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
            await signIn.magicLink({
                email,
                fetchOptions: {
                    onSuccess: () => {
                        setIsLoading(false);
                        addToast({
                            variant: "success",
                            message: "Magic link sent! Please check your email.",
                        });
                        setView("magic-sent");
                    },
                    onError: (error: ApiError) => {
                        setIsLoading(false);
                        addToast({
                            variant: "danger",
                            message:
                                error?.message || "Failed to send magic link. Please try again.",
                        });
                    },
                },
            });
        } catch (error) {
            setIsLoading(false);
            addToast({
                variant: "danger",
                message: "Failed to send magic link. Please try again.",
            });
        }
    };

    // Get header content based on current view
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
            case "verification-sent":
                return (
                    <Column gap="8" padding="16">
                        <Heading as="h1" variant="heading-strong-xl">
                            Verify your email
                        </Heading>
                        <Text variant="body-default-m" onBackground="neutral-medium">
                            We've sent a verification email to <strong>{email}</strong>. Click the
                            link to activate your account.
                        </Text>
                    </Column>
                );
            case "otp":
                return (
                    <Column gap="8" padding="16">
                        <Heading as="h1" variant="heading-strong-xl">
                            Enter verification code
                        </Heading>
                        <Text variant="body-default-m" onBackground="neutral-medium">
                            We've sent a code to <strong>{email}</strong>. Please enter it below.
                        </Text>
                    </Column>
                );
            case "magic":
                return (
                    <Column gap="8" padding="16">
                        <Heading as="h1" variant="heading-strong-xl">
                            Sign up with magic link
                        </Heading>
                        <Text variant="body-default-m" onBackground="neutral-medium">
                            Enter your email and we'll send you a link to sign up instantly.
                        </Text>
                    </Column>
                );
            default:
                return (
                    <Column gap="8" padding="16" horizontal="center">
                        <Heading as="h1" variant="display-strong-xs">
                            Create your account
                        </Heading>
                    </Column>
                );
        }
    };

    // Render form based on current view
    const renderForm = () => {
        switch (view) {
            case "magic-sent":
                return (
                    <Column gap="24" fillWidth>
                        <Button
                            variant="secondary"
                            label="Resend magic link"
                            fillWidth
                            disabled={isLoading}
                            onClick={(e: React.MouseEvent) => handleMagicLinkSignup(e as any)}
                        />
                        <Button
                            variant="tertiary"
                            label="Back to sign up"
                            fillWidth
                            onClick={() => setView("password")}
                        />
                    </Column>
                );
            case "verification-sent":
                return (
                    <Column gap="24" fillWidth>
                        <Text variant="body-default-m" align="center">
                            Please check your inbox and verify your email to continue.
                        </Text>
                        <Button
                            variant="tertiary"
                            label="Back to sign up"
                            fillWidth
                            onClick={() => setView("password")}
                        />
                    </Column>
                );
            case "otp":
                return (
                    <form onSubmit={handleVerifyOTP}>
                        <Column gap="24" fillWidth>
                            <OTPInput
                                id="signup-otp"
                                onComplete={(value) => setOtp(value)}
                                length={6}
                                autoFocus
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                label={isLoading ? "Verifying..." : "Verify"}
                                fillWidth
                                disabled={isLoading}
                            />
                            <Button
                                variant="tertiary"
                                label="Back to sign up"
                                fillWidth
                                onClick={() => setView("password")}
                            />
                        </Column>
                    </form>
                );
            case "magic":
                return (
                    <form onSubmit={handleMagicLinkSignup}>
                        <Column gap="24" fillWidth>
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
                            <Button
                                variant="tertiary"
                                label="Back to sign up"
                                fillWidth
                                onClick={() => setView("password")}
                            />
                        </Column>
                    </form>
                );
            default:
                return (
                    <form onSubmit={handleEmailPasswordSignup}>
                        <Column gap="24" fillWidth>
                            <Column fillWidth gap="-1">
                                <Input
                                    radius="top"
                                    id="signup-email"
                                    label="Email address"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <PasswordInput
                                    radius="none"
                                    id="signup-password"
                                    label="Password"
                                    name="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <PasswordInput
                                    radius="bottom"
                                    id="signup-confirm-password"
                                    label="Confirm password"
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </Column>
                            <Button
                                type="submit"
                                variant="primary"
                                label={isLoading ? "Creating account..." : "Create account"}
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
                                        onClick={handleGoogleSignup}
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
                                    Already have an account?
                                </Text>
                                <Button variant="tertiary" label="Sign in" href="/login" />
                            </Row>
                        </Column>
                    </form>
                );
        }
    };

    /**
     * Handle OTP verification
     */
    const handleVerifyOTP = async (e: FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length < 6) {
            addToast({
                variant: "danger",
                message: "Please enter a valid verification code",
            });
            return;
        }

        setIsLoading(true);

        try {
            await authClient.emailOtp.verifyEmail({
                email,
                otp,
                fetchOptions: {
                    onSuccess: () => {
                        addToast({
                            variant: "success",
                            message: "Email verified! Your account is now active.",
                        });
                    },
                    onError: (error: ApiError) => {
                        setIsLoading(false);
                        addToast({
                            variant: "danger",
                            message:
                                error?.message || "Invalid verification code. Please try again.",
                        });
                    },
                },
            });
        } catch (error) {
            setIsLoading(false);
            addToast({
                variant: "danger",
                message: "Failed to verify your email. Please try again.",
            });
        }
    };

    /**
     * Resend OTP verification code
     */
    const resendOTP = async () => {
        if (!email) {
            return;
        }

        setIsLoading(true);

        try {
            await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "email-verification",
                fetchOptions: {
                    onSuccess: () => {
                        setIsLoading(false);
                        addToast({
                            variant: "success",
                            message: "Verification code resent!",
                        });
                    },
                    onError: (error: ApiError) => {
                        setIsLoading(false);
                        addToast({
                            variant: "danger",
                            message: error?.message || "Failed to resend verification code.",
                        });
                    },
                },
            });
        } catch (error) {
            setIsLoading(false);
            addToast({
                variant: "danger",
                message: "Failed to resend verification code.",
            });
        }
    };

    return (
        <Column fillWidth horizontal="center" vertical="center" fillHeight>
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
        </Column>
    );
}
