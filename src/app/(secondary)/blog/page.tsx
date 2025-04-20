import { Button, Column, Heading, Icon, Row, Text } from "@/once-ui/components";
import React from "react";

export default function BlogPage() {
    return (
        <Row fill padding="8" gap="8" horizontal="center">
            <Column gap="-1" fillWidth horizontal="center" maxWidth="l">
                {/* Main content */}
                <Column as="main" position="relative" horizontal="center">
                    <Column paddingX="xl" gap="32" paddingY="64">
                        <Column gap="16" horizontal="center">
                            <Heading variant="display-strong-xl" align="center">
                                Blog
                            </Heading>
                            <Text
                                variant="body-default-l"
                                align="center"
                                onBackground="neutral-medium"
                            >
                                Insights, updates, and tips to manage your email more effectively
                            </Text>
                        </Column>

                        {/* Featured post */}
                        <Column
                            gap="24"
                            padding="32"
                            radius="xl"
                            border="brand-weak"
                            background="overlay"
                        >
                            <Row gap="12" vertical="center">
                                <Text variant="label-strong-s" onBackground="neutral-medium">
                                    FEATURED
                                </Text>
                                <Text variant="label-default-xs" onBackground="neutral-medium">
                                    March 15, 2024
                                </Text>
                            </Row>

                            <Heading as="h2" variant="heading-strong-xl">
                                Introducing Smart Email Organization with AI
                            </Heading>

                            <Text variant="body-default-l" onBackground="neutral-medium">
                                Learn how our new AI-powered features can automatically categorize
                                and prioritize your emails to save you hours each week.
                            </Text>

                            <Row gap="8" vertical="center">
                                <Icon name="userCircle" size="m" onBackground="brand-strong" />
                                <Text variant="body-strong-m">Sarah Chen</Text>
                                <Text variant="body-default-s" onBackground="neutral-medium">
                                    Product Manager
                                </Text>
                            </Row>

                            <Button
                                label="Read Article"
                                variant="primary"
                                prefixIcon="arrowRight"
                            />
                        </Column>

                        {/* Article grid */}
                        <Column gap="24">
                            <Heading as="h2" variant="heading-strong-l">
                                Latest Articles
                            </Heading>
                            <Row gap="24" mobileDirection="column">
                                {/* Article 1 */}
                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="xl"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Text variant="label-default-s" onBackground="neutral-medium">
                                        February 28, 2024
                                    </Text>
                                    <Heading as="h3" variant="heading-strong-m">
                                        Email Security Best Practices in 2024
                                    </Heading>
                                    <Text variant="body-default-m" onBackground="neutral-medium">
                                        Protect your inbox with these updated security guidelines
                                        and tools to prevent phishing and other email threats.
                                    </Text>
                                    <Row gap="8" vertical="center">
                                        <Icon
                                            name="userCircle"
                                            size="s"
                                            onBackground="brand-strong"
                                        />
                                        <Text variant="body-strong-s">Michael Johnson</Text>
                                        <Text
                                            variant="body-default-xs"
                                            onBackground="neutral-medium"
                                        >
                                            Security Expert
                                        </Text>
                                    </Row>
                                    <Button label="Read More" variant="tertiary" size="s" />
                                </Column>

                                {/* Article 2 */}
                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="xl"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Text variant="label-default-s" onBackground="neutral-medium">
                                        February 15, 2024
                                    </Text>
                                    <Heading as="h3" variant="heading-strong-m">
                                        5 Ways to Declutter Your Inbox Today
                                    </Heading>
                                    <Text variant="body-default-m" onBackground="neutral-medium">
                                        Simple strategies to organize your email, reduce digital
                                        noise, and find important messages faster.
                                    </Text>
                                    <Row gap="8" vertical="center">
                                        <Icon
                                            name="userCircle"
                                            size="s"
                                            onBackground="brand-strong"
                                        />
                                        <Text variant="body-strong-s">Emma Roberts</Text>
                                        <Text
                                            variant="body-default-xs"
                                            onBackground="neutral-medium"
                                        >
                                            Productivity Coach
                                        </Text>
                                    </Row>
                                    <Button label="Read More" variant="tertiary" size="s" />
                                </Column>
                            </Row>

                            <Row gap="24" mobileDirection="column">
                                {/* Article 3 */}
                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="xl"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Text variant="label-default-s" onBackground="neutral-medium">
                                        February 5, 2024
                                    </Text>
                                    <Heading as="h3" variant="heading-strong-m">
                                        Understanding Email Authentication Protocols
                                    </Heading>
                                    <Text variant="body-default-m" onBackground="neutral-medium">
                                        A deep dive into SPF, DKIM, and DMARC and how they protect
                                        your email communications from spoofing.
                                    </Text>
                                    <Row gap="8" vertical="center">
                                        <Icon
                                            name="userCircle"
                                            size="s"
                                            onBackground="brand-strong"
                                        />
                                        <Text variant="body-strong-s">David Liu</Text>
                                        <Text
                                            variant="body-default-xs"
                                            onBackground="neutral-medium"
                                        >
                                            Technical Lead
                                        </Text>
                                    </Row>
                                    <Button label="Read More" variant="tertiary" size="s" />
                                </Column>

                                {/* Article 4 */}
                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="xl"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Text variant="label-default-s" onBackground="neutral-medium">
                                        January 22, 2024
                                    </Text>
                                    <Heading as="h3" variant="heading-strong-m">
                                        How AI is Transforming Email Management
                                    </Heading>
                                    <Text variant="body-default-m" onBackground="neutral-medium">
                                        The latest AI advancements and how they're making email more
                                        efficient and less time-consuming.
                                    </Text>
                                    <Row gap="8" vertical="center">
                                        <Icon
                                            name="userCircle"
                                            size="s"
                                            onBackground="brand-strong"
                                        />
                                        <Text variant="body-strong-s">Olivia Martinez</Text>
                                        <Text
                                            variant="body-default-xs"
                                            onBackground="neutral-medium"
                                        >
                                            AI Researcher
                                        </Text>
                                    </Row>
                                    <Button label="Read More" variant="tertiary" size="s" />
                                </Column>
                            </Row>
                        </Column>

                        {/* Categories section */}
                        <Column gap="24" paddingY="32">
                            <Heading as="h2" variant="heading-strong-l">
                                Categories
                            </Heading>
                            <Row gap="16" mobileDirection="column" wrap>
                                <Button
                                    label="Email Security"
                                    variant="secondary"
                                    prefixIcon="shield"
                                />
                                <Button
                                    label="Productivity"
                                    variant="secondary"
                                    prefixIcon="clock"
                                />
                                <Button
                                    label="AI & Technology"
                                    variant="secondary"
                                    prefixIcon="sparkles"
                                />
                                <Button
                                    label="Tutorials"
                                    variant="secondary"
                                    prefixIcon="bookOpen"
                                />
                                <Button
                                    label="Company News"
                                    variant="secondary"
                                    prefixIcon="megaphone"
                                />
                            </Row>
                        </Column>

                        {/* Newsletter signup */}
                        <Column
                            gap="24"
                            padding="32"
                            radius="xl"
                            border="neutral-alpha-medium"
                            background="neutral-alpha-weak"
                            horizontal="center"
                        >
                            <Heading as="h2" variant="heading-strong-l" align="center">
                                Subscribe to Our Newsletter
                            </Heading>
                            <Column maxWidth="m" horizontal="center">
                                <Text
                                    variant="body-default-m"
                                    align="center"
                                    onBackground="neutral-medium"
                                >
                                    Get the latest articles, tips, and product updates delivered
                                    directly to your inbox.
                                </Text>
                            </Column>
                            <Row
                                gap="16"
                                maxWidth="m"
                                fillWidth
                                horizontal="center"
                                mobileDirection="column"
                            >
                                <Row
                                    padding="8"
                                    radius="l"
                                    border="neutral-alpha-medium"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Icon name="mail" size="m" onBackground="neutral-medium" />
                                    <Text
                                        variant="body-default-m"
                                        onBackground="neutral-weak"
                                        paddingLeft="8"
                                    >
                                        Enter your email
                                    </Text>
                                </Row>
                                <Button label="Subscribe" variant="primary" />
                            </Row>
                            <Text
                                variant="body-default-xs"
                                align="center"
                                onBackground="neutral-weak"
                            >
                                We respect your privacy. Unsubscribe at any time.
                            </Text>
                        </Column>
                    </Column>
                </Column>
            </Column>
        </Row>
    );
}
