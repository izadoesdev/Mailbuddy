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
  const startItem = ((page - 1) * pageSize) + 1;
  const endItem = Math.min(page * pageSize, totalCount || page * pageSize);
  const showCount = totalCount !== undefined;

  return (
    <Column>
      <Row paddingY="16" gap="8" horizontal="center">
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
      </Row>
      
      {showCount && !isLoading && (
        <Row horizontal="center" paddingBottom="8">
          <Text variant="body-default-s" color="text.subtle">
            Showing {startItem} to {endItem} {totalCount !== undefined && `of ${totalCount}`}
          </Text>
        </Row>
      )}
    </Column>
  );
} 