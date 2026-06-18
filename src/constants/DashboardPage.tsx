import {
  User,
  HelpCircle,
  BarChart3,
  FileText,
} from "lucide-react";

// export const CloudIcon = () => (
//   <svg
//     width="21"
//     height="18"
//     viewBox="0 0 22 18"
//     fill="none"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <path
//       d="M11 5L7.90142 10.3669H14.0986L11 5ZM11 13.7051H11.5367V9.8302H11H10.4633V13.7051H11Z"
//       fill="white"
//     />
//     <path
//       d="M10.5879 0.75C12.2813 0.75 13.9152 1.35753 15.1836 2.45605C16.4517 3.55438 17.2672 5.0679 17.4814 6.71191L17.5283 7.06738L17.834 7.25488C18.8195 7.85847 19.584 8.75193 20.0205 9.80566C20.4568 10.8592 20.544 12.0206 20.2695 13.125C19.9949 14.2297 19.3724 15.2233 18.4883 15.9619C17.604 16.7006 16.5033 17.1467 15.3438 17.2344L15.1348 17.25H6.04199L5.83301 17.2344C4.67336 17.1467 3.5728 16.7006 2.68848 15.9619C1.80431 15.2233 1.18182 14.2297 0.907227 13.125C0.632744 12.0205 0.719899 10.8592 1.15625 9.80566C1.59277 8.75186 2.35716 7.85847 3.34277 7.25488L3.64844 7.06738L3.69434 6.71191C3.90854 5.0679 4.72509 3.55438 5.99316 2.45605C7.26141 1.35769 8.89466 0.750083 10.5879 0.75Z"
//       stroke="white"
//       strokeWidth="1.5"
//     />
//   </svg>
// );

// export const HighlightsIcon = () => (
//   <svg
//     width="22"
//     height="16"
//     viewBox="0 0 22 16"
//     fill="none"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <path
//       d="M10.1858 9.06412L0.79144 15.3274C0.714746 15.3784 0.625645 15.4077 0.533627 15.4121C0.44161 15.4165 0.350121 15.3959 0.268906 15.3524C0.18769 15.3089 0.11979 15.2442 0.0724356 15.1652C0.0250816 15.0862 4.75887e-05 14.9958 0 14.9037V0.509029C4.75887e-05 0.416906 0.0250816 0.326521 0.0724356 0.247501C0.11979 0.16848 0.18769 0.103784 0.268906 0.0603014C0.350121 0.0168193 0.44161 -0.00382006 0.533627 0.000581848C0.625645 0.00498376 0.714746 0.0342622 0.79144 0.0852984L10.1858 6.34857V0.509029C10.1859 0.416906 10.2109 0.326521 10.2583 0.247501C10.3056 0.16848 10.3735 0.103784 10.4547 0.0603014C10.536 0.0168193 10.6274 -0.00382006 10.7195 0.000581848C10.8115 0.00498376 10.9006 0.0342622 10.9773 0.0852984L21.7733 7.28261C21.843 7.32912 21.9002 7.39213 21.9397 7.46605C21.9793 7.53997 22 7.62251 22 7.70634C22 7.79018 21.9793 7.87272 21.9397 7.94664C21.9002 8.02055 21.843 8.08356 21.7733 8.13008L10.9773 15.3274C10.9006 15.3784 10.8115 15.4077 10.7195 15.4121C10.6274 15.4165 10.536 15.3959 10.4547 15.3524C10.3735 15.3089 10.3056 15.2442 10.2583 15.1652C10.2109 15.0862 10.1859 14.9958 10.1858 14.9037V9.06412ZM8.54999 7.70634L2.03717 3.36412V12.0486L8.54999 7.70634ZM12.223 3.36412V12.0486L18.7358 7.70634L12.223 3.36412Z"
//       fill="white"
//     />
//   </svg>
// );

