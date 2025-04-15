import { Background, SmartLink, Column, Row, Text, IconButton, ThemeSwitcher, Logo } from "@/once-ui/components";


export default function Footer() {
  return (
    <Row as="footer" fillWidth horizontal="center" paddingTop="80">
    <Column
      maxWidth="l"
      fillWidth
      paddingX="32"
      paddingBottom="40"
      gap="40"
      borderTop="neutral-alpha-weak"
      position="relative"
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
          <Logo size="s" icon={true} href="/" />
          <Text variant="body-default-s" onBackground="neutral-medium">
            Secure, private, AI-powered email companion
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

          {/* <Column gap="16">
            <Text variant="label-strong-s">Company</Text>
            <Column gap="8">
              <SmartLink href="/about">About Us</SmartLink>
              <SmartLink href="/contact">Contact</SmartLink>
              <SmartLink href="/blog">Blog </SmartLink>
            </Column>
          </Column> */}
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
          © {new Date().getFullYear()} Mailbuddy. All rights reserved.
        </Text>
        <Row gap="16">
          <IconButton
            variant="tertiary"
            size="s"
            icon="twitter"
            href="https://twitter.com/databuddyps"
          />
          <IconButton
            variant="tertiary"
            size="s"
            icon="linkedin"
            href="https://linkedin.com/in/issanassar"
          />
          <IconButton
            variant="tertiary"
            size="s"
            icon="github"
            href="https://github.com/izadoesdev/mailer"
          />
          <ThemeSwitcher />
        </Row>
      </Row>
    </Column>
  </Row>
  );
}
