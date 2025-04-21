import {
    Button,
    Column,
    Flex,
    Heading,
    Icon,
    Input,
    Row,
    Scroller,
    Select,
    Tag,
    Text,
    UserMenu,
} from "@/once-ui/components";
import type React from "react";
import { useEffect, useState } from "react";
import type { ContactsQueryParams } from "../types";

const SORT_OPTIONS = [
    { label: "Name", value: "name" },
    { label: "Email Count", value: "emailCount" },
    { label: "Most Recent", value: "latestEmailDate" },
    { label: "Priority", value: "priority" },
];

interface Category {
    value: string;
    label: string;
    badge?: string;
    color?: string;
    icon?: string;
}

export interface ContactFiltersProps {
    params: ContactsQueryParams;
    onChangeParams: (newParams: ContactsQueryParams) => void;
    disabled?: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    currentCategory: string;
    categoryOptions: Category[];
    onCategoryChange: (category: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    user?: { name?: string; email?: string; image?: string };
    onSignOut?: () => void;
}

export function ContactFilters({
    params,
    onChangeParams,
    disabled = false,
    searchQuery,
    onSearchChange,
    currentCategory,
    categoryOptions,
    onCategoryChange,
    onRefresh,
    isRefreshing,
    user,
    onSignOut,
}: ContactFiltersProps) {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    // Sync local search query with prop
    useEffect(() => {
        setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    const updateParams = (updates: Partial<ContactsQueryParams>) => {
        if (disabled) return;
        onChangeParams({ ...params, ...updates, page: 1 }); // Reset to page 1 when filters change
    };

    const handleSearchChange = (value: string) => {
        setLocalSearchQuery(value);
        onSearchChange(value);
    };

    const handleSortChange = (value: string) => {
        if (disabled) return;

        if (
            value === "name" ||
            value === "emailCount" ||
            value === "latestEmailDate" ||
            value === "priority"
        ) {
            updateParams({ sortBy: value });
        }
    };

    const handleCategoryChange = (value: string) => {
        if (onCategoryChange) {
            onCategoryChange(value);
        }
    };

    const handleSignOut = () => {
        if (onSignOut) {
            onSignOut();
        }
    };

    // User dropdown menu content
    const userDropdownContent = (
        <Flex direction="column" padding="8" minWidth={12}>
            {user?.name && (
                <Flex direction="column" padding="12" gap="4" borderBottom="neutral-alpha-medium">
                    <Text variant="heading-strong-s">{user.name}</Text>
                    <Text variant="body-default-s" onBackground="neutral-weak">
                        {user.email}
                    </Text>
                </Flex>
            )}
            <Flex direction="column" padding="8">
                <Button
                    variant="tertiary"
                    label="Account Settings"
                    prefixIcon="settings"
                    onClick={() => {
                        window.location.href = "/profile";
                    }}
                />
                <Button
                    variant="tertiary"
                    label="Help & Support"
                    prefixIcon="helpCircle"
                    onClick={() => {
                        window.open("/support", "_blank");
                    }}
                />
                <Button
                    variant="tertiary"
                    label="Sign Out"
                    prefixIcon="logout"
                    onClick={handleSignOut}
                />
            </Flex>
        </Flex>
    );

    return (
        <Column fillWidth gap="16">
            {/* Top row with heading, search, and user controls */}
            <Row
                fillWidth
                horizontal="space-between"
                vertical="center"
                paddingBottom="20"
                paddingX="16"
            >
                <Text variant="heading-strong-l">Contacts</Text>

                <Row style={{ width: "40%", maxWidth: "600px" }} data-border="rounded">
                    <Input
                        id="search-contacts"
                        label="Search contacts..."
                        labelAsPlaceholder
                        value={localSearchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        hasPrefix={<Icon name="search" size="s" />}
                        style={{ width: "100%" }}
                    />
                </Row>

                <UserMenu
                    name={user?.name || "User"}
                    subline={user?.email || "user@example.com"}
                    avatarProps={{
                        src: user?.image,
                        value: user?.name?.charAt(0) || "U",
                    }}
                    dropdown={userDropdownContent}
                />
            </Row>

            {/* Bottom row with category buttons */}
            <Row
                paddingX="8"
                paddingY="8"
                gap="16"
                fillWidth
                data-border="rounded"
                background="neutral-alpha-weak"
                topRadius="m"
                borderTop="neutral-alpha-medium"
                borderLeft="neutral-alpha-medium"
                borderRight="neutral-alpha-medium"
                horizontal="space-between"
                vertical="center"
                style={{
                    minHeight: "56px",
                }}
            >
                <Row gap="16">
                    <Button
                        size="s"
                        label="New Contact"
                        prefixIcon="plus"
                        onClick={() => {}} // TODO: Implement new contact functionality
                    />
                </Row>

                {/* Category buttons row */}
                {categoryOptions.length > 0 && (
                    <Row fillWidth horizontal="center" style={{ flex: 1 }}>
                        <Row
                            style={{
                                width: "100%",
                                maxWidth: "800px",
                            }}
                            horizontal="center"
                            radius="full"
                            overflow="hidden"
                            shadow="m"
                        >
                            <Scroller
                                style={{
                                    width: "100%",
                                    paddingTop: "4px",
                                    paddingBottom: "4px",
                                    paddingLeft: "4px",
                                    paddingRight: "4px",
                                    background: "var(--neutral-alpha-weak)",
                                    borderRadius: "var(--radius-full)",
                                    border: "1px solid var(--neutral-alpha-medium)",
                                }}
                            >
                                <Row
                                    gap="4"
                                    style={{
                                        display: "inline-flex",
                                        flexWrap: "nowrap",
                                        width: "max-content",
                                        margin: "0 auto",
                                    }}
                                >
                                    {categoryOptions.map((option) => (
                                        <Button
                                            key={option.value}
                                            weight="default"
                                            onClick={() => handleCategoryChange(option.value)}
                                            variant={
                                                currentCategory === option.value
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                            label={option.label}
                                            size="s"
                                            style={{
                                                whiteSpace: "nowrap",
                                                flex: "0 0 auto",
                                                minWidth: "unset",
                                            }}
                                        />
                                    ))}
                                </Row>
                            </Scroller>
                        </Row>
                    </Row>
                )}

                <Row gap="8" vertical="center">
                    {/* Sort dropdown */}
                    <Select
                        id="sort-select"
                        label="Sort by"
                        labelAsPlaceholder
                        options={SORT_OPTIONS}
                        value={params.sortBy || "name"}
                        onSelect={handleSortChange}
                        disabled={disabled}
                        style={{ minWidth: "120px" }}
                    />

                    <Button
                        size="s"
                        weight="default"
                        label="Refresh"
                        prefixIcon="refresh"
                        variant="secondary"
                        onClick={onRefresh}
                        disabled={disabled || isRefreshing}
                        loading={isRefreshing}
                    />
                </Row>
            </Row>
        </Column>
    );
}
