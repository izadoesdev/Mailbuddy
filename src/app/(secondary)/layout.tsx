import "@/once-ui/styles/index.scss";
import "@/once-ui/tokens/index.scss";

import { baseURL, meta, og } from "@/app/resources/config";
import Footer from "@/components/Boxes/Footer";
import TopNav from "@/components/Boxes/TopNav";
import { Column } from "@/once-ui/components";
import { Meta } from "@/once-ui/modules";

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
        image: og.image,
    });
}

export default function SecondaryLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Column fillWidth margin="0" padding="0">
            <TopNav />
            <Column fillWidth paddingTop="128" center vertical="center">
                {children}
            </Column>
            <Footer />
        </Column>
    );
}
