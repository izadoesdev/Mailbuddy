import React, { useState } from "react";
import {
    Row,
    Text,
    Input,
    Icon,
    Button,
    Avatar,
    Scroller,
} from "@/once-ui/components";

interface CategoryOption {
    value: string;
    label: string;
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
    currentCategory = "inbox",
    categoryOptions = [],
    onCategoryChange,
    onNewEmail,
}: InboxControlsProps) {
    // Local search state to handle AI search button clicks
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    // Handle local search change and propagate to parent
    const handleSearchChange = (value: string) => {
        setLocalSearchQuery(value);
        onSearchChange(value);

        // If AI search is active and the user is typing a new search query,
        // automatically clear the AI search results
        if (isAISearchActive && onClearAISearch) {
            onClearAISearch();
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

    return (
        <>
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
                <Avatar />
            </Row>

            <Row paddingX="8" paddingY="8" gap="24" data-border="rounded" background="neutral-alpha-weak" topRadius="m" borderTop="neutral-alpha-medium" borderLeft="neutral-alpha-medium" borderRight="neutral-alpha-medium">
                {isAISearchActive && onClearAISearch ? (
                    <Button
                        label="Return to inbox"
                        prefixIcon="arrow-left"
                        onClick={handleClearAISearch}
                    />
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
        </>
    );
}
