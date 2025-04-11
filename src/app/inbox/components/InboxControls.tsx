import React, { useState } from "react";
import {
    Row,
    Text,
    Input,
    Icon,
    Switch,
    Button,
    Select,
    Tooltip,
    IconButton,
    DropdownWrapper,
    Dropdown,
    Option,
    Column,
    Avatar,
} from "@/once-ui/components";

interface InboxControlsProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    threadView: boolean;
    onThreadViewChange: (value: boolean) => void;
    pageSize: number;
    onPageSizeChange: (value: number) => void;
    onRefresh: () => void;
    onSync?: () => void;
    isSyncing?: boolean;
    isLoading: boolean;
    isFetching: boolean;
    // AI Search props
    onAISearch?: (query: string) => void;
    onClearAISearch?: () => void;
    isAISearchActive?: boolean;
    isAISearchLoading?: boolean;
}

export function InboxControls({
    searchQuery,
    onSearchChange,
    threadView,
    onThreadViewChange,
    pageSize,
    onPageSizeChange,
    onRefresh,
    onSync,
    isSyncing = false,
    isLoading,
    isFetching,
    onAISearch,
    onClearAISearch,
    isAISearchActive = false,
    isAISearchLoading = false,
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
                <Row maxWidth={24}>
                    <Input
                        data-border="rounded"
                        id="search-emails"
                        label={isAISearchActive ? "Type to search with AI..." : "Search emails"}
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

            <Row paddingX="16" marginBottom="16" gap="8">
                {isAISearchActive && onClearAISearch ? (
                    <Button
                        label="Return to inbox"
                        prefixIcon="arrow-left"
                        onClick={handleClearAISearch}
                    />
                ) : (
                    <>
                        {onSync && (
                            <Button
                                size="s"
                                weight="default"
                                label="Gmail sync"
                                prefixIcon="cloud"
                                variant="secondary"
                                onClick={onSync}
                                disabled={isLoading || isFetching || isSyncing}
                                loading={isSyncing}
                            />
                        )}

                        <IconButton
                            size="m"
                            tooltip="Star selected"
                            icon="star"
                            variant="secondary"
                            disabled={true}
                        />
                    </>
                )}

                <Row gap="8" fillWidth horizontal="end">
                    <IconButton
                        size="m"
                        icon="refresh"
                        tooltip="Refresh"
                        variant="secondary"
                        onClick={onRefresh}
                        disabled={isLoading || isFetching}
                    />
                </Row>
            </Row>
        </>
    );
}