export const dashboardStats = [
  {
    label: "Total videos",
    value: "1,657",
    iconType: "total-videos",
    color: "text-blue-400",
  },
  {
    label: "Live streams",
    value: "86",
    iconType: "live-streams",
    color: "text-red-400",
  },
  {
    label: "Completed videos",
    value: "570",
    iconType: "completed-videos",
    color: "text-green-400",
  },
  {
    label: "Highlights",
    value: "5,130",
    iconType: "highlights",
    color: "text-yellow-400",
  },
  {
    label: "Published",
    value: "972",
    iconType: "published",
    color: "text-purple-400",
  },
];

// Sidebar items — permissionModule used for role-based visibility; superadminOnly hides for non-superadmin
export const sidebarItems = [
  { iconType: 'home', label: "Home", path: "/dashboard", active: true, permissionModule: "Dashboard" as const },
  { iconType: 'highlights', label: "Highlights", path: "/my-highlights", permissionModule: "Highlights" as const },
  { iconType: 'published', label: "Published", path: "/publish-history", permissionModule: "Published" as const },
  { iconType: 'assets', label: "Assets", path: "/assets", permissionModule: "Assets" as const },
  { iconType: 'organizations', label: "Orgs", path: "/organizations", superadminOnly: true },
  { iconType: 'monitoring', label: "Monitoring", path: "/monitoring", superadminOnly: true },
  { iconType: 'settings', label: "Settings", path: "/settings", permissionModule: "Settings" as const },
];

export const profileMenuItems = [
  { icon: User, label: "Profile" },
  { icon: BarChart3, label: "Overview" },
  { icon: FileText, label: "Publish History", path: "/publish-history" },
  // { icon: Building, label: "Organization Profile" },
  { icon: HelpCircle, label: "Help" },
];

export const STATUS_STYLES: Record<number, { name: string; color: string; background: string }> = {
  1: { name: "Completed", color: "#000", background: "#00CF45" },
  2: { name: "Live", color: "#FFF", background: "#F00" },
  3: { name: "Processing", color: "#000", background: "yellow" },
  4: { name: "Pending", color: "#000", background: "#ff32d3" },
  5: { name: "Failed", color: "#FFF", background: "red" },
  6: { name: "Cancelled", color: "#000", background: "#838d85" },
  7: { name: "Scheduled", color: "#000", background: "#FFF" },
  8: { name: "Delayed", color: "#000", background: "#ff32d3" },
}

