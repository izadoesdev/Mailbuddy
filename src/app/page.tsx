"use client";

import type React from "react";
import { useEffect, useState } from "react";
import TopNav from "@/components/Boxes/TopNav";
import Footer from "@/components/Boxes/Footer";
import {
    Heading,
    Text,
    Button,
    Icon,
    Row,
    Column,
    Background,
    Line,
    Fade,
    Input,
    Badge,
    SmartImage,
    Grid,
} from "@/once-ui/components";

export default function Home() {
    const [wishlistEmail, setWishlistEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [userCount, setUserCount] = useState(0);
    const [alreadySubscribed, setAlreadySubscribed] = useState(false);

    const features = [
        {
          title: "Smart Email Categorization",
          img: "/images/landing/prod-5.png",
          description: "AI automatically organizes your emails into intuitive categories like Work, Personal, Finance, and more, helping you focus on what matters.",
          icon: "folder",
        },
        {
          title: "Priority Inbox",
          img: "/images/landing/prod-4.png",
          description: "Never miss important emails again. Our AI analyzes content and automatically flags urgent messages that need your immediate attention.",
          icon: "flag",
        },
        {
          title: "Secure & Private",
          img: "/images/landing/prod-3.png",
          description: "End-to-end encryption keeps your emails safe. We never scan your content for advertising - your data remains private and protected.",
          icon: "shield",
        },
        {
          title: "Seamless Gmail Integration",
          img: "/images/landing/prod-2.png",
          description: "Works with your existing Gmail account. No need to change email addresses or migrate data - just connect and start experiencing smarter email.",
          icon: "mail",
        },
      ];

      const targetAudience = [
        {
          title: "Busy professionals",
          description: "Focus on high-priority communications without drowning in your inbox.",
          icon: "briefcase",
        },
        {
          title: "Team leaders",
          description: "Efficiently manage work communications with smart filters and categorization.",
          icon: "group",
        },
        {
          title: "Privacy-conscious users",
          description: "Keep your email data secure with our privacy-first approach.",
          icon: "shield",
        },
        {
          title: "Gmail power users",
          description: "Take your Gmail experience to the next level with AI-powered organization.",
          icon: "sparkles",
        },
      ];    
    
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await fetch('/api/wishlist');
                const data = await response.json();
                
                if (data.success && data.data?.count) {
                    animateCounter(data.data.count);
                } else {
                    animateCounter(1247);
                }
            } catch (error) {
                animateCounter(1247);
            }
        };
        
        fetchUserCount();
    }, []);
    
    const animateCounter = (targetCount: number) => {
        const duration = 1500;
        const step = 30;
        const increment = Math.ceil(targetCount / (duration / step));
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetCount) {
                setUserCount(targetCount);
                clearInterval(timer);
            } else {
                setUserCount(current);
            }
        }, step);
    };
    
    const handleWishlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wishlistEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wishlistEmail)) {
            setSubmitError("Please enter a valid email address");
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError("");
        
        try {
            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: wishlistEmail }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                const isAlreadySubscribed = data.message?.includes("already");
                setAlreadySubscribed(isAlreadySubscribed);
                
                if (!isAlreadySubscribed) {
                    setUserCount(prev => prev + 1);
                }
                
                setSubmitted(true);
                setWishlistEmail("");
            } else {
                setSubmitError(data.error || "Failed to join wishlist. Please try again.");
            }
        } catch (error) {
            setSubmitError("An unexpected error occurred. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Column
            fillWidth
            paddingTop="40"
            paddingBottom="48"
            horizontal="center"
            flex={1}
        >
            <Fade
                zIndex={3}
                pattern={{ display: true, size: "4" }}
                position="fixed"
                top="0"
                left="0"
                to="bottom"
                height={5}
                fillWidth
                blur={0.25}
            />

            <TopNav />

            <Column
                overflow="hidden"
                as="main"
                position="relative"
                horizontal="center"
                fillWidth
            >
            <Column fillWidth horizontal="center" paddingX="l" paddingY="xl" gap="xl" data-brand="emerald" >
                <Column maxWidth="s" horizontal="center" gap="l">
                <Row radius="full" minWidth="56" minHeight="4" solid="brand-medium" data-solid="inverse"/>
                <Heading as="h2" align="center" variant="display-strong-l">
                    Your AI-Powered Email Companion
                </Heading>
                <Text align="center" onBackground="neutral-medium" variant="heading-default-xl" wrap="balance">
                    MailBuddy organizes your Gmail with smart AI categories and priority management, making email simple and efficient
                </Text>
                
                <Row gap="16" horizontal="center" data-border="rounded">
                        <Button
                            id="start-for-free"
                            label="Start for free"
                            href="/register"
                            variant="primary"
                            size="l"
                            arrowIcon
                        />
                    </Row>
            </Column>

        {/* Who is it for Section */}
        <Row fillWidth horizontal="center" paddingTop="l" paddingLeft="l">
        
        <Background position="absolute" top="0" mask={{x: 25, y: 0, radius: 100}}>
          <SmartImage alt="Email app background" sizes="(max-width: 1024px) 100vw, 90vw" aspectRatio="16/9" radius="xl" src="/images/landing/fantasy-background-1.jpg" />
        </Background>
        <Column maxWidth="l">
          <Column height={4} hide="m"/>
          <Background mask={{x: 50, y: 25, radius: 250}} style={{transform: "skewX(24deg) skewY(-7deg) scaleY(0.85) translateX(0)"}} minWidth={56}>
            <SmartImage alt="Email organization demo" sizes="(max-width: 1024px) 100vw, 1200px" aspectRatio="1920/1200" src="/images/landing/prod-1.png" radius="l"/>
          </Background>
          <Grid
            style={{
              transform: "translateY(-2rem)",
            }}
            paddingX="l"
            fillWidth
            gap="8"
            columns="4"
            tabletColumns="2"
            mobileColumns="1"
          >
            {targetAudience.map((item, index) => (
              <Column
                style={{
                  backdropFilter: "blur(1rem)"
                }}
                key={item.title}
                background="overlay"
                radius="l"
                shadow="xl"
                padding="32"
                border="neutral-alpha-weak"
                fillWidth
                gap="8"
              >
                <Icon name={item.icon} marginBottom="12" size="s" onBackground="brand-weak" />
                <Heading as="h3" variant="label-default-l">
                  {item.title}
                </Heading>
                <Text wrap="balance" variant="body-default-s" onBackground="neutral-medium">
                  {item.description}
                </Text>
              </Column>
            ))}
          </Grid>
        </Column>
        </Row>

        <Background height="1" marginTop="l" marginBottom="l" borderBottom="neutral-alpha-medium" mask={{x: 50, y: 0, radius: 50}}/>

        {/* Features Section */}
        <Column fillWidth horizontal="center" gap="40">
          <Column maxWidth={32} gap="20">
            <Heading as="h2" variant="display-strong-s" align="center">
              Smart organization.<br/>
              Peace of mind.
            </Heading>
            <Text wrap="balance" onBackground="neutral-medium" align="center" variant="body-default-xl" marginBottom="l">
              Stop drowning in your inbox. Let AI help you focus on what truly matters.
            </Text>
          </Column>
          <Column gap="104" maxWidth="l">
            {features.map((feature, index) => (
              <Row
                fillWidth
                key={feature.title}
                gap="xl"
                direction={index % 2 === 0 ? "row" : "row-reverse"}
                vertical="center"
                mobileDirection="column"
              >
                <Column
                  flex={3}
                  vertical="center"
                  fillWidth
                  position="sticky"
                  top="0"
                  paddingY="24"
                  paddingX="16"
                  horizontal={index % 2 ? "start" : "end"}
                  tabletDirection="column"
                >
                  <Column 
                    gap="12"
                    maxWidth={24}
                    horizontal={index % 2 ? "start" : "end"}
                    align={index % 2 ? "left" : "right"}>
                    <Icon
                      background="accent-alpha-weak"
                      radius="full"
                      padding="16"
                      border="accent-alpha-weak"
                      center
                      marginBottom="20"
                      name={feature.icon}
                      onBackground="brand-weak" />
                    <Heading size="l">{feature.title}</Heading>
                    <Text onBackground="neutral-weak" variant="body-default-m" wrap="balance">
                      {feature.description}
                    </Text>
                  </Column>
                </Column>
                <SmartImage
                  flex={4}
                  border="neutral-alpha-medium"
                  src={feature.img}
                  alt={`Image for ${feature.title}`}
                  sizes={"(max-width: 1024px) 90vw, 640px"}
                  radius="l"
                  aspectRatio=""
                />
              </Row>
            ))}
          </Column>
        </Column>
        
        <Background height="1" marginTop="l" marginBottom="l" borderBottom="neutral-alpha-medium" mask={{x: 50, y: 0, radius: 50}}/>

        {/* Categories Section */}
        <Column fillWidth horizontal="center" gap="40">
          <Row maxWidth="l" paddingX="24">
            <Heading as="h2" variant="display-strong-m">
              Smart categories for<br/>a smarter inbox.
            </Heading>
          </Row>
          <Row gap="24" maxWidth="l" mobileDirection="column">
            <Column fillWidth gap="8">
              <SmartImage
                radius="xl"
                fillWidth
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 720px"
                aspectRatio="1/1"
                alt="AI categorization"
                src="/images/landing/prod-1.png"
                border="neutral-alpha-medium"/>
              <Column gap="8" padding="24"> 
                <Heading as="h3" variant="heading-strong-xl" marginBottom="8">
                  Business & Work
                </Heading>
                <Text onBackground="neutral-weak" wrap="balance">
                  Separate work emails from personal ones. Keep track of invoices, receipts, and financial communications automatically.
                </Text>
              </Column>
            </Column>
            <Column fillWidth gap="8">
                <Background position="absolute" top="0" mask={{x: 25, y: 0, radius: 100}}>
                    <SmartImage opacity={30} alt="Email app background" sizes="(max-width: 1024px) 100vw, 90vw" aspectRatio="16/9" radius="xl" src="/images/landing/fantasy-background-1.jpg" />
                </Background>
              <SmartImage
                radius="xl"
                fillWidth
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 720px"
                aspectRatio="1.2/1"
                alt="Priority inbox"
                draggable={false}
                src="/images/landing/prod-4.png"
                background="overlay"
                border="neutral-alpha-medium"/>
              <Column gap="8" padding="24">
                <Heading as="h3" variant="heading-strong-xl" marginBottom="8">
                  Priority Management
                </Heading>
                <Text onBackground="neutral-weak" wrap="balance">
                  Our AI identifies urgent emails that need immediate attention, letting you focus on what matters most right now.
                </Text>
              </Column>
            </Column>
          </Row>
        </Column>

                <Column
                    fillWidth
                    paddingX="32"
                    paddingY="64"
                    gap="48"
                    horizontal="center"
                    position="relative"
                >
                    <Column fillWidth gap="32" horizontal="center" maxWidth="l">
                        <Row
                            fillWidth
                            padding="xl"
                            radius="l"
                            background="overlay"
                            border="neutral-alpha-medium"
                        > 
                            {submitted ? (
                                <Column gap="16" horizontal="center" paddingY="24">
                                    <Icon 
                                        name={alreadySubscribed ? "info" : "checkCircle"} 
                                        size="l" 
                                        color={alreadySubscribed ? "info" : "success"} 
                                    />
                                    <Heading 
                                        variant="heading-strong-m" 
                                        align="center"
                                    >
                                        {alreadySubscribed ? "Already subscribed" : "Thank you!"}
                                    </Heading>
                                    <Text 
                                        variant="body-default-m" 
                                        align="center" 
                                        onBackground="neutral-medium"
                                    >
                                        {alreadySubscribed 
                                            ? "This email is already on our waitlist. We'll keep you updated on our progress."
                                            : "You've been added to our waitlist. We'll keep you updated on our progress and upcoming features."
                                        }
                                    </Text>
                                </Column>
                            ) : (
                                <form onSubmit={handleWishlistSubmit} style={{ width: '100%' }}>
                                    <Column gap="16" fillWidth horizontal="center">
                                    
                                    <Badge paddingX="16"
                                            marginBottom="24"
                                            background="surface"
                                            border="neutral-alpha-medium"
                                            paddingY="8"
                                            textVariant="label-default-s"
                                            arrow={false}
                                            align="center"
                                        >
                                            <Text weight="strong" marginRight="4">{userCount.toLocaleString()}</Text> people signed up
                                        </Badge>

                                    <Heading as="h2" variant="display-strong-m" align="center">
                                        Join Our Waitlist
                                    </Heading>
                                    
                                    <Column horizontal="center" gap="16" maxWidth={24}>
                                        <Text
                                            variant="body-default-m"
                                            align="center"
                                            onBackground="neutral-medium"
                                            wrap="balance"
                                        >
                                            Be the first to know when we launch new features and get early access to our premium tiers.
                                        </Text>
                                    </Column>
                                        <Background mask={{ x: 50, y: 0, radius: 50 }} marginTop="40" marginBottom="40">
                                            <Line maxWidth="l" background="neutral-alpha-medium" />
                                        </Background>
                                        <Column gap="16" maxWidth={32}>
                                            <Input
                                                id="wishlist-email"
                                                labelAsPlaceholder
                                                label="Your email"
                                                type="email"
                                                value={wishlistEmail}
                                                onChange={(e) => setWishlistEmail(e.target.value)}
                                                required
                                                error={submitError ? true : undefined}
                                                errorMessage={submitError}
                                            />
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                label={isSubmitting ? "Adding you..." : "Join Waitlist"}
                                                loading={isSubmitting}
                                                fillWidth
                                            />
                                        </Column>
                                    </Column>
                                </form>
                            )}
                        </Row>
                    </Column>
                </Column>

                <Column
                    fillWidth
                    paddingX="32"
                    paddingY="80"
                    gap="32"
                    horizontal="center"
                    position="relative"
                >
                    <Column maxWidth={48} horizontal="center" gap="32">
                        <Heading as="h2" variant="display-strong-l" align="center">
                            Ready to Take Control of Your Email?
                        </Heading>
                        <Text
                            variant="heading-default-xl"
                            align="center"
                            marginBottom="16"
                            onBackground="neutral-weak"
                            wrap="balance"
                        >
                            Join thousands of users who have made email secure and simple again with AI-powered organization.
                        </Text>
                        <Button
                            data-border="rounded"
                            label="Get Started for Free"
                            href="/register"
                            variant="primary"
                            size="l"
                            arrowIcon
                        />
                    </Column>
                </Column>
            </Column>

            <Background mask={{ x: 50, y: 0, radius: 50 }} maxWidth="l" height="1">
                <Line background="neutral-alpha-medium" />
            </Background>

            <Footer />
        </Column>
        </Column>
    );
}
