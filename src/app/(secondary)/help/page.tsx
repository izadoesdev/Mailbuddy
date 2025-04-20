import { Button, Column, Heading, Icon, Row, Text } from "@/once-ui/components";
import React from "react";

export default function HelpCenter() {
    return (
        <Row fill padding="8" gap="8" horizontal="center">
            <Column gap="-1" fillWidth horizontal="center" maxWidth="l">
                {/* Main content */}
                <Column
                    as="main"
                    maxWidth="m"
                    position="relative"
                    radius="xl"
                    horizontal="center"
                    border="neutral-alpha-weak"
                    background="overlay"
                >
                    <Column paddingX="xl" gap="24" paddingY="64">
                        <Heading variant="display-strong-xl" align="center">
                            Help Center
                        </Heading>
                        <Text
                            variant="body-default-m"
                            align="center"
                            onBackground="neutral-medium"
                            marginBottom="40"
                        >
                            Find answers to common questions and learn how to get the most out of
                            Mailbuddy
                        </Text>

                        {/* Search section */}
                        <Column gap="24" horizontal="center" paddingY="16" maxWidth="m">
                            <Row
                                padding="8"
                                radius="l"
                                border="neutral-alpha-medium"
                                background="overlay"
                                horizontal="space-between"
                                gap="8"
                                fillWidth
                            >
                                <Row gap="12" padding="8" fillWidth>
                                    <Icon name="search" size="m" onBackground="neutral-medium" />
                                    <Text variant="body-default-m" onBackground="neutral-weak">
                                        Search the help center...
                                    </Text>
                                </Row>
                                <Button label="Search" variant="primary" />
                            </Row>
                        </Column>

                        {/* Categories */}
                        <Column gap="32" paddingY="24">
                            {/* Getting Started */}
                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    Getting Started
                                </Heading>
                                <Row gap="24" mobileDirection="column">
                                    <Column
                                        gap="12"
                                        padding="24"
                                        radius="l"
                                        border="neutral-alpha-weak"
                                        background="overlay"
                                        fillWidth
                                    >
                                        <Row gap="12" vertical="start">
                                            <Icon
                                                name="userPlus"
                                                size="m"
                                                onBackground="brand-strong"
                                            />
                                            <Column gap="4">
                                                <Heading as="h3" variant="heading-strong-s">
                                                    Account Setup
                                                </Heading>
                                                <Text variant="body-default-m">
                                                    Learn how to create an account, connect your
                                                    email providers, and set up your profile.
                                                </Text>
                                            </Column>
                                        </Row>
                                    </Column>

                                    <Column
                                        gap="12"
                                        padding="24"
                                        radius="l"
                                        border="neutral-alpha-weak"
                                        background="overlay"
                                        fillWidth
                                    >
                                        <Row gap="12" vertical="start">
                                            <Icon
                                                name="settings"
                                                size="m"
                                                onBackground="brand-strong"
                                            />
                                            <Column gap="4">
                                                <Heading as="h3" variant="heading-strong-s">
                                                    Configuration
                                                </Heading>
                                                <Text variant="body-default-m">
                                                    Customize your Mailbuddy experience with
                                                    personalized settings and preferences.
                                                </Text>
                                            </Column>
                                        </Row>
                                    </Column>
                                </Row>
                            </Column>

                            {/* Features */}
                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    Features
                                </Heading>
                                <Row gap="24" mobileDirection="column">
                                    <Column
                                        gap="12"
                                        padding="24"
                                        radius="l"
                                        border="neutral-alpha-weak"
                                        background="overlay"
                                        fillWidth
                                    >
                                        <Row gap="12" vertical="start">
                                            <Icon
                                                name="sparkles"
                                                size="m"
                                                onBackground="accent-strong"
                                            />
                                            <Column gap="4">
                                                <Heading as="h3" variant="heading-strong-s">
                                                    AI Features
                                                </Heading>
                                                <Text variant="body-default-m">
                                                    Discover how our AI helps organize, summarize,
                                                    and prioritize your emails efficiently.
                                                </Text>
                                            </Column>
                                        </Row>
                                    </Column>

                                    <Column
                                        gap="12"
                                        padding="24"
                                        radius="l"
                                        border="neutral-alpha-weak"
                                        background="overlay"
                                        fillWidth
                                    >
                                        <Row gap="12" vertical="start">
                                            <Icon
                                                name="shield"
                                                size="m"
                                                onBackground="accent-strong"
                                            />
                                            <Column gap="4">
                                                <Heading as="h3" variant="heading-strong-s">
                                                    Security & Privacy
                                                </Heading>
                                                <Text variant="body-default-m">
                                                    Learn about our security practices and how we
                                                    protect your email data and privacy.
                                                </Text>
                                            </Column>
                                        </Row>
                                    </Column>
                                </Row>
                            </Column>

                            {/* Troubleshooting */}
                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    Troubleshooting
                                </Heading>
                                <Row gap="24" mobileDirection="column">
                                    <Column
                                        gap="12"
                                        padding="24"
                                        radius="l"
                                        border="neutral-alpha-weak"
                                        background="overlay"
                                        fillWidth
                                    >
                                        <Row gap="12" vertical="start">
                                            <Icon
                                                name="alertCircle"
                                                size="m"
                                                onBackground="warning-strong"
                                            />
                                            <Column gap="4">
                                                <Heading as="h3" variant="heading-strong-s">
                                                    Common Issues
                                                </Heading>
                                                <Text variant="body-default-m">
                                                    Solutions to frequently encountered problems and
                                                    how to resolve them quickly.
                                                </Text>
                                            </Column>
                                        </Row>
                                    </Column>

                                    <Column
                                        gap="12"
                                        padding="24"
                                        radius="l"
                                        border="neutral-alpha-weak"
                                        background="overlay"
                                        fillWidth
                                    >
                                        <Row gap="12" vertical="start">
                                            <Icon
                                                name="support"
                                                size="m"
                                                onBackground="warning-strong"
                                            />
                                            <Column gap="4">
                                                <Heading as="h3" variant="heading-strong-s">
                                                    Support Resources
                                                </Heading>
                                                <Text variant="body-default-m">
                                                    Additional resources, diagnostic tools, and ways
                                                    to contact our support team.
                                                </Text>
                                            </Column>
                                        </Row>
                                    </Column>
                                </Row>
                            </Column>
                        </Column>

                        {/* FAQ section */}
                        <Column gap="24" paddingY="24">
                            <Heading as="h2" variant="heading-strong-l">
                                Frequently Asked Questions
                            </Heading>

                            <Column gap="16">
                                <Column
                                    gap="8"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Heading as="h3" variant="heading-strong-m">
                                        How does Mailbuddy's AI categorize my emails?
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Our AI analyzes the content, sender information, and
                                        patterns in your email to automatically sort them into
                                        relevant categories. The system learns from your
                                        interactions to improve accuracy over time.
                                    </Text>
                                </Column>

                                <Column
                                    gap="8"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Heading as="h3" variant="heading-strong-m">
                                        Is my email data secure with Mailbuddy?
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Yes, security is our top priority. We use end-to-end
                                        encryption, secure authentication protocols, and never store
                                        your full email content on our servers. All AI processing is
                                        done with strict privacy controls.
                                    </Text>
                                </Column>

                                <Column
                                    gap="8"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Heading as="h3" variant="heading-strong-m">
                                        Can I use Mailbuddy with multiple email accounts?
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Absolutely! Mailbuddy is designed to work with multiple
                                        email accounts from various providers. You can add Gmail,
                                        Outlook, Yahoo, and other IMAP/POP3 accounts to manage all
                                        your emails in one place.
                                    </Text>
                                </Column>

                                <Column
                                    gap="8"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Heading as="h3" variant="heading-strong-m">
                                        What if I need more help?
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Our support team is always ready to assist you. You can
                                        contact us through the{" "}
                                        <Button
                                            variant="tertiary"
                                            href="/contact"
                                            label="Contact page"
                                        />{" "}
                                        or email us at support@mailbuddy.dev for personalized help
                                        with any issues.
                                    </Text>
                                </Column>
                            </Column>
                        </Column>

                        <Row horizontal="center" paddingY="48">
                            <Button
                                label="Contact Support"
                                href="/contact"
                                variant="primary"
                                prefixIcon="support"
                            />
                        </Row>
                    </Column>
                </Column>
            </Column>
        </Row>
    );
}
