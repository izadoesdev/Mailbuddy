"use client";

import { authClient } from "@/libs/auth/client";
import {
    Button,
    Card,
    Column,
    Heading,
    Input,
    Kbd,
    OTPInput,
    Row,
    SmartImage,
    Text,
    useToast,
} from "@/once-ui/components";
import { useState } from "react";

interface ProfileInfoProps {
    user: any;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        bio: user?.bio || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            // Update profile information
            const updatedUser = await authClient.updateUser({
                ...formData,
            });

            addToast({
                variant: "success",
                message: "Profile updated successfully",
            });
        } catch (error) {
            console.error("Failed to update profile:", error);
            addToast({
                variant: "danger",
                message: "Failed to update profile. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: user?.name || "",
            bio: user?.bio || "",
        });
    };

    const handleTwoFactor = async (password: string) => {
        const { data } = await authClient.twoFactor.enable({ password });
        if (!data) {
            return { error: "Failed to enable two-factor authentication" };
        }
        const { totpURI, backupCodes } = data;
        return { totpURI, backupCodes };
    };

    const handleVerifyTwoFactor = async (code: string) => {
        const { data } = await authClient.twoFactor.verifyTotp({ code });
        if (!data) {
            return { error: "Failed to verify two-factor authentication" };
        }
        return data;
    };

    return (
        <Column gap="24" fill>
            <Column gap="16" padding="24" fill>
                <Input
                    label="Full Name"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <Input
                    label="Email Address"
                    name="email"
                    id="email"
                    disabled
                    value={user?.email || ""}
                    description="You can't update your email address"
                />
            </Column>

            <Row
                horizontal="end"
                gap="8"
                paddingX="20"
                paddingY="12"
                borderTop="neutral-alpha-medium"
                data-border="rounded"
            >
                <Button
                    label="Cancel"
                    variant="secondary"
                    onClick={handleReset}
                    type="button"
                    disabled={isLoading}
                />
                <Button
                    label="Save Changes"
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading}
                />
            </Row>
        </Column>
    );
}
