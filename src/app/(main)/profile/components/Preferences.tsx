"use client";

import { Column, StylePanel } from "@/once-ui/components";

export default function Preferences() {
    return (
        <Column gap="24" fill>
            <Column gap="16" padding="24" fill>
                <StylePanel paddingBottom="24" />
            </Column>
        </Column>
    );
}
