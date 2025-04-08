import React from "react";
import { Row, Button, Text } from "@/once-ui/components";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isFetching: boolean;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  isLoading,
  isFetching,
}: PaginationProps) {
  if (isLoading || totalPages <= 1) {
    return null;
  }

  return (
    <Row paddingY="16" gap="8" horizontal="center">
      <Button
        variant="secondary"
        label="Previous"
        prefixIcon="arrowLeft"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || isLoading || isFetching}
      />
      
      <Text variant="body-default-m" paddingX="8">
        Page {page} of {totalPages}
      </Text>
      
      <Button
        variant="secondary"
        label="Next"
        suffixIcon="arrowRight"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || isLoading || isFetching}
      />
    </Row>
  );
} 