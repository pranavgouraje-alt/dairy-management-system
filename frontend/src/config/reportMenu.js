const reportMenu = [
  {
    id: "daily-report",
    title: "Daily Collection Report",
    description:
      "View date-wise cow and buffalo milk entries, sessions, litres and collection amounts.",
    icon: "📅",
    path: "/daily-report",
    category: "Collection",
    color: "blue",
    badge: "Daily",
  },
  {
    id: "collection-register",
    title: "Collection Register",
    description:
      "Open the complete member-wise milk collection register with detailed entry information.",
    icon: "📒",
    path: "/collection-register",
    category: "Collection",
    color: "cyan",
    badge: "Register",
  },
  {
    id: "milk-summary",
    title: "Milk Summary",
    description:
      "View consolidated cow, buffalo and total milk quantity and amount summaries.",
    icon: "🥛",
    path: "/milk-summary",
    category: "Collection",
    color: "teal",
    badge: "Summary",
  },
  {
    id: "fat-snf-report",
    title: "FAT & SNF Report",
    description:
      "Review milk-quality records including FAT, SNF, rate and calculated amount.",
    icon: "🧪",
    path: "/fat-snf-report",
    category: "Quality",
    color: "purple",
    badge: "Quality",
  },
  {
    id: "member-bill",
    title: "Member Bill",
    description:
      "Generate an individual member's 10-day milk bill with deductions and net payable.",
    icon: "🧾",
    path: "/member-bill",
    category: "Billing",
    color: "green",
    badge: "Billing",
  },
  {
    id: "bill-history",
    title: "Bill History",
    description:
      "Review generated bills according to member, billing month and billing cycle.",
    icon: "📚",
    path: "/bill-history",
    category: "Billing",
    color: "indigo",
    badge: "History",
  },
  {
    id: "print-all-bills",
    title: "Print All Bills",
    description:
      "Prepare and print bills for all eligible members in the selected billing cycle.",
    icon: "🖨️",
    path: "/print-all-bills",
    category: "Billing",
    color: "slate",
    badge: "Print",
  },
  {
    id: "payment-register",
    title: "Payment Register",
    description:
      "Track bill payments, payment status, payable amounts and member transactions.",
    icon: "💳",
    path: "/payment-register",
    category: "Finance",
    color: "blue",
    badge: "Payments",
  },
  {
    id: "feed-advance-report",
    title: "Feed & Advance Report",
    description:
      "Review feed deductions, member advances, paid values and outstanding balances.",
    icon: "🌾",
    path: "/feed-advance-report",
    category: "Finance",
    color: "orange",
    badge: "Deductions",
  },
  {
    id: "reserve-report",
    title: "Reserve Report",
    description:
      "View member-wise reserve deductions accumulated from generated milk bills.",
    icon: "🏦",
    path: "/reserve-report",
    category: "Finance",
    color: "red",
    badge: "Reserve",
  },
  {
    id: "analytics",
    title: "Charts & Analytics",
    description:
      "Explore collection trends, animal-wise milk contribution and business performance.",
    icon: "📊",
    path: "/analytics",
    category: "Analytics",
    color: "indigo",
    badge: "Charts",
  },
  {
    id: "feed-management",
    title: "Feed Management",
    description:
      "Open the complete cattle-feed entry, update, payment and deduction component.",
    icon: "🌾",
    path: "/feed-management",
    category: "Management",
    color: "orange",
    badge: "Feed",
  },
  {
    id: "advance-management",
    title: "Advance Management",
    description:
      "Open member advance entry, update, recovery and remaining-balance management.",
    icon: "💰",
    path: "/advance-management",
    category: "Management",
    color: "red",
    badge: "Advance",
  },
  {
    id: "rate-master",
    title: "Rate Master",
    description:
      "Configure cow and buffalo milk prices according to FAT and SNF combinations.",
    icon: "📈",
    path: "/rate-master",
    category: "Configuration",
    color: "cyan",
    badge: "Rates",
  },
  {
    id: "backup",
    title: "Backup & Restore",
    description:
      "Download a system backup, restore saved records and inspect backup summaries.",
    icon: "💾",
    path: "/backup",
    category: "System",
    color: "slate",
    badge: "Backup",
  },
];

export default reportMenu;