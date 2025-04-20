"use client";

import {
    Background,
    Button,
    Column,
    Flex,
    IconButton,
    Logo,
    Row,
    ToggleButton,
} from "@/once-ui/components";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopNav() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const pathname = usePathname();

    const toggleMobileMenu = () => {
        setMobileMenuOpen((prev) => !prev);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [scrolled]);

    return (
        <Row
            position="fixed"
            top="0"
            fillWidth
            horizontal="center"
            zIndex={10}
            paddingY={scrolled ? "0" : "16"}
        >
            <Row
                horizontal="space-between"
                maxWidth="xl"
                paddingX="24"
                paddingY="16"
                fillWidth
                shadow={scrolled ? "l" : undefined}
                radius={scrolled ? undefined : "xl"}
                bottomLeftRadius={"xl"}
                bottomRightRadius={"xl"}
                style={{
                    background: scrolled ? "var(--overlay-background)" : undefined,
                    backdropFilter: scrolled ? "blur(8px)" : undefined,
                    transition: "all 0.3s ease",
                }}
            >
                <Row vertical="center" gap="12">
                    <Logo size="s" href="/" />

                    <Row gap="4" hide="s" vertical="center" paddingLeft="24">
                        <ToggleButton
                            selected={pathname === "/pricing"}
                            href="/pricing"
                            label="Pricing"
                        />
                        <ToggleButton
                            selected={pathname === "/security"}
                            href="/security"
                            label="Security"
                        />
                        <ToggleButton
                            selected={pathname === "/features"}
                            href="/features"
                            label="Features"
                        />
                    </Row>
                </Row>

                {/* Desktop Navigation */}
                <Row gap="8" hide="s" vertical="center">
                    <Button href="/login" size="s" label="Sign in" variant="secondary" />
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
                    top="104"
                    left="16"
                    right="16"
                    zIndex={9}
                    background="overlay"
                    border="neutral-alpha-weak"
                    shadow="l"
                    radius="l"
                    paddingY="16"
                    style={{
                        backdropFilter: "blur(8px)",
                        animation: "fadeInDown 0.3s ease-out forwards",
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
                        animation: "fadeIn 0.2s ease-out forwards",
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
