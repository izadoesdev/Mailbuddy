import "@/once-ui/styles/index.scss";
import "@/once-ui/tokens/index.scss";

import classNames from "classnames";
import { baseURL, meta, og, schema, style } from "@/app/resources/config";
import { Background, Column, Flex, ThemeProvider, ToastProvider, Row } from "@/once-ui/components";
import { Meta, Schema } from "@/once-ui/modules";
import TopNav from "@/components/Boxes/TopNav";
import Footer from "@/components/Boxes/Footer";

import { Geist } from "next/font/google";
import { Geist_Mono } from "next/font/google";

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

export async function generateMetadata({ params }: { params: any }) {
  const title = `Legal & Resources | ${meta.title}`;
  const description = "Legal and important information for our services";
  
  return Meta.generate({
    title,
    description,
    baseURL,
    path: "/",
    image: og.image
  });
}

export default function SecondaryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Flex
      suppressHydrationWarning
      as="body"
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
          <Column as="body" fillWidth margin="0" padding="0">

            
            <TopNav />
            
            <Column fillWidth paddingTop="128" center vertical="center">
              {children}
            </Column>
            
            {/* Footer */}
            <Footer />
          </Column>
        </ToastProvider>
      </ThemeProvider>
    </Flex>
  );
}
