"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Heading,
    Text,
    Button,
    Icon,
    Logo,
    Row,
    Column,
    Background,
    Line,
    IconButton,
    Fade,
    Input,
    Badge,
} from "@/once-ui/components";
import { useUser } from "@/libs/auth/client";

export default function Home() {
    const router = useRouter();
    const { user, isLoading } = useUser();
    const [wishlistEmail, setWishlistEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [userCount, setUserCount] = useState(0);
    const [successMessage, setSuccessMessage] = useState("");
    const [alreadySubscribed, setAlreadySubscribed] = useState(false);
    
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await fetch('/api/wishlist');
                const data = await response.json();
                
                if (data.success && data.data?.count) {
                    animateCounter(data.data.count);
                } else {
                    animateCounter(1247);
                }
            } catch (error) {
                animateCounter(1247);
            }
        };
        
        fetchUserCount();
    }, []);
    
    const animateCounter = (targetCount: number) => {
        const duration = 1500;
        const step = 30;
        const increment = Math.ceil(targetCount / (duration / step));
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetCount) {
                setUserCount(targetCount);
                clearInterval(timer);
            } else {
                setUserCount(current);
            }
        }, step);
    };
    
    const handleWishlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wishlistEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wishlistEmail)) {
            setSubmitError("Please enter a valid email address");
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError("");
        
        try {
            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: wishlistEmail }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSuccessMessage(data.message || "Successfully added to wishlist");
                const isAlreadySubscribed = data.message?.includes("already");
                setAlreadySubscribed(isAlreadySubscribed);
                
                if (!isAlreadySubscribed) {
                    setUserCount(prev => prev + 1);
                }
                
                setSubmitted(true);
                setWishlistEmail("");
            } else {
                setSubmitError(data.error || "Failed to join wishlist. Please try again.");
            }
        } catch (error) {
            setSubmitError("An unexpected error occurred. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect to inbox if user is logged in
    // useEffect(() => {
    //     // Only redirect when authentication check is complete and user exists
    //     if (!isLoading && user) {
    //         router.push("/inbox");
    //     }
    // }, [user, isLoading, router]);

    if (isLoading) {
        return <Column fillWidth paddingTop="80" horizontal="center" flex={1} />;
    }

    return (
        <Column
            fillWidth
            paddingTop="80"
            paddingBottom="48"
            paddingX="s"
            horizontal="center"
            flex={1}
        >
            <Background
                position="absolute"
                pointerEvents="none"
                mask={{ x: 100, y: 0, radius: 100 }}
                gradient={{
                    display: true,
                    x: 100,
                    y: 60,
                    width: 70,
                    height: 50,
                    tilt: -40,
                    opacity: 90,
                    colorStart: "accent-background-strong",
                    colorEnd: "page-background",
                }}
                grid={{
                    display: true,
                    opacity: 100,
                    width: "0.25rem",
                    color: "neutral-alpha-medium",
                    height: "0.25rem",
                }}
            />
            <Fade
                zIndex={3}
                pattern={{ display: true, size: "4" }}
                position="fixed"
                top="0"
                left="0"
                to="bottom"
                height={5}
                fillWidth
                blur={0.25}
            />

            <Row position="fixed" top="0" fillWidth horizontal="center" zIndex={3}>
                <Row
                    data-border="rounded"
                    horizontal="space-between"
                    maxWidth="l"
                    paddingX="24"
                    paddingY="20"
                    fillWidth
                >
                    <Row gap="8" vertical="center">
                        <Logo size="m" href="/" />
                        <Row paddingLeft="24" gap="8">
                            <Button
                                weight="default"
                                size="s"
                                href="/features"
                                label="Features"
                                variant="tertiary"
                            />
                            <Button
                                weight="default"
                                size="s"
                                href="/pricing"
                                label="Pricing"
                                variant="tertiary"
                            />
                        </Row>
                    </Row>
                    <Row gap="8" hide="s">
                        <Button size="s" href="/login" label="Log in" variant="secondary" />
                        <Button size="s" href="/register" label="Sign up" arrowIcon />
                    </Row>
                    <Row gap="16" show="s">
                        <IconButton icon="menu" variant="tertiary" aria-label="Menu" />
                    </Row>
                </Row>
            </Row>

            <Column
                overflow="hidden"
                as="main"
                maxWidth="l"
                position="relative"
                horizontal="center"
                fillWidth
            >
                <Column
                    fillWidth
                    horizontal="center"
                    gap="48"
                    overflow="hidden"
                    radius="xl"
                    paddingTop="80"
                    paddingBottom="64"
                    position="relative"
                >
                    <Background
                        mask={{ x: 0, y: 48 }}
                        position="absolute"
                        grid={{
                            display: true,
                            width: "0.25rem",
                            color: "neutral-alpha-medium",
                            height: "0.25rem",
                        }}
                    />
                    <Background
                        mask={{ x: 80, y: 0, radius: 100 }}
                        position="absolute"
                        gradient={{
                            display: true,
                            tilt: -35,
                            height: 100,
                            width: 100,
                            x: 100,
                            y: 40,
                            colorStart: "accent-solid-medium",
                            colorEnd: "static-transparent",
                        }}
                    />
                    <Background
                        mask={{ x: 100, y: 0, radius: 100 }}
                        position="absolute"
                        gradient={{
                            display: true,
                            opacity: 100,
                            tilt: -35,
                            height: 70,
                            width: 160,
                            x: 120,
                            y: 35,
                            colorStart: "brand-solid-strong",
                            colorEnd: "static-transparent",
                        }}
                    />

                    <Column
                        maxWidth={64}
                        horizontal="center"
                        gap="32"
                        padding="32"
                        position="relative"
                    >
                        <Heading
                            wrap="balance"
                            variant="display-strong-xl"
                            align="center"
                            marginBottom="16"
                        >
                            Your AI-Powered Email Companion
                        </Heading>
                        <Text
                            wrap="balance"
                            variant="heading-default-xl"
                            align="center"
                            marginBottom="32"
                        >
                            Mailbuddy is your secure, privacy-focused email companion that makes
                            managing Gmail simple and efficient
                        </Text>
                        <Row gap="16" horizontal="center" data-border="rounded">
                            <Button
                                label="Start for free"
                                href="/register"
                                variant="primary"
                                size="l"
                                arrowIcon
                            />
                        </Row>
                    </Column>
                </Column>

                <Column
                    fillWidth
                    paddingX="32"
                    paddingY="64"
                    gap="48"
                    horizontal="center"
                    position="relative"
                >
                    
                    <Column fillWidth gap="32" horizontal="center" maxWidth="l">
                        <Row
                            fillWidth
                            padding="xl"
                            radius="l"
                            background="neutral-alpha-weak"
                            border="neutral-alpha-medium"
                        > 
                            {submitted ? (
                                <Column gap="16" horizontal="center" paddingY="24">
                                    <Icon 
                                        name={alreadySubscribed ? "info" : "checkCircle"} 
                                        size="l" 
                                        color={alreadySubscribed ? "info" : "success"} 
                                    />
                                    <Heading 
                                        variant="heading-strong-m" 
                                        align="center"
                                    >
                                        {alreadySubscribed ? "Already subscribed" : "Thank you!"}
                                    </Heading>
                                    <Text 
                                        variant="body-default-m" 
                                        align="center" 
                                        onBackground="neutral-medium"
                                    >
                                        {alreadySubscribed 
                                            ? "This email is already on our waitlist. We'll keep you updated on our progress."
                                            : "You've been added to our waitlist. We'll keep you updated on our progress and upcoming features."
                                        }
                                    </Text>
                                </Column>
                            ) : (
                                <form onSubmit={handleWishlistSubmit} style={{ width: '100%' }}>
                                    <Column gap="16" fillWidth horizontal="center">
                                    
                                    <Badge paddingX="12"
                                        marginBottom="24"
                                            background="surface"
                                            border="neutral-alpha-medium"
                                            paddingY="8"
                                            textVariant="body-default-s"
                                            arrow={false}
                                            align="center"
                                        >
                                            {userCount.toLocaleString()} people are already waiting
                                        </Badge>

                                    <Heading as="h2" variant="display-strong-m" align="center">
                                        Join Our Waitlist
                                    </Heading>
                                    
                                    <Column horizontal="center" gap="16" maxWidth={24}>
                                        <Text
                                            variant="body-default-m"
                                            align="center"
                                            onBackground="neutral-medium"
                                            wrap="balance"
                                        >
                                            Be the first to know when we launch new features and get early access to our premium tiers.
                                        </Text>
                                    </Column>
                                        <Background mask={{ x: 50, y: 0, radius: 50 }} marginTop="40" marginBottom="40">
                                            <Line maxWidth="l" background="neutral-alpha-medium" />
                                        </Background>
                                        <Column gap="16" maxWidth={32}>
                                            <Input
                                                id="wishlist-email"
                                                labelAsPlaceholder
                                                label="Your email"
                                                type="email"
                                                value={wishlistEmail}
                                                onChange={(e) => setWishlistEmail(e.target.value)}
                                                required
                                                error={submitError ? true : undefined}
                                                errorMessage={submitError}
                                            />
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                label={isSubmitting ? "Adding you..." : "Join Wishlist"}
                                                loading={isSubmitting}
                                                fillWidth
                                            />
                                        </Column>
                                    </Column>
                                </form>
                            )}
                        </Row>
                    </Column>
                </Column>

                <Column
                    fillWidth
                    paddingX="32"
                    paddingY="80"
                    gap="32"
                    horizontal="center"
                    position="relative"
                >
                    <Column maxWidth={48} horizontal="center" gap="32">
                        <Heading as="h2" variant="display-strong-l" align="center">
                            Ready to Take Control of Your Email?
                        </Heading>
                        <Text
                            variant="heading-default-xl"
                            align="center"
                            marginBottom="16"
                            onBackground="neutral-weak"
                            wrap="balance"
                        >
                            Join thousands of users who have made email secure and simple again.
                        </Text>
                        <Button
                            data-border="rounded"
                            label="Get Started for Free"
                            href="/register"
                            variant="primary"
                            size="l"
                            arrowIcon
                        />
                    </Column>
                </Column>
            </Column>

            <Background mask={{ x: 50, y: 0, radius: 50 }} maxWidth="l" height="1">
                <Line background="neutral-alpha-medium" />
            </Background>

            <Row
                as="footer"
                maxWidth="l"
                paddingX="32"
                paddingY="48"
                gap="64"
                mobileDirection="column"
                marginTop="48"
            >
                <Column gap="24" maxWidth={24}>
                    <Logo style={{marginLeft: "-0.5rem"}} size="l" icon={false} />
                    <Text variant="label-default-s" onBackground="neutral-medium" wrap="balance">
                        Your secure email companion that makes managing Gmail simple and efficient.
                    </Text>
                    <Row gap="8" data-border="rounded">
                        <IconButton
                            href="https://www.twitter.com/mailbuddy"
                            icon="twitter"
                            variant="tertiary"
                            aria-label="Twitter"
                        />
                        <IconButton
                            href="https://www.linkedin.com/company/mailbuddy/"
                            icon="linkedin"
                            variant="tertiary"
                            aria-label="LinkedIn"
                        />
                        <IconButton
                            href="https://github.com/mailbuddy"
                            icon="github"
                            variant="tertiary"
                            aria-label="GitHub"
                        />
                    </Row>
                </Column>

                <Row gap="64" fillWidth mobileDirection="column" data-border="rounded">
                    <Column gap="8" fillWidth>
                        <Heading
                            as="h3"
                            variant="heading-strong-s"
                            marginLeft="12"
                            marginBottom="24"
                        >
                            Product
                        </Heading>
                        <Button
                            size="s"
                            weight="default"
                            label="Features"
                            href="/features"
                            variant="tertiary"
                        />
                        <Button
                            size="s"
                            weight="default"
                            label="Pricing"
                            href="/pricing"
                            variant="tertiary"
                        />
                        <Button
                            size="s"
                            weight="default"
                            label="Security"
                            href="/security"
                            variant="tertiary"
                        />
                    </Column>

                    <Column gap="8" fillWidth>
                        <Heading
                            as="h3"
                            variant="heading-strong-s"
                            marginLeft="12"
                            marginBottom="24"
                        >
                            Company
                        </Heading>
                        <Button
                            size="s"
                            weight="default"
                            label="About"
                            href="/about"
                            variant="tertiary"
                        />
                        <Button
                            size="s"
                            weight="default"
                            label="Blog"
                            href="/blog"
                            variant="tertiary"
                        />
                        <Button
                            size="s"
                            weight="default"
                            label="Contact"
                            href="/contact"
                            variant="tertiary"
                        />
                    </Column>

                    <Column gap="8" fillWidth>
                        <Heading
                            as="h3"
                            variant="heading-strong-s"
                            marginLeft="12"
                            marginBottom="24"
                        >
                            Legal
                        </Heading>
                        <Button
                            size="s"
                            weight="default"
                            label="Terms"
                            href="/terms"
                            variant="tertiary"
                        />
                        <Button
                            size="s"
                            weight="default"
                            label="Privacy"
                            href="/privacy"
                            variant="tertiary"
                        />
                    </Column>
                </Row>
            </Row>

            <Row
                fillWidth
                maxWidth="l"
                paddingX="32"
                paddingY="24"
                horizontal="space-between"
                mobileDirection="column"
                gap="16"
            >
                <Text variant="label-default-s" onBackground="neutral-weak">
                    {new Date().getFullYear()} Mailbuddy. All rights reserved.
                </Text>
            </Row>
        </Column>
    );
}
