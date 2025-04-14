import { 
  Column, 
  Row, 
  Text, 
  Icon, 
  Button,
} from "@/once-ui/components";

interface SyncOverlayProps {
  isVisible: boolean;
  progress: number;
  message: string;
  onCancel?: () => void;
}

export function SyncOverlay({ isVisible, progress, message, onCancel }: SyncOverlayProps) {
  if (!isVisible) return null;

  return (
    <Row
    fill center position="fixed"
    padding="l"
    zIndex={9}
    background="overlay">
      <Column
        background="page"
        shadow="xl"
        radius="xl"
        border="neutral-medium"
        padding="48"
        maxWidth="s"
        horizontal="center"
        gap="12"
      >
          <Icon name="mail" size="m" onBackground="neutral-strong" marginBottom="16" padding="8" radius="full" border="neutral-medium" />
          
          <Text variant="heading-strong-l" align="center">
            Syncing Your Emails
          </Text>
          
          <Text align="center"  wrap="balance" onBackground="neutral-weak">
            Please wait while we sync your emails. This might take a few minutes
            depending on how many emails you have.
          </Text>
          
          <Column gap="12" fillWidth paddingY="48">
            <Row fillWidth height="8" background="overlay" radius="full" overflow="hidden">
              <Row 
                fillHeight
                solid="brand-strong"
                radius="full"
                transition="micro-medium"
                style={{ 
                  width: `${progress}%`,
                }} 
              />
            </Row>
            
            <Row horizontal="space-between" vertical="center" paddingX="8">
              <Text variant="body-default-s" onBackground="neutral-weak">{message}</Text>
              <Text variant="body-default-s">{progress}%</Text>
            </Row>
          </Column>
          
          {onCancel && (
            <Button
              variant="secondary"
              onClick={onCancel}
              prefixIcon="close"
              weight="default"
            >
              Cancel
            </Button>
          )}
        </Column>
    </Row>
  );
} 