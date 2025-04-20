"use client";

import {
    Background,
    Badge,
    Button,
    Column,
    Grid,
    Heading,
    Icon,
    IconButton,
    Line,
    RevealFx,
    Row,
    Switch,
    Text,
} from "@/once-ui/components";
import { ScrollToTop } from "@/once-ui/components/ScrollToTop";
import React, { useState } from "react";

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [includePro, setIncludePro] = useState(true);

    // Calculate discount for yearly billing
    const yearlyDiscount = 20; // 20% discount for yearly billing

    // Feature Categories
    const featureCategories = [
        { name: "Email Management", id: "email" },
        { name: "AI Features", id: "ai" },
        { name: "Security", id: "security" },
        { name: "Support", id: "support" },
    ];

    // Comprehensive Features List for comparison
    const featuresList = [
        {
            name: "Email organization",
            category: "email",
            free: "Basic",
            essential: "Advanced",
            pro: "Advanced",
        },
        {
            name: "Emails processed monthly",
            category: "email",
            free: "100",
            essential: "1,000",
            pro: "5,000",
        },
        {
            name: "AI email analysis",
            category: "ai",
            free: "Basic",
            essential: "Advanced",
            pro: "Premium",
        },
        {
            name: "AI email categorization",
            category: "ai",
            free: "✓",
            essential: "✓",
            pro: "✓",
        },
        {
            name: "Custom AI workflows",
            category: "ai",
            free: "—",
            essential: "—",
            pro: "✓",
        },
        {
            name: "Client-side encryption",
            category: "security",
            free: "✓",
            essential: "✓",
            pro: "✓",
        },
        {
            name: "Enhanced security",
            category: "security",
            free: "—",
            essential: "✓",
            pro: "✓",
        },
        {
            name: "Advanced encryption",
            category: "security",
            free: "—",
            essential: "—",
            pro: "✓",
        },
        {
            name: "HIPAA compliance",
            category: "security",
            free: "—",
            essential: "—",
            pro: "—",
        },
        {
            name: "Support",
            category: "support",
            free: "Community",
            essential: "Email priority",
            pro: "Phone & email",
        },
        {
            name: "Dedicated account manager",
            category: "support",
            free: "—",
            essential: "—",
            pro: "—",
        },
    ];

    // Pricing plans with features
    const pricingPlans = [
        {
            id: "free-plan",
            name: "Free",
            description: "Perfect for trying out Mailbuddy",
            monthlyPrice: 0,
            yearlyPrice: 0,
            highlight: "Basic features to get started",
            keyFeatures: [
                "1 Gmail account",
                "100 emails per month with AI",
                "Basic organization",
                "Client-side encryption",
                "Community support",
            ],
            cta: "Get Started",
            popular: false,
            variant: "secondary" as const,
        },
        {
            id: "essential-plan",
            name: "Essential",
            description: "For personal and small teams",
            monthlyPrice: 19,
            yearlyPrice: Math.round(19 * 12 * (1 - yearlyDiscount / 100)),
            highlight: "Most popular for individuals",
            keyFeatures: [
                "Unlimited Gmail accounts",
                "1,000 AI-processed emails/month",
                "Advanced categorization",
                "Enhanced security features",
                "Priority email support",
            ],
            cta: "Start Free Trial",
            popular: true,
            variant: "primary" as const,
        },
        {
            id: "pro-plan",
            name: "Pro",
            description: "For growing teams and businesses",
            monthlyPrice: 99,
            yearlyPrice: Math.round(99 * 12 * (1 - yearlyDiscount / 100)),
            highlight: "For productivity pros",
            keyFeatures: [
                "Multiple email providers",
                "5,000 AI-processed emails/month",
                "Custom AI workflows",
                "Advanced encryption options",
                "Phone & email support",
            ],
            cta: "Start Free Trial",
            popular: false,
            variant: "secondary" as const,
        },
    ];

    const displayPlans = includePro
        ? pricingPlans
        : pricingPlans.filter((plan) => plan.id !== "pro-plan");

    const renderPlanFeatureValue = (planId: string, feature: (typeof featuresList)[0]) => {
        const planKey = planId.split("-")[0];
        const value = feature[planKey as keyof typeof feature];

        if (value === "✓") {
            return <Icon name="checkCircle" size="s" onBackground="success-strong" />;
        }
        if (value === "—") {
            return <Icon name="minus" size="s" onBackground="neutral-weak" />;
        }

        return <Text variant="body-default-s">{value}</Text>;
    };

    return (
        <Column fillWidth horizontal="center">
            <Column fillWidth horizontal="center" maxWidth="l" padding="8">
                <ScrollToTop>
                    <IconButton variant="secondary" icon="chevronUp" />
                </ScrollToTop>

                {/* Main content wrapper */}
                <Column as="main" horizontal="center" fillWidth overflow="hidden">
                    {/* Hero section */}
                    <RevealFx speed="medium" translateY={1}>
                        <Column
                            paddingX="32"
                            paddingTop="32"
                            paddingBottom="32"
                            horizontal="center"
                            position="relative"
                        >
                            <Badge icon="sparkles" marginBottom="16" arrow={false}>
                                Pricing
                            </Badge>
                            <Heading variant="display-strong-xl" align="center" marginBottom="16">
                                Choose your perfect plan
                            </Heading>
                            <Column maxWidth={40} horizontal="center">
                                <Text
                                    variant="body-default-l"
                                    align="center"
                                    onBackground="neutral-medium"
                                >
                                    Simple, transparent pricing for everyone. All plans include our
                                    core security features.
                                </Text>
                            </Column>
                        </Column>
                    </RevealFx>

                    {/* Billing Toggle */}
                    <RevealFx speed="medium" translateY={1}>
                        <Column horizontal="center" paddingTop="16" paddingBottom="40">
                            <Row
                                background="neutral-alpha-weak"
                                padding="4"
                                radius="full"
                                horizontal="center"
                                shadow="s"
                            >
                                <Row horizontal="center" gap="16" paddingX="24" paddingY="8">
                                    <Row gap="8" vertical="center">
                                        <Text variant="label-strong-m">Monthly</Text>
                                    </Row>
                                    <Switch
                                        isChecked={billingCycle === "yearly"}
                                        onToggle={() =>
                                            setBillingCycle(
                                                billingCycle === "monthly" ? "yearly" : "monthly",
                                            )
                                        }
                                    />
                                    <Row gap="8" vertical="center">
                                        <Text variant="label-strong-m">Yearly</Text>
                                    </Row>
                                </Row>
                            </Row>
                        </Column>
                    </RevealFx>

                    {/* Pricing cards grid */}
                    <RevealFx speed="medium" translateY={1.25} delay={0}>
                        <Grid
                            columns={3}
                            gap="16"
                            mobileColumns={1}
                            padding="32"
                            position="relative"
                        >
                            {displayPlans.map((plan, index) => (
                                <Column
                                    key={plan.id}
                                    fillWidth
                                    padding="32"
                                    gap="24"
                                    radius="xl"
                                    shadow={plan.popular ? "l" : "s"}
                                    border={plan.popular ? "brand-medium" : "neutral-alpha-weak"}
                                    background={plan.popular ? "brand-weak" : "overlay"}
                                    position="relative"
                                >
                                    {plan.popular && (
                                        <Row
                                            position="absolute"
                                            style={{ transform: "translateY(-50%)", top: "0" }}
                                            right="24"
                                            horizontal="center"
                                        >
                                            <Badge
                                                paddingY="8"
                                                paddingX="12"
                                                textVariant="label-default-s"
                                                icon="sparkles"
                                                arrow={false}
                                            >
                                                Most Popular
                                            </Badge>
                                        </Row>
                                    )}

                                    <Column gap="8">
                                        <Heading variant="heading-strong-l">{plan.name}</Heading>
                                        <Text
                                            variant="body-default-s"
                                            onBackground="neutral-medium"
                                        >
                                            {plan.description}
                                        </Text>
                                    </Column>

                                    <Column gap="8">
                                        <Row gap="8" vertical="end">
                                            <Text variant="display-strong-l">
                                                $
                                                {billingCycle === "monthly"
                                                    ? plan.monthlyPrice
                                                    : Math.round(plan.yearlyPrice / 12)}
                                            </Text>
                                            <Text
                                                variant="body-default-m"
                                                onBackground="neutral-medium"
                                                paddingBottom="4"
                                            >
                                                / month
                                            </Text>
                                        </Row>
                                        {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                                            <Text
                                                variant="body-default-s"
                                                onBackground="neutral-medium"
                                            >
                                                Billed annually (${plan.yearlyPrice}/year)
                                            </Text>
                                        )}
                                    </Column>

                                    <Text variant="label-strong-xs" onBackground="brand-strong">
                                        {plan.highlight}
                                    </Text>

                                    <Button label={plan.cta} variant={plan.variant} fillWidth />

                                    <Column gap="16">
                                        <Line background="neutral-alpha-medium" />
                                        <Column gap="12">
                                            {plan.keyFeatures.map((feature, featureIndex) => (
                                                <Row
                                                    key={`${plan.id}-feature-${featureIndex}`}
                                                    gap="12"
                                                    vertical="center"
                                                >
                                                    <Icon
                                                        name="checkCircle"
                                                        size="s"
                                                        onBackground={
                                                            plan.popular
                                                                ? "brand-strong"
                                                                : "success-strong"
                                                        }
                                                    />
                                                    <Text variant="body-default-s">{feature}</Text>
                                                </Row>
                                            ))}
                                        </Column>
                                    </Column>
                                </Column>
                            ))}
                        </Grid>
                    </RevealFx>

                    {/* FAQ Section */}
                    <RevealFx speed="medium" translateY={1.5} delay={0.1}>
                        <Column
                            paddingX="32"
                            paddingTop="32"
                            paddingBottom="64"
                            position="relative"
                        >
                            <Background
                                position="absolute"
                                mask={{
                                    x: 0,
                                    y: 0,
                                }}
                                grid={{
                                    display: true,
                                    width: "1rem",
                                    color: "neutral-alpha-weak",
                                    height: "1rem",
                                    opacity: 20,
                                }}
                            />
                            <Heading
                                variant="display-strong-m"
                                align="center"
                                marginBottom="40"
                                marginTop="xl"
                            >
                                Got questions?
                                <br /> We have answers.
                            </Heading>

                            <Grid columns={2} gap="8" maxWidth="l">
                                <Row
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Column gap="8">
                                        <Heading as="h3" variant="heading-strong-s">
                                            How does billing work?
                                        </Heading>
                                        <Text
                                            variant="body-default-s"
                                            onBackground="neutral-medium"
                                        >
                                            Plans are billed either monthly or yearly, with a 20%
                                            discount for yearly subscriptions. You can change your
                                            billing cycle at any time.
                                        </Text>
                                    </Column>
                                </Row>

                                <Row
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Column gap="8">
                                        <Heading as="h3" variant="heading-strong-s">
                                            Can I change my plan later?
                                        </Heading>
                                        <Text
                                            variant="body-default-s"
                                            onBackground="neutral-medium"
                                        >
                                            Yes! You can upgrade or downgrade your plan at any time.
                                            If you upgrade, the change will take effect immediately.
                                            If you downgrade, the change will take effect at the end
                                            of your current billing cycle.
                                        </Text>
                                    </Column>
                                </Row>

                                <Row
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Column gap="8">
                                        <Heading as="h3" variant="heading-strong-s">
                                            Do you offer a free trial?
                                        </Heading>
                                        <Text
                                            variant="body-default-s"
                                            onBackground="neutral-medium"
                                        >
                                            Yes, all paid plans come with a 14-day free trial. No
                                            credit card is required to start your trial.
                                        </Text>
                                    </Column>
                                </Row>

                                <Row
                                    padding="24"
                                    radius="l"
                                    border="neutral-alpha-weak"
                                    background="overlay"
                                >
                                    <Column gap="8">
                                        <Heading as="h3" variant="heading-strong-s">
                                            What payment methods do you accept?
                                        </Heading>
                                        <Text
                                            variant="body-default-s"
                                            onBackground="neutral-medium"
                                        >
                                            We accept all major credit cards, PayPal, and bank
                                            transfers for yearly plans.
                                        </Text>
                                    </Column>
                                </Row>
                            </Grid>
                        </Column>
                    </RevealFx>

                    {/* CTA Section */}
                    <RevealFx speed="medium" translateY={1.75} delay={0.2}>
                        <Column
                            paddingX="40"
                            paddingY="104"
                            horizontal="center"
                            gap="32"
                            maxWidth="s"
                        >
                            <Heading variant="display-strong-m" align="center">
                                Ready to transform your email experience?
                            </Heading>
                            <Column horizontal="center" maxWidth={40}>
                                <Text
                                    variant="body-default-l"
                                    align="center"
                                    onBackground="neutral-medium"
                                >
                                    Start your free trial today. No credit card required.
                                </Text>
                            </Column>
                            <Row horizontal="center" gap="16">
                                <Button
                                    label="Get started for free"
                                    size="l"
                                    variant="primary"
                                    href="/register"
                                />
                                <Button
                                    label="Contact sales"
                                    size="l"
                                    variant="secondary"
                                    href="/contact"
                                />
                            </Row>
                        </Column>
                    </RevealFx>
                </Column>
            </Column>
        </Column>
    );
}
