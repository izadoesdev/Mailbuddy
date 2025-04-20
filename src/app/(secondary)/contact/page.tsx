import { Button, Column, Heading, Icon, Row, Text } from "@/once-ui/components";
import React from "react";

export default function ContactPage() {
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
                            Contact Us
                        </Heading>
                        <Column horizontal="center">
                            <Text
                                variant="body-default-l"
                                align="center"
                                onBackground="neutral-medium"
                                marginBottom="40"
                            >
                                We're here to help with any questions or feedback you may have
                            </Text>
                        </Column>

                        {/* Contact form */}
                        <Column gap="32" paddingY="24">
                            <Column gap="24">
                                <Row gap="16" mobileDirection="column">
                                    <Column gap="8" fillWidth>
                                        <Text variant="label-strong-s">First Name</Text>
                                        <Row
                                            padding="12"
                                            radius="l"
                                            border="neutral-alpha-medium"
                                            fillWidth
                                        >
                                            <Text
                                                variant="body-default-m"
                                                onBackground="neutral-weak"
                                            >
                                                Enter your first name
                                            </Text>
                                        </Row>
                                    </Column>

                                    <Column gap="8" fillWidth>
                                        <Text variant="label-strong-s">Last Name</Text>
                                        <Row
                                            padding="12"
                                            radius="l"
                                            border="neutral-alpha-medium"
                                            fillWidth
                                        >
                                            <Text
                                                variant="body-default-m"
                                                onBackground="neutral-weak"
                                            >
                                                Enter your last name
                                            </Text>
                                        </Row>
                                    </Column>
                                </Row>

                                <Column gap="8">
                                    <Text variant="label-strong-s">Email Address</Text>
                                    <Row
                                        padding="12"
                                        radius="l"
                                        border="neutral-alpha-medium"
                                        fillWidth
                                    >
                                        <Text variant="body-default-m" onBackground="neutral-weak">
                                            Enter your email address
                                        </Text>
                                    </Row>
                                </Column>

                                <Column gap="8">
                                    <Text variant="label-strong-s">Subject</Text>
                                    <Row
                                        padding="12"
                                        radius="l"
                                        border="neutral-alpha-medium"
                                        fillWidth
                                    >
                                        <Text variant="body-default-m" onBackground="neutral-weak">
                                            Select a subject
                                        </Text>
                                    </Row>
                                </Column>

                                <Column gap="8">
                                    <Text variant="label-strong-s">Message</Text>
                                    <Column
                                        padding="12"
                                        radius="l"
                                        border="neutral-alpha-medium"
                                        fillWidth
                                        style={{ minHeight: "120px" }}
                                    >
                                        <Text variant="body-default-m" onBackground="neutral-weak">
                                            Type your message here...
                                        </Text>
                                    </Column>
                                </Column>

                                <Button label="Send Message" variant="primary" fillWidth />
                            </Column>
                        </Column>

                        {/* Alternate contact methods */}
                        <Column gap="24" paddingY="24">
                            <Heading as="h2" variant="heading-strong-l" align="center">
                                Other Ways to Reach Us
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
                                    <Row gap="12" vertical="start">
                                        <Icon name="mail" size="m" onBackground="brand-strong" />
                                        <Column gap="4">
                                            <Heading as="h3" variant="heading-strong-s">
                                                Email Support
                                            </Heading>
                                            <Text variant="body-default-m">
                                                For general inquiries: support@mailbuddy.dev
                                            </Text>
                                            <Text variant="body-default-m">
                                                For security concerns: security@mailbuddy.dev
                                            </Text>
                                        </Column>
                                    </Row>
                                </Column>

                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Row gap="12" vertical="start">
                                        <Icon name="support" size="m" onBackground="brand-strong" />
                                        <Column gap="4">
                                            <Heading as="h3" variant="heading-strong-s">
                                                Help Center
                                            </Heading>
                                            <Text variant="body-default-m">
                                                Find answers to common questions in our extensive
                                                knowledge base.
                                            </Text>
                                            <Button
                                                label="Visit Help Center"
                                                variant="tertiary"
                                                size="s"
                                                href="/help"
                                            />
                                        </Column>
                                    </Row>
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
                                    <Row gap="12" vertical="start">
                                        <Icon name="twitter" size="m" onBackground="brand-strong" />
                                        <Column gap="4">
                                            <Heading as="h3" variant="heading-strong-s">
                                                Twitter Support
                                            </Heading>
                                            <Text variant="body-default-m">
                                                Tweet us @MailbuddySupport for quick responses to
                                                simple questions.
                                            </Text>
                                        </Column>
                                    </Row>
                                </Column>

                                <Column
                                    gap="16"
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                    fillWidth
                                >
                                    <Row gap="12" vertical="start">
                                        <Icon name="github" size="m" onBackground="brand-strong" />
                                        <Column gap="4">
                                            <Heading as="h3" variant="heading-strong-s">
                                                GitHub Issues
                                            </Heading>
                                            <Text variant="body-default-m">
                                                Report technical issues or contribute to the project
                                                on our GitHub repository.
                                            </Text>
                                            <Button
                                                label="GitHub Repo"
                                                variant="tertiary"
                                                size="s"
                                                href="https://github.com/izadoesdev/mailer"
                                            />
                                        </Column>
                                    </Row>
                                </Column>
                            </Row>
                        </Column>

                        {/* Office hours */}
                        <Column
                            gap="16"
                            padding="24"
                            radius="l"
                            border="neutral-alpha-weak"
                            background="neutral-alpha-weak"
                        >
                            <Heading as="h2" variant="heading-strong-m" align="center">
                                Support Hours
                            </Heading>
                            <Text variant="body-default-m" align="center">
                                Our team is available Monday through Friday, 9:00 AM to 5:00 PM EST.
                                <br />
                                We typically respond to inquiries within 24 hours during business
                                days.
                            </Text>
                        </Column>

                        <Row horizontal="center" paddingY="48">
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
