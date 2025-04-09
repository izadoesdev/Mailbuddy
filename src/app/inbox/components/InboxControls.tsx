import React from "react";
import { Row, Text, Input, Icon, Switch, Button, Select, Tooltip } from "@/once-ui/components";

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
}: InboxControlsProps) {
    return (
        <>
            <Row
                fillWidth
                horizontal="space-between"
                vertical="center"
                paddingBottom="20"
                paddingX="16"
            >
                <Text variant="display-default-l" as="h1">
                    Inbox
                </Text>
                <Row gap="16" vertical="center">
                    <Input
                        id="search-emails"
                        label="Search emails"
                        labelAsPlaceholder
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        hasPrefix={<Icon name="search" size="s" />}
                    />
                    <Row gap="8" vertical="center">
                        <Text variant="body-default-s">Thread view</Text>
                        <Switch
                            id="thread-toggle"
                            isChecked={threadView}
                            onToggle={() => onThreadViewChange(!threadView)}
                        />
                    </Row>
                </Row>
            </Row>

            <Row paddingX="16" marginBottom="16" gap="8">
                <Button
                    label="Refresh"
                    prefixIcon="refresh"
                    variant="secondary"
                    onClick={onRefresh}
                    disabled={isLoading || isFetching}
                />

                {onSync && (
                    <Button
                        label="Sync with Gmail"
                        prefixIcon="cloud-download"
                        variant="secondary"
                        onClick={onSync}
                        disabled={isLoading || isFetching || isSyncing}
                        loading={isSyncing}
                    />
                )}

                <Button
                    label="Star Selected"
                    prefixIcon="star"
                    variant="secondary"
                    disabled={true}
                />
                <Select
                    id="page-size-select"
                    label={`${pageSize} per page`}
                    onChange={(value) => onPageSizeChange(Number(value))}
                    value={pageSize.toString()}
                    options={[
                        { value: "10", label: "10 per page" },
                        { value: "20", label: "20 per page" },
                        { value: "50", label: "50 per page" },
                    ]}
                />
            </Row>
        </>
    );
}
