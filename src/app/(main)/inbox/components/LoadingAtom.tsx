import { Column, Text } from "@/once-ui/components";
import { useEffect, useState } from "react";

interface AtomProps {
    color?: string;
    size?: "small" | "medium" | "large";
    text?: string;
    textColor?: string;
}

// Loading messages to cycle through
export const loadingMessages = [
    "Fetching your emails...",
    "Looking for important messages...",
    "Scanning for cat pictures... 🐱",
    "Organizing your digital life...",
    "Separating spam from the good stuff...",
    "Teaching AI to understand your priorities...",
    "Finding those needles in the haystack...",
    "Hunting down that email you need...",
    "Applying smart filters...",
    "Sorting conversations by importance...",
    "Almost there, hang tight!",
    "Just a moment longer...",
    "Making your inbox shine ✨",
    "Decluttering your digital space...",
    "Preparing your personalized view...",
    "Brewing fresh insights from your emails ☕",
    "Reading through your messages...",
    "Tagging and categorizing...",
    "Detecting sentiment in your emails...",
    "Finding patterns in your correspondence...",
];

// Custom Atom loading component
export function Atom({ color = "#32cd32", size = "medium", text = "", textColor = "" }: AtomProps) {
    const sizeValue = size === "small" ? 30 : size === "medium" ? 50 : 70;
    const electronRadius = sizeValue / 10;

    return (
        <div
            style={{ position: "relative", width: sizeValue, height: sizeValue, margin: "0 auto" }}
        >
            {/* Core of the atom */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: sizeValue / 3,
                    height: sizeValue / 3,
                    borderRadius: "50%",
                    backgroundColor: color,
                    transform: "translate(-50%, -50%)",
                    boxShadow: `0 0 ${sizeValue / 5}px ${color}`,
                }}
            />

            {/* Electrons */}
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    animation: "spin1 1.5s linear infinite",
                    transformOrigin: "center",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        width: electronRadius,
                        height: electronRadius,
                        borderRadius: "50%",
                        backgroundColor: color,
                        transform: "translateX(-50%)",
                        boxShadow: `0 0 ${sizeValue / 15}px ${color}`,
                    }}
                />
            </div>
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    animation: "spin2 2s linear infinite",
                    transformOrigin: "center",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        width: electronRadius,
                        height: electronRadius,
                        borderRadius: "50%",
                        backgroundColor: color,
                        transform: "translateY(-50%)",
                        boxShadow: `0 0 ${sizeValue / 15}px ${color}`,
                    }}
                />
            </div>
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    animation: "spin3 2.5s linear infinite",
                    transformOrigin: "center",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        width: electronRadius,
                        height: electronRadius,
                        borderRadius: "50%",
                        backgroundColor: color,
                        transform: "translateX(-50%)",
                        boxShadow: `0 0 ${sizeValue / 15}px ${color}`,
                    }}
                />
            </div>

            {/* Text underneath if provided */}
            {text && (
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        textAlign: "center",
                        top: "100%",
                        marginTop: 10,
                        color: textColor || color,
                        fontWeight: "bold",
                    }}
                >
                    {text}
                </div>
            )}

            {/* Style for animations */}
            <style jsx>{`
                @keyframes spin1 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes spin2 {
                    0% { transform: rotate(120deg); }
                    100% { transform: rotate(480deg); }
                }
                @keyframes spin3 {
                    0% { transform: rotate(240deg); }
                    100% { transform: rotate(600deg); }
                }
            `}</style>
        </div>
    );
}

interface LoadingAtomProps {
    color?: string;
    size?: "small" | "medium" | "large";
    messages?: string[];
    messageInterval?: number;
}

export function LoadingAtom({
    color = "#32cd32",
    size = "medium",
    messages = loadingMessages,
    messageInterval = 5000,
}: LoadingAtomProps) {
    // Start with the first message by default (server-side)
    const [messageIndex, setMessageIndex] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const [progress, setProgress] = useState(0);

    // Initialize with random message on client-side only
    useEffect(() => {
        // Only run this on the client after initial render
        setMessageIndex(Math.floor(Math.random() * messages.length));
    }, [messages.length]); // Only run once after mount

    // Update message every interval
    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                const increment = 100 / (messageInterval / 100); // Divide interval into 100ms chunks
                return Math.min(prev + increment, 100);
            });
        }, 100);

        const messageTimer = setInterval(() => {
            setFadeOut(true);
            setTimeout(() => {
                setMessageIndex((prev) => (prev + 1) % messages.length);
                setFadeOut(false);
                // Reset progress when message changes
                setProgress(0);
            }, 500); // Message change happens during fade out
        }, messageInterval);

        return () => {
            clearInterval(messageTimer);
            clearInterval(progressInterval);
        };
    }, [messages, messageInterval]);

    return (
        <Column center gap="24" padding="64">
            <Atom color={color} size={size} />
            <div
                style={{
                    minHeight: "2em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "opacity 0.5s ease",
                    opacity: fadeOut ? 0 : 1,
                }}
            >
                <Text variant="heading-strong-s">{messages[messageIndex]}</Text>
            </div>
            <div
                style={{
                    width: "200px",
                    height: "8px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${progress}%`,
                        backgroundColor: color,
                        borderRadius: "4px",
                        transition: "width 0.1s linear",
                    }}
                />
            </div>
        </Column>
    );
}
