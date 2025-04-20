import { Button, Column, Heading, Icon, Row, Text } from "@/once-ui/components";
import React from "react";

export default function TermsOfService() {
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
                            Terms of Service
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
                                    1. Acceptance of Terms
                                </Heading>
                                <Text variant="body-default-m">
                                    By accessing or using our services, you agree to be bound by
                                    these Terms of Service and all applicable laws and regulations.
                                    If you do not agree with any of these terms, you are prohibited
                                    from using or accessing our services.
                                </Text>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    2. Use License
                                </Heading>
                                <Text variant="body-default-m">
                                    Permission is granted to temporarily access the materials on our
                                    website for personal, non-commercial use only. This is the grant
                                    of a license, not a transfer of title, and under this license
                                    you may not:
                                </Text>
                                <Column gap="8" paddingLeft="24">
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            Modify or copy the materials
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            Use the materials for any commercial purpose
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            Attempt to decompile or reverse engineer any software
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            Remove any copyright or other proprietary notations
                                        </Text>
                                    </Row>
                                    <Row gap="12" vertical="start">
                                        <Icon name="chevronRight" size="s" />
                                        <Text variant="body-default-m">
                                            Transfer the materials to another person or "mirror" the
                                            materials
                                        </Text>
                                    </Row>
                                </Column>
                            </Column>

                            <Column gap="16" position="relative">
                                <Heading as="h2" variant="heading-strong-l">
                                    3. Disclaimer
                                </Heading>
                                <Text variant="body-default-m">
                                    The materials on our website are provided on an 'as is' basis.
                                    We make no warranties, expressed or implied, and hereby disclaim
                                    and negate all other warranties including, without limitation,
                                    implied warranties or conditions of merchantability, fitness for
                                    a particular purpose, or non-infringement of intellectual
                                    property or other violation of rights.
                                </Text>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    4. Limitations
                                </Heading>
                                <Text variant="body-default-m">
                                    In no event shall we or our suppliers be liable for any damages
                                    (including, without limitation, damages for loss of data or
                                    profit, or due to business interruption) arising out of the use
                                    or inability to use our materials, even if we or an authorized
                                    representative has been notified orally or in writing of the
                                    possibility of such damage.
                                </Text>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    5. Revisions and Errata
                                </Heading>
                                <Text variant="body-default-m">
                                    The materials appearing on our website could include technical,
                                    typographical, or photographic errors. We do not warrant that
                                    any of the materials on our website are accurate, complete or
                                    current. We may make changes to the materials contained on our
                                    website at any time without notice.
                                </Text>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    6. Links
                                </Heading>
                                <Text variant="body-default-m">
                                    We have not reviewed all of the sites linked to our website and
                                    are not responsible for the contents of any such linked site.
                                    The inclusion of any link does not imply endorsement by us of
                                    the site. Use of any such linked website is at the user's own
                                    risk.
                                </Text>
                            </Column>

                            <Column gap="16" position="relative">
                                <Heading as="h2" variant="heading-strong-l">
                                    7. Modifications
                                </Heading>
                                <Text variant="body-default-m">
                                    We may revise these terms of service for our website at any time
                                    without notice. By using this website you are agreeing to be
                                    bound by the then current version of these terms of service.
                                </Text>
                            </Column>

                            <Column gap="16">
                                <Heading as="h2" variant="heading-strong-l">
                                    8. Governing Law
                                </Heading>
                                <Text variant="body-default-m">
                                    These terms and conditions are governed by and construed in
                                    accordance with the laws and you irrevocably submit to the
                                    exclusive jurisdiction of the courts in that location.
                                </Text>
                            </Column>
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
