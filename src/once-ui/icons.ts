import type { IconType } from "react-icons";

// Heroicons (hi2)
import {
    HiArrowUpRight,
    HiCalendar,
    HiCheckCircle,
    HiChevronDown,
    HiChevronLeft,
    HiChevronRight,
    HiChevronUp,
    HiEnvelope,
    HiExclamationCircle,
    HiExclamationTriangle,
    HiInformationCircle,
    HiMiniMinus,
    HiMiniPlus,
    HiMiniQuestionMarkCircle,
    HiMiniUser,
    HiMiniXMark,
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineArrowRight,
    HiOutlineBars3,
    HiOutlineBolt,
    HiOutlineClipboard,
    HiOutlineCloud,
    HiOutlineComputerDesktop,
    HiOutlineClock,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineInboxStack,
    HiOutlineLink,
    HiOutlineListBullet,
    HiOutlineMagnifyingGlass,
    HiOutlineMoon,
    HiOutlinePaperAirplane,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineStar,
    HiOutlineSun,
    HiOutlineCog, // Settings icon
    HiOutlineArrowRightOnRectangle, // Logout icon
    HiPaperAirplane,
    HiCheck,
    HiEyeDropper,
    HiStar,
} from "react-icons/hi2";

// Font Awesome 6
import { 
    FaDiscord, 
    FaGithub, 
    FaGoogle, 
    FaLinkedin, 
    FaTrash, 
    FaTwitter 
} from "react-icons/fa6";

// Remix Icons
import { RiVisaLine } from "react-icons/ri";

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
    checkCircle: HiCheckCircle,
    infoCircle: HiInformationCircle,
    warningTriangle: HiExclamationTriangle,
    errorCircle: HiExclamationCircle,
    helpCircle: HiMiniQuestionMarkCircle,
    
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
    settings: HiOutlineCog,
    logout: HiOutlineArrowRightOnRectangle,
    
    // Common Icons
    person: HiMiniUser,
    calendar: HiCalendar,
    clock: HiOutlineClock,
    eyeDropper: HiEyeDropper,
    clipboard: HiOutlineClipboard,
    list: HiOutlineListBullet,
    link: HiOutlineLink,
    openLink: HiOutlineLink,
    
    // Email & Communication
    mail: HiEnvelope,
    inbox: HiOutlineInboxStack,
    send: HiPaperAirplane,
    paperPlane: HiOutlinePaperAirplane,
    trash: FaTrash,
    star: HiOutlineStar,
    starFill: HiStar,
    
    // Services & Brands
    discord: FaDiscord,
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
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
