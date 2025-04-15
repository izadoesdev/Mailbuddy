"use client";

import React, { useState } from "react";
import {
  Heading,
  Text,
  Column,
  Row,
  Background,
  Button,
  Icon,
  IconButton,
  Card,
  Line,
  Switch,
  Grid,
  RevealFx,
  Badge,
} from "@/once-ui/components";
import { ScrollToTop } from "@/once-ui/components/ScrollToTop";
import { effects } from "@/app/resources/config";

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
    { name: "Support", id: "support" }
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
      variant: "tertiary" as const,
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
    : pricingPlans.filter(plan => plan.id !== "pro-plan");
  
  const renderPlanFeatureValue = (planId: string, feature: typeof featuresList[0]) => {
    const planKey = planId.split('-')[0];
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
      />
      
      <Column
        fillWidth
        horizontal="center"
        maxWidth="l"
        padding="8"
      >
        <ScrollToTop><IconButton variant="secondary" icon="chevronUp"/></ScrollToTop>

        {/* Main content wrapper */}
        <Column
          as="main"
          radius="xl"
          horizontal="center"
          border="neutral-alpha-weak"
          fillWidth
          background="overlay"
          overflow="hidden"
        >
          {/* Hero section */}
          <RevealFx speed="medium" translateY={12}>
            <Column paddingX="32" paddingTop="64" paddingBottom="32" horizontal="center" position="relative">
              <Badge icon="sparkles" marginBottom="16">Pricing</Badge>
              <Heading variant="display-strong-xl" align="center" marginBottom="16">Choose your perfect plan</Heading>
              <Column maxWidth={40} horizontal="center">
                <Text 
                  variant="body-default-l" 
                  align="center" 
                  onBackground="neutral-medium" 
                >
                  Simple, transparent pricing for everyone. All plans include our core security features.
                </Text>
              </Column>
            </Column>
          </RevealFx>

          {/* Billing Toggle */}
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
                  <Text variant="label-strong-m">
                    Monthly
                  </Text>
                </Row>
                <Switch
                  isChecked={billingCycle === "yearly"}
                  onToggle={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                />
                <Row gap="8" vertical="center">
                  <Text variant="label-strong-m">
                    Yearly
                  </Text>
                </Row>
              </Row>
            </Row>
          </Column>

          {/* Pricing cards grid */}
          <RevealFx speed="medium" translateY={12} delay={0.2}>
            <Grid 
              columns={3}
              gap="24" 
              padding="32"
              position="relative"
            >
              {displayPlans.map((plan, index) => (
                <Card
                  key={plan.id}
                  fillWidth
                  padding="32"
                  gap="24"
                  direction="column"
                  radius="xl"
                  shadow={plan.popular ? "l" : "s"}
                  border={plan.popular ? "brand-medium" : "neutral-alpha-weak"}
                  background={plan.popular ? "brand-weak" : "overlay"}
                  position="relative"
                >
                  {plan.popular && (
                    <Row
                      position="absolute"
                      style={{ top: "-12px" }}
                      horizontal="center"
                      fillWidth
                    >
                      <Badge 
                        icon="sparkles"
                      >
                        Most Popular
                      </Badge>
                    </Row>
                  )}

                  <Column gap="8">
                    <Heading variant="heading-strong-l">{plan.name}</Heading>
                    <Text variant="body-default-s" onBackground="neutral-medium">
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
                    {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                      <Text variant="body-default-s" onBackground="neutral-medium">
                        Billed annually (${plan.yearlyPrice}/year)
                      </Text>
                    )}
                  </Column>
                  
                  <Text variant="label-strong-xs" onBackground="brand-strong">
                    {plan.highlight}
                  </Text>

                  <Button
                    label={plan.cta}
                    variant={plan.variant}
                    fillWidth
                  />

                  <Column gap="16">
                    <Line background="neutral-alpha-medium" />
                    <Column gap="12">
                      {plan.keyFeatures.map((feature, featureIndex) => (
                        <Row key={`${plan.id}-feature-${featureIndex}`} gap="12" vertical="center">
                          <Icon name="checkCircle" size="s" onBackground={plan.popular ? "brand-strong" : "success-strong"} />
                          <Text variant="body-default-s">{feature}</Text>
                        </Row>
                      ))}
                    </Column>
                  </Column>
                </Card>
              ))}
            </Grid>
          </RevealFx>

          {/* Feature comparison section */}
          <RevealFx speed="medium" translateY={12} delay={0.4}>
            <Column paddingX="32" paddingTop="32" paddingBottom="64" horizontal="center" position="relative">
              <Background
                position="absolute"
                mask={{
                  x: 50,
                  y: 0,
                  radius: 100,
                }}
                grid={{
                  display: true,
                  opacity: 10,
                  color: "brand-alpha-weak",
                  width: "16",
                  height: "16",
                }}
              />
              
              <Heading variant="heading-strong-l" align="center" marginBottom="40">
                Compare All Features
              </Heading>
              
              <Card 
                border="neutral-alpha-medium" 
                radius="xl" 
                padding="0" 
                overflow="hidden"
                background="overlay"
              >
                {/* Plan headers */}
                <Row fillWidth borderBottom="neutral-alpha-medium">
                  <Column padding="16" fillWidth maxWidth={30}>
                    <Text variant="label-strong-m">Features</Text>
                  </Column>
                  {displayPlans.map(plan => (
                    <Column 
                      key={`header-${plan.id}`} 
                      fillWidth 
                      padding="16" 
                      background={plan.popular ? "brand-weak" : undefined}
                      borderLeft="neutral-alpha-weak"
                    >
                      <Heading as="h3" variant="heading-strong-s">{plan.name}</Heading>
                      <Text variant="body-default-s" onBackground="neutral-medium">
                        ${billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}/mo
                      </Text>
                    </Column>
                  ))}
                </Row>
                
                {/* Feature categories and details */}
                {featureCategories.map(category => (
                  <Column key={category.id} fillWidth>
                    {/* Category header */}
                    <Row fillWidth background="neutral-alpha-weak" paddingY="12" paddingX="16">
                      <Text variant="label-strong-s">{category.name}</Text>
                    </Row>
                    
                    {/* Features in this category */}
                    {featuresList
                      .filter(feature => feature.category === category.id)
                      .map((feature, featureIndex) => (
                        <Row 
                          key={`${category.id}-${featureIndex}`} 
                          fillWidth 
                          borderTop="neutral-alpha-weak"
                        >
                          <Column padding="16" fillWidth maxWidth={30}>
                            <Text variant="body-default-s">{feature.name}</Text>
                          </Column>
                          {displayPlans.map(plan => (
                            <Column 
                              key={`${plan.id}-${feature.name}`} 
                              fillWidth 
                              padding="16" 
                              horizontal="center"
                              vertical="center"
                              background={plan.popular ? "brand-alpha-weak" : undefined}
                              borderLeft="neutral-alpha-weak"
                            >
                              {renderPlanFeatureValue(plan.id, feature)}
                            </Column>
                          ))}
                        </Row>
                      ))
                    }
                  </Column>
                ))}
              </Card>
            </Column>
          </RevealFx>

          {/* FAQ Section */}
          <RevealFx speed="medium" translateY={12} delay={0.6}>
            <Column paddingX="32" paddingTop="32" paddingBottom="64" position="relative">
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
              <Heading variant="heading-strong-l" align="center" marginBottom="32">
                Questions? We have answers
              </Heading>
              
              <Grid columns={2} gap="24" maxWidth="l">
                <Card padding="24" radius="l" border="neutral-alpha-weak" background="overlay">
                  <Column gap="8">
                    <Heading as="h3" variant="heading-strong-s">
                      How does billing work?
                    </Heading>
                    <Text variant="body-default-s" onBackground="neutral-medium">
                      Plans are billed either monthly or yearly, with a 20% discount for yearly subscriptions. You can change your billing cycle at any time.
                    </Text>
                  </Column>
                </Card>
                
                <Card padding="24" radius="l" border="neutral-alpha-weak" background="overlay">
                  <Column gap="8">
                    <Heading as="h3" variant="heading-strong-s">
                      Can I change my plan later?
                    </Heading>
                    <Text variant="body-default-s" onBackground="neutral-medium">
                      Yes! You can upgrade or downgrade your plan at any time. If you upgrade, the change will take effect immediately. If you downgrade, the change will take effect at the end of your current billing cycle.
                    </Text>
                  </Column>
                </Card>
                
                <Card padding="24" radius="l" border="neutral-alpha-weak" background="overlay">
                  <Column gap="8">
                    <Heading as="h3" variant="heading-strong-s">
                      Do you offer a free trial?
                    </Heading>
                    <Text variant="body-default-s" onBackground="neutral-medium">
                      Yes, all paid plans come with a 14-day free trial. No credit card is required to start your trial.
                    </Text>
                  </Column>
                </Card>
                
                <Card padding="24" radius="l" border="neutral-alpha-weak" background="overlay">
                  <Column gap="8">
                    <Heading as="h3" variant="heading-strong-s">
                      What payment methods do you accept?
                    </Heading>
                    <Text variant="body-default-s" onBackground="neutral-medium">
                      We accept all major credit cards, PayPal, and bank transfers for yearly plans.
                    </Text>
                  </Column>
                </Card>
              </Grid>
            </Column>
          </RevealFx>

          {/* CTA Section */}
          <RevealFx speed="medium" translateY={12} delay={0.8}>
            <Column
              background="overlay"
              paddingX="40"
              paddingY="64"
              horizontal="center"
              gap="32"
              position="relative"
              topRadius="xl"
            >

              <Heading variant="heading-strong-xl" align="center">
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
                  href="/signup"
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