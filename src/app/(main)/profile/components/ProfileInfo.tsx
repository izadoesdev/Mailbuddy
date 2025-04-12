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
    email: user?.email || "",
    bio: user?.bio || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <form onSubmit={handleSubmit}>
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
            
            <Input
              label="Email Address"
              name="email"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled
            />
            
            <Textarea
              label="Bio"
              name="bio"
              id="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself"
              rows={4}
            />
          </Column>
          
          <Row horizontal="end" gap="16">
            <Button
              label="Cancel"
              variant="tertiary"
              onClick={() => setFormData({
                name: user?.name || "",
                email: user?.email || "",
                bio: user?.bio || "",
              })}
              type="button"
              disabled={isLoading}
            />
            <Button
              label="Save Changes"
              variant="primary"
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            />
          </Row>
        </Column>
      </Card>
    </form>
  );
} 