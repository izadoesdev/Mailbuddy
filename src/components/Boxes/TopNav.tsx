import { Background, Row, Logo, Button, IconButton } from "@/once-ui/components";

export default function TopNav() {
  return (
    <Row position="fixed" top="0" fillWidth horizontal="center" zIndex={10} paddingY="16">
      <Row
        data-border="rounded"
        horizontal="space-between"
        maxWidth="l"
        paddingRight="64"
        background="overlay"
        paddingLeft="32"
        paddingY="20"
        fillWidth
        shadow="s"
        border="neutral-alpha-weak"
        radius="m"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <Logo size="s" icon={true} href="/" />
        
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
            href="/security"
            size="s"
            label="Security"
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
  );
} 