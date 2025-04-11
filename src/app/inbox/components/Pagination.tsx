import React from "react";
import { Row, Button, Text, Column, Select, IconButton } from "@/once-ui/components";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
    isFetching: boolean;
    pageSize?: number;
    totalCount?: number;
}

export function Pagination({
    page,
    totalPages,
    onPageChange,
    isLoading,
    isFetching,
    pageSize = 20,
    totalCount,
}: PaginationProps) {
    // Don't render pagination if there's only one page or less
    if (totalPages <= 1) {
        return null;
    }

    // Calculate current range of items being displayed
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalCount || page * pageSize);
    const showCount = totalCount !== undefined;

    // Generate page options for the dropdown
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

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
                
                {totalPages > 3 && (
                    <Row width={4}>
                    <Select
                        height="s"
                        labelAsPlaceholder
                        id="page-select"
                        label="Go to page"
                        options={pageNumbers.map((num) => ({
                            value: num.toString(),
                            label: num.toString()
                        }))}
                        value={page.toString()}
                        onSelect={(value) => {
                            const numValue = Number.parseInt(value, 10);
                            if (!Number.isNaN(numValue) && numValue >= 1 && numValue <= totalPages) {
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
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages || isLoading || isFetching}
                    aria-label="Next page"
                />
            </Row>

            {showCount && !isLoading && (
                <Row horizontal="center">
                    <Text variant="label-default-s" onBackground="neutral-weak">
                        {startItem}-{endItem}{" "}
                        {totalCount !== undefined && `of ${totalCount}`}
                    </Text>
                </Row>
            )}
        </Row>
    );
}
