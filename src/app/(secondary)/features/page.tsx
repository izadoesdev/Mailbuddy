import React from "react";
import {
  Heading,
  Text,
  Column,
  Row,
  Background,
  Icon,
  Card,
  Button,
} from "@/once-ui/components";

export default function Features() {
  return (
    <Row fill padding="8" gap="8" horizontal="center">
      <Column
        gap="-1"
        fillWidth
        horizontal="center"
        maxWidth="l"
      >
        {/* Main content */}
        <Column
          as="main"
          maxWidth="l"
          position="relative"
          radius="xl"
          horizontal="center"
          border="neutral-alpha-weak"
          fillWidth
          background="overlay"
        >
          <Column paddingX="32" gap="24" paddingY="64">
            <Heading variant="display-strong-xl" align="center">Powerful Features</Heading>
            <Text variant="body-default-m" align="center" onBackground="neutral-medium" marginBottom="40">
              Transform your email experience with intelligent tools
            </Text>

            <Column gap="32" paddingY="24">
              {/* Introduction */}
              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">Smarter Email Management</Heading>
                <Text variant="body-default-m">
                  Mailbuddy was built to help you regain control of your inbox. Our AI-powered platform understands the context of your emails, intelligently organizes them, and helps you focus on what truly matters, saving you hours each week.
                </Text>
              </Column>

              {/* AI Features */}
              <Column gap="24" position="relative">
                <Heading as="h2" variant="heading-strong-l">AI-Powered Assistance</Heading>
                
                <Card padding="24" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                  <Column gap="24">
                    <Row gap="16" vertical="center">
                      <Icon name="sparkles" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Smart Reply Generation</Heading>
                        <Text variant="body-default-m">
                          Generate contextually appropriate responses to emails with a single click. Our AI understands the tone and content of messages to create natural, personalized replies.
                        </Text>
                      </Column>
                    </Row>
                    
                    <Row gap="16" vertical="center">
                      <Icon name="edit" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Email Enhancement</Heading>
                        <Text variant="body-default-m">
                          Improve your writing with different style options: make your emails more formal, friendly, shorter, or enhanced with a single click while maintaining your authentic voice.
                        </Text>
                      </Column>
                    </Row>
                    
                    <Row gap="16" vertical="center">
                      <Icon name="stack" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Content Summarization</Heading>
                        <Text variant="body-default-m">
                          Get the key points from long email threads instantly. Our AI extracts important information, action items, and deadlines so you never miss critical details.
                        </Text>
                      </Column>
                    </Row>
                  </Column>
                </Card>
              </Column>

              {/* Organization Features */}
              <Column gap="16" position="relative">
                <Heading as="h2" variant="heading-strong-l">Intelligent Organization</Heading>
                <Column gap="8" paddingLeft="24">
                  <Row gap="12" vertical="start">
                    <Icon name="inbox" size="s" />
                    <Text variant="body-default-m">
                      <Text as="span" variant="body-strong-m">AI Categorization:</Text> Automatically sorts emails into relevant categories like Work, Personal, Financial, and more.
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="fire" size="s" />
                    <Text variant="body-default-m">
                      <Text as="span" variant="body-strong-m">Priority Inbox:</Text> Smart recognition of urgent emails that need your immediate attention, ensuring you never miss important messages.
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="chat" size="s" />
                    <Text variant="body-default-m">
                      <Text as="span" variant="body-strong-m">Smart Threading:</Text> Keep conversations organized with intelligent email threading, making it easy to follow complex discussions.
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="search" size="s" />
                    <Text variant="body-default-m">
                      <Text as="span" variant="body-strong-m">Advanced Search:</Text> Find any email in seconds with powerful search capabilities that understand what you're looking for, even with vague queries.
                    </Text>
                  </Row>
                </Column>
              </Column>

              {/* Productivity Features */}
              <Column gap="16" position="relative">
                <Heading as="h2" variant="heading-strong-l">Productivity Tools</Heading>
                <Text variant="body-default-m">
                  Streamline your workflow and save time on email management with our powerful productivity features:
                </Text>
                <Column gap="24" paddingY="16">
                  <Card padding="20" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                    <Row gap="16" vertical="center">
                      <Icon name="template" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Email Templates</Heading>
                        <Text variant="body-default-m">
                          Create and save templates for common responses, making it faster to reply to frequent inquiries. Personalize templates on the fly with dynamic fields.
                        </Text>
                      </Column>
                    </Row>
                  </Card>
                  
                  <Card padding="20" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                    <Row gap="16" vertical="center">
                      <Icon name="clock" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Scheduled Sending</Heading>
                        <Text variant="body-default-m">
                          Compose emails now and schedule them to be sent at the optimal time. Perfect for reaching recipients during their working hours or when they're most likely to read your message.
                        </Text>
                      </Column>
                    </Row>
                  </Card>
                  
                  <Card padding="20" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                    <Row gap="16" vertical="center">
                      <Icon name="bell" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Follow-up Reminders</Heading>
                        <Text variant="body-default-m">
                          Never forget to reply to important emails or follow up when you haven't received a response. Set smart reminders that adapt to your communication patterns.
                        </Text>
                      </Column>
                    </Row>
                  </Card>
                </Column>
              </Column>

              {/* Security Features */}
              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">Security & Privacy</Heading>
                <Text variant="body-default-m">
                  Your data security is our priority with robust protection features:
                </Text>
                <Column gap="8" paddingLeft="24">
                  <Row gap="12" vertical="start">
                    <Icon name="shield" size="s" />
                    <Text variant="body-default-m">
                      End-to-end encryption for all your emails
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="shield" size="s" />
                    <Text variant="body-default-m">
                      AI detection of suspicious emails and security threats
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="shield" size="s" />
                    <Text variant="body-default-m">
                      Granular privacy controls for AI processing
                    </Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="shield" size="s" />
                    <Text variant="body-default-m">
                      Regular security audits and updates
                    </Text>
                  </Row>
                </Column>
              </Column>

              {/* Integration Features */}
              <Column gap="16" position="relative">
                <Heading as="h2" variant="heading-strong-l">Seamless Integration</Heading>
                <Text variant="body-default-m">
                  Works with the tools you already use to maximize productivity:
                </Text>
                <Column gap="12" paddingY="16">
                  <Row gap="16" vertical="center">
                    <Icon name="mail" size="m" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Perfect integration with Gmail and other major email providers
                    </Text>
                  </Row>
                  <Row gap="16" vertical="center">
                    <Icon name="calendar" size="m" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Calendar sync to schedule meetings directly from emails
                    </Text>
                  </Row>
                  <Row gap="16" vertical="center">
                    <Icon name="userCircle" size="m" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Manage multiple email accounts in one unified interface
                    </Text>
                  </Row>
                  <Row gap="16" vertical="center">
                    <Icon name="paperclip" size="m" onBackground="brand-strong" />
                    <Text variant="body-default-m">
                      Seamless cloud storage integration for attachments
                    </Text>
                  </Row>
                </Column>
              </Column>

              {/* Analytics Features */}
              <Column gap="16" position="relative">
                <Heading as="h2" variant="heading-strong-l">Advanced Analytics</Heading>
                <Text variant="body-default-m">
                  Gain insights into your email habits and communication patterns:
                </Text>
                <Column gap="24" paddingY="16">
                  <Card padding="20" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                    <Row gap="16" vertical="center">
                      <Icon name="chart" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Email Analytics</Heading>
                        <Text variant="body-default-m">
                          Track response times, volume trends, and productivity metrics to understand your email usage patterns and identify opportunities for improvement.
                        </Text>
                      </Column>
                    </Row>
                  </Card>
                  
                  <Card padding="20" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                    <Row gap="16" vertical="center">
                      <Icon name="network" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Network Analysis</Heading>
                        <Text variant="body-default-m">
                          Visualize your communication network and key contacts to understand your most important relationships and prioritize effectively.
                        </Text>
                      </Column>
                    </Row>
                  </Card>
                  
                  <Card padding="20" border="neutral-alpha-medium" radius="l" background="neutral-alpha-weak">
                    <Row gap="16" vertical="center">
                      <Icon name="document" size="l" onBackground="brand-strong" />
                      <Column gap="8">
                        <Heading as="h3" variant="heading-strong-m">Productivity Reports</Heading>
                        <Text variant="body-default-m">
                          Receive weekly reports on email productivity and time saved, helping you quantify the benefits and continuously optimize your workflow.
                        </Text>
                      </Column>
                    </Row>
                  </Card>
                </Column>
              </Column>

              {/* CTA section */}
              <Column gap="24" paddingY="32" horizontal="center" position="relative">
                <Background
                  position="absolute"
                  mask={{
                    x: 50,
                    y: 50,
                    radius: 50,
                  }}
                  grid={{
                    display: true,
                    color: "brand-alpha-weak",
                    width: "8",
                    height: "8",
                    opacity: 30,
                  }}
                />
                <Heading as="h2" variant="heading-strong-xl" align="center">
                  Ready to transform your inbox?
                </Heading>
                <Column maxWidth={48} horizontal="center">
                  <Text variant="body-default-l" align="center" onBackground="neutral-medium" marginBottom="8">
                    Join Mailbuddy today and experience a smarter, more productive email workflow.
                  </Text>
                </Column>
                <Row gap="16" horizontal="center" paddingTop="8">
                    <Button
                        prefixIcon="sparkles"
                        href="/register"
                    >
                        Get Started For Free
                    </Button>
                    <Button
                        prefixIcon="sparkles"
                        href="/pricing"
                        variant="secondary"
                    >
                        View Pricing
                    </Button>
                </Row>
              </Column>
            </Column>
          </Column>
        </Column>
      </Column>
    </Row>
  );
} 