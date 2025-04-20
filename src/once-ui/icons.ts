import type { IconType } from "react-icons";

// Heroicons (hi2)
import {
    HiArrowUpRight,
    HiCalendar,
    HiCheck,
    HiChevronDown,
    HiChevronLeft,
    HiChevronRight,
    HiChevronUp,
    HiExclamationCircle,
    HiExclamationTriangle,
    HiEyeDropper,
    HiInformationCircle,
    HiMiniMinus,
    HiMiniPlus,
    HiMiniXMark,
    HiOutlineAcademicCap, // For educational/book
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineArrowRight,
    HiOutlineArrowRightOnRectangle, // Logout icon
    HiOutlineBanknotes, // For money/financial
    HiOutlineBars3,
    HiOutlineBell,
    HiOutlineBolt,
    HiOutlineBriefcase,
    HiOutlineChartBar,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineCheckCircle,
    HiOutlineClipboard,
    HiOutlineClock,
    HiOutlineCloud,
    HiOutlineCog6Tooth,
    HiOutlineComputerDesktop,
    HiOutlineCurrencyDollar,
    HiOutlineDocument,
    HiOutlineEnvelope,
    HiOutlineExclamationCircle,
    HiOutlineExclamationTriangle,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineFire,
    HiOutlineFlag,
    HiOutlineFolder,
    HiOutlineHome,
    HiOutlineInboxStack,
    HiOutlineInformationCircle,
    HiOutlineLightBulb,
    HiOutlineLink,
    HiOutlineListBullet,
    HiOutlineMagnifyingGlass,
    HiOutlineMoon,
    HiOutlineMusicalNote, // For music/entertainment
    HiOutlinePaperAirplane,
    HiOutlinePencil,
    HiOutlineQuestionMarkCircle,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineSparkles,
    HiOutlineStar,
    HiOutlineSun,
    HiOutlineTag,
    HiOutlineTrash,
    HiOutlineUser,
    HiOutlineUserCircle,
    HiOutlineUserGroup,
    HiOutlineUserPlus,
    HiOutlineXMark, // Alternative for money
    HiPaintBrush,
    HiPaperAirplane,
    HiPaperClip,
    HiStar,
    HiWifi,
} from "react-icons/hi2";

// Font Awesome 6
import {
    FaApple,
    FaBots,
    FaCode,
    FaDiscord,
    FaGithub,
    FaGoogle,
    FaLinkedin,
    FaMicrosoft,
    FaPage4,
    FaPlane,
    FaTruck,
    FaTwitter,
    FaUtensils,
} from "react-icons/fa6";

// Remix Icons
import {
    RiBillLine,
    RiMegaphoneLine,
    RiReplyAllFill,
    RiStackedView,
    RiVisaLine,
} from "react-icons/ri";

// Lucide Icons
import { LuActivity, LuBookOpen, LuBot, LuChevronsLeftRight, LuSave, LuZap } from "react-icons/lu";

export const iconLibrary: Record<string, IconType> = {
    // Navigation
    chevronUp: HiChevronUp,
    chevronDown: HiChevronDown,
    chevronRight: HiChevronRight,
    chevronLeft: HiChevronLeft,
    chevronsLeftRight: LuChevronsLeftRight,
    arrowLeft: HiOutlineArrowLeft,
    arrowRight: HiOutlineArrowRight,
    arrowUpRight: HiArrowUpRight,

    // Status & Feedback
    check: HiCheck,
    checkCircle: HiOutlineCheckCircle,
    infoCircle: HiOutlineInformationCircle,
    warningTriangle: HiExclamationTriangle,
    errorCircle: HiExclamationCircle,
    helpCircle: HiOutlineQuestionMarkCircle,

    // UI Controls
    refresh: HiOutlineArrowPath,
    light: HiOutlineSun,
    dark: HiOutlineMoon,
    close: HiMiniXMark,
    minus: HiMiniMinus,
    plus: HiMiniPlus,
    search: HiOutlineMagnifyingGlass,
    eye: HiOutlineEye,
    eyeOff: HiOutlineEyeSlash,
    settings: HiOutlineCog6Tooth,
    logout: HiOutlineArrowRightOnRectangle,

    // Common Icons
    person: HiOutlineUser,
    group: HiOutlineUserGroup,
    calendar: HiCalendar,
    clock: HiOutlineClock,
    eyeDropper: HiEyeDropper,
    clipboard: HiOutlineClipboard,
    list: HiOutlineListBullet,
    link: HiOutlineLink,
    openLink: HiOutlineLink,

    // Email & Communication
    mail: HiOutlineEnvelope,
    inbox: HiOutlineInboxStack,
    send: HiPaperAirplane,
    paperPlane: HiOutlinePaperAirplane,
    trash: HiOutlineTrash,
    star: HiOutlineStar,
    starFill: HiStar,
    edit: HiOutlinePencil,
    folder: HiOutlineFolder,
    flag: HiOutlineFlag,

    // Business & Commerce
    briefcase: HiOutlineBriefcase,
    money: HiOutlineBanknotes,
    currencyDollar: HiOutlineCurrencyDollar,
    bag: HiOutlineShoppingBag,
    tag: HiOutlineTag,
    bill: RiBillLine,

    // Travel & Transport
    plane: FaPlane,
    truck: FaTruck,

    // Notifications & Alerts
    bell: HiOutlineBell,
    bullhorn: RiMegaphoneLine,

    // Education & Entertainment
    book: HiOutlineAcademicCap,
    music: HiOutlineMusicalNote,
    utensils: FaUtensils,

    // Services & Brands
    discord: FaDiscord,
    apple: FaApple,
    microsoft: FaMicrosoft,
    google: FaGoogle,
    github: FaGithub,
    twitter: FaTwitter,
    linkedin: FaLinkedin,
    visa: RiVisaLine,

    // Miscellaneous
    security: HiOutlineShieldCheck,
    shield: HiOutlineShieldCheck,
    sparkle: HiOutlineSparkles,
    sparkles: HiOutlineSparkles,
    computer: HiOutlineComputerDesktop,
    layout: HiOutlineBars3,
    bolt: HiOutlineBolt,
    lightning: HiOutlineBolt,
    cloud: HiOutlineCloud,
    forward: HiOutlineArrowRight,
    reply: RiReplyAllFill,

    preferences: HiPaintBrush,
    support: HiOutlineQuestionMarkCircle,
    lightbulb: HiOutlineLightBulb,
    home: HiOutlineHome,
    mailWarning: HiOutlineExclamationTriangle,
    menu: HiOutlineBars3,
    danger: HiOutlineExclamationTriangle,
    stack: RiStackedView,
    fire: HiOutlineFire,
    template: LuSave,
    userCircle: HiOutlineUserCircle,
    paperclip: HiPaperClip,
    chart: HiOutlineChartBar,
    network: HiWifi,
    document: HiOutlineDocument,
    chat: HiOutlineChatBubbleBottomCenterText,
    userPlus: HiOutlineUserPlus,
    alertCircle: HiOutlineExclamationCircle,
    shieldCheck: HiOutlineShieldCheck,
    cross: HiOutlineXMark,
    code: FaCode,
    activity: LuActivity,
    bot: LuBot,
    zap: LuZap,
    megaphone: RiMegaphoneLine,
    bookOpen: LuBookOpen,
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
