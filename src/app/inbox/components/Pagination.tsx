import React from "react";
import { Row, Button, Text, Column } from "@/once-ui/components";

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
        <Column>
            <Row paddingY="16" gap="8" horizontal="center" wrap>
                <Button
                    variant="secondary"
                    label="Previous"
                    prefixIcon="arrowLeft"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1 || isLoading || isFetching}
                    aria-label="Previous page"
                />

                <Text variant="body-default-m" paddingX="8">
                    {isLoading ? "Loading..." : `Page ${page} of ${totalPages}`}
                </Text>

                <Button
                    variant="secondary"
                    label="Next"
                    suffixIcon="arrowRight"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages || isLoading || isFetching}
                    aria-label="Next page"
                />

                {totalPages > 3 && (
                    <select
                        value={page}
                        onChange={(e) => {
                            const value = Number.parseInt(e.target.value, 10);
                            if (!Number.isNaN(value) && value >= 1 && value <= totalPages) {
                                onPageChange(value);
                            }
                        }}
                        disabled={isLoading || isFetching}
                        style={{ 
                            minWidth: '120px',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginLeft: '8px'
                        }}
                        aria-label="Go to specific page"
                    >
                        {pageNumbers.map((num) => (
                            <option key={num} value={num}>
                                Page {num}
                            </option>
                        ))}
                    </select>
                )}
            </Row>

            {showCount && !isLoading && (
                <Row horizontal="center" paddingBottom="8">
                    <Text variant="body-default-s" color="text.subtle">
                        Showing {startItem} to {endItem}{" "}
                        {totalCount !== undefined && `of ${totalCount}`}
                    </Text>
                </Row>
            )}
        </Column>
    );
}
