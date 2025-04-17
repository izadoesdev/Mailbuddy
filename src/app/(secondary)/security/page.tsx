"use client";

import React from "react";
import {
  Heading,
  Text,
  Column,
  Row,
  Background,
  Button,
  Icon,
  IconButton
} from "@/once-ui/components";
import { ScrollToTop } from "@/once-ui/components/ScrollToTop";

export default function Security() {
  return (
    <Row fill padding="8" gap="8" horizontal="center">
      <Column
        gap="-1"
        fillWidth
        horizontal="center"
        maxWidth="m"
      >
        <ScrollToTop><IconButton variant="secondary" icon="chevronUp"/></ScrollToTop>

        {/* Main content */}
        <Column
          as="main"
          radius="xl"
          horizontal="center"
          border="neutral-alpha-weak"
          fillWidth
          background="overlay"
        >
          <Column padding="xl" gap="24">
            <Heading variant="display-strong-xl" align="center">Security & Privacy</Heading>
            <Text variant="heading-default-xl" align="center" onBackground="neutral-medium" marginBottom="40">
              Your data's security is our top priority
            </Text>

            <Column gap="32" paddingY="24">
              {/* Introduction */}
              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">Our Security Promise</Heading>
                <Text variant="body-default-m">
                  At Mailbuddy, we believe privacy and security are fundamental rights. Our platform is built from the ground up with a security-first approach, ensuring your emails and personal data remain protected at all times. We implement industry-leading security practices and maintain complete transparency about how we handle your data.
                </Text>
              </Column>

              {/* Key Security Features */}
              <Column gap="24" position="relative">
                <Heading as="h2" variant="heading-strong-l">Key Security Features</Heading>
                
                  <Row gap="8" mobileDirection="column">
                    <Column fillWidth gap="16" vertical="center" padding="l" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                      <Icon name="shield" onBackground="brand-strong" />
                      <Column gap="12">
                        <Heading as="h3" variant="heading-strong-m">End-to-End Encryption</Heading>
                        <Text variant="body-default-s" onBackground="neutral-medium">
                          Your email content is encrypted at rest and only decrypted on demand when you need to access it. This ensures that even in the unlikely event of a breach, your data remains unreadable.
                        </Text>
                      </Column>
                    </Column>
                    
                    <Column fillWidth gap="16" vertical="center" padding="l" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                      <Icon name="sparkles" onBackground="brand-strong" />
                      <Column gap="12">
                        <Heading as="h3" variant="heading-strong-m">AI-Powered with Privacy Focus</Heading>
                        <Text variant="body-default-s" onBackground="neutral-medium">
                          Emails are stored as vectors for AI search capabilities, making them more efficient while maintaining privacy. Our AI processing follows strict no-retention policies—your data is never stored for training purposes.
                        </Text>
                      </Column>
                    </Column>
                    
                    <Column fillWidth gap="16" vertical="center" padding="l" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                      <Icon name="checkCircle" onBackground="brand-strong" />
                      <Column gap="12">
                        <Heading as="h3" variant="heading-strong-m">Complete Data Anonymization</Heading>
                        <Text variant="body-default-s" onBackground="neutral-medium">
                          All data processed by our AI systems is completely anonymized. We strip identifying information before any analysis, ensuring your personal information is never exposed.
                        </Text>
                      </Column>
                    </Column>
                  </Row>
              </Column>

              {/* Authentication & Access */}
              <Column gap="16" position="relative">
                <Heading as="h2" variant="heading-strong-l">Authentication & Access Control</Heading>
                <Column gap="8" paddingLeft="24">

                  <Row gap="12" vertical="start">
                    <Icon name="chevronRight" size="s" />
                    <Text variant="body-default-m">
                      <Text as="span" variant="body-strong-m">Two-Factor Authentication:</Text> Additional security layer for your account, making unauthorized access virtually impossible.
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="chevronRight" size="s" />
                    <Text variant="body-default-m">
                      <Text as="span" variant="body-strong-m">Secure Session Management:</Text> Automatic session expiration and device tracking to ensure your account remains secure even if you forget to log out.
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="chevronRight" size="s" />
                    <Text variant="body-default-m">
                      <Text as="span" variant="body-strong-m">Granular Permissions:</Text> Control which applications have access to your data with detailed permission management.
                    </Text>
                  </Row>
                </Column>
              </Column>

              {/* Data Protection */}
              <Column gap="16" position="relative">
                <Heading as="h2" variant="heading-strong-l">Data Protection & Compliance</Heading>
                <Text variant="body-default-m">
                  Our platform adheres to the highest industry standards for data protection and compliance, including:
                </Text>
                <Row gap="8" paddingY="16" mobileDirection="column">
                  <Column fillWidth gap="16" padding="l" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                      <Icon name="infoCircle" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">GDPR Compliance</Heading>
                        <Text variant="body-default-s" onBackground="neutral-medium">
                          We're fully compliant with the General Data Protection Regulation, ensuring European users' data rights are respected. This includes the right to access, correct, delete, and export your data.
                        </Text>
                      </Column>
                  </Column>
                  
                  <Column fillWidth gap="16" padding="l" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                      <Icon name="shield" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Zero-Knowledge Architecture</Heading>
                        <Text variant="body-default-s" onBackground="neutral-medium">
                          Our system is designed so that even we cannot access your unencrypted data. Your encryption keys are generated and stored locally on your device, giving you complete control.
                        </Text>
                      </Column>
                    </Column>
                  
                  <Column fillWidth gap="16" padding="l" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                      <Icon name="trash" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Data Deletion & Retention</Heading>
                        <Text variant="body-default-s" onBackground="neutral-medium">
                          You control how long your data is stored. Deleted emails are completely purged from our systems, with no backups retained. You can also schedule automatic data deletion after a period you specify.
                        </Text>
                      </Column>
                    </Column>
                </Row>
              </Column>

              {/* Technical Security */}
              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">Technical Security Measures</Heading>
                <Text variant="body-default-m">
                  Our infrastructure is designed with multiple layers of security to protect against both external and internal threats:
                </Text>
                <Column gap="8">
                  <Row gap="12" vertical="start">
                    <Icon name="checkCircle" size="s" />
                    <Text variant="body-default-m">
                      AES-256 encryption for all stored data
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="checkCircle" size="s" />
                    <Text variant="body-default-m">
                      TLS 1.3 for all data in transit
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="checkCircle" size="s" />
                    <Text variant="body-default-m">
                      Regular security audits and penetration testing (Soon atleast...)
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="checkCircle" size="s" />
                    <Text variant="body-default-m">
                      Automatic security patches and updates
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="checkCircle" size="s" />
                    <Text variant="body-default-m">
                      DDoS protection and rate limiting (Thanks to Vercel ;)
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="checkCircle" size="s" />
                    <Text variant="body-default-m">
                      Isolated environments for different processing stages
                    </Text>
                  </Row>
                </Column>
              </Column>

              {/* Transparency */}
              <Column gap="16" position="relative">
                <Heading as="h2" variant="heading-strong-l">Our Commitment to Transparency</Heading>
                <Text variant="body-default-m">
                  We believe in being completely transparent about our security practices and data handling:
                </Text>
                <Column gap="12" paddingY="16">
                  <Row gap="16" vertical="center">
                    <Icon name="eye" size="s" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Regular updates on our security practices and improvements
                    </Text>
                  </Row>
                  <Row gap="16" vertical="center">
                    <Icon name="eye" size="s" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Clear documentation of how your data is processed and stored
                    </Text>
                  </Row>
                  <Row gap="16" vertical="center">
                    <Icon name="eye" size="s" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Prompt notification in the unlikely event of a security incident
                    </Text>
                  </Row>
                  <Row gap="16" vertical="center">
                    <Icon name="eye" size="s" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Open source components where possible for community review
                    </Text>
                  </Row>
                </Column>
              </Column>

              {/* CTA section */}
              <Column gap="24" paddingY="32" horizontal="center" position="relative">
                <Background
                  position="absolute"
                  mask={{
                    x: 50,
                    y: 50,
                    radius: 50,
                  }}
                  grid={{
                    display: true,
                    color: "brand-alpha-weak",
                    width: "8",
                    height: "8",
                    opacity: 30,
                  }}
                />
                <Heading as="h2" variant="display-strong-m" align="center">
                  Ready to secure your emails?
                </Heading>
                <Column maxWidth={48} horizontal="center">
                  <Text variant="body-default-l" align="center" onBackground="neutral-medium" marginBottom="8">
                    Join Mailbuddy today and experience email with privacy and security built-in at every level.
                  </Text>
                </Column>
                <Row gap="16" horizontal="center" paddingTop="8">
                  <Button
                    href="/register"
                    size="l"
                    variant="primary"
                    prefixIcon="sparkles"
                    label="Get Started For Free"
                  />
                  <Button
                    href="/pricing"
                    size="l"
                    variant="secondary"
                    label="View Pricing"
                  />
                </Row>
              </Column>
            </Column>
          </Column>
        </Column>
      </Column>
    </Row>
  );
} 