import { effects } from "@/app/resources/config";
import { Background, Button, Card, Column, Heading, Icon, Row, Text } from "@/once-ui/components";
import React from "react";

export default function NotFound() {
    return (
        <Row fill padding="8" gap="8" horizontal="center" vertical="center">
            <Background
                pointerEvents="none"
                position="fixed"
                mask={{
                    cursor: effects.mask.cursor,
                    x: effects.mask.x,
                    y: effects.mask.y,
                    radius: effects.mask.radius,
                }}
                gradient={{
                    display: effects.gradient.display,
                    x: effects.gradient.x,
                    y: effects.gradient.y,
                    width: effects.gradient.width,
                    height: effects.gradient.height,
                    tilt: effects.gradient.tilt,
                    colorStart: effects.gradient.colorStart,
                    colorEnd: effects.gradient.colorEnd,
                    opacity: effects.gradient.opacity as
                        | 0
                        | 10
                        | 20
                        | 30
                        | 40
                        | 50
                        | 60
                        | 70
                        | 80
                        | 90
                        | 100,
                }}
                dots={{
                    display: effects.dots.display,
                    color: effects.dots.color,
                    size: effects.dots.size as any,
                    opacity: effects.dots.opacity as any,
                }}
                grid={{
                    display: effects.grid.display,
                    color: effects.grid.color,
                    width: effects.grid.width as any,
                    height: effects.grid.height as any,
                    opacity: effects.grid.opacity as any,
                }}
                lines={{
                    display: effects.lines.display,
                    opacity: effects.lines.opacity as any,
                }}
            />

            <Column
                gap="32"
                horizontal="center"
                maxWidth="m"
                radius="xl"
                border="neutral-alpha-weak"
                padding="64"
                background="overlay"
                style={{ minHeight: "70vh" }}
                vertical="center"
            >
                <Row horizontal="center">
                    <Icon
                        name="mailWarning"
                        size="xl"
                        onBackground="brand-strong"
                        aria-hidden="true"
                    />
                </Row>

                <Column gap="16" horizontal="center">
                    <Heading variant="display-strong-xl" align="center">
                        404
                    </Heading>
                    <Heading as="h1" variant="heading-strong-l" align="center">
                        Page Not Found
                    </Heading>
                    <Text
                        variant="body-default-l"
                        align="center"
                        onBackground="neutral-medium"
                        marginBottom="16"
                    >
                        We couldn't find the page you're looking for. It might have been moved,
                        deleted, or never existed.
                    </Text>
                </Column>

                <Row gap="16" horizontal="center" paddingTop="16">
                    <Button
                        size="l"
                        variant="primary"
                        prefixIcon="home"
                        label="Back to Homepage"
                        href="/"
                    />
                    <Button
                        size="l"
                        variant="secondary"
                        prefixIcon="support"
                        label="Contact Support"
                        href="/contact"
                    />
                </Row>
            </Column>
        </Row>
    );
}
