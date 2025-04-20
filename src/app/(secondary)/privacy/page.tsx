import { Background, Button, Column, Heading, Icon, Row, Text } from "@/once-ui/components";
import React from "react";

export default function PrivacyPolicy() {
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
                            Privacy Policy
                        </Heading>
                        <Text
                            variant="body-default-m"
                            align="center"
                            onBackground="neutral-medium"
                            marginBottom="40"
                        >
                            Last updated:{" "}
                            {new Date().toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </Text>

                        <Column gap="32" paddingY="24">
                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    1. Introduction
                                </Heading>
                                <Text variant="body-default-m">
                                    Welcome to our Privacy Policy. This Privacy Policy describes how
                                    we collect, use, process, and disclose your information,
                                    including personal information, in conjunction with your access
                                    to and use of our services.
                                </Text>
                            </Column>

                            <Column gap="16" position="relative">
                                <Background
                                    position="absolute"
                                    mask={{
                                        x: 0,
                                        y: 100,
                                        radius: 75,
                                    }}
                                    gradient={{
                                        display: true,
                                        opacity: 20,
                                        tilt: -20,
                                        height: 30,
                                        width: 30,
                                        x: 25,
                                        y: 25,
                                        colorStart: "accent-solid-medium",
                                        colorEnd: "static-transparent",
                                    }}
                                />
                                <Heading as="h2" variant="heading-strong-l">
                                    2. Information We Collect
                                </Heading>
                                <Text variant="body-default-m">
                                    We collect various types of information from you when you use
                                    our service, including:
                                </Text>
                                <Column gap="8" paddingLeft="24">
                                    <Row gap="12" vertical="start">
                                        <Icon name="checkCircle" size="s" />
                                        <Text variant="body-default-m">
                                            <Text as="span" variant="body-strong-m">
                                                Account Information:
                                            </Text>{" "}
                                            Such as your name, email address, date of birth, and
                                            other information you provide during registration.
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="checkCircle" size="s" />
                                        <Text variant="body-default-m">
                                            <Text as="span" variant="body-strong-m">
                                                Usage Information:
                                            </Text>{" "}
                                            Information about how you use our service, including log
                                            data, device information, and cookies.
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="checkCircle" size="s" />
                                        <Text variant="body-default-m">
                                            <Text as="span" variant="body-strong-m">
                                                Payment Information:
                                            </Text>{" "}
                                            When you make a purchase, we collect information
                                            necessary to process the payment.
                                        </Text>
                                    </Row>
                                </Column>
                            </Column>

                            <Column gap="16" position="relative">
                                <Heading as="h2" variant="heading-strong-l">
                                    3. How We Use Your Information
                                </Heading>
                                <Text variant="body-default-m">
                                    We use the information we collect for various purposes,
                                    including:
                                </Text>
                                <Column gap="8" paddingLeft="24">
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            To provide, maintain, and improve our services
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            To process transactions and send related information
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            To send administrative messages, updates, and security
                                            alerts
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            To respond to your comments, questions, and customer
                                            service requests
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            To monitor and analyze trends, usage, and activities
                                            connected to our services
                                        </Text>
                                    </Row>
                                </Column>
                            </Column>

                            <Column gap="16" position="relative">
                                <Heading as="h2" variant="heading-strong-l">
                                    4. Information Sharing and Disclosure
                                </Heading>
                                <Text variant="body-default-m">
                                    We may share your information in the following situations:
                                </Text>
                                <Column gap="8">
                                    <Text variant="body-default-m">
                                        <Text as="span" variant="body-strong-m">
                                            With Service Providers:
                                        </Text>{" "}
                                        We may share your information with third-party vendors,
                                        consultants, and other service providers who need access to
                                        such information to carry out work on our behalf.
                                    </Text>
                                    <Text variant="body-default-m">
                                        <Text as="span" variant="body-strong-m">
                                            For Legal Reasons:
                                        </Text>{" "}
                                        We may disclose your information if we believe it is
                                        reasonably necessary to comply with a law, regulation, or
                                        legal request.
                                    </Text>
                                    <Text variant="body-default-m">
                                        <Text as="span" variant="body-strong-m">
                                            Business Transfers:
                                        </Text>{" "}
                                        We may share or transfer your information in connection with
                                        a merger, acquisition, reorganization, or sale of assets.
                                    </Text>
                                </Column>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    5. Your Rights
                                </Heading>
                                <Text variant="body-default-m">
                                    Depending on your location, you may have certain rights
                                    regarding your personal information, such as:
                                </Text>
                                <Column gap="8" paddingLeft="24">
                                    <Row gap="12" vertical="start">
                                        <Icon name="shield" size="s" />
                                        <Text variant="body-default-m">
                                            Access to your personal information
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="shield" size="s" />
                                        <Text variant="body-default-m">
                                            Correction of inaccurate or incomplete information
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="shield" size="s" />
                                        <Text variant="body-default-m">
                                            Deletion of your personal information
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="shield" size="s" />
                                        <Text variant="body-default-m">
                                            Restriction or objection to our processing of your
                                            information
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="shield" size="s" />
                                        <Text variant="body-default-m">Data portability</Text>
                                    </Row>
                                </Column>
                            </Column>

                            <Column gap="16" position="relative">
                                <Heading as="h2" variant="heading-strong-l">
                                    6. Data Security
                                </Heading>
                                <Text variant="body-default-m">
                                    We implement appropriate security measures to protect the
                                    security of your personal information. However, please keep in
                                    mind that no method of transmission over the Internet or
                                    electronic storage is 100% secure.
                                </Text>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    7. Children's Privacy
                                </Heading>
                                <Text variant="body-default-m">
                                    Our services are not intended for children under the age of 13.
                                    We do not knowingly collect personal information from children
                                    under 13. If you are a parent or guardian and believe that your
                                    child has provided us with personal information, please contact
                                    us.
                                </Text>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    8. Changes to This Privacy Policy
                                </Heading>
                                <Text variant="body-default-m">
                                    We may update our Privacy Policy from time to time. We will
                                    notify you of any changes by posting the new Privacy Policy on
                                    this page and updating the "Last updated" date at the top of
                                    this Privacy Policy.
                                </Text>
                            </Column>

                            <Column gap="16" position="relative">
                                <Heading as="h2" variant="heading-strong-l">
                                    9. Contact Us
                                </Heading>
                                <Text variant="body-default-m">
                                    If you have any questions about this Privacy Policy, please
                                    contact us at:
                                </Text>
                                <Column gap="8" paddingTop="8">
                                    <Text variant="body-default-m">
                                        Email: privacy@yourcompany.com
                                    </Text>
                                    <Text variant="body-default-m">
                                        Address: 123 Privacy Street, Data City, 12345
                                    </Text>
                                </Column>
                            </Column>
                        </Column>

                        <Row horizontal="center" paddingY="48">
                            <Button
                                label="Back to Home"
                                href="/"
                                variant="secondary"
                                prefixIcon="arrowLeft"
                            />
                        </Row>
                    </Column>
                </Column>
            </Column>
        </Row>
    );
}
