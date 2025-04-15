import { Row, Logo, Button, IconButton } from "@/once-ui/components";

export default function TopNav() {
  return (
    <Row position="fixed" top="0" fillWidth horizontal="center" zIndex={10} paddingY="16">
      <Row
        horizontal="space-between"
        maxWidth="xl"
        paddingX="24"
        background="overlay"
        paddingY="16"
        fillWidth
        shadow="s"
        border="neutral-alpha-weak"
        radius="xl"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <Row vertical="center" gap="12">
          <Logo size="s" href="/" />
        </Row>
        
        {/* Desktop Navigation */}
        <Row gap="8" hide="s" vertical="center">
          <Button
            href="/pricing"
            size="s"
            label="Pricing"
            variant="tertiary"
          />
          <Button
            href="/security"
            size="s"
            label="Security"
            variant="tertiary"
          />
          <Button
            href="/features"
            size="s"
            label="Features"
            variant="tertiary"
          />
          <Button
            href="/login"
            size="s"
            label="Sign in"
            variant="secondary"
          />
          <Button
            href="/register"
            prefixIcon="sparkles"
            size="s"
            label="Sign up free"
            variant="primary"
          />
        </Row>
        
        {/* Mobile Navigation */}
        <Row show="s">
          <IconButton
            icon="menu"
            variant="tertiary"
            aria-label="Open menu"
          />
        </Row>
      </Row>
    </Row>
  );
} 