import type React from "react";
import { Column, Text, Skeleton, Icon } from "@/once-ui/components";
import type { Email, Thread } from "../types";
import { EmailItem } from "./EmailItem";

interface EmailListProps {
    threads: Thread[];
    isLoading: boolean;
    selectedThreadId: string | null;
    selectedEmailId: string | null;
    searchQuery: string;
    onSelectThread: (thread: Thread) => void;
    onToggleStar: (thread: Thread, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EmailList({
    threads,
    isLoading,
    selectedThreadId,
    selectedEmailId,
    searchQuery,
    onSelectThread,
    onToggleStar,
}: EmailListProps) {
    // If loading, show skeletons
    if (isLoading) {
        return (
            <Column fill gap="1" border="neutral-alpha-medium" overflow="hidden" bottomRadius="m">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <Skeleton key={i} shape="block" style={{ height: "5rem" }} />
                ))}
            </Column>
        );
    }

    // If no threads, show empty state
    if (threads.length === 0) {
        return (
            <Column fill center padding="64" horizontal="center" vertical="center" gap="16" border="neutral-alpha-medium" bottomRadius="m">
                <Icon name="inbox" size="m" />
                <Text variant="heading-strong-m">Your inbox is empty</Text>
                {searchQuery && (
                    <Text variant="body-default-m" onBackground="neutral-weak">
                        Try adjusting your search query
                    </Text>
                )}
            </Column>
        );
    }

    // Render list of threads
    return (
        <Column fill overflow="hidden" bottomRadius="m" border="neutral-alpha-medium">
            <Column fill overflowY="auto">
                {threads.map((thread, index) => (
                    <Column fillWidth key={thread.threadId}>
                        <EmailItem
                            email={thread}
                            index={index}
                            isSelected={selectedThreadId === thread.threadId}
                            totalEmails={threads.length}
                            onSelect={(item) => onSelectThread(item as Thread)}
                            onToggleStar={(item, e) => onToggleStar(item as Thread, e)}
                        />
                    </Column>
                ))}
            </Column>
        </Column>
    );
}
