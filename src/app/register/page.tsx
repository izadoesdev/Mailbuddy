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
    Input,
    PasswordInput,
    OTPInput,
    useToast,
} from "@/once-ui/components";
import { signIn, signUp } from "@/libs/auth/client";

export default function RegisterPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    
    // View states
    const [view, setView] = useState<"register" | "otp" | "magic">("register");
    const [registerMethod, setRegisterMethod] = useState<"password" | "magic" | "">("");

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

    const handleEmailPasswordSignup = async (e: React.FormEvent) => {
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
            await signUp.credentials({
                email,
                password,
                fetchOptions: {
                    onSuccess: () => {
                        setIsLoading(false);
                        addToast({
                            variant: "success",
                            message: "Verification code sent to your email.",
                        });
                        setView("otp");
                    },
                    onError: (error) => {
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

    const handleVerifyOTP = async (e: React.FormEvent) => {
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
            await signUp.verifyOTP({
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
                    onError: (error) => {
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

    const resendOTP = async () => {
        setIsLoading(true);
        
        try {
            await signUp.resendOTP({
                email,
                fetchOptions: {
                    onSuccess: () => {
                        setIsLoading(false);
                        addToast({
                            variant: "success",
                            message: "New verification code sent to your email.",
                        });
                    },
                    onError: (error) => {
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
                                
                                {view === "register" && (
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
                                            Sign up to get started
                                        </Text>

                                        {registerMethod === "password" ? (
                                            <form onSubmit={handleEmailPasswordSignup} style={{ width: "100%" }}>
                                                <Column gap="16" fillWidth>
                                                    <Input
                                                        id="email"
                                                        label="Email address"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        placeholder="your@email.com"
                                                        fillWidth
                                                    />
                                                    <PasswordInput
                                                        id="password"
                                                        label="Password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        fillWidth
                                                    />
                                                    <PasswordInput
                                                        id="confirmPassword"
                                                        label="Confirm Password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                        fillWidth
                                                    />
                                                    <Button
                                                        label="Create account"
                                                        fillWidth
                                                        variant="primary"
                                                        weight="default"
                                                        size="l"
                                                        type="submit"
                                                        loading={isLoading}
                                                        disabled={isLoading}
                                                    />
                                                    <Button
                                                        label="Back to options"
                                                        variant="link"
                                                        onClick={() => setRegisterMethod("")}
                                                        type="button"
                                                    />
                                                </Column>
                                            </form>
                                        ) : registerMethod === "magic" ? (
                                            <form onSubmit={handleMagicLinkSignup} style={{ width: "100%" }}>
                                                <Column gap="16" fillWidth>
                                                    <Input
                                                        id="email"
                                                        label="Email address"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        placeholder="your@email.com"
                                                        fillWidth
                                                    />
                                                    <Button
                                                        label="Continue with Magic Link"
                                                        fillWidth
                                                        variant="primary"
                                                        weight="default"
                                                        size="l"
                                                        type="submit"
                                                        loading={isLoading}
                                                        disabled={isLoading}
                                                    />
                                                    <Button
                                                        label="Back to options"
                                                        variant="link"
                                                        onClick={() => setRegisterMethod("")}
                                                        type="button"
                                                    />
                                                </Column>
                                            </form>
                                        ) : (
                                            <>
                                                <Column gap="16" fillWidth>
                                                    <Button
                                                        label="Email & Password"
                                                        fillWidth
                                                        variant="secondary"
                                                        weight="default"
                                                        size="l"
                                                        onClick={() => setRegisterMethod("password")}
                                                    />
                                                    <Button
                                                        label="Magic Link"
                                                        fillWidth
                                                        variant="secondary"
                                                        weight="default"
                                                        size="l"
                                                        onClick={() => setRegisterMethod("magic")}
                                                    />
                                                </Column>

                                                <Row padding="24" marginY="16" fillWidth>
                                                    <Column fillWidth>
                                                        <Row horizontal="center" gap="16" vertical="center">
                                                            <Text variant="label-default-s" onBackground="neutral-medium">Or continue with</Text>
                                                        </Row>
                                                    </Column>
                                                </Row>

                                                <Button
                                                    label="Continue with Google"
                                                    fillWidth
                                                    variant="secondary"
                                                    weight="default"
                                                    prefixIcon="google"
                                                    size="l"
                                                    onClick={handleGoogleSignup}
                                                    disabled={isLoading}
                                                />
                                            </>
                                        )}
                                    </>
                                )}

                                {view === "otp" && (
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
                                            marginBottom="12"
                                            align="center"
                                        >
                                            We've sent a verification code to
                                        </Text>
                                        <Text
                                            variant="body-strong-m"
                                            marginBottom="24"
                                            align="center"
                                        >
                                            {email}
                                        </Text>

                                        <form onSubmit={handleVerifyOTP} style={{ width: "100%" }}>
                                            <Column gap="24" fillWidth>
                                                <OTPInput
                                                    value={otp}
                                                    onChange={setOtp}
                                                    numInputs={6}
                                                    onComplete={(code) => setOtp(code)}
                                                />
                                                <Button
                                                    label="Verify Email"
                                                    fillWidth
                                                    variant="primary"
                                                    weight="default"
                                                    size="l"
                                                    type="submit"
                                                    loading={isLoading}
                                                    disabled={isLoading || otp.length < 6}
                                                />
                                            </Column>
                                        </form>

                                        <Row paddingTop="24" horizontal="center" gap="8">
                                            <Text variant="body-default-s" onBackground="neutral-medium">
                                                Didn't receive a code?
                                            </Text>
                                            <Button
                                                variant="link"
                                                label="Resend"
                                                size="s"
                                                onClick={resendOTP}
                                                disabled={isLoading}
                                            />
                                        </Row>
                                    </>
                                )}

                                {view === "magic" && (
                                    <>
                                        <Heading
                                            as="h1"
                                            variant="display-strong-xs"
                                            align="center"
                                            marginTop="24"
                                        >
                                            Check your email
                                        </Heading>
                                        <Text
                                            onBackground="neutral-medium"
                                            marginBottom="12"
                                            align="center"
                                        >
                                            We've sent a magic link to
                                        </Text>
                                        <Text
                                            variant="body-strong-m"
                                            marginBottom="24"
                                            align="center"
                                        >
                                            {email}
                                        </Text>
                                        <Text
                                            onBackground="neutral-medium"
                                            marginBottom="24"
                                            align="center"
                                        >
                                            Click the link in your email to complete registration.
                                        </Text>
                                        <Button
                                            label="Back to sign up"
                                            variant="secondary"
                                            onClick={() => {
                                                setView("register");
                                                setRegisterMethod("");
                                            }}
                                        />
                                    </>
                                )}

                                <Row paddingTop="32" horizontal="center">
                                    <Text variant="body-default-s" onBackground="neutral-medium">
                                        Already have an account?&nbsp;
                                    </Text>
                                    <Link href="/login" style={{ textDecoration: 'none' }}>
                                        <Text variant="body-strong-s" onBackground="brand-strong">Log in</Text>
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