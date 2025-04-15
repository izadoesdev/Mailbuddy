import "@/once-ui/styles/index.scss";
import "@/once-ui/tokens/index.scss";

import classNames from "classnames";
import { baseURL, meta, og, schema, style } from "@/app/resources/config";
import { Background, Column, Flex, ThemeProvider, ToastProvider, Row, Logo, Button, IconButton, Text } from "@/once-ui/components";
import { Meta, Schema } from "@/once-ui/modules";

import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";

const primary = Geist({
  variable: "--font-primary",
  subsets: ["latin"],
  display: "swap",
});

const code = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

type FontConfig = {
  variable: string;
};

/*
	Replace with code for secondary and tertiary fonts
	from https://once-ui.com/customize
*/
const secondary: FontConfig | undefined = undefined;
const tertiary: FontConfig | undefined = undefined;
/*
 */

export async function generateMetadata({ params }: { params: any }) {
  const title = `Legal & Resources | ${meta.title}`;
  const description = "Legal and important information for our services";
  
  return Meta.generate({
    title,
    description,
    baseURL,
    path: "/",
    image: og.image
  });
}

export default function SecondaryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Flex
      suppressHydrationWarning
      as="body"
      lang="en"
      fillHeight
      background="page"
      data-neutral={style.neutral}
      data-brand={style.brand}
      data-accent={style.accent}
      data-border={style.border}
      data-solid={style.solid}
      data-solid-style={style.solidStyle}
      data-surface={style.surface}
      data-transition={style.transition}
      data-scaling={style.scaling}
      className={classNames(
        primary.variable,
        code.variable,
        secondary ? secondary.variable : "",
        tertiary ? tertiary.variable : "",
      )}
    >
      <Schema
        as="organization"
        title={schema.name}
        description={schema.description}
        baseURL={baseURL}
        path="/"
        image={schema.logo}
      />
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const root = document.documentElement;
                  if (theme === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  } else {
                    root.setAttribute('data-theme', theme);
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <ThemeProvider>
        <ToastProvider>
          <Column as="body" fillWidth margin="0" padding="0">
            {/* Global background effects */}
            <Background
              position="absolute"
              mask={{
                x: 100,
                y: 0,
                radius: 100,
              }}
              gradient={{
                display: true,
                x: 100,
                y: 60,
                width: 70,
                height: 50,
                tilt: -40,
                opacity: 90,
                colorStart: "accent-background-strong",
                colorEnd: "page-background",
              }}
              grid={{
                display: true,
                opacity: 100,
                width: "0.25rem",
                color: "neutral-alpha-medium",
                height: "0.25rem",
              }}
            />
            
            {/* Top navigation */}
            <Row position="fixed" top="0" fillWidth horizontal="center" zIndex={10} paddingY="20">
              <Background
                position="absolute"
                mask={{
                  x: 50,
                  y: 50,
                }}
                grid={{
                  display: true,
                  width: "0.25rem",
                  color: "neutral-alpha-medium",
                  height: "0.25rem",
                  opacity: 30,
                }}
              />
              <Row
                data-border="rounded"
                horizontal="space-between"
                maxWidth="l"
                paddingRight="64"
                paddingLeft="32"
                paddingY="20"
                fillWidth
                background="surface"
                shadow="s"
                border="neutral-alpha-weak"
                radius="s"
                style={{ backdropFilter: "blur(8px)" }}
              >
                <Logo size="s" icon={false} href="/" />
                
                {/* Desktop Navigation */}
                <Row gap="16" hide="s">
                  <Button
                    href="/pricing"
                    size="s"
                    label="Pricing"
                    variant="tertiary"
                  />
                  <Button
                    href="/terms"
                    size="s"
                    label="Terms"
                    variant="tertiary"
                  />
                  <Button
                    href="/privacy"
                    size="s"
                    label="Privacy"
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
                
                {/* Mobile Navigation */}
                <Row gap="16" show="s">
                  <IconButton
                    icon="layout"
                    variant="tertiary"
                    aria-label="Open menu"
                  />
                </Row>
              </Row>
            </Row>
            
            {/* Main content with proper padding for fixed header */}
            <Column fillWidth paddingTop="80">
              {children}
            </Column>
            
            {/* Footer */}
            <Row as="footer" fillWidth horizontal="center" paddingTop="40">
              <Column
                maxWidth="l"
                fillWidth
                paddingX="32"
                paddingBottom="40"
                gap="40"
                borderTop="neutral-alpha-weak"
              >
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
                      © {new Date().getFullYear()} Your Company. All rights reserved.
                    </Text>
                  </Column>

                  <Row gap="64" mobileDirection="column">
                    <Column gap="16">
                      <Text variant="label-strong-s">Legal</Text>
                      <Column gap="8">
                        <Button variant="tertiary" size="s" href="/terms" label="Terms of Service" />
                        <Button variant="tertiary" size="s" href="/privacy" label="Privacy Policy" />
                        <Button variant="tertiary" size="s" href="/cookies" label="Cookie Policy" />
                      </Column>
                    </Column>

                    <Column gap="16">
                      <Text variant="label-strong-s">Company</Text>
                      <Column gap="8">
                        <Button variant="tertiary" size="s" href="/about" label="About Us" />
                        <Button variant="tertiary" size="s" href="/contact" label="Contact" />
                        <Button variant="tertiary" size="s" href="/blog" label="Blog" />
                      </Column>
                    </Column>
                  </Row>
                </Row>

                <Row
                  fillWidth
                  paddingTop="16"
                  horizontal="end"
                  mobileDirection="column-reverse"
                  gap="16"
                >
                  <Row gap="16">
                    <IconButton
                      variant="tertiary"
                      size="s"
                      icon="twitter"
                      href="https://twitter.com"
                      aria-label="Twitter"
                    />
                    <IconButton
                      variant="tertiary"
                      size="s"
                      icon="linkedin"
                      href="https://linkedin.com"
                      aria-label="LinkedIn"
                    />
                    <IconButton
                      variant="tertiary"
                      size="s"
                      icon="github"
                      href="https://github.com"
                      aria-label="GitHub"
                    />
                  </Row>
                </Row>
              </Column>
            </Row>
          </Column>
        </ToastProvider>
      </ThemeProvider>
    </Flex>
  );
}
