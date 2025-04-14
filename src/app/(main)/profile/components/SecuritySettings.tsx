"use client";

import { useState } from "react";
import {
  Card,
  Column,
  Heading,
  Text,
  Button,
  Row,
  PasswordInput,
  Switch,
  useToast,
} from "@/once-ui/components";
import { authClient } from "@/libs/auth/client";

interface SecuritySettingsProps {
  user: any;
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled ?? false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle2FA = async () => {
    setIsLoading(true);
    
    try {
      // Mock API call to toggle 2FA
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIs2FAEnabled(!is2FAEnabled);
      addToast({
        variant: "success",
        message: is2FAEnabled 
          ? "Two-factor authentication disabled" 
          : "Two-factor authentication enabled",
      });
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
      addToast({
        variant: "danger",
        message: "Failed to update two-factor authentication. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast({
        variant: "danger",
        message: "New passwords don't match. Please try again.",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Mock API call to update password
      const response = await authClient.changePassword({
        newPassword: passwords.newPassword,
        currentPassword: passwords.currentPassword,
      });

      if (response.error) {
        addToast({
          variant: "danger",
          message: response.error.message || "Failed to update password. Please try again.",
        });
        return;
      }
      
      addToast({
        variant: "success",
        message: "Password updated successfully",
      });
      
      // Clear form
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Failed to update password:", error);
      addToast({
        variant: "danger",
        message: "Failed to update password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
        <Column gap="24" fillWidth>
          <Heading variant="heading-strong-s">Change Password</Heading>
          
          <form onSubmit={handleChangePassword}>
            <Column gap="16" fillWidth>
              <PasswordInput
                label="Current Password"
                name="currentPassword"
                id="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              
              <PasswordInput
                label="New Password"
                name="newPassword"
                id="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                required
              />
              
              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                id="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
              
              <Row horizontal="end">
                <Button
                  label="Update Password"
                  variant="primary"
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading || 
                    !passwords.currentPassword || 
                    !passwords.newPassword || 
                    !passwords.confirmPassword}
                />
              </Row>
            </Column>
          </form>
      
        <Column gap="24" fillWidth>
          <Heading variant="heading-strong-s">Two-Factor Authentication</Heading>
          
          <Column gap="16" fillWidth>
            <Row gap="8" vertical="center" horizontal="space-between">
              <Column gap="4">
                <Text variant="body-strong-m">Enable Two-Factor Authentication</Text>
                <Text variant="body-default-s" onBackground="neutral-medium">
                  Add an extra layer of security to your account by requiring both your password and authentication code.
                </Text>
              </Column>
              <Switch 
                isChecked={is2FAEnabled}
                onToggle={handleToggle2FA}
                id="two-factor-auth"
                disabled={isLoading}
              />
            </Row>
          </Column>
        </Column>
    </Column>
  );
} 