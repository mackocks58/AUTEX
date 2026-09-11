export type Lang = "en" | "sw";

export const translations = {
  en: {
    // Nav
    home: "Home",
    chat: "Chat",
    betslips: "Betslips",
    wallet: "Wallet",
    profile: "Profile",
    movies: "Movies",
    admin: "Admin",
    logIn: "Log in",
    register: "Register",
    signOut: "Sign out",

    // Bottom nav modal
    signInRequired: "Sign In Required",
    signInDesc: (section: string) =>
      `You need an account to access ${section}. Join to get premium picks!`,
    cancel: "Cancel",

    // Home
    footballMatches: "Football Matches",
    topTierFootball: "Top tier football action.",
    live: "Live",
    today: "Today",
    tomorrow: "Tomorrow",
    loadingMatches: "Loading live matches...",
    noMatches: "No matches found. Admins will update the daily matches soon!",
    viewOdds: "View Odds & Premium Tips",

    // Auth
    welcomeBack: "Welcome Back",
    signInSubtitle: "Sign in to access your premium picks.",
    emailAddress: "Email Address",
    password: "Password",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    noAccount: "Don't have an account?",
    createAccount: "Create Account",
    joinSubtitle: "Join us to get the best premium picks.",
    fullName: "Full Name",
    username: "Username",
    phoneNumber: "Phone Number",
    usernameAvailable: "Username available",
    usernameTaken: "Username taken",
    usernameChecking: "Checking...",
    usernameInvalid: "3-16 letters, numbers, or underscores",
    confirmPassword: "Confirm Password",
    alreadyHaveAccount: "Already have an account?",
    resetPassword: "Reset Password",
    enterEmailReset: "Enter your phone number to receive a reset link.",
    sendResetLink: "Send Reset Link",
    checkInbox: "Check your messages!",
    resetSent: (app: string) =>
      `We've sent a password reset message from ${app} to your phone.`,
    backToLogin: "Back to login",

    // Errors
    errInvalidCred: "Invalid phone number or password.",
    errInUse: "This phone number is already registered. Please log in.",
    errWeakPass: "Password is too weak. Please use at least 6 characters.",
    errNetwork: "Network error. Please check your connection.",
    errTooMany: "Too many attempts. Please try again later.",
    errDefault: "An unexpected error occurred. Please try again.",

    // Account
    welcomeBackGreeting: (name: string, greeting: string) =>
      `${greeting}, ${name}!`,
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    goodNight: "Good night",
    welcomeDashboard: "Welcome back to your dashboard.",
    profileDetails: "Profile Details",
    fullNameLabel: "Full Name",
    emailLabel: "Email Address",
    userId: "User ID",
    accountRole: "Account Role",
    notSet: "Not set",
    administrator: "👑 Administrator",
    standardUser: "Standard User",
    signOutSecurely: "Sign Out Securely",
    socialActivity: "Social Activity",
    following: "Following",
    myChannels: "My Channels",
    affiliateProgram: "Affiliate Program",
    affiliateDesc:
      "Invite your friends to Mfalme wa Mikeka and earn commissions for every successful registration!",
    openAffiliate: "Open Affiliate Dashboard",
    liveCenter: "Live Center",
    liveCenterDesc:
      "Track live matches with our real-time visual simulation and live score tracker.",
    enterLiveCenter: "Enter Live Center",
    logInToView: "Log in to view your account.",

    // Language
    language: "Language",
    languageToggle: "Switch language",
    english: "English",
    swahili: "Swahili",

    // Betslips
    premiumBetslips: "Premium Betslips",
    betslipsSubtitle: "Today's handpicked winning codes.",
    noBetslips: "No premium betslips available today. Check back soon!",

    // Notifications
    notifications: "Notifications",
    noNotifications: "No notifications yet.",
    markAllRead: "Mark all as read",

    // Support
    support: "Support",
    supportSubtitle: "We're here to help you.",
    supportMessage: "Send us a message",
    yourMessage: "Your message",
    send: "Send",

    // Shell search
    searchPlaceholder: "Search premium betslips, matches, or codes...",

    // General
    loading: "Loading...",
    error: "An error occurred.",
    close: "Close",
    save: "Save",
    back: "Back",
  },

  sw: {
    // Nav
    home: "Nyumbani",
    chat: "Gumzo",
    betslips: "Kadi za Dau",
    wallet: "Mkoba",
    profile: "Wasifu",
    movies: "Filamu",
    admin: "Msimamizi",
    logIn: "Ingia",
    register: "Jisajili",
    signOut: "Toka",

    // Bottom nav modal
    signInRequired: "Unahitaji Kuingia",
    signInDesc: (section: string) =>
      `Unahitaji akaunti kupata ${section}. Jiunge kupata mechi bora!`,
    cancel: "Ghairi",

    // Home
    footballMatches: "Mechi za Mpira",
    topTierFootball: "Michezo ya mpira wa daraja la juu.",
    live: "Moja kwa Moja",
    today: "Leo",
    tomorrow: "Kesho",
    loadingMatches: "Inapakia mechi za moja kwa moja...",
    noMatches:
      "Hakuna mechi zilizopatikana. Wasimamizi watasasisha mechi za leo hivi karibuni!",
    viewOdds: "Angalia Uwiano & Vidokezo vya Premium",

    // Auth
    welcomeBack: "Karibu Tena",
    signInSubtitle: "Ingia kupata vidokezo vyako vya premium.",
    emailAddress: "Anwani ya Barua Pepe",
    password: "Nywila",
    forgotPassword: "Umesahau nywila?",
    signIn: "Ingia",
    noAccount: "Huna akaunti?",
    createAccount: "Fungua Akaunti",
    joinSubtitle: "Jiunge kupata vidokezo bora vya premium.",
    fullName: "Jina Kamili",
    username: "Jina la Mtumiaji",
    phoneNumber: "Namba ya Simu",
    usernameAvailable: "Jina linapatikana",
    usernameTaken: "Jina limeshachukuliwa",
    usernameChecking: "Inakagua...",
    usernameInvalid: "Herufi 3-16, namba, au _ tu",
    confirmPassword: "Thibitisha Nywila",
    alreadyHaveAccount: "Una akaunti tayari?",
    resetPassword: "Weka Upya Nywila",
    enterEmailReset:
      "Weka namba yako ya simu kupokea kiungo cha kuweka upya nywila.",
    sendResetLink: "Tuma Kiungo cha Kuweka Upya",
    checkInbox: "Angalia meseji zako!",
    resetSent: (app: string) =>
      `Tumetuma ujumbe wa kuweka upya nywila kutoka ${app} kwenye simu yako.`,
    backToLogin: "Rudi kuingia",

    // Errors
    errInvalidCred: "Namba ya simu au nywila si sahihi.",
    errInUse: "Namba hii ya simu tayari imesajiliwa. Tafadhali ingia.",
    errWeakPass: "Nywila ni dhaifu. Tafadhali tumia angalau herufi 6.",
    errNetwork: "Tatizo la mtandao. Tafadhali angalia intaneti yako.",
    errTooMany: "Majaribio mengi mno. Tafadhali jaribu tena baadaye.",
    errDefault: "Kuna tatizo limetokea. Tafadhali jaribu tena.",

    // Account
    welcomeBackGreeting: (name: string, greeting: string) =>
      `${greeting}, ${name}!`,
    goodMorning: "Habari za asubuhi",
    goodAfternoon: "Habari za mchana",
    goodEvening: "Habari za jioni",
    goodNight: "Usiku mwema",
    welcomeDashboard: "Karibu tena kwenye dashibodi yako.",
    profileDetails: "Maelezo ya Wasifu",
    fullNameLabel: "Jina Kamili",
    emailLabel: "Anwani ya Barua Pepe",
    userId: "Kitambulisho cha Mtumiaji",
    accountRole: "Jukumu la Akaunti",
    notSet: "Haijawekwa",
    administrator: "👑 Msimamizi",
    standardUser: "Mtumiaji wa Kawaida",
    signOutSecurely: "Toka kwa Usalama",
    socialActivity: "Shughuli za Kijamii",
    following: "Wanaofuatwa",
    myChannels: "Chaneli Zangu",
    affiliateProgram: "Programu ya Ushirika",
    affiliateDesc:
      "Alika marafiki wako kwenye Mfalme wa Mikeka na upate kamisheni kwa kila usajili uliofanikiwa!",
    openAffiliate: "Fungua Dashibodi ya Ushirika",
    liveCenter: "Kituo cha Moja kwa Moja",
    liveCenterDesc:
      "Fuatilia mechi za moja kwa moja kwa mfumo wetu wa kuonyesha na kufuatilia matokeo.",
    enterLiveCenter: "Ingia Kituo cha Moja kwa Moja",
    logInToView: "Ingia kuona akaunti yako.",

    // Language
    language: "Lugha",
    languageToggle: "Badilisha lugha",
    english: "Kiingereza",
    swahili: "Kiswahili",

    // Betslips
    premiumBetslips: "Kadi za Dau za Premium",
    betslipsSubtitle: "Nambari bora za leo zilizochaguliwa kwa mikono.",
    noBetslips:
      "Hakuna kadi za dau za premium leo. Angalia tena hivi karibuni!",

    // Notifications
    notifications: "Arifa",
    noNotifications: "Hakuna arifa bado.",
    markAllRead: "Weka zote kama zimesomwa",

    // Support
    support: "Msaada",
    supportSubtitle: "Tuko hapa kukusaidia.",
    supportMessage: "Tutumie ujumbe",
    yourMessage: "Ujumbe wako",
    send: "Tuma",

    // Shell search
    searchPlaceholder: "Tafuta kadi za dau, mechi, au nambari...",

    // General
    loading: "Inapakia...",
    error: "Hitilafu imetokea.",
    close: "Funga",
    save: "Hifadhi",
    back: "Rudi",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
