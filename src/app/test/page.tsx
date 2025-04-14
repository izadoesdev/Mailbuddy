import { Background } from "@/once-ui/components";

export default function Page() {
    return (
        <Background             
            mask={{ x: 100, y: 0, radius: 100 }}
            gradient={{
                display: true,
                x: 100,
                y: 60,
                width: 70,
                height: 50,
                tilt: -40,
                opacity: 100,
                colorStart: "accent-background-strong",
                colorEnd: "page-background",
            }}
            grid={{
                display: true,
                opacity: 100,
                width: "0.25rem",
                color: "neutral-alpha-medium",
                height: "0.25rem",
            }}        
            style={{
                width: "100%",
                height: "100%",
            }}
            />
    )
}