"use client";

import React from "react";
import {
  Heading,
  Text,
  Column,
  Row,
  Background,
  Button,
  Line,
  Logo,
  Icon,
  SmartLink,
  ThemeSwitcher,
  IconButton,
} from "@/once-ui/components";
import { ScrollToTop } from "@/once-ui/components/ScrollToTop";

export default function TermsOfService() {
  return (
    <Column fillWidth paddingY="80" paddingX="s" horizontal="center" flex={1} position="relative">
      {/* Enhanced background elements */}
      <Background
        position="absolute"
        mask={{
          x: 80,
          y: 0,
          radius: 100,
        }}
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
        position="absolute"
        mask={{
          x: 100,
          y: 0,
          radius: 100,
        }}
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
      <Background
        position="absolute"
        mask={{
          cursor: true,
          radius: 75,
        }}
        dots={{
          display: true,
          opacity: 20,
          color: "neutral-solid-weak",
          size: "32", 
        }}
      />

      <ScrollToTop><IconButton variant="secondary" icon="chevronUp"/></ScrollToTop>
      
      {/* Header with sticky navigation */}
      <Row position="fixed" top="0" fillWidth horizontal="center" zIndex={3}>
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
        <Row
          data-border="rounded"
          horizontal="space-between"
          maxWidth="l"
          paddingRight="64"
          paddingLeft="32"
          paddingY="20"
        >
          <Logo size="s" icon={false} href="/" />
          <Row gap="12">
            <Button
              href="/pricing"
              size="s"
              label="Pricing"
              variant="tertiary"
            />
            <Button
              href="/contact"
              size="s"
              label="Contact"
              variant="tertiary"
            />
            <Button
              href="/login"
              size="s"
              label="Login"
              variant="secondary"
            />
            <Button
              href="/signup"
              prefixIcon="sparkle"
              size="s"
              label="Sign up"
              variant="primary"
            />
          </Row>
        </Row>
      </Row>

      {/* Main content */}
      <Column
        as="main"
        maxWidth="l"
        position="relative"
        radius="xl"
        horizontal="center"
        border="neutral-alpha-weak"
        fillWidth
        paddingTop="80"
      >
        <Background
          position="absolute"
          mask={{
            x: 100,
            y: 0,
          }}
          grid={{
            display: true,
            width: "2rem",
            color: "neutral-alpha-medium",
            height: "2rem",
            opacity: 30,
          }}
        />

        <Column paddingX="32" gap="24" paddingY="64">
          <Heading variant="display-strong-xl" align="center">Terms of Service</Heading>
          <Text variant="body-default-m" align="center" onBackground="neutral-medium" marginBottom="40">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          <Column gap="32" paddingY="24">
            <Column gap="16">
              <Heading as="h2" variant="heading-strong-l">1. Acceptance of Terms</Heading>
              <Text variant="body-default-m">
                By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
              </Text>
            </Column>

            <Column gap="16">
              <Heading as="h2" variant="heading-strong-l">2. Use License</Heading>
              <Text variant="body-default-m">
                Permission is granted to temporarily access the materials on our website for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </Text>
              <Column gap="8" paddingLeft="24">
                <Row gap="12" vertical="start">
                  <Icon name="chevronRight" size="s" />
                  <Text variant="body-default-m">Modify or copy the materials</Text>
                </Row>
                <Row gap="12" vertical="start">
                  <Icon name="chevronRight" size="s" />
                  <Text variant="body-default-m">Use the materials for any commercial purpose</Text>
                </Row>
                <Row gap="12" vertical="start">
                  <Icon name="chevronRight" size="s" />
                  <Text variant="body-default-m">Attempt to decompile or reverse engineer any software</Text>
                </Row>
                <Row gap="12" vertical="start">
                  <Icon name="chevronRight" size="s" />
                  <Text variant="body-default-m">Remove any copyright or other proprietary notations</Text>
                </Row>
                <Row gap="12" vertical="start">
                  <Icon name="chevronRight" size="s" />
                  <Text variant="body-default-m">Transfer the materials to another person or "mirror" the materials</Text>
                </Row>
              </Column>
            </Column>

            <Column gap="16" position="relative">
              <Background
                position="absolute"
                mask={{
                  x: 0,
                  y: 100,
                  radius: 100,
                }}
                grid={{
                  display: true,
                  color: "brand-alpha-weak",
                  width: "12",
                  height: "12",
                  opacity: 30,
                }}
              />
              <Heading as="h2" variant="heading-strong-l">3. Disclaimer</Heading>
              <Text variant="body-default-m">
                The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </Text>
            </Column>

            <Column gap="16">
              <Heading as="h2" variant="heading-strong-l">4. Limitations</Heading>
              <Text variant="body-default-m">
                In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use our materials, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </Text>
            </Column>

            <Column gap="16">
              <Heading as="h2" variant="heading-strong-l">5. Revisions and Errata</Heading>
              <Text variant="body-default-m">
                The materials appearing on our website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our website are accurate, complete or current. We may make changes to the materials contained on our website at any time without notice.
              </Text>
            </Column>

            <Column gap="16">
              <Heading as="h2" variant="heading-strong-l">6. Links</Heading>
              <Text variant="body-default-m">
                We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such linked website is at the user's own risk.
              </Text>
            </Column>

            <Column gap="16" position="relative">
              <Background
                position="absolute"
                mask={{
                  x: 100,
                  y: 50,
                }}
                gradient={{
                  display: true,
                  opacity: 30,
                  tilt: 45,
                  height: 40,
                  width: 40,
                  x: 75,
                  y: 50,
                  colorStart: "accent-solid-medium",
                  colorEnd: "static-transparent",
                }}
              />
              <Heading as="h2" variant="heading-strong-l">7. Modifications</Heading>
              <Text variant="body-default-m">
                We may revise these terms of service for our website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </Text>
            </Column>

            <Column gap="16">
              <Heading as="h2" variant="heading-strong-l">8. Governing Law</Heading>
              <Text variant="body-default-m">
                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </Text>
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

      {/* Footer */}
      <Row as="footer" fillWidth horizontal="center" paddingTop="80">
        <Column
          maxWidth="l"
          fillWidth
          paddingX="32"
          paddingBottom="40"
          gap="40"
          borderTop="neutral-alpha-weak"
        >
          <Background
            position="absolute"
            mask={{
              x: 50,
              y: 0,
            }}
            grid={{
              display: true,
              width: "0.5rem",
              color: "neutral-alpha-weak",
              height: "0.5rem",
              opacity: 50,
            }}
          />
          <Row
            fillWidth
            horizontal="space-between"
            paddingTop="40"
            mobileDirection="column"
            gap="24"
          >
            <Column gap="16">
              <Logo size="s" icon={false} href="/" />
              <Text variant="body-default-s" onBackground="neutral-medium">
                Simplifying your digital experience.
              </Text>
            </Column>

            <Row gap="64" mobileDirection="column">
              <Column gap="16">
                <Text variant="label-strong-s">Legal</Text>
                <Column gap="8">
                  <SmartLink href="/terms">Terms of Service</SmartLink>
                  <SmartLink href="/privacy">Privacy Policy</SmartLink>
                  <SmartLink href="/cookies">Cookie Policy</SmartLink>
                </Column>
              </Column>

              <Column gap="16">
                <Text variant="label-strong-s">Company</Text>
                <Column gap="8">
                  <SmartLink href="/about">About Us</SmartLink>
                  <SmartLink href="/contact">Contact</SmartLink>
                  <SmartLink href="/blog">Blog</SmartLink>
                </Column>
              </Column>
            </Row>
          </Row>

          <Row
            fillWidth
            paddingTop="16"
            horizontal="space-between"
            mobileDirection="column-reverse"
            gap="16"
          >
            <Text variant="body-default-xs" onBackground="neutral-weak">
              © {new Date().getFullYear()} Your Company. All rights reserved.
            </Text>
            <Row gap="16">
              <IconButton
                variant="tertiary"
                size="s"
                icon="twitter"
                href="https://twitter.com"
              />
              <IconButton
                variant="tertiary"
                size="s"
                icon="linkedin"
                href="https://linkedin.com"
              />
              <IconButton
                variant="tertiary"
                size="s"
                icon="github"
                href="https://github.com"
              />
              <ThemeSwitcher />
            </Row>
          </Row>
        </Column>
      </Row>
    </Column>
  );
} 