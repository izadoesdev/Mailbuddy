"use client";

import { useState, type FormEvent } from "react";
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
    Input,
    PasswordInput,
    OTPInput,
    useToast,
} from "@/once-ui/components";
import { authClient, signIn, signUp } from "@/libs/auth/client";

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
    
    // View state - consolidated to a single state
    const [view, setView] = useState<"options" | "password" | "magic" | "otp" | "magic-sent" | "verification-sent">("options");

    /**
     * Handle Google sign up
     */
    const handleGoogleSignup = () => {
        setIsLoading(true);
        signIn.social({
            provider: "google",
            fetchOptions: {
                onSuccess: () => {
                    addToast({
                        variant: "success",
                        message: "Account created successfully!",
                    });
                    router.push("/inbox");
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
                name: email.split('@')[0], // Default name from email
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
                            message: error?.message || "Failed to send magic link. Please try again.",
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
                        router.push("/inbox");
                    },
                    onError: (error: ApiError) => {
                        setIsLoading(false);
                        addToast({
                            variant: "danger",
                            message: error?.message || "Verification failed. Please try again.",
                        });
                    },
                },
            });
        } catch (error) {
            setIsLoading(false);
            addToast({
                variant: "danger",
                message: "Verification failed. Please try again.",
            });
        }
    };

    /**
     * Resend OTP code
     */
    const resendOTP = async () => {
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
                            message: "New verification code sent to your email.",
                        });
                    },
                    onError: (error: ApiError) => {
                        setIsLoading(false);
                        addToast({
                            variant: "danger",
                            message: error?.message || "Failed to resend code. Please try again.",
                        });
                    },
                },
            });
        } catch (error) {
            setIsLoading(false);
            addToast({
                variant: "danger",
                message: "Failed to resend code. Please try again.",
            });
        }
    };

    // Render different forms based on the current view
    const renderForm = () => {
        switch(view) {
            case "password":
                return (
                    <form onSubmit={handleEmailPasswordSignup} style={{ width: "100%" }}>
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
                            <PasswordInput
                                id="confirmPassword"
                                label="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <Button
                                label="Create account"
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
                
            case "magic":
                return (
                    <form onSubmit={handleMagicLinkSignup} style={{ width: "100%" }}>
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
                                We'll send a magic link to your email that will let you sign up instantly.
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
                
            case "otp":
                return (
                    <form onSubmit={handleVerifyOTP} style={{ width: "100%" }}>
                        <Column gap="16" fillWidth>
                            <Text variant="body-default-m" align="center">
                                We've sent a verification code to <strong>{email}</strong>
                            </Text>
                            <OTPInput
                                length={6}
                                onComplete={(newOtp) => setOtp(newOtp)}
                                autoFocus
                            />
                            <Button
                                label="Verify email"
                                fillWidth
                                variant="primary"
                                size="l"
                                type="submit"
                                loading={isLoading}
                                disabled={isLoading}
                            />
                            <Button
                                label="Resend code"
                                variant="tertiary"
                                onClick={resendOTP}
                                type="button"
                                disabled={isLoading}
                            />
                        </Column>
                    </form>
                );
                
            case "magic-sent":
                return (
                    <Column gap="24" fillWidth horizontal="center">
                        <div className="magic-link-icon" style={{ fontSize: "48px", color: "var(--brand-solid-medium)" }}>
                            ✉️
                        </div>
                        <Text variant="body-strong-m" align="center">
                            Check your email
                        </Text>
                        <Text variant="body-default-m" align="center">
                            We've sent a magic link to <strong>{email}</strong>
                        </Text>
                        <Text variant="body-default-s" align="center" onBackground="neutral-medium">
                            Click the link in your email to complete your registration
                        </Text>
                        <Column paddingTop="16">
                            <Button
                                label="Back to sign-up options"
                                variant="secondary"
                                onClick={() => setView("options")}
                                type="button"
                            />
                        </Column>
                    </Column>
                );
                
            case "verification-sent":
                return (
                    <Column gap="24" fillWidth horizontal="center">
                        <div style={{ fontSize: "48px" }}>
                            ✉️
                        </div>
                        <Text variant="heading-strong-s" align="center">
                            Check your email
                        </Text>
                        <Text variant="body-default-m" align="center">
                            We've sent a verification link to <strong>{email}</strong>
                        </Text>
                        <Text variant="body-default-s" align="center" onBackground="neutral-medium">
                            Please verify your email to activate your account
                        </Text>
                        <Button
                            label="Go to sign in"
                            variant="primary"
                            onClick={() => router.push("/login")}
                            type="button"
                            style={{ marginTop: "24px" }}
                        />
                    </Column>
                );
                
            default: // options
                return (
                    <Column gap="16" fillWidth>
                        <Button
                            label="Sign up with email"
                            fillWidth
                            variant="primary"
                            size="l"
                            onClick={() => setView("password")}
                            prefixIcon="mail"
                        />
                        <Button
                            label="Sign up with magic link"
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
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                        />
                    </Column>
                );
        }
    };

    // Page title and header content based on current view
    const getHeaderContent = () => {
        switch(view) {
            case "otp":
                return (
                    <>
                        <Heading
                            as="h1"
                            variant="display-strong-xs"
                            align="center"
                            marginTop="24"
                        >
                            Verify your email
                        </Heading>
                        <Text
                            onBackground="neutral-medium"
                            marginBottom="24"
                            align="center"
                        >
                            Enter the verification code
                        </Text>
                    </>
                );
            case "magic-sent":
                return (
                    <>
                        <Heading
                            as="h1"
                            variant="display-strong-xs"
                            align="center"
                            marginTop="24"
                        >
                            Magic link sent
                        </Heading>
                        <Text
                            onBackground="neutral-medium"
                            marginBottom="24"
                            align="center"
                        >
                            Follow the instructions in your email
                        </Text>
                    </>
                );
            case "verification-sent":
                return (
                    <>
                        <Heading
                            as="h1"
                            variant="display-strong-xs"
                            align="center"
                            marginTop="24"
                        >
                            Verify your email
                        </Heading>
                        <Text
                            onBackground="neutral-medium"
                            marginBottom="24"
                            align="center"
                        >
                            Your account has been created
                        </Text>
                    </>
                );
            default:
                return (
                    <>
                        <Heading
                            as="h1"
                            variant="display-strong-xs"
                            align="center"
                            marginTop="24"
                        >
                            Create an account
                        </Heading>
                        <Text
                            onBackground="neutral-medium"
                            marginBottom="24"
                            align="center"
                        >
                            Join Mailer and start managing emails
                        </Text>
                    </>
                );
        }
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
                                
                                {getHeaderContent()}
                                
                                {renderForm()}

                                {view !== "otp" && view !== "magic-sent" && view !== "verification-sent" && (
                                    <Row paddingTop="32" horizontal="center">
                                        <Text variant="body-default-s" onBackground="neutral-medium">
                                            Already have an account?&nbsp;
                                        </Text>
                                        <Link href="/login" style={{ textDecoration: 'none' }}>
                                            <Text variant="body-strong-s" onBackground="brand-strong">Sign in</Text>
                                        </Link>
                                    </Row>
                                )}
                            </Column>
                        </Column>
                    </Row>
                </Column>
            </Column>
        </Column>
    );
} 