"use client";

import { authClient } from "@/libs/auth/client";
import {
    Button,
    Card,
    Column,
    Dialog,
    Heading,
    Input,
    Kbd,
    OTPInput,
    PasswordInput,
    Row,
    Switch,
    Text,
    useToast,
} from "@/once-ui/components";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearAllEmails } from "../actions";

interface SecuritySettingsProps {
    user: any;
}

interface TwoFactorData {
    totpURI?: string;
    backupCodes?: string[];
    error?: string;
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
    const { addToast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled ?? false);
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [show2FADialog, setShow2FADialog] = useState(false);
    const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
    const [disable2FAPassword, setDisable2FAPassword] = useState("");
    const [twoFactorStep, setTwoFactorStep] = useState<"setup" | "verify" | "backup">("setup");
    const [twoFactorPassword, setTwoFactorPassword] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [twoFactorData, setTwoFactorData] = useState<TwoFactorData>({});
    const [isCopied, setIsCopied] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const backupCodesRef = useRef<HTMLPreElement>(null);

    // Add state for account deletion and purge
    const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
    const [showPurgeEmailsDialog, setShowPurgeEmailsDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [purgePassword, setPurgePassword] = useState("");

    // Generate QR code when totpURI is available
    useEffect(() => {
        if (twoFactorData.totpURI) {
            generateQRCode(twoFactorData.totpURI);
        }
    }, [twoFactorData.totpURI]);

    const generateQRCode = async (totpURI: string) => {
        try {
            // Dynamically import QRCode library only when needed
            const QRCode = (await import("qrcode")).default;
            const dataUrl = await QRCode.toDataURL(totpURI, {
                width: 200,
                margin: 1,
                color: {
                    dark: "#000",
                    light: "#fff",
                },
            });
            setQrCodeDataUrl(dataUrl);
        } catch (error) {
            console.error("Failed to generate QR code:", error);
            addToast({
                variant: "danger",
                message: "Failed to generate QR code",
            });
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleToggle2FA = async () => {
        if (is2FAEnabled) {
            // Show dialog to confirm disabling 2FA
            setShowDisable2FADialog(true);
        } else {
            // Start 2FA setup flow
            setShow2FADialog(true);
            setTwoFactorStep("setup");
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            addToast({
                variant: "danger",
                message: "Password is required to delete account",
            });
            return;
        }

        setIsLoading(true);
        try {
            await authClient.deleteUser({ password: deletePassword });
            addToast({
                variant: "success",
                message: "Account deleted successfully",
            });
            router.push("/login");
        } catch (error) {
            console.error("Failed to delete account:", error);
            addToast({
                variant: "danger",
                message: "Failed to delete account. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    const handleDisable2FA = async () => {
        if (!disable2FAPassword) {
            addToast({
                variant: "danger",
                message: "Password is required to disable two-factor authentication",
            });
            return;
        }

        setIsLoading(true);
        try {
            await authClient.twoFactor.disable({ password: disable2FAPassword });
            setIs2FAEnabled(false);
            setShowDisable2FADialog(false);
            setDisable2FAPassword("");

            addToast({
                variant: "success",
                message: "Two-factor authentication disabled",
            });
        } catch (error) {
            console.error("Failed to disable 2FA:", error);
            addToast({
                variant: "danger",
                message:
                    "Failed to disable two-factor authentication. Please check your password and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const cancelDisable2FA = () => {
        setShowDisable2FADialog(false);
        setDisable2FAPassword("");
    };

    const handleSetupTwoFactor = async () => {
        setIsLoading(true);
        try {
            const result = await handleTwoFactor(twoFactorPassword);
            if (result.error) {
                addToast({
                    variant: "danger",
                    message: result.error,
                });
                return;
            }

            setTwoFactorData({
                totpURI: result.totpURI,
                backupCodes: result.backupCodes,
            });
            setTwoFactorStep("verify");
        } catch (error) {
            console.error("Failed to setup 2FA:", error);
            addToast({
                variant: "danger",
                message: "Failed to set up two-factor authentication. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyTwoFactorSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await handleVerifyTwoFactor(otpCode);
            if (result.error) {
                addToast({
                    variant: "danger",
                    message: result.error,
                });
                return;
            }

            setTwoFactorStep("backup");
        } catch (error) {
            console.error("Failed to verify 2FA:", error);
            addToast({
                variant: "danger",
                message: "Failed to verify two-factor authentication. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTwoFactor = async (password: string): Promise<TwoFactorData> => {
        try {
            const { data } = await authClient.twoFactor.enable({ password });
            if (!data) {
                return { error: "Failed to enable two-factor authentication" };
            }
            const { totpURI, backupCodes } = data;
            return { totpURI, backupCodes };
        } catch (error) {
            console.error("Failed to enable 2FA:", error);
            return { error: "Failed to enable two-factor authentication" };
        }
    };

    const handleVerifyTwoFactor = async (code: string): Promise<TwoFactorData> => {
        try {
            const { data } = await authClient.twoFactor.verifyTotp({ code });
            if (!data) {
                return { error: "Failed to verify two-factor authentication" };
            }
            return data as TwoFactorData;
        } catch (error) {
            console.error("Failed to verify 2FA:", error);
            return { error: "Failed to verify two-factor authentication" };
        }
    };

    const copyBackupCodes = () => {
        if (twoFactorData.backupCodes) {
            navigator.clipboard
                .writeText(twoFactorData.backupCodes.join("\n"))
                .then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                })
                .catch((err) => {
                    console.error("Failed to copy backup codes:", err);
                    addToast({
                        variant: "danger",
                        message: "Failed to copy backup codes.",
                    });
                });
        }
    };

    const completeTwoFactorSetup = () => {
        setIs2FAEnabled(true);
        setShow2FADialog(false);
        setTwoFactorStep("setup");
        setTwoFactorPassword("");
        setOtpCode("");
        setTwoFactorData({});
        setQrCodeDataUrl(null);

        addToast({
            variant: "success",
            message: "Two-factor authentication enabled successfully!",
        });
    };

    const cancelTwoFactorSetup = () => {
        setShow2FADialog(false);
        setTwoFactorStep("setup");
        setTwoFactorPassword("");
        setOtpCode("");
        setTwoFactorData({});
        setQrCodeDataUrl(null);
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
                    message:
                        response.error.message || "Failed to update password. Please try again.",
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

    const getDialogTitle = () => {
        switch (twoFactorStep) {
            case "setup":
                return "Set up Two-Factor Authentication";
            case "verify":
                return "Verify Two-Factor Authentication";
            case "backup":
                return "Save your Backup Codes";
            default:
                return "Two-Factor Authentication";
        }
    };

    const handlePurgeEmails = async () => {
        if (!purgePassword) {
            addToast({
                variant: "danger",
                message: "Password is required to delete all emails",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await clearAllEmails(user.id, purgePassword);

            if (result.success) {
                addToast({
                    variant: "success",
                    message: result.message,
                });
                setShowPurgeEmailsDialog(false);
                setPurgePassword("");
            } else {
                addToast({
                    variant: "danger",
                    message: result.message,
                });
            }
        } catch (error) {
            console.error("Failed to delete all emails:", error);
            addToast({
                variant: "danger",
                message: "Failed to delete all emails. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Column gap="12" fill>
                <Column fill padding="24" gap="16">
                    <Heading variant="heading-strong-s">Change Password</Heading>

                    <form onSubmit={handleChangePassword}>
                        <Column gap="-1" fillWidth>
                            <PasswordInput
                                radius="top"
                                label="Current Password"
                                name="currentPassword"
                                id="currentPassword"
                                value={passwords.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />

                            <PasswordInput
                                radius="none"
                                label="New Password"
                                name="newPassword"
                                id="newPassword"
                                value={passwords.newPassword}
                                onChange={handlePasswordChange}
                                required
                            />

                            <PasswordInput
                                radius="bottom"
                                label="Confirm New Password"
                                name="confirmPassword"
                                id="confirmPassword"
                                value={passwords.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </Column>
                    </form>

                    <Column paddingTop="12" fill>
                        <Column gap="16" fillWidth>
                            <Row
                                fillWidth
                                radius="l"
                                paddingX="16"
                                paddingY="12"
                                border="neutral-alpha-medium"
                            >
                                <Switch
                                    reverse
                                    label="Two-Factor Authentication"
                                    description="Add an extra layer of security to your account by requiring an additional authentication code"
                                    isChecked={is2FAEnabled}
                                    onToggle={handleToggle2FA}
                                    id="two-factor-auth"
                                    disabled={isLoading}
                                />
                            </Row>

                            {/* Adding Data Management Section */}
                            <Heading variant="heading-strong-s" paddingTop="16">
                                Data Management
                            </Heading>

                            <Row fillWidth radius="l" border="neutral-alpha-medium">
                                <Column padding="20" gap="16">
                                    <Column gap="8">
                                        <Text variant="label-strong-l">
                                            Delete All Emails and Messages
                                        </Text>
                                        <Text variant="body-default-s" onBackground="neutral-weak">
                                            This will permanently delete all emails and messages
                                            from your account. This action cannot be undone.
                                        </Text>
                                    </Column>
                                    <Button
                                        label="Delete all emails"
                                        variant="danger"
                                        onClick={() => setShowPurgeEmailsDialog(true)}
                                        size="s"
                                    />
                                </Column>
                            </Row>

                            <Row fillWidth radius="l" border="neutral-alpha-medium">
                                <Column padding="20" gap="16">
                                    <Column gap="8">
                                        <Text variant="label-strong-l">Delete Account</Text>
                                        <Text variant="body-default-s" onBackground="neutral-weak">
                                            This will permanently delete your account and all
                                            associated data. This action cannot be undone.
                                        </Text>
                                    </Column>
                                    <Button
                                        label="Delete account"
                                        variant="danger"
                                        onClick={() => setShowDeleteAccountDialog(true)}
                                        size="s"
                                    />
                                </Column>
                            </Row>
                        </Column>
                    </Column>
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
                        label="Save changes"
                        type="submit"
                        loading={isLoading}
                        disabled={
                            isLoading ||
                            !passwords.currentPassword ||
                            !passwords.newPassword ||
                            !passwords.confirmPassword
                        }
                    />
                </Row>
            </Column>

            {/* Enable 2FA Dialog */}
            <Dialog isOpen={show2FADialog} onClose={cancelTwoFactorSetup} title={getDialogTitle()}>
                {twoFactorStep === "setup" && (
                    <Column gap="16">
                        <Text>Please enter your password to continue with 2FA setup.</Text>
                        <Input
                            type="password"
                            id="two-factor-password"
                            label="Password"
                            value={twoFactorPassword}
                            onChange={(e) => setTwoFactorPassword(e.target.value)}
                        />
                        <Row gap="8" horizontal="end">
                            <Button
                                label="Cancel"
                                variant="secondary"
                                onClick={cancelTwoFactorSetup}
                            />
                            <Button
                                label="Continue"
                                variant="primary"
                                onClick={handleSetupTwoFactor}
                                loading={isLoading}
                                disabled={!twoFactorPassword || isLoading}
                            />
                        </Row>
                    </Column>
                )}

                {twoFactorStep === "verify" && twoFactorData.totpURI && (
                    <Column gap="16">
                        <Text>Scan this QR code with your authenticator app</Text>
                        <Row horizontal="center">
                            {qrCodeDataUrl && (
                                <img
                                    src={qrCodeDataUrl}
                                    alt="QR Code for Two-Factor Authentication"
                                    width={200}
                                    height={200}
                                />
                            )}
                        </Row>

                        <Text>
                            Can't scan the QR code? Use the following key in your authenticator app:
                        </Text>
                        <Kbd>{twoFactorData.totpURI.split("secret=")[1]?.split("&")[0] || ""}</Kbd>

                        <Text>Enter the verification code from your authenticator app</Text>
                        <OTPInput
                            length={6}
                            onComplete={(newOtp) => setOtpCode(newOtp)}
                            autoFocus
                        />

                        <Row gap="8" horizontal="end">
                            <Button
                                label="Cancel"
                                variant="secondary"
                                onClick={cancelTwoFactorSetup}
                            />
                            <Button
                                label="Verify"
                                variant="primary"
                                onClick={handleVerifyTwoFactorSubmit}
                                loading={isLoading}
                                disabled={otpCode.length !== 6 || isLoading}
                            />
                        </Row>
                    </Column>
                )}

                {twoFactorStep === "backup" && twoFactorData.backupCodes && (
                    <Column gap="16">
                        <Text weight="strong">Save these backup codes</Text>
                        <Text>
                            If you lose access to your authentication app, you can use one of these
                            backup codes to sign in. Each code can only be used once.
                        </Text>

                        <Card fillWidth radius="l">
                            <Column padding="16" gap="8">
                                <pre ref={backupCodesRef} style={{ overflowX: "auto" }}>
                                    {twoFactorData.backupCodes?.join("\n")}
                                </pre>
                                <Button
                                    label={isCopied ? "Copied!" : "Copy Codes"}
                                    variant="secondary"
                                    onClick={copyBackupCodes}
                                    size="s"
                                />
                            </Column>
                        </Card>

                        <Row gap="8" horizontal="end">
                            <Button
                                label="Complete Setup"
                                variant="primary"
                                onClick={completeTwoFactorSetup}
                            />
                        </Row>
                    </Column>
                )}
            </Dialog>

            {/* Disable 2FA Dialog */}
            <Dialog
                isOpen={showDisable2FADialog}
                onClose={cancelDisable2FA}
                title="Disable Two-Factor Authentication"
            >
                <Column gap="16">
                    <Text>
                        Disabling two-factor authentication will make your account less secure. Are
                        you sure you want to continue?
                    </Text>
                    <Text>Please enter your password to confirm.</Text>
                    <Input
                        type="password"
                        id="disable-2fa-password"
                        label="Password"
                        value={disable2FAPassword}
                        onChange={(e) => setDisable2FAPassword(e.target.value)}
                    />
                    <Row gap="8" horizontal="end">
                        <Button label="Cancel" variant="secondary" onClick={cancelDisable2FA} />
                        <Button
                            label="Disable 2FA"
                            variant="danger"
                            onClick={handleDisable2FA}
                            loading={isLoading}
                            disabled={!disable2FAPassword || isLoading}
                        />
                    </Row>
                </Column>
            </Dialog>

            {/* Purge Emails Dialog */}
            <Dialog
                isOpen={showPurgeEmailsDialog}
                onClose={() => {
                    setShowPurgeEmailsDialog(false);
                    setPurgePassword("");
                }}
                title="Delete All Emails"
            >
                <Column gap="16">
                    <Text>
                        This will permanently delete all emails and messages from your account. This
                        action cannot be undone.
                    </Text>
                    <Text>Please enter your password to confirm.</Text>
                    <Input
                        type="password"
                        id="purge-emails-password"
                        label="Password"
                        value={purgePassword}
                        onChange={(e) => setPurgePassword(e.target.value)}
                    />
                    <Row gap="8" horizontal="end">
                        <Button
                            label="Cancel"
                            variant="secondary"
                            onClick={() => {
                                setShowPurgeEmailsDialog(false);
                                setPurgePassword("");
                            }}
                        />
                        <Button
                            label="Delete All Emails"
                            variant="danger"
                            onClick={handlePurgeEmails}
                            loading={isLoading}
                            disabled={!purgePassword || isLoading}
                        />
                    </Row>
                </Column>
            </Dialog>

            {/* Delete Account Dialog */}
            <Dialog
                isOpen={showDeleteAccountDialog}
                onClose={() => {
                    setShowDeleteAccountDialog(false);
                    setDeletePassword("");
                    setDeleteConfirmText("");
                }}
                title="Delete Account"
            >
                <Column gap="16">
                    <Text>
                        This will permanently delete your account and all associated data. This
                        action cannot be undone.
                    </Text>
                    <Text>Please enter your password to confirm.</Text>
                    <Input
                        type="password"
                        id="delete-account-password"
                        label="Password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                    />
                    <Text>Type "DELETE" to confirm.</Text>
                    <Input
                        type="text"
                        id="delete-account-confirm"
                        label="Confirmation"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                    />
                    <Row gap="8" horizontal="end">
                        <Button
                            label="Cancel"
                            variant="secondary"
                            onClick={() => {
                                setShowDeleteAccountDialog(false);
                                setDeletePassword("");
                                setDeleteConfirmText("");
                            }}
                        />
                        <Button
                            label="Delete Account"
                            variant="danger"
                            onClick={handleDeleteAccount}
                            loading={isLoading}
                            disabled={
                                !deletePassword || deleteConfirmText !== "DELETE" || isLoading
                            }
                        />
                    </Row>
                </Column>
            </Dialog>
        </>
    );
}
