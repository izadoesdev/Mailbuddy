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
  SmartImage,
  Line,
  IconButton,
  Fade,
} from "@/once-ui/components";

export default function Home() {
  return (
    <Column fillWidth paddingY="80" paddingX="s" horizontal="center" flex={1}>
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
          paddingRight="64"
          paddingLeft="32"
          paddingY="20"
          fillWidth
        >
          <Logo size="s" icon={true} href="/" />
          <Row gap="24" hide="s">
            <Button href="/features" label="Features" variant="tertiary" />
            <Button href="/pricing" label="Pricing" variant="tertiary" />
            <Button href="/login" label="Log in" variant="secondary" />
            <Button href="/register" label="Sign up" arrowIcon />
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
        radius="xl"
        horizontal="center"
        fillWidth
      >
        {/* Hero section */}
        <Column
          fillWidth
          horizontal="center"
          gap="48"
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
              height: 50,
              width: 75,
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
              height: 20,
              width: 120,
              x: 120,
              y: 35,
              colorStart: "brand-solid-strong",
              colorEnd: "static-transparent",
            }}
          />

          <Column fillWidth horizontal="center" gap="32" padding="32" position="relative">
            <Heading wrap="balance" variant="display-strong-xl" align="center" marginBottom="16">
              Secure Email Made Simple
            </Heading>
            <Text variant="body-default-xl" align="center" marginBottom="32">
              Mailbuddy is your secure, privacy-focused email companion that makes managing Gmail
              simple and efficient.
            </Text>
            <Row gap="16" horizontal="center">
              <Button label="Get Started" href="/register" variant="primary" size="l" arrowIcon />
              <Button label="See Features" href="/features" variant="secondary" size="l" />
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
          <Line maxWidth="l" background="neutral-alpha-medium" />

          <Column fillWidth gap="32" horizontal="center">
            <Heading as="h2" variant="display-default-m" align="center">
              Why Choose Mailbuddy
            </Heading>

            <Row gap="24" fillWidth marginTop="32" mobileDirection="column">
              <Card fillWidth padding="32" gap="16" radius="xl" border="neutral-alpha-weak">
                <Icon name="shieldLock" size="xl" color="brand-medium" />
                <Heading as="h3" variant="heading-default-m">
                  Privacy First
                </Heading>
                <Text>
                  End-to-end encryption keeps your emails secure and private, with zero access to
                  your data.
                </Text>
              </Card>

              <Card fillWidth padding="32" gap="16" radius="xl" border="neutral-alpha-weak">
                <Icon name="bolt" size="xl" color="brand-medium" />
                <Heading as="h3" variant="heading-default-m">
                  Lightning Fast
                </Heading>
                <Text>
                  Optimized performance for quick loading and responsiveness even with thousands of
                  emails.
                </Text>
              </Card>

              <Card fillWidth padding="32" gap="16" radius="xl" border="neutral-alpha-weak">
                <Icon name="layout" size="xl" color="brand-medium" />
                <Heading as="h3" variant="heading-default-m">
                  Intuitive Interface
                </Heading>
                <Text>
                  Clean, modern design that makes email management feel effortless and enjoyable.
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
          <Column fillWidth gap="32" horizontal="center" maxWidth="l">
            <Heading as="h2" variant="display-default-m" align="center">
              How Mailbuddy Works
            </Heading>

            <Row gap="64" fillWidth marginTop="32" mobileDirection="column" vertical="center">
              <Column gap="24" fillWidth>
                <Row gap="16" vertical="center">
                  <Card radius="full" background="brand-medium" paddingX="16" paddingY="8">
                    <Text onSolid="neutral-strong" variant="body-strong-m">
                      1
                    </Text>
                  </Card>
                  <Heading as="h3" variant="heading-default-m">
                    Connect Your Gmail
                  </Heading>
                </Row>
                <Text>
                  Securely link your Gmail account with read-only access. We never store your
                  password.
                </Text>
              </Column>

              <Column gap="24" fillWidth>
                <Row gap="16" vertical="center">
                  <Card radius="full" background="brand-medium" paddingX="16" paddingY="8">
                    <Text onSolid="neutral-strong" variant="body-strong-m">
                      2
                    </Text>
                  </Card>
                  <Heading as="h3" variant="heading-default-m">
                    Encrypt Your Data
                  </Heading>
                </Row>
                <Text>Your emails are automatically encrypted with keys only you control.</Text>
              </Column>

              <Column gap="24" fillWidth>
                <Row gap="16" vertical="center">
                  <Card radius="full" background="brand-medium" paddingX="16" paddingY="8">
                    <Text onSolid="neutral-strong" variant="body-strong-m">
                      3
                    </Text>
                  </Card>
                  <Heading as="h3" variant="heading-default-m">
                    Enjoy Your Inbox
                  </Heading>
                </Row>
                <Text>
                  Browse, search, and manage your emails with confidence and peace of mind.
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
          <Column fillWidth horizontal="center" gap="32" maxWidth="m">
            <Heading as="h2" variant="display-default-l" align="center">
              Ready to Take Control of Your Email?
            </Heading>
            <Text variant="body-default-l" align="center" marginBottom="16">
              Join thousands of users who have made email secure and simple again.
            </Text>
            <Button
              label="Get Started for Free"
              href="/register"
              variant="primary"
              size="l"
              arrowIcon
            />
          </Column>
        </Column>
      </Column>

      {/* Footer */}
      <Row
        as="footer"
        fillWidth
        maxWidth="l"
        paddingX="32"
        paddingY="64"
        gap="64"
        mobileDirection="column"
        borderTop="neutral-alpha-weak"
        marginTop="64"
      >
        <Column gap="24" fillWidth>
          <Logo size="m" />
          <Text onBackground="neutral-medium">
            Your secure email companion that makes managing Gmail simple and efficient.
          </Text>
        </Column>

        <Row gap="64" fillWidth mobileDirection="column">
          <Column gap="16" fillWidth>
            <Heading as="h3" variant="heading-default-s">
              Product
            </Heading>
            <Button label="Features" href="/features" variant="tertiary" />
            <Button label="Pricing" href="/pricing" variant="tertiary" />
            <Button label="Security" href="/security" variant="tertiary" />
          </Column>

          <Column gap="16" fillWidth>
            <Heading as="h3" variant="heading-default-s">
              Company
            </Heading>
            <Button label="About" href="/about" variant="tertiary" />
            <Button label="Blog" href="/blog" variant="tertiary" />
            <Button label="Contact" href="/contact" variant="tertiary" />
          </Column>

          <Column gap="16" fillWidth>
            <Heading as="h3" variant="heading-default-s">
              Legal
            </Heading>
            <Button label="Terms" href="/terms" variant="tertiary" />
            <Button label="Privacy" href="/privacy" variant="tertiary" />
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
        <Text variant="body-default-s" onBackground="neutral-medium">
          © {new Date().getFullYear()} Mailbuddy. All rights reserved.
        </Text>
        <Row gap="16">
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
      </Row>
    </Column>
  );
}
