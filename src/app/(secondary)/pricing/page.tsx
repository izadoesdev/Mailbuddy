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
      description: "Perfect for trying out our service",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "1 project",
        "Basic analytics",
        "100 recipients per month",
        "Community support",
        "Email templates: 5",
      ],
      cta: "Get Started",
      popular: false,
      variant: "secondary" as const,
    },
    {
      id: "essential-plan",
      name: "Essential",
      description: "For growing small businesses",
      monthlyPrice: 19,
      yearlyPrice: Math.round(19 * 12 * (1 - yearlyDiscount / 100)),
      features: [
        "5 projects",
        "Advanced analytics",
        "1,000 recipients per month",
        "Priority email support",
        "Email templates: 20",
        "API access",
        "Scheduled sending",
      ],
      cta: "Choose Essential",
      popular: true,
      variant: "primary" as const,
    },
    {
      id: "premium-plan",
      name: "Premium",
      description: "For established businesses",
      monthlyPrice: 49,
      yearlyPrice: Math.round(49 * 12 * (1 - yearlyDiscount / 100)),
      features: [
        "Unlimited projects",
        "Full analytics suite",
        "5,000 recipients per month",
        "24/7 priority support",
        "Email templates: Unlimited",
        "Advanced API access",
        "Scheduled sending",
        "Custom integrations",
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
    description: "For professional teams",
    monthlyPrice: 99,
    yearlyPrice: Math.round(99 * 12 * (1 - yearlyDiscount / 100)),
    features: [
      "25 projects",
      "Full analytics suite",
      "10,000 recipients per month",
      "Priority phone & email support",
      "Email templates: Unlimited",
      "Advanced API access",
      "Scheduled sending",
      "Custom integrations",
    ],
    cta: "Choose Pro",
    popular: false,
    variant: "secondary" as const,
  };

  const displayPlans = includePro 
    ? [...pricingPlans.slice(0, 2), proPlan, pricingPlans[2]] 
    : pricingPlans;

  return (
    <Column fillWidth paddingY="80" paddingX="s" horizontal="center" flex={1} position="relative">
      {/* Enhanced background elements */}
      <Background
        position="absolute"
        mask={{
          cursor: true,
          radius: 100,
        }}
        grid={{
          display: true,
          opacity: 10,
          width: "4rem",
          color: "neutral-alpha-medium",
          height: "4rem",
        }}
      />
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

          <Background
            position="absolute"
            mask={{
              x: 0,
              y: 100,
              radius: 80,
            }}
            gradient={{
              display: true,
              opacity: 30,
              tilt: 35,
              height: 30,
              width: 30,
              x: 20,
              y: 80,
              colorStart: "brand-solid-strong",
              colorEnd: "static-transparent",
            }}
          />
          
          <Heading variant="display-strong-xl" align="center">Simple, transparent pricing</Heading>
          <Column maxWidth={40} horizontal="center">
            <Text 
              variant="body-default-l" 
              align="center" 
              onBackground="neutral-medium" 
              marginBottom="16"
            >
              Choose the perfect plan for your business needs. No hidden fees or surprise charges.
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
            Ready to get started?
          </Heading>
          <Column horizontal="center" style={{ maxWidth: "var(--spacing-30)" }}>
            <Text 
              variant="body-default-m" 
              align="center" 
              onBackground="neutral-medium"
            >
              Join thousands of businesses that use our platform to scale their email campaigns.
            </Text>
          </Column>
          <Row horizontal="center" gap="16">
            <Button
              label="Start your free trial"
              variant="primary"
              prefixIcon="sparkle"
            />
            <Button
              label="Learn more"
              variant="secondary"
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