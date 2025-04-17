import React from "react";
import {
  Heading,
  Text,
  Column,
  Row,
  Button,
  Icon,
} from "@/once-ui/components";

export default function CookiePolicy() {
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
          maxWidth="m"
          position="relative"
          radius="xl"
          horizontal="center"
          border="neutral-alpha-weak"
          background="overlay"
        >
          <Column paddingX="xl" gap="24" paddingY="64">
            <Heading variant="display-strong-xl" align="center">Cookie Policy</Heading>
            <Text variant="body-default-m" align="center" onBackground="neutral-medium" marginBottom="40">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>

            <Column gap="32" paddingY="24">
              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">1. Introduction</Heading>
                <Text variant="body-default-m">
                  This Cookie Policy explains how Mailbuddy ("we", "us", and "our") uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                </Text>
              </Column>

              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">2. What Are Cookies</Heading>
                <Text variant="body-default-m">
                  Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                </Text>
                <Text variant="body-default-m">
                  Cookies set by the website owner (in this case, Mailbuddy) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website.
                </Text>
              </Column>

              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">3. Our Cookie Usage</Heading>
                <Text variant="body-default-m">
                  At Mailbuddy, we are committed to your privacy. We use only essential authentication cookies that are strictly necessary for our website and services to function properly. We do not use any tracking or marketing cookies.
                </Text>
                <Column gap="8" paddingLeft="24">
                  <Row gap="12" vertical="start">
                    <Icon name="chevronRight" size="s" />
                    <Text variant="body-default-m">Essential authentication cookies: These cookies are necessary for you to login to your account and access our services securely.</Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="chevronRight" size="s" />
                    <Text variant="body-default-m">Session cookies: Help us remember your login state during your browser session.</Text>
                  </Row>
                </Column>
                <Text variant="body-default-m">
                  We do <Text as="span" variant="body-strong-m">not</Text> use any of the following:
                </Text>
                <Column gap="8" paddingLeft="24">
                  <Row gap="12" vertical="start">
                    <Icon name="cross" size="s" />
                    <Text variant="body-default-m">Performance/analytics cookies: We don't track how you use our website.</Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="cross" size="s" />
                    <Text variant="body-default-m">Marketing cookies: We don't use cookies to track you across websites or display targeted advertising.</Text>
                  </Row>
                  <Row gap="12" vertical="start">
                    <Icon name="cross" size="s" />
                    <Text variant="body-default-m">Third-party cookies: We don't allow third parties to place cookies on your device through our website.</Text>
                  </Row>
                </Column>
              </Column>

              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">4. Essential Authentication Cookies</Heading>
                <Text variant="body-default-m">
                  The essential cookies we use are strictly necessary to provide you with our services. They are used to maintain your authenticated session and ensure that your data remains secure while using Mailbuddy.
                </Text>
                <Column gap="16" paddingLeft="24">
                  <Column gap="8">
                    <Text variant="body-strong-m">Session Cookies</Text>
                    <Text variant="body-default-m">
                      These temporary cookies expire when you close your browser. They're used to keep you signed in during your session and to maintain security during your visit.
                    </Text>
                  </Column>
                  <Column gap="8">
                    <Text variant="body-strong-m">Authentication Cookies</Text>
                    <Text variant="body-default-m">
                      These cookies help us recognize you when you return to our website so you don't have to log in again. They're set with a longer expiration date but contain only encrypted identification tokens, never personal data.
                    </Text>
                  </Column>
                </Column>
              </Column>

              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">5. Our Privacy Commitment</Heading>
                <Text variant="body-default-m">
                  We are committed to protecting your privacy. Our minimalist cookie approach is part of our core privacy values. We don't track your browsing behavior, we don't build marketing profiles, and we don't sell or share your data with third parties.
                </Text>
                <Text variant="body-default-m">
                  All data processing, including the limited cookie usage, is done in accordance with our Privacy Policy and applicable data protection laws.
                </Text>
              </Column>

              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">6. How to Control Cookies</Heading>
                <Text variant="body-default-m">
                  While our essential cookies are necessary for the proper functioning of our service, you always have the right to control cookies through your browser settings. Most web browsers allow you to control cookies through their settings preferences.
                </Text>
                <Text variant="body-default-m">
                  However, please note that if you reject or disable essential cookies, you may not be able to use all features of our website, particularly those requiring authentication.
                </Text>
              </Column>

              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">7. Changes to This Cookie Policy</Heading>
                <Text variant="body-default-m">
                  We may update this Cookie Policy from time to time to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will always maintain our commitment to minimizing cookie usage to only what is essential for providing our services.
                </Text>
                <Text variant="body-default-m">
                  The date at the top of this Cookie Policy indicates when it was last updated.
                </Text>
              </Column>

              <Column gap="16">
                <Heading as="h2" variant="heading-strong-l">8. Contact Us</Heading>
                <Text variant="body-default-m">
                  If you have any questions about our use of cookies or other technologies, please email us at privacy@mailbuddy.dev.
                </Text>
              </Column>
            </Column>

            <Row horizontal="center" paddingY="48">
              <Button
                label="Back to Home"
                href="/"
                variant="secondary"
                prefixIcon="arrowLeft"
                color="neutral-alpha-strong"
              />
            </Row>
          </Column>
        </Column>
      </Column>
    </Row>
  );
} 