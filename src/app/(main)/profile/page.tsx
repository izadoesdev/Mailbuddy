"use client";

import { useUser } from "@/libs/auth/client";
import { Avatar, Button, Column, Heading, Icon, Row, Spinner, Text } from "@/once-ui/components";
import { useQueryState } from "nuqs";
import { Suspense } from "react";
import AISettings from "./components/AISettings";
import ConnectedAccounts from "./components/ConnectedAccounts";
import EmailSettings from "./components/EmailSettings";
import Preferences from "./components/Preferences";
import ProfileInfo from "./components/ProfileInfo";
import SecuritySettings from "./components/SecuritySettings";

// Profile category options
const PROFILE_CATEGORIES = [
    { value: "profile", label: "Profile", icon: "person" },
    { value: "email", label: "Notifications", icon: "mail" },
    { value: "ai", label: "AI Preferences", icon: "sparkles" },
    { value: "accounts", label: "Accounts", icon: "link" },
    { value: "security", label: "Security", icon: "shield" },
    { value: "preferences", label: "Preferences", icon: "preferences" },
];

function ProfileContent() {
    const { user, isLoading, error } = useUser();
    const [tab, setTab] = useQueryState("tab", {
        defaultValue: "profile",
        history: "push",
        parse: (value) => (PROFILE_CATEGORIES.some((c) => c.value === value) ? value : "profile"),
    });

    // If loading or error, show appropriate state
    if (isLoading) {
        return (
            <Column fillWidth fillHeight horizontal="center" vertical="center" gap="20">
                <Spinner size="l" />
            </Column>
        );
    }

    if (error || !user) {
        return (
            <Column fillWidth fillHeight horizontal="center" vertical="center" gap="20">
                <Icon name="errorCircle" size="l" color="danger" />
                <Text>Unable to load your profile. Please try again later.</Text>
                <Button
                    label="Refresh"
                    variant="primary"
                    onClick={() => window.location.reload()}
                />
            </Column>
        );
    }

    // Get the current category label
    const currentCategory = PROFILE_CATEGORIES.find((c) => c.value === tab);

    return (
        <Row fill padding="8">
            {/* Left sidebar */}
            <Column
                maxWidth={18}
                fillHeight
                radius="l"
                background="overlay"
                border="neutral-alpha-weak"
                paddingTop="32"
                paddingBottom="16"
                paddingX="16"
                gap="24"
            >
                <Column gap="16" horizontal="center" paddingX="16">
                    <Avatar src={user?.image || ""} size="l" />
                    <Column gap="4" horizontal="center">
                        <Heading variant="heading-strong-m">{user?.name || "Your Profile"}</Heading>
                        <Text
                            variant="body-default-s"
                            onBackground="neutral-weak"
                            style={{ textAlign: "center" }}
                        >
                            {user?.email}
                        </Text>
                    </Column>
                </Column>

                <Column gap="8" fill>
                    {PROFILE_CATEGORIES.map((category) => (
                        <Button
                            key={category.value}
                            label={category.label}
                            variant={tab === category.value ? "primary" : "tertiary"}
                            prefixIcon={category.icon}
                            fillWidth
                            onClick={() => setTab(category.value)}
                            justifyContent="start"
                        />
                    ))}
                </Column>

                <Button
                    label="Inbox"
                    prefixIcon="mail"
                    href="/inbox"
                    variant="secondary"
                    fillWidth
                />
            </Column>

            {/* Main content */}
            <Column fillWidth horizontal="center">
                <Column
                    fill
                    maxWidth="s"
                    overflowY="auto"
                    radius="xl"
                    border="neutral-alpha-medium"
                    background="overlay"
                >
                    <Row
                        vertical="center"
                        paddingX="20"
                        paddingY="16"
                        horizontal="space-between"
                        fillWidth
                        borderBottom="neutral-alpha-medium"
                    >
                        <Row vertical="center" gap="12">
                            <Icon name={currentCategory?.icon || "person"} size="m" />
                            <Heading variant="heading-strong-l">
                                {currentCategory?.label || "Profile"}
                            </Heading>
                        </Row>
                    </Row>

                    <Column gap="24" fill>
                        <Suspense fallback={<LoadingContent />}>
                            {tab === "profile" && <ProfileInfo user={user} />}

                            {tab === "email" && <EmailSettings user={user} />}

                            {tab === "ai" && <AISettings user={user} />}

                            {tab === "security" && <SecuritySettings user={user} />}

                            {tab === "accounts" && <ConnectedAccounts user={user} />}
                            {tab === "preferences" && <Preferences />}
                        </Suspense>
                    </Column>
                </Column>
            </Column>
        </Row>
    );
}

function LoadingContent() {
    return (
        <Column padding="l" gap="m" horizontal="center">
            <Spinner size="m" />
        </Column>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<LoadingContent />}>
            <ProfileContent />
        </Suspense>
    );
}
