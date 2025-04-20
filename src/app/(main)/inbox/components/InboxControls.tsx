import {
    Avatar,
    Button,
    Column,
    Dropdown,
    DropdownWrapper,
    Flex,
    Icon,
    Input,
    Row,
    Scroller,
    Tag,
    Text,
    User,
    UserMenu,
} from "@/once-ui/components";
import React, { useState, useMemo } from "react";
import type { KeyboardEvent } from "react";

interface CategoryOption {
    value: string;
    label: string;
    badge?: string;
    color?: string;
    icon?: string;
}

interface InboxControlsProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    pageSize?: number;
    onPageSizeChange?: (value: number) => void;
    onRefresh: () => void;
    onSync?: () => void;
    isSyncing?: boolean;
    isLoading: boolean;
    isFetching?: boolean;
    // AI Search props
    onAISearch?: (query: string) => void;
    onClearAISearch?: () => void;
    isAISearchActive?: boolean;
    isAISearchLoading?: boolean;
    // Category selection
    currentCategory?: string;
    categoryOptions?: CategoryOption[];
    onCategoryChange?: (value: string) => void;
    // Compose new email
    onNewEmail?: () => void;
    // User data
    user?: { name?: string; email?: string; image?: string };
    onSignOut?: () => void;
}

export function InboxControls({
    searchQuery,
    onSearchChange,
    onRefresh,
    onSync,
    isSyncing = false,
    isLoading,
    isFetching = false,
    onAISearch,
    onClearAISearch,
    isAISearchActive = false,
    isAISearchLoading = false,
    currentCategory = "",
    categoryOptions = [],
    onCategoryChange,
    onNewEmail,
    pageSize,
    onPageSizeChange,
    user,
    onSignOut,
}: InboxControlsProps) {
    // Local search state to handle AI search button clicks
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    // Organize categories by type
    const { mainCategories, folderCategories, aiPriorityCategories, aiTopicCategories } =
        useMemo(() => {
            const main: CategoryOption[] = [];
            const folder: CategoryOption[] = [];
            const aiPriority: CategoryOption[] = [];
            const aiTopic: CategoryOption[] = [];

            for (const option of categoryOptions) {
                // System folders
                if (
                    ["inbox", "all", "sent", "drafts", "trash", "starred"].some((key) =>
                        option.value.includes(key),
                    )
                ) {
                    main.push(option);
                }
                // AI Priority Categories
                else if (option.value.startsWith("priority-")) {
                    aiPriority.push(option);
                }
                // AI Topic Categories
                else if (option.value.startsWith("topic-")) {
                    aiTopic.push(option);
                }
                // User created folders
                else {
                    folder.push(option);
                }
            }

            return {
                mainCategories: main,
                folderCategories: folder,
                aiPriorityCategories: aiPriority,
                aiTopicCategories: aiTopic,
            };
        }, [categoryOptions]);

    // Handle local search change without triggering parent search
    const handleSearchChange = (value: string) => {
        setLocalSearchQuery(value);

        // Don't call onSearchChange here anymore
        // Only clear AI search if active
        if (isAISearchActive && onClearAISearch) {
            onClearAISearch();
        }
    };

    // Handle search submission when Enter key is pressed
    const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSearchChange(localSearchQuery);
        }
    };

    // Handle AI search button click
    const handleAISearchClick = () => {
        if (onAISearch && localSearchQuery.trim()) {
            onAISearch(localSearchQuery);
        }
    };

    // Handle clear AI search
    const handleClearAISearch = () => {
        if (onClearAISearch) {
            onClearAISearch();
        }
    };

    // Handle category change
    const handleCategoryChange = (value: string) => {
        if (onCategoryChange) {
            onCategoryChange(value);
        }
    };

    // Handle sign out
    const handleSignOut = () => {
        if (onSignOut) {
            onSignOut();
        }
    };

    // Group AI priority categories (by urgency)
    const groupedPriorities = useMemo(() => {
        const urgent = aiPriorityCategories.filter((c) => c.value.includes("urgent"));
        const high = aiPriorityCategories.filter((c) => c.value.includes("high"));
        const medium = aiPriorityCategories.filter((c) => c.value.includes("medium"));
        const low = aiPriorityCategories.filter((c) => c.value.includes("low"));

        return { urgent, high, medium, low };
    }, [aiPriorityCategories]);

    // Group AI topic categories by type
    const groupedTopics = useMemo(() => {
        const workBusiness = aiTopicCategories.filter((c) =>
            ["work", "job", "financial", "legal", "invoices", "receipts"].some((key) =>
                c.value.includes(key),
            ),
        );

        const personalSocial = aiTopicCategories.filter((c) =>
            ["personal", "social", "healthcare"].some((key) => c.value.includes(key)),
        );

        const updatesMarketing = aiTopicCategories.filter((c) =>
            ["updates", "newsletters", "promotions", "marketing"].some((key) =>
                c.value.includes(key),
            ),
        );

        const eventsTravel = aiTopicCategories.filter((c) =>
            ["events", "scheduling", "travel", "shipping"].some((key) => c.value.includes(key)),
        );

        const other = aiTopicCategories.filter(
            (c) =>
                !workBusiness.includes(c) &&
                !personalSocial.includes(c) &&
                !updatesMarketing.includes(c) &&
                !eventsTravel.includes(c),
        );

        return {
            workBusiness,
            personalSocial,
            updatesMarketing,
            eventsTravel,
            other,
        };
    }, [aiTopicCategories]);

    // Get badge color based on the category option or default to neutral
    const getBadgeColor = (
        category: CategoryOption,
    ): "danger" | "warning" | "info" | "success" | "neutral" => {
        if (category.color === "red") return "danger";
        if (category.color === "orange" || category.color === "yellow") return "warning";
        if (category.color === "blue") return "info";
        if (category.color === "green") return "success";
        if (category.value.includes("urgent")) return "danger";
        if (category.value.includes("high")) return "warning";
        if (category.value.includes("medium")) return "info";
        if (category.value.includes("low")) return "success";
        return "neutral";
    };

    // Get current category label
    const getCurrentCategoryLabel = () => {
        const found = categoryOptions.find((cat) => cat.value === currentCategory);
        return found ? found.label : "Inbox";
    };

    // Choose dropdown icon based on category type
    const getCategoryIcon = (category: CategoryOption) => {
        if (category.icon) return category.icon;

        if (category.value.includes("inbox") || category.value.includes("all")) return "inbox";
        if (category.value.includes("sent")) return "send";
        if (category.value.includes("draft")) return "edit";
        if (category.value.includes("trash")) return "trash";
        if (category.value.includes("starred")) return "star";

        return "folder";
    };

    // Render dropdown item for a category
    const renderCategoryItem = (category: CategoryOption) => (
        <Flex
            key={category.value}
            data-value={category.value}
            padding="8"
            radius="m"
            gap="8"
            horizontal="space-between"
            fillWidth
            background={currentCategory === category.value ? "neutral-alpha-weak" : undefined}
            cursor="pointer"
            className="hover-background-neutral-alpha-weak"
            aria-selected={currentCategory === category.value}
            tabIndex={0}
            onClick={() => handleCategoryChange(category.value)}
        >
            <Row gap="8" vertical="center">
                <Icon name={getCategoryIcon(category)} size="s" />
                <Text variant="body-default-s">{category.label}</Text>
            </Row>
            {category.badge && (
                <Tag variant={getBadgeColor(category)} size="s" label={category.badge} />
            )}
        </Flex>
    );

    // Render category group
    const renderCategoryGroup = (categories: CategoryOption[]) => {
        if (categories.length === 0) return null;

        return (
            <Flex direction="column" gap="4" paddingTop="8">
                {/* <Text variant="body-strong-xs" paddingX="8" paddingBottom="4" onBackground="neutral-weak">{categories[0].label}</Text> */}
                {categories.map(renderCategoryItem)}
            </Flex>
        );
    };

    // Main folders dropdown content
    const mainFoldersDropdown = (
        <Flex direction="column" padding="8" gap="4" minWidth={16}>
            {mainCategories.map(renderCategoryItem)}
        </Flex>
    );

    // User folders dropdown content
    const userFoldersDropdown =
        folderCategories.length > 0 ? (
            <Flex direction="column" padding="8" gap="4" minWidth={16}>
                {folderCategories.map(renderCategoryItem)}
            </Flex>
        ) : null;

    // AI priorities dropdown content
    const prioritiesDropdown = (
        <Flex direction="column" padding="8" gap="4" minWidth={16}>
            {renderCategoryGroup(groupedPriorities.urgent)}
            {renderCategoryGroup(groupedPriorities.high)}
            {renderCategoryGroup(groupedPriorities.medium)}
            {renderCategoryGroup(groupedPriorities.low)}
        </Flex>
    );

    // AI topics dropdown content
    const topicsDropdown = (
        <Flex direction="column" padding="8" gap="4" minWidth={16}>
            {renderCategoryGroup(groupedTopics.workBusiness)}
            {renderCategoryGroup(groupedTopics.personalSocial)}
            {renderCategoryGroup(groupedTopics.updatesMarketing)}
            {renderCategoryGroup(groupedTopics.eventsTravel)}
            {renderCategoryGroup(groupedTopics.other)}
        </Flex>
    );

    // User dropdown menu content
    const userDropdownContent = (
        <Flex direction="column" padding="8" minWidth={12}>
            {user?.name && (
                <Flex
                    direction="column"
                    paddingBottom="12"
                    paddingTop="4"
                    paddingX="8"
                    gap="2"
                    borderBottom="neutral-alpha-medium"
                >
                    <Text variant="heading-strong-xs">{user.name}</Text>
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                        {user.email}
                    </Text>
                </Flex>
            )}
            <Flex direction="column" fillWidth paddingTop="8" gap="2">
                <Button
                    fillWidth
                    justifyContent="start"
                    weight="default"
                    variant="tertiary"
                    size="s"
                    label="Account Settings"
                    prefixIcon="settings"
                    href="/profile"
                />
                <Button
                    fillWidth
                    justifyContent="start"
                    weight="default"
                    variant="tertiary"
                    size="s"
                    label="Help & Support"
                    prefixIcon="helpCircle"
                    onClick={() => {
                        window.open("/support", "_blank");
                    }}
                />
                <Button
                    fillWidth
                    justifyContent="start"
                    weight="default"
                    variant="tertiary"
                    size="s"
                    label="Calendar"
                    prefixIcon="calendar"
                    href="/calendar"
                />
                <Button
                    fillWidth
                    justifyContent="start"
                    weight="default"
                    variant="tertiary"
                    size="s"
                    label="Sign Out"
                    prefixIcon="logout"
                    onClick={handleSignOut}
                />
            </Flex>
        </Flex>
    );

    return (
        <Column fillWidth>
            <Row
                fillWidth
                horizontal="space-between"
                vertical="center"
                paddingBottom="20"
                paddingX="16"
            >
                <Text variant="heading-strong-l">
                    {isAISearchActive ? "AI Search Results" : "Inbox"}
                </Text>
                <Row maxWidth={24} data-border="rounded">
                    <Input
                        id="search-emails"
                        label={isAISearchActive ? "Search with AI..." : "Search emails"}
                        labelAsPlaceholder
                        value={localSearchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        hasPrefix={<Icon name="search" size="s" />}
                        hasSuffix={
                            onAISearch &&
                            localSearchQuery.trim() && (
                                <Button
                                    size="s"
                                    weight="default"
                                    label={
                                        isAISearchLoading
                                            ? "Searching..."
                                            : isAISearchActive
                                              ? "AI Search Active"
                                              : "Find Similar"
                                    }
                                    prefixIcon="sparkles"
                                    variant={isAISearchActive ? "secondary" : "primary"}
                                    onClick={handleAISearchClick}
                                    disabled={!localSearchQuery.trim() || isAISearchLoading}
                                    loading={isAISearchLoading}
                                />
                            )
                        }
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

            <Row
                paddingX="8"
                paddingY="8"
                gap="24"
                data-border="rounded"
                background="neutral-alpha-weak"
                topRadius="m"
                borderTop="neutral-alpha-medium"
                borderLeft="neutral-alpha-medium"
                borderRight="neutral-alpha-medium"
            >
                {isAISearchActive && onClearAISearch ? (
                    <Row fillWidth horizontal="space-between" vertical="center">
                        <Button
                            label="Return to inbox"
                            prefixIcon="arrowLeft"
                            onClick={handleClearAISearch}
                        />
                        {isAISearchLoading ? (
                            <Text variant="body-default-s" onBackground="neutral-weak">
                                Searching...
                            </Text>
                        ) : (
                            <Text variant="body-default-s" onBackground="neutral-weak">
                                {localSearchQuery
                                    ? `AI searching for: "${localSearchQuery}"`
                                    : "AI search results"}
                            </Text>
                        )}
                    </Row>
                ) : (
                    <>
                        {onNewEmail && (
                            <Button
                                size="s"
                                label="Compose"
                                prefixIcon="plus"
                                onClick={onNewEmail}
                            />
                        )}

                        {/* Email Folders */}
                        <Flex fillWidth horizontal="center" gap="8">
                            <Row gap="8">
                                {/* Main folders dropdown */}
                                <DropdownWrapper
                                    trigger={
                                        <Button
                                            size="s"
                                            weight="default"
                                            label="Folders"
                                            prefixIcon="inbox"
                                            variant="secondary"
                                            suffixIcon="chevronDown"
                                        />
                                    }
                                    dropdown={mainFoldersDropdown}
                                    onSelect={handleCategoryChange}
                                    selectedOption={currentCategory}
                                    minWidth={18}
                                />

                                {/* User folders dropdown - only show if there are user folders */}
                                {userFoldersDropdown && folderCategories.length > 0 && (
                                    <DropdownWrapper
                                        trigger={
                                            <Button
                                                size="s"
                                                weight="default"
                                                label="My Folders"
                                                prefixIcon="folder"
                                                variant="secondary"
                                                suffixIcon="chevronDown"
                                            />
                                        }
                                        dropdown={userFoldersDropdown}
                                        onSelect={handleCategoryChange}
                                        selectedOption={currentCategory}
                                        minWidth={18}
                                    />
                                )}
                            </Row>

                            {/* AI Categories */}
                            {(aiPriorityCategories.length > 0 || aiTopicCategories.length > 0) && (
                                <Row gap="8">
                                    {/* AI Priority dropdown */}
                                    {aiPriorityCategories.length > 0 && (
                                        <DropdownWrapper
                                            trigger={
                                                <Button
                                                    size="s"
                                                    weight="default"
                                                    label="Priority"
                                                    prefixIcon="flag"
                                                    variant="secondary"
                                                    suffixIcon="chevronDown"
                                                />
                                            }
                                            dropdown={prioritiesDropdown}
                                            onSelect={handleCategoryChange}
                                            selectedOption={currentCategory}
                                            minWidth={18}
                                        />
                                    )}

                                    {/* AI Topics dropdown */}
                                    {aiTopicCategories.length > 0 && (
                                        <DropdownWrapper
                                            trigger={
                                                <Button
                                                    size="s"
                                                    weight="default"
                                                    label="Topics"
                                                    prefixIcon="sparkles"
                                                    variant="secondary"
                                                    suffixIcon="chevronDown"
                                                />
                                            }
                                            dropdown={topicsDropdown}
                                            onSelect={handleCategoryChange}
                                            selectedOption={currentCategory}
                                            minWidth={18}
                                        />
                                    )}
                                </Row>
                            )}
                        </Flex>

                        {onSync && (
                            <Button
                                size="s"
                                weight="default"
                                label="Sync"
                                prefixIcon="refresh"
                                variant="secondary"
                                onClick={() => {
                                    onSync();
                                    onRefresh();
                                }}
                                disabled={isLoading || isFetching || isSyncing}
                                loading={isSyncing}
                            />
                        )}
                    </>
                )}
            </Row>
        </Column>
    );
}
