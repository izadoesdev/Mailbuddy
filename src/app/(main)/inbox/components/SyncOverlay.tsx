import { 
  Column, 
  Row, 
  Card, 
  Text, 
  Spinner, 
  Icon, 
  Button,
  Line,
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
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card
        radius="xl"
        border="neutral-alpha-weak"
        padding="32"
        style={{
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <Column gap="24">
          <Row horizontal="center">
            <Icon name="mail" size="xl" onBackground="neutral-strong" />
          </Row>
          
          <Text variant="heading-strong-l" align="center">
            Syncing Your Emails
          </Text>
          
          <Text align="center">
            Please wait while we sync your emails. This might take a few minutes
            depending on how many emails you have.
          </Text>
          
          <Column gap="12">
            <Row horizontal="space-between" vertical="center">
              <Text variant="body-default-m">{message}</Text>
              <Text variant="body-strong-m">{progress}%</Text>
            </Row>
            
            <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(0, 0, 0, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div 
                style={{ 
                  height: "100%", 
                  width: `${progress}%`, 
                  backgroundColor: "var(--color-primary-500)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease-in-out",
                }} 
              />
            </div>
          </Column>
          
          {onCancel && (
            <Button
              variant="secondary"
              onClick={onCancel}
              prefixIcon="close"
            >
              Cancel Sync
            </Button>
          )}
        </Column>
      </Card>
    </div>
  );
} 