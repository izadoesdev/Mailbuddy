import "@/once-ui/styles/index.scss";
import "@/once-ui/tokens/index.scss";

import classNames from "classnames";

import { baseURL, effects, meta, og, schema, style } from "@/app/resources/config";
import { QueryProvider } from "@/libs/query/QueryProvider";
import { Background, Column, Flex, ThemeProvider, ToastProvider } from "@/once-ui/components";
import { Meta, Schema } from "@/once-ui/modules";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";

const primary = Geist({
    variable: "--font-primary",
    subsets: ["latin"],
    display: "swap",
});

const code = Geist_Mono({
    variable: "--font-code",
    subsets: ["latin"],
    display: "swap",
});

type FontConfig = {
    variable: string;
};

/*
	Replace with code for secondary and tertiary fonts
	from https://once-ui.com/customize
*/
const secondary: FontConfig | undefined = undefined;
const tertiary: FontConfig | undefined = undefined;
/*
 */

export async function generateMetadata() {
    return Meta.generate({
        title: meta.title,
        description: meta.description,
        baseURL,
        path: "/",
        image: og.image,
    });
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Flex
            suppressHydrationWarning
            as="html"
            lang="en"
            fillHeight
            background="page"
            data-neutral={style.neutral}
            data-brand={style.brand}
            data-accent={style.accent}
            data-border={style.border}
            data-solid={style.solid}
            data-solid-style={style.solidStyle}
            data-surface={style.surface}
            data-transition={style.transition}
            data-scaling={style.scaling}
            className={classNames(
                primary.variable,
                code.variable,
                secondary ? secondary.variable : "",
                tertiary ? tertiary.variable : "",
            )}
        >
            <Schema
                as="organization"
                title={schema.name}
                description={schema.description}
                baseURL={baseURL}
                path="/"
                image={schema.logo}
            />
            <head>
                <Script
                    defer
                    src="https://cloud.umami.is/script.js"
                    data-website-id="daf3c389-edda-4092-aed1-bd93cd7b2761"
                />
                <Script
                src="https://app.databuddy.cc/databuddy.js"
                data-client-id="rhW0oqd511QgVTw1P31WT"
                data-api-url="https://basket.databuddy.cc"
                data-track-screen-views="true"
                data-track-performance="true"
                data-track-web-vitals="false"
                data-track-errors="true"
                // data-enable-batching="true"
                // data-batch-size="20"
                // data-batch-timeout="5000"
                strategy="afterInteractive"
                defer
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const root = document.documentElement;
                  if (theme === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  } else {
                    root.setAttribute('data-theme', theme);
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
                    }}
                />
            </head>
            <ThemeProvider>
                <ToastProvider>
                    <NuqsAdapter>
                        <Column as="body" fillWidth margin="0" padding="0" marginTop="8">
                            <Background
                                pointerEvents="none"
                                position="fixed"
                                mask={{
                                    cursor: effects.mask.cursor,
                                    x: effects.mask.x,
                                    y: effects.mask.y,
                                    radius: effects.mask.radius,
                                }}
                                gradient={{
                                    display: effects.gradient.display,
                                    x: effects.gradient.x,
                                    y: effects.gradient.y,
                                    width: effects.gradient.width,
                                    height: effects.gradient.height,
                                    tilt: effects.gradient.tilt,
                                    colorStart: effects.gradient.colorStart,
                                    colorEnd: effects.gradient.colorEnd,
                                    opacity: effects.gradient.opacity as
                                        | 0
                                        | 10
                                        | 20
                                        | 30
                                        | 40
                                        | 50
                                        | 60
                                        | 70
                                        | 80
                                        | 90
                                        | 100,
                                }}
                                dots={{
                                    display: effects.dots.display,
                                    color: effects.dots.color,
                                    size: effects.dots.size as any,
                                    opacity: effects.dots.opacity as any,
                                }}
                                grid={{
                                    display: effects.grid.display,
                                    color: effects.grid.color,
                                    width: effects.grid.width as any,
                                    height: effects.grid.height as any,
                                    opacity: effects.grid.opacity as any,
                                }}
                                lines={{
                                    display: effects.lines.display,
                                    opacity: effects.lines.opacity as any,
                                }}
                            />
                            <QueryProvider>{children}</QueryProvider>
                        </Column>
                    </NuqsAdapter>
                </ToastProvider>
            </ThemeProvider>
        </Flex>
    );
}
