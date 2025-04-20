import { Button, Column, IconButton, Row, Select, Text } from "@/once-ui/components";
import React from "react";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
    isFetching: boolean;
    pageSize?: number;
    totalCount?: number;
    hasMore?: boolean;
}

export function Pagination({
    page,
    totalPages,
    onPageChange,
    isLoading,
    isFetching,
    pageSize = 20,
    totalCount,
    hasMore = false,
}: PaginationProps) {
    // Don't render pagination if there's only one page and no more items available
    if (totalPages <= 1 && !hasMore) {
        return null;
    }

    // Calculate current range of items being displayed
    const startItem = totalCount ? Math.min((page - 1) * pageSize + 1, totalCount) : 0;
    const endItem = totalCount ? Math.min(page * pageSize, totalCount) : 0;
    const showCount = totalCount !== undefined && totalCount > 0;

    // Generate page options for the dropdown (up to current page + 1 if hasMore)
    const maxPage = hasMore ? Math.max(totalPages, page + 1) : totalPages;
    const pageNumbers = Array.from({ length: maxPage }, (_, i) => i + 1);

    if (totalPages <= 1) {
        return null;
    }

    return (
        <Row fillWidth horizontal="space-between" vertical="center" paddingX="24" paddingTop="8">
            <Row gap="8" vertical="center">
                <IconButton
                    variant="secondary"
                    tooltip="Previous"
                    icon="chevronLeft"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1 || isLoading || isFetching}
                    aria-label="Previous page"
                />

                {maxPage > 3 && (
                    <Row width={4}>
                        <Select
                            height="s"
                            labelAsPlaceholder
                            id="page-select"
                            label="Go to page"
                            options={pageNumbers.map((num) => ({
                                value: num.toString(),
                                label: num.toString(),
                            }))}
                            value={page.toString()}
                            onSelect={(value) => {
                                const numValue = Number.parseInt(value, 10);
                                if (
                                    !Number.isNaN(numValue) &&
                                    numValue >= 1 &&
                                    numValue <= maxPage
                                ) {
                                    onPageChange(numValue);
                                }
                            }}
                            disabled={isLoading || isFetching}
                            aria-label="Go to specific page"
                        />
                    </Row>
                )}

                <IconButton
                    variant="secondary"
                    tooltip="Next"
                    icon="chevronRight"
                    onClick={() => onPageChange(page + 1)}
                    disabled={(page >= totalPages && !hasMore) || isLoading || isFetching}
                    aria-label="Next page"
                />
            </Row>

            {showCount && !isLoading && (
                <Row horizontal="center">
                    <Text variant="label-default-s" onBackground="neutral-weak">
                        {startItem}-{endItem} {totalCount !== undefined && `of ${totalCount}`}
                    </Text>
                </Row>
            )}
        </Row>
    );
}