export const CATEGORY_COLORS: { [key: string]: string } = {
  // Ball Sports
  'cricket': '#4A90E2',
  'basketball': '#FF6B6B',
  'soccer': '#4ECDC4',
  'football': '#FF8A65',
  'american_football': '#26C6DA',
  'australian_football': '#AB47BC',
  'volleyball': '#66BB6A',
  'beach_volleyball': '#FFB74D',
  'handball': '#EF5350',
  'beach_handball': '#FFA726',
  'water_polo': '#42A5F5',
  'rugby_sevens': '#8BC34A',
  'baseball_softball': '#78909C',
  'tennis': '#9CCC65',
  'table_tennis': '#FF7043',
  'badminton': '#FFCA28',
  'squash': '#7986CB',
  'padel': '#A1C181',
  'pickleball': '#81C784',
  'netball': '#F06292',
  'sepak_takraw': '#FFD54F',
  'basque_pelota': '#90A4AE',

  // Combat Sports
  'boxing': '#E57373',
  'mma': '#F44336',
  'ufc': '#D32F2F',
  'wrestling': '#FF5722',
  'judo': '#795548',
  'karate': '#607D8B',
  'taekwondo': '#9E9E9E',
  'kickboxing': '#FF9800',
  'muay_thai': '#FF6F00',
  'jiu_jitsu': '#6A1B9A',
  'fencing': '#37474F',
  'sumo': '#8D6E63',
  'sambo': '#5D4037',
  'kurash': '#3E2723',
  'pencak_silat': '#424242',

  // Water Sports
  'swimming': '#29B6F6',
  'diving': '#0288D1',
  'artistic_swimming': '#03A9F4',
  'marathone_swimming': '#0277BD',
  'sailing': '#0097A7',
  'rowing': '#00838F',
  'canoe_flatwater': '#006064',
  'canoe_slalom': '#004D40',
  'surfing': '#00BCD4',
  'jet_ski': '#26C6DA',

  // Winter Sports
  'ice_hockey': '#81C784',
  'figure_skating': '#E1BEE7',
  'speed_skating': '#B39DDB',
  'short_track_speed_skating': '#9575CD',
  'alpine_skiing': '#7986CB',
  'cross_country_skiing': '#5C6BC0',
  'freestyle_skiing': '#3F51B5',
  'ski_jumping': '#3949AB',
  'nordic_combined': '#303F9F',
  'ski_mountaineering': '#283593',
  'snowboard': '#1A237E',
  'biathlon': '#C5CAE9',
  'bobsleight': '#9FA8DA',
  'luge': '#7986CB',
  'skeleton': '#5C6BC0',
  'curling': '#3F51B5',

  // Gymnastics & Acrobatics
  'artistic_gymnastics': '#F8BBD9',
  'rhythmic_gymnastics': '#F48FB1',
  'acrobatic_gymnastics': '#F06292',
  'trampoline': '#EC407A',
  'breaking': '#E91E63',

  // Track & Field
  'athletics': '#FFAB91',
  'relay': '#FF8A65',

  // Cycling
  'cycling_road': '#A5D6A7',
  'cycling_track': '#81C784',
  'cycling_mountain_bike': '#66BB6A',
  'cycling_bmx_racing': '#4CAF50',
  'cycling_bmx_freestyle': '#388E3C',

  // Racquet Sports
  'golf': '#C8E6C9',
  'archery': '#DCEDC8',
  'shooting': '#F0F4C3',

  // Strength Sports
  'weightlifting': '#FFCDD2',
  'powerlifting': '#F8BBD9',

  // Team Sports
  'hockey': '#B2DFDB',
  'lacrosse': '#80CBC4',
  'floorball': '#4DB6AC',
  'bandy': '#26A69A',
  'futsal': '#009688',
  'kabaddi': '#00796B',

  // Motor Sports
  'motorsport': '#FFCCBC',
  'greyhound_racing': '#BCAAA4',
  'horse_racing': '#A1887F',

  // Precision Sports
  'billiards': '#D7CCC8',
  'snooker': '#BCAAA4',
  'darts': '#A1887F',
  'bowling': '#8D6E63',
  'bocce': '#795548',
  'boccia': '#6D4C41',
  'bowls': '#5D4037',

  // Board & Mind Sports
  'chess': '#CFD8DC',
  'bridge': '#B0BEC5',
  'dominoes': '#90A4AE',

  // Climbing & Adventure
  'sport_climbing': '#FFECB3',
  'skateboarding': '#FFE082',
  'roller_speed_skating': '#FFD54F',
  'paragliding': '#FFCC02',

  // Multi-discipline
  'triathlon': '#E8F5E8',
  'modern_pentathlon': '#C8E6C9',
  'multisport': '#A5D6A7',

  // Martial Arts (Traditional)
  'wushu': '#FFCDD2',
  'goalball': '#F8BBD9',

  // E-Sports
  'e_sports': '#E1BEE7',
  'call_of_duty': '#CE93D8',
  'cs_2': '#BA68C8',
  'dota2': '#AB47BC',
  'eFootball': '#9C27B0',
  'ea_fc': '#8E24AA',
  'league_of_legends': '#7B1FA2',
  'nba_2k': '#6A1B9A',
  'overwatch_2': '#4A148C',
  'pubg': '#E8EAF6',
  'rainbow_six_siege': '#C5CAE9',
  'rocket_league': '#9FA8DA',
  'starcraft_2': '#7986CB',
  'tekken': '#5C6BC0',

  // Entertainment
  'entertainment': '#FFE0B2',

  // Equestrian
  'equestrian': '#D1C4E9'
};

export const getCategoryColorFromConstant = (categoryName: string, fallback?: string) => {
  const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_COLORS[normalizedCategory] || fallback || '#9E9E9E';
};
