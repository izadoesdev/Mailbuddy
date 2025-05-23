import { Button, Column, Heading, Icon, Row, Text } from "@/once-ui/components";
import React from "react";

export default function ApiPage() {
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
                            API Documentation
                        </Heading>
                        <Column horizontal="center">
                            <Text
                                variant="body-default-l"
                                align="center"
                                onBackground="neutral-medium"
                                marginBottom="40"
                            >
                                Integrate Mailbuddy's features into your applications
                            </Text>
                        </Column>

                        {/* API Overview */}
                        <Column gap="24" paddingY="16">
                            <Heading as="h2" variant="heading-strong-l">
                                Overview
                            </Heading>
                            <Text variant="body-default-m">
                                The Mailbuddy API allows developers to integrate our email
                                management, organization, and AI features into their own
                                applications. Our RESTful API provides endpoints for email
                                management, AI analysis, and user administration.
                            </Text>

                            <Row gap="16">
                                <Button label="API Reference" variant="primary" prefixIcon="code" />
                                <Button
                                    label="Getting Started Guide"
                                    variant="secondary"
                                    prefixIcon="bookOpen"
                                />
                            </Row>
                        </Column>

                        {/* Authentication */}
                        <Column gap="24" paddingY="16">
                            <Heading as="h2" variant="heading-strong-l">
                                Authentication
                            </Heading>
                            <Text variant="body-default-m">
                                Mailbuddy API uses OAuth 2.0 for authentication. You'll need to
                                register your application to receive client credentials and
                                implement the OAuth flow.
                            </Text>

                            <Column
                                gap="8"
                                padding="24"
                                radius="l"
                                border="neutral-alpha-weak"
                                background="neutral-alpha-weak"
                            >
                                <Heading as="h3" variant="heading-strong-s">
                                    API Key Example
                                </Heading>
                                <Row
                                    padding="16"
                                    radius="m"
                                    background="overlay"
                                    gap="8"
                                    vertical="center"
                                >
                                    <Text
                                        variant="body-default-s"
                                        style={{ fontFamily: "monospace" }}
                                    >
                                        Authorization: Bearer YOUR_API_TOKEN
                                    </Text>
                                    <Button
                                        variant="tertiary"
                                        size="s"
                                        label="Copy"
                                        prefixIcon="clipboard"
                                    />
                                </Row>
                            </Column>
                        </Column>

                        {/* Endpoints */}
                        <Column gap="24" paddingY="16">
                            <Heading as="h2" variant="heading-strong-l">
                                Key Endpoints
                            </Heading>

                            <Column gap="16">
                                {/* Emails endpoint */}
                                <Column
                                    gap="8"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Row gap="8" vertical="center">
                                        <Text
                                            variant="label-strong-s"
                                            onBackground="success-strong"
                                        >
                                            GET
                                        </Text>
                                        <Text
                                            variant="body-default-m"
                                            style={{ fontFamily: "monospace" }}
                                        >
                                            /api/v1/emails
                                        </Text>
                                    </Row>
                                    <Text variant="body-default-m">
                                        Retrieve emails with optional filtering, pagination, and
                                        sorting. Supports advanced search queries.
                                    </Text>
                                    <Row gap="8">
                                        <Button label="Documentation" variant="tertiary" size="s" />
                                        <Button label="Try It" variant="tertiary" size="s" />
                                    </Row>
                                </Column>

                                {/* Categories endpoint */}
                                <Column
                                    gap="8"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Row gap="8" vertical="center">
                                        <Text
                                            variant="label-strong-s"
                                            onBackground="success-strong"
                                        >
                                            GET
                                        </Text>
                                        <Text
                                            variant="body-default-m"
                                            style={{ fontFamily: "monospace" }}
                                        >
                                            /api/v1/categories
                                        </Text>
                                    </Row>
                                    <Text variant="body-default-m">
                                        Retrieve email categories generated by our AI, with counts
                                        and metadata.
                                    </Text>
                                    <Row gap="8">
                                        <Button label="Documentation" variant="tertiary" size="s" />
                                        <Button label="Try It" variant="tertiary" size="s" />
                                    </Row>
                                </Column>

                                {/* Analyze endpoint */}
                                <Column
                                    gap="8"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Row gap="8" vertical="center">
                                        <Text
                                            variant="label-strong-s"
                                            onBackground="warning-strong"
                                        >
                                            POST
                                        </Text>
                                        <Text
                                            variant="body-default-m"
                                            style={{ fontFamily: "monospace" }}
                                        >
                                            /api/v1/analyze
                                        </Text>
                                    </Row>
                                    <Text variant="body-default-m">
                                        Submit text for AI analysis, including sentiment,
                                        categorization, and summarization.
                                    </Text>
                                    <Row gap="8">
                                        <Button label="Documentation" variant="tertiary" size="s" />
                                        <Button label="Try It" variant="tertiary" size="s" />
                                    </Row>
                                </Column>
                            </Column>
                        </Column>

                        {/* Example Use Cases */}
                        <Column gap="24" paddingY="16">
                            <Heading as="h2" variant="heading-strong-l">
                                Example Use Cases
                            </Heading>

                            <Row gap="24" mobileDirection="column">
                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Icon name="zap" size="m" onBackground="brand-strong" />
                                    <Heading as="h3" variant="heading-strong-s">
                                        Email Client Integration
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Add Mailbuddy's AI-powered email organization and filtering
                                        capabilities to your own email client application.
                                    </Text>
                                </Column>

                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Icon name="mail" size="m" onBackground="brand-strong" />
                                    <Heading as="h3" variant="heading-strong-s">
                                        Email Analysis Service
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Build a service that analyzes emails for sentiment,
                                        importance, and category to prioritize customer
                                        communications.
                                    </Text>
                                </Column>
                            </Row>

                            <Row gap="24" mobileDirection="column">
                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Icon name="bot" size="m" onBackground="brand-strong" />
                                    <Heading as="h3" variant="heading-strong-s">
                                        Chatbot Enhancement
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Integrate email analysis capabilities into your chatbot or
                                        virtual assistant to provide email insights to users.
                                    </Text>
                                </Column>

                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Icon name="chart" size="m" onBackground="brand-strong" />
                                    <Heading as="h3" variant="heading-strong-s">
                                        Analytics Dashboard
                                    </Heading>
                                    <Text variant="body-default-m">
                                        Create a dashboard that visualizes email communication
                                        patterns and insights from your organization's email data.
                                    </Text>
                                </Column>
                            </Row>
                        </Column>

                        {/* Rate Limiting */}
                        <Column
                            gap="16"
                            padding="24"
                            radius="l"
                            border="neutral-alpha-weak"
                            background="neutral-alpha-weak"
                        >
                            <Heading as="h2" variant="heading-strong-m">
                                Rate Limiting
                            </Heading>
                            <Text variant="body-default-m">
                                The API is rate limited to protect our services from abuse. Rate
                                limits vary by endpoint and subscription tier:
                            </Text>
                            <Column gap="8" paddingLeft="24">
                                <Row gap="12" vertical="center">
                                    <Icon name="chevronRight" size="s" />
                                    <Text variant="body-default-m">
                                        Free tier: 100 requests per hour
                                    </Text>
                                </Row>
                                <Row gap="12" vertical="center">
                                    <Icon name="chevronRight" size="s" />
                                    <Text variant="body-default-m">
                                        Pro tier: 1,000 requests per hour
                                    </Text>
                                </Row>
                                <Row gap="12" vertical="center">
                                    <Icon name="chevronRight" size="s" />
                                    <Text variant="body-default-m">
                                        Business tier: 10,000 requests per hour
                                    </Text>
                                </Row>
                            </Column>
                        </Column>

                        {/* Support and Feedback */}
                        <Column gap="24" paddingY="24">
                            <Heading as="h2" variant="heading-strong-l" align="center">
                                Developer Support
                            </Heading>
                            <Text variant="body-default-m" align="center">
                                Need help with the API? Our developer support team is ready to
                                assist you.
                            </Text>
                            <Row horizontal="center" gap="16">
                                <Button
                                    label="API Support"
                                    href="/contact?subject=api"
                                    variant="primary"
                                    prefixIcon="support"
                                />
                                <Button
                                    label="API Status"
                                    variant="secondary"
                                    prefixIcon="activity"
                                />
                            </Row>
                        </Column>

                        <Row horizontal="center" paddingY="32">
                            <Button
                                label="Back to Home"
                                href="/"
                                variant="secondary"
                                prefixIcon="arrowLeft"
                                color="neutral-alpha-strong"
                            />
                        </Row>
                    </Column>
                </Column>
            </Column>
        </Row>
    );
}
