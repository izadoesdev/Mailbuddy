'use client'

import { useState } from "react";
import { Row, Logo, Button, IconButton, Column, Flex, Background, Text } from "@/once-ui/components";

export default function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

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
        
        {/* Mobile Navigation Trigger */}
        <Row show="s">
          <IconButton
            icon={mobileMenuOpen ? "close" : "menu"}
            variant="tertiary"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={toggleMobileMenu}
          />
        </Row>
      </Row>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <Column
          position="fixed"
          left="16"
          top="104"
          right="16"
          zIndex={9}
          background="overlay"
          border="neutral-alpha-weak"
          shadow="l"
          radius="l"
          paddingY="16"
          style={{
            backdropFilter: "blur(8px)",
            animation: "fadeInDown 0.3s ease-out forwards"
          }}
        >
          <Column gap="4" paddingX="16">
            <Button
              href="/pricing"
              size="m"
              label="Pricing"
              variant="tertiary"
              fillWidth
              justifyContent="start"
              onClick={closeMobileMenu}
            />
            <Button
              href="/security"
              size="m"
              label="Security"
              variant="tertiary"
              fillWidth
              justifyContent="start"
              onClick={closeMobileMenu}
            />
            <Button
              href="/features"
              size="m"
              label="Features"
              variant="tertiary"
              fillWidth
              justifyContent="start"
              onClick={closeMobileMenu}
            />
            <Background
              height="1"
              marginY="8"
              background="neutral-alpha-medium"
              mask={{ x: 50, y: 0, radius: 50 }}
            />
            <Button
              href="/login"
              size="m"
              label="Sign in"
              variant="tertiary"
              fillWidth
              justifyContent="start"
              onClick={closeMobileMenu}
            />
            <Button
              href="/register"
              prefixIcon="sparkles"
              size="m"
              label="Sign up free"
              variant="primary"
              fillWidth
              onClick={closeMobileMenu}
            />
          </Column>
        </Column>
      )}

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <Flex
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex={8}
          onClick={closeMobileMenu}
          style={{
            background: "rgba(0,0,0,0.3)",
            animation: "fadeIn 0.2s ease-out forwards"
          }}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Row>
  );
} 