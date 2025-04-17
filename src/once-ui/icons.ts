import type { IconType } from "react-icons";

// Heroicons (hi2)
import {
    HiArrowUpRight,
    HiCalendar,
    HiOutlineCheckCircle,
    HiChevronDown,
    HiChevronLeft,
    HiChevronRight,
    HiChevronUp,
    HiExclamationCircle,
    HiExclamationTriangle,
    HiInformationCircle,
    HiMiniMinus,
    HiMiniPlus,
    HiMiniXMark,
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineArrowRight,
    HiOutlineBars3,
    HiOutlineBell,
    HiOutlineBolt,
    HiOutlineBriefcase,
    HiOutlineClipboard,
    HiOutlineCloud,
    HiOutlineComputerDesktop,
    HiOutlineClock,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineFlag,
    HiOutlineFolder,
    HiOutlineInboxStack,
    HiOutlineLink,
    HiOutlineListBullet,
    HiOutlineMagnifyingGlass,
    HiOutlineMoon,
    HiOutlinePaperAirplane,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineSparkles,
    HiOutlineStar,
    HiOutlineSun,
    HiOutlineTag,
    HiOutlineArrowRightOnRectangle, // Logout icon
    HiOutlineUserGroup,
    HiPaperAirplane,
    HiCheck,
    HiEyeDropper,
    HiStar,
    HiOutlineCog6Tooth,
    HiOutlineQuestionMarkCircle,
    HiOutlineEnvelope,
    HiOutlineUser,
    HiOutlineTrash,
    HiPaintBrush,
    HiOutlineLightBulb,
    HiOutlineHome,
    HiOutlineExclamationTriangle,
    HiOutlinePencil,
    HiOutlineAcademicCap, // For educational/book
    HiOutlineBanknotes, // For money/financial
    HiOutlineMusicalNote, // For music/entertainment
    HiOutlineCurrencyDollar,
    HiOutlineInformationCircle, // Alternative for money
} from "react-icons/hi2";

// Font Awesome 6
import { 
    FaApple,
    FaDiscord, 
    FaGithub, 
    FaGoogle, 
    FaLinkedin, 
    FaMicrosoft, 
    FaPlane,
    FaTruck,
    FaTwitter,
    FaUtensils,
} from "react-icons/fa6";

// Remix Icons
import { RiBillLine, RiMegaphoneLine, RiReplyAllFill, RiVisaLine } from "react-icons/ri";

// Lucide Icons
import { LuChevronsLeftRight } from "react-icons/lu";

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
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
