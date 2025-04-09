const baseURL = "mailbuddy.app";

// default customization applied to the HTML in the main layout.tsx
const style = {
  theme: "dark", // dark | light - not needed when using ThemeProvider
  neutral: "gray", // sand | gray | slate
  brand: "blue", // blue | indigo | violet | magenta | pink | red | orange | yellow | moss | green | emerald | aqua | cyan
  accent: "indigo", // blue | indigo | violet | magenta | pink | red | orange | yellow | moss | green | emerald | aqua | cyan
  solid: "contrast", // color | contrast | inverse
  solidStyle: "flat", // flat | plastic
  border: "playful", // rounded | playful | conservative
  surface: "filled", // filled | translucent
  transition: "all", // all | micro | macro
  scaling: "100", // 90 | 95 | 100 | 105 | 110
};

const effects = {
  mask: {
    cursor: false,
    x: 50,
    y: 0,
    radius: 100,
  },
  gradient: {
    display: true,
    x: 50,
    y: 0,
    width: 100,
    height: 100,
    tilt: 0,
    colorStart: "brand-background-strong",
    colorEnd: "static-transparent",
    opacity: 50,
  },
  dots: {
    display: true,
    size: 2,
    color: "brand-on-background-weak",
    opacity: 20,
  },
  lines: {
    display: false,
    color: "neutral-alpha-weak",
    opacity: 100,
  },
  grid: {
    display: false,
    color: "neutral-alpha-weak",
    width: "24",
    height: "24",
    opacity: 100,
  },
};

// default metadata
const meta = {
  title: "Mailbuddy - Your Secure AI Email Companion",
  description:
    "Mailbuddy is a secure, privacy-focused AI email client that makes managing your Gmail messages simple and efficient.",
};

// default open graph data
const og = {
  title: meta.title,
  description: meta.description,
  image: "/images/mailbuddy-cover.jpg",
};

// default schema data
const schema = {
  logo: "/images/mailbuddy-logo.png",
  type: "Organization",
  name: "Mailbuddy",
  description: meta.description,
  email: "hello@mailbuddy.app",
};

// social links
const social = {
  twitter: "https://www.twitter.com/mailbuddy",
  linkedin: "https://www.linkedin.com/company/mailbuddy/",
  github: "https://github.com/mailbuddy",
};

export { baseURL, style, meta, og, schema, social, effects };
