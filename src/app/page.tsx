"use client";

import React from "react";
import {
    Heading,
    Text,
    Button,
    Icon,
    Logo,
    Row,
    Column,
    Card,
    Background,
    Line,
    IconButton,
    Fade,
} from "@/once-ui/components";

export default function Home() {
    return (
        <Column fillWidth paddingTop="80" paddingBottom="48" paddingX="s" horizontal="center" flex={1}>
            {/* Top fade effect */}
            <Fade
                zIndex={3}
                pattern={{
                    display: true,
                    size: "4",
                }}
                position="fixed"
                top="0"
                left="0"
                to="bottom"
                height={5}
                fillWidth
                blur={0.25}
            />

            {/* Navigation */}
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
                        <Logo size="s" icon={true} href="/" />
                        <Row paddingLeft="24" gap="8">
                            <Button weight="default" size="s" href="/features" label="Features" variant="tertiary" />
                            <Button weight="default" size="s" href="/pricing" label="Pricing" variant="tertiary" />
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

            {/* Main content */}
            <Column
                overflow="hidden"
                as="main"
                maxWidth="l"
                position="relative"
                horizontal="center"
                fillWidth
            >
                {/* Hero section */}
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
                            height: 100,
                            width: 100,
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
                            height: 70,
                            width: 160,
                            x: 120,
                            y: 35,
                            colorStart: "brand-solid-strong",
                            colorEnd: "static-transparent",
                        }}
                    />

                    <Column maxWidth={64} horizontal="center" gap="32" padding="32" position="relative">
                        <Heading
                            wrap="balance"
                            variant="display-strong-xl"
                            align="center"
                            marginBottom="16"
                        >
                            Your AI-powered email companion
                        </Heading>
                        <Text wrap="balance" variant="body-default-xl" align="center" marginBottom="32">
                            Mailbuddy is your secure, privacy-focused email companion that makes
                            managing Gmail simple and efficient
                        </Text>
                        <Row gap="16" horizontal="center" data-border="rounded">
                            <Button
                                label="Get Started"
                                href="/register"
                                variant="primary"
                                size="l"
                                arrowIcon
                            />
                            <Button
                                label="See Features"
                                href="/features"
                                variant="secondary"
                                size="l"
                            />
                        </Row>
                    </Column>
                </Column>

                {/* Features section */}
                <Column
                    fillWidth
                    paddingX="32"
                    paddingY="64"
                    gap="64"
                    horizontal="center"
                    position="relative"
                >
                    <Background mask={{x:50, y:0, radius:50}}>
                        <Line maxWidth="l" background="neutral-alpha-medium" />
                    </Background>

                    <Column fillWidth gap="32" horizontal="center">
                        <Heading as="h2" variant="display-strong-m" align="center">
                            Why Choose Mailbuddy
                        </Heading>

                        <Row gap="24" fillWidth marginTop="32" mobileDirection="column">
                            <Card
                                direction="column"
                                fillWidth
                                padding="32"
                                gap="16"
                                radius="xl"
                                border="neutral-alpha-weak"
                            >
                                <Icon name="shield" size="s" color="brand-medium" />
                                <Heading as="h3" variant="heading-strong-m">
                                    Privacy First
                                </Heading>
                                <Text variant="body-default-s" onBackground="neutral-weak" wrap="balance">
                                    End-to-end encryption keeps your emails secure and private, with
                                    zero access to your data.
                                </Text>
                            </Card>

                            <Card
                                direction="column"
                                fillWidth
                                padding="32"
                                gap="16"
                                radius="xl"
                                border="neutral-alpha-weak"
                            >
                                <Icon name="bolt" size="s" color="brand-medium" />
                                <Heading as="h3" variant="heading-strong-m">
                                    Lightning Fast
                                </Heading>
                                <Text variant="body-default-s" onBackground="neutral-weak" wrap="balance">
                                    Optimized performance for quick loading and responsiveness even with thousands of emails.
                                </Text>
                            </Card>

                            <Card
                                direction="column"
                                fillWidth
                                padding="32"
                                gap="16"
                                radius="xl"
                                border="neutral-alpha-weak"
                            >
                                <Icon name="layout" size="s" color="brand-medium" />
                                <Heading as="h3" variant="heading-strong-m">
                                    Intuitive Interface
                                </Heading>
                                <Text variant="body-default-s" onBackground="neutral-weak" wrap="balance">
                                    Clean, modern design that makes email management feel effortless
                                    and enjoyable.
                                </Text>
                            </Card>
                        </Row>
                    </Column>
                </Column>

                {/* How it works section */}
                <Column
                    fillWidth
                    paddingX="32"
                    paddingY="64"
                    gap="64"
                    horizontal="center"
                    position="relative"
                    background="overlay"
                >
                    <Background mask={{x:50, y:0, radius:50}}>
                        <Line maxWidth="l" background="neutral-alpha-medium" />
                    </Background>
                    <Column fillWidth gap="32" horizontal="center" maxWidth="l">
                        <Heading as="h2" variant="display-strong-m" align="center">
                            How Mailbuddy Works
                        </Heading>

                        <Row
                            gap="64"
                            fillWidth
                            marginTop="32"
                            mobileDirection="column"
                            vertical="center"
                        >
                            <Column gap="24" fillWidth>
                                <Row gap="24" vertical="center">
                                    <Row
                                        radius="full"
                                        background="neutral-medium"
                                        border="neutral-alpha-weak"
                                        minWidth="40"
                                        height="40"
                                        center
                                    >
                                        <Text onSolid="neutral-strong" variant="body-default-m">
                                            1
                                        </Text>
                                    </Row>
                                    <Heading as="h3" variant="heading-strong-m">
                                        Connect Your Gmail
                                    </Heading>
                                </Row>
                                <Text variant="body-default-s" marginLeft="64" onBackground="neutral-weak" wrap="balance">
                                    Securely link your Gmail account with read-only access. We never
                                    store your password.
                                </Text>
                            </Column>

                            <Column gap="24" fillWidth>
                                <Row gap="24" vertical="center">
                                    <Row
                                        radius="full"
                                        background="neutral-medium"
                                        border="neutral-alpha-weak"
                                        minWidth="40"
                                        height="40"
                                        center
                                    >
                                        <Text onSolid="neutral-strong" variant="body-strong-m">
                                            2
                                        </Text>
                                    </Row>
                                    <Heading as="h3" variant="heading-strong-m">
                                        Encrypt Your Data
                                    </Heading>
                                </Row>
                                <Text variant="body-default-s" marginLeft="64" onBackground="neutral-weak" wrap="balance">
                                    Your emails are automatically encrypted with keys only you
                                    control.
                                </Text>
                            </Column>

                            <Column gap="24" fillWidth>
                                <Row gap="24" vertical="center">
                                    <Row
                                        radius="full"
                                        background="neutral-medium"
                                        border="neutral-alpha-weak"
                                        minWidth="40"
                                        height="40"
                                        center
                                    >
                                        <Text onSolid="neutral-strong" variant="body-strong-m">
                                            3
                                        </Text>
                                    </Row>
                                    <Heading as="h3" variant="heading-strong-m">
                                        Enjoy Your Inbox
                                    </Heading>
                                </Row>
                                <Text variant="body-default-s" marginLeft="64" onBackground="neutral-weak" wrap="balance">
                                    Browse, search, and manage your emails with confidence and peace
                                    of mind.
                                </Text>
                            </Column>
                        </Row>
                    </Column>
                </Column>

                {/* CTA section */}
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
                        <Text variant="heading-default-xl" align="center" marginBottom="16" onBackground="neutral-weak" wrap="balance">
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

            <Background mask={{x:50, y:0, radius:50}} maxWidth="l" height="1">
                <Line background="neutral-alpha-medium" />
            </Background>

            {/* Footer */}
            <Row
                as="footer"
                maxWidth="l"
                paddingX="32"
                paddingY="64"
                gap="64"
                mobileDirection="column"
                marginTop="64"
            >
                <Column gap="24" maxWidth={24}>
                    <Logo size="m" />
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
                        <Heading as="h3" variant="heading-strong-s" marginLeft="12" marginBottom="24">
                            Product
                        </Heading>
                        <Button size="s" weight="default" label="Features" href="/features" variant="tertiary" />
                        <Button size="s" weight="default" label="Pricing" href="/pricing" variant="tertiary" />
                        <Button size="s" weight="default" label="Security" href="/security" variant="tertiary" />
                    </Column>

                    <Column gap="8" fillWidth>
                        <Heading as="h3" variant="heading-strong-s" marginLeft="12" marginBottom="24">
                            Company
                        </Heading>
                        <Button size="s" weight="default" label="About" href="/about" variant="tertiary" />
                        <Button size="s" weight="default" label="Blog" href="/blog" variant="tertiary" />
                        <Button size="s" weight="default" label="Contact" href="/contact" variant="tertiary" />
                    </Column>

                    <Column gap="8" fillWidth>
                        <Heading as="h3" variant="heading-strong-s" marginLeft="12" marginBottom="24">
                            Legal
                        </Heading>
                        <Button size="s" weight="default" label="Terms" href="/terms" variant="tertiary" />
                        <Button size="s" weight="default" label="Privacy" href="/privacy" variant="tertiary" />
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
                    © {new Date().getFullYear()} Mailbuddy. All rights reserved.
                </Text>
            </Row>
        </Column>
    );
}
