import React, { useState, useMemo } from "react";
import type { KeyboardEvent } from "react";
import {
    Row,
    Text,
    Input,
    Icon,
    Button,
    Avatar,
    Scroller,
    Column,
    UserMenu,
    User,
    Flex,
} from "@/once-ui/components";

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
    const { aiCategories } = useMemo(() => {
        const ai: CategoryOption[] = [];

        for (const option of categoryOptions) {
            if (option.value.startsWith('priority-')) {
                ai.push(option);
            }
        }

        return { aiCategories: ai };
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
        if (e.key === 'Enter') {
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

    // Group AI categories into sections
    const groupedAiCategories = useMemo(() => {
        const workBusiness = aiCategories.filter(c => 
            ['work', 'job', 'financial', 'legal', 'invoices', 'receipts'].some(
                key => c.value.includes(key)
            )
        );
        
        const personalSocial = aiCategories.filter(c => 
            ['personal', 'social', 'healthcare'].some(
                key => c.value.includes(key)
            )
        );
        
        const updatesMarketing = aiCategories.filter(c => 
            ['updates', 'newsletters', 'promotions', 'marketing'].some(
                key => c.value.includes(key)
            )
        );
        
        const eventsTravel = aiCategories.filter(c => 
            ['events', 'scheduling', 'travel', 'shipping'].some(
                key => c.value.includes(key)
            )
        );
        
        const other = aiCategories.filter(c => 
            !workBusiness.includes(c) && 
            !personalSocial.includes(c) && 
            !updatesMarketing.includes(c) && 
            !eventsTravel.includes(c)
        );
        
        return {
            workBusiness,
            personalSocial,
            updatesMarketing,
            eventsTravel,
            other
        };
    }, [aiCategories]);

    // Get badge color based on the category option or default to neutral
    const getBadgeColor = (category: CategoryOption): string => {
        if (category.color) return category.color;
        if (category.value.includes('urgent')) return 'danger';
        if (category.value.includes('high')) return 'warning';
        if (category.value.includes('medium')) return 'info';
        if (category.value.includes('low')) return 'success';
        return 'neutral';
    };

    // User dropdown menu content
    const userDropdownContent = (
        <Flex direction="column" padding="8" minWidth={12}>
            {user?.name && (
                <Flex direction="column" padding="12" gap="4" borderBottom="neutral-alpha-medium">
                    <Text variant="heading-strong-s">{user.name}</Text>
                    <Text variant="body-default-s" onBackground="neutral-weak">{user.email}</Text>
                </Flex>
            )}
            <Flex direction="column" padding="8">
                <Button 
                    variant="tertiary"
                    label="Account Settings" 
                    prefixIcon="settings"
                    onClick={() => {
                        window.location.href = '/profile';
                    }}
                />
                <Button 
                    variant="tertiary"
                    label="Help & Support" 
                    prefixIcon="helpCircle"
                    onClick={() => {
                        window.open('/support', '_blank');
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
                        value: user?.name?.charAt(0) || "U"
                    }}
                    dropdown={userDropdownContent}
                />
            </Row>

            <Row paddingX="8" paddingY="8" gap="24" data-border="rounded" background="neutral-alpha-weak" topRadius="m" borderTop="neutral-alpha-medium" borderLeft="neutral-alpha-medium" borderRight="neutral-alpha-medium">
                {isAISearchActive && onClearAISearch ? (
                    <Row fillWidth horizontal="space-between" vertical="center">
                        <Button
                            label="Return to inbox"
                            prefixIcon="arrowLeft"
                            onClick={handleClearAISearch}
                        />
                        {isAISearchLoading ? (
                            <Text variant="body-default-s" onBackground="neutral-weak">Searching...</Text>
                        ) : (
                            <Text variant="body-default-s" onBackground="neutral-weak">
                                {localSearchQuery ? `AI searching for: "${localSearchQuery}"` : "AI search results"}
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

                        {/* Simple category buttons row */}
                        {categoryOptions.length > 0 && onCategoryChange && (
                            <Row fillWidth horizontal="center">
                            <Row maxWidth={40} horizontal="center" radius="full" overflow="hidden">
                                <Scroller fitWidth>
                                    <Row gap="4">
                                        {categoryOptions.map((option) => (
                                            <Button
                                                key={option.value}
                                                weight="default"
                                                onClick={() => handleCategoryChange(option.value)}
                                                variant={currentCategory === option.value ? "primary" : "secondary"}
                                                label={option.label}
                                                size="s"
                                            />
                                        ))}
                                    </Row>
                                </Scroller>
                            </Row>
                            </Row>
                        )}

                        
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
