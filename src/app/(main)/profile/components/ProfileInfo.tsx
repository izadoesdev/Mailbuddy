"use client";

import { useState } from "react";
import {
  Card,
  Column,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  Row,
  useToast,
} from "@/once-ui/components";
import { authClient } from "@/libs/auth/client";

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

  return (
    <Card padding="l">
      <Column gap="24" fillWidth>
        <Heading variant="heading-strong-s">Personal Information</Heading>
        
        <Column gap="16" fillWidth>
          <Input
            label="Full Name"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
          
          <Row gap="12" vertical="center">
            <Text variant="body-strong-m">Email Address</Text>
            <Text variant="body-default-m">{user?.email || ""}</Text>
          </Row>
        </Column>
        
        <Row horizontal="end" gap="16">
          <Button
            label="Cancel"
            variant="tertiary"
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
    </Card>
  );
} 