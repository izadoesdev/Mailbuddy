"use client";

import React, { useState } from "react";
import {
  Heading,
  Text,
  Column,
  Row,
  Background,
  Button,
  Logo,
  Icon,
  SmartLink,
  ThemeSwitcher,
  IconButton,
  Card,
  Line,
  Switch,
} from "@/once-ui/components";
import { ScrollToTop } from "@/once-ui/components/ScrollToTop";
import { effects } from "@/app/resources/config";
import Footer from "@/components/Boxes/Footer";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [includePro, setIncludePro] = useState(true);

  // Calculate discount for yearly billing
  const yearlyDiscount = 20; // 20% discount for yearly billing
  
  // Pricing plans with features
  const pricingPlans = [
    {
      id: "free-plan",
      name: "Free",
      description: "Perfect for trying out Mailbuddy",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Gmail integration",
        "Basic email organization",
        "100 emails per month with AI processing",
        "Community support",
        "Client-side encryption",
      ],
      cta: "Get Started",
      popular: false,
      variant: "secondary" as const,
    },
    {
      id: "essential-plan",
      name: "Essential",
      description: "For personal and small team use",
      monthlyPrice: 19,
      yearlyPrice: Math.round(19 * 12 * (1 - yearlyDiscount / 100)),
      features: [
        "Unlimited Gmail accounts",
        "AI-powered email categorization",
        "1,000 emails per month with AI processing",
        "Priority email support",
        "Enhanced security features",
        "Real-time syncing",
        "Advanced search capabilities",
      ],
      cta: "Choose Essential",
      popular: true,
      variant: "primary" as const,
    },
    {
      id: "premium-plan",
      name: "Premium",
      description: "For businesses requiring maximum security",
      monthlyPrice: 49,
      yearlyPrice: Math.round(49 * 12 * (1 - yearlyDiscount / 100)),
      features: [
        "Unlimited email accounts",
        "Full AI feature suite",
        "10,000 emails per month with AI processing",
        "24/7 priority support",
        "HIPAA-compliant configuration",
        "Team collaboration tools",
        "Custom integration options",
        "Data retention policies",
        "Dedicated account manager",
      ],
      cta: "Choose Premium",
      popular: false,
      variant: "secondary" as const,
    }
  ];

  // Conditionally add Pro plan if toggle is on
  const proPlan = {
    id: "pro-plan",
    name: "Pro",
    description: "For professional teams and businesses",
    monthlyPrice: 99,
    yearlyPrice: Math.round(99 * 12 * (1 - yearlyDiscount / 100)),
    features: [
      "Multiple email accounts",
      "Full AI feature suite",
      "5,000 emails per month with AI processing",
      "Priority phone & email support",
      "Advanced encryption options",
      "Team management features",
      "Custom email templates",
      "Advanced analytics",
    ],
    cta: "Choose Pro",
    popular: false,
    variant: "secondary" as const,
  };

  const displayPlans = includePro 
    ? [...pricingPlans.slice(0, 2), proPlan, pricingPlans[2]] 
    : pricingPlans;

  return (
    <Row fill padding="8" gap="8" horizontal="center">
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
        gap="-1"
        fillWidth
        horizontal="center"
        maxWidth="l"
      >
        <ScrollToTop><IconButton variant="secondary" icon="chevronUp"/></ScrollToTop>

        {/* Main content */}
        <Column
          as="main"
          maxWidth="l"
          position="relative"
          radius="xl"
          horizontal="center"
          border="neutral-alpha-weak"
          fillWidth
          background="surface"
        >
          {/* Hero section */}
          <Column paddingX="32" gap="32" paddingY="64" horizontal="center" position="relative">
            
            <Heading variant="display-strong-xl" align="center">Simple, transparent pricing</Heading>
            <Column maxWidth={40} horizontal="center">
              <Text 
                variant="body-default-l" 
                align="center" 
                onBackground="neutral-medium" 
                marginBottom="16"
              >
                Choose the right plan for your secure, private, and AI-enhanced email experience. No compromises on security or privacy.
              </Text>
            </Column>

            {/* Billing Toggle */}
            <Row horizontal="center" gap="16" paddingTop="24" paddingBottom="40">
              <Text variant="body-default-m">Monthly</Text>
              <Switch
                isChecked={billingCycle === "yearly"}
                onToggle={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              />
              <Row gap="8" vertical="center">
                <Text variant="body-default-m">Yearly</Text>
                <Row 
                  background="success-alpha-weak" 
                  paddingX="8" 
                  paddingY="4" 
                  radius="s"
                >
                  <Text variant="label-strong-xs" onBackground="success-strong">
                    Save {yearlyDiscount}%
                  </Text>
                </Row>
              </Row>
            </Row>

            {/* Demo Feature: Toggle for Pro plan inclusion */}
            <Row horizontal="center" gap="12" paddingBottom="24">
              <Text variant="body-default-s" onBackground="neutral-medium">Include Pro plan?</Text>
              <Switch
                isChecked={includePro}
                onToggle={() => setIncludePro(!includePro)}
              />
            </Row>

            {/* Pricing cards */}
            <Row
              fillWidth
              gap="24"
              mobileDirection="column"
              tabletDirection="column"
              position="relative"
            >
              <Background
                position="absolute"
                mask={{
                  x: 50,
                  y: 50,
                }}
                dots={{
                  display: true,
                  opacity: 20,
                  color: "neutral-alpha-medium",
                  size: "32",
                }}
              />
              {displayPlans.map((plan) => (
                <Card
                  key={plan.id}
                  fillWidth
                  padding="32"
                  gap="32"
                  direction="column"
                  radius="xl"
                  shadow={plan.popular ? "l" : "s"}
                  border={plan.popular ? "brand-medium" : "neutral-alpha-weak"}
                  background={plan.popular ? "brand-weak" : "surface"}
                  position="relative"
                >
                  {plan.popular && (
                    <Row
                      position="absolute"
                      style={{ top: "-12px" }}
                      horizontal="center"
                      fillWidth
                    >
                      <Row
                        background="brand-strong"
                        paddingX="16"
                        paddingY="4"
                        radius="full"
                      >
                        <Text variant="label-strong-xs" onSolid="neutral-strong">
                          Most Popular
                        </Text>
                      </Row>
                    </Row>
                  )}

                  <Column gap="16">
                    <Heading variant="heading-strong-l">{plan.name}</Heading>
                    <Text variant="body-default-m" onBackground="neutral-medium">
                      {plan.description}
                    </Text>
                  </Column>

                  <Column gap="8">
                    <Row gap="8" vertical="end">
                      <Text variant="display-strong-l">
                        ${billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                      </Text>
                      <Text variant="body-default-m" onBackground="neutral-medium" paddingBottom="4">
                        / month
                      </Text>
                    </Row>
                    {billingCycle === "yearly" && (
                      <Text variant="body-default-s" onBackground="neutral-medium">
                        Billed annually (${plan.yearlyPrice}/year)
                      </Text>
                    )}
                  </Column>

                  <Button
                    label={plan.cta}
                    variant={plan.variant}
                    fillWidth
                  />

                  <Column gap="16">
                    <Line background="neutral-alpha-medium" />
                    <Text variant="label-strong-s">What's included:</Text>
                    <Column gap="12">
                      {plan.features.map((feature, featureIndex) => (
                        <Row key={`${plan.id}-feature-${featureIndex}`} gap="12" vertical="start">
                          <Icon name="checkCircle" size="s" />
                          <Text variant="body-default-m">{feature}</Text>
                        </Row>
                      ))}
                    </Column>
                  </Column>
                </Card>
              ))}
            </Row>
          </Column>

          {/* FAQ Section */}
          <Column paddingX="32" paddingTop="104" paddingBottom="64" position="relative">
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
                opacity: 30,
              }}
            />
            <Heading variant="heading-strong-l" align="center" marginBottom="32">
              Frequently Asked Questions
            </Heading>
            <Column gap="24" horizontal="center" style={{ maxWidth: "var(--spacing-40)" }}>
              <Column gap="8">
                <Heading as="h3" variant="heading-strong-s">
                  How does billing work?
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-medium">
                  Plans are billed either monthly or yearly, with a 20% discount for yearly subscriptions. You can change your billing cycle at any time.
                </Text>
              </Column>
              
              <Column gap="8">
                <Heading as="h3" variant="heading-strong-s">
                  Can I change my plan later?
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-medium">
                  Yes! You can upgrade or downgrade your plan at any time. If you upgrade, the change will take effect immediately. If you downgrade, the change will take effect at the end of your current billing cycle.
                </Text>
              </Column>
              
              <Column gap="8">
                <Heading as="h3" variant="heading-strong-s">
                  Do you offer a free trial?
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-medium">
                  Yes, all paid plans come with a 14-day free trial. No credit card is required to start your trial.
                </Text>
              </Column>
              
              <Column gap="8">
                <Heading as="h3" variant="heading-strong-s">
                  What payment methods do you accept?
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-medium">
                  We accept all major credit cards, PayPal, and bank transfers for yearly plans.
                </Text>
              </Column>
              
              <Column gap="8">
                <Heading as="h3" variant="heading-strong-s">
                  Do you offer refunds?
                </Heading>
                <Text variant="body-default-m" onBackground="neutral-medium">
                  We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied with our service, contact us within 30 days of your purchase for a full refund.
                </Text>
              </Column>

              <Row horizontal="center" paddingTop="32">
                <Button
                  label="Contact Sales"
                  href="/contact"
                  variant="secondary"
                  prefixIcon="mail"
                />
              </Row>
            </Column>
          </Column>

          {/* CTA Section */}
          <Column
            background="overlay"
            paddingX="32"
            paddingY="64"
            horizontal="center"
            gap="32"
            radius="xl"
            margin="32"
            border="neutral-alpha-weak"
            position="relative"
          >
            <Background
              position="absolute"
              mask={{
                cursor: true,
                radius: 50,
              }}
              dots={{
                display: true,
                opacity: 10,
                color: "brand-alpha-strong",
                size: "24",
              }}
            />
            <Heading variant="heading-strong-l" align="center">
              Ready to secure your email experience?
            </Heading>
            <Column horizontal="center" style={{ maxWidth: "var(--spacing-30)" }}>
              <Text 
                variant="body-default-m" 
                align="center" 
                onBackground="neutral-medium"
              >
                Join Mailbuddy - Your AI Email Assistant with privacy-first architecture and zero-knowledge encryption.
              </Text>
            </Column>
            <Row horizontal="center" gap="16">
              <Button
                label="Get started for free"
                variant="primary"
                prefixIcon="sparkle"
                href="/signup"
              />
              <Button
                label="Learn more"
                variant="secondary"
              />
            </Row>
          </Column>
        </Column>

        {/* Footer */}
      </Column>
    </Row>
  );
} 