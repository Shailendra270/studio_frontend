export interface VideoData {
  id: string;
  title: string;
  date: string;
  time: string;
  thumbnail: string;
  category: {
    name: string;
    color: string;
  };
  status: {
    name: string;
    color: string;
    background: string;
  };
  clips: number;
  role: string;
}

export const mockVideoData: VideoData[] = [
  {
    id: "1",
    title: "Bangladesh vs Bhutan | FIFA Friendl...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_1000/v1690594400/catalog/1685096358785175552/upkvqobmwabmuua9upta.jpg",
    category: { name: "Soccer", color: "#00932C" },
    status: { name: "Scheduled", color: "#000", background: "#FFF" },
    clips: 30,
    role: "Editor",
  },
  {
    id: "3",
    title: "Sri Lanka vs Bangladesh, 2nd Test g...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594431/catalog/1685096358785175552/d1gf6aglkusikanteyhz.jpg",
    category: { name: "Cricket", color: "#003893" },
    status: { name: "Live", color: "#FFF", background: "#F00" },
    clips: 30,
    role: "Live editor",
  },
  {
    id: "2",
    title: "NBA Basketball in New York 2025",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_1000/v1690594400/catalog/1685096358785175552/upkvqobmwabmuua9upta.jpg",
    category: { name: "Basketball", color: "#930000" },
    status: { name: "Scheduled", color: "#000", background: "#FFF" },
    clips: 30,
    role: "Editor",
  },
  {
    id: "4",
    title: "Bangladesh vs Bhutan | FIFA Friendl...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594421/catalog/1685096358785175552/wpl997ecb9dxpia7lctv.jpg",
    category: { name: "Soccer", color: "#00932C" },
    status: { name: "Scheduled", color: "#000", background: "#FFF" },
    clips: 30,
    role: "Editor",
  },
  {
    id: "5",
    title: "Bangladesh vs Bhutan | FIFA Friendl...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_1000/v1690594400/catalog/1685096358785175552/upkvqobmwabmuua9upta.jpg",
    category: { name: "Soccer", color: "#00932C" },
    status: { name: "Completed", color: "#000", background: "#00CF45" },
    clips: 30,
    role: "Editor",
  },
  {
    id: "6",
    title: "Bangladesh vs Bhutan | FIFA Friendl...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594449/catalog/1685096358785175552/tkbhtg94scygqgf51zzk.jpg",
    category: { name: "Soccer", color: "#00932C" },
    status: { name: "Live editor", color: "#FFF", background: "#DC2626" },
    clips: 30,
    role: "Live editor",
  },
  {
    id: "7",
    title: "Bangladesh vs Bhutan | FIFA Friendl...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_1000/v1690594400/catalog/1685096358785175552/upkvqobmwabmuua9upta.jpg",
    category: { name: "Soccer", color: "#00932C" },
    status: { name: "Live", color: "#FFF", background: "#F00" },
    clips: 30,
    role: "Live editor",
  },
  {
    id: "8",
    title: "NBA Basketball in New York 2025",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594449/catalog/1685096358785175552/tkbhtg94scygqgf51zzk.jpg",
    category: { name: "Basketball", color: "#930000" },
    status: { name: "Archived", color: "#FFF", background: "#DC2626" },
    clips: 30,
    role: "Editor",
  },
  {
    id: "9",
    title: "Sri Lanka vs Bangladesh, 2nd Test g...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594421/catalog/1685096358785175552/wpl997ecb9dxpia7lctv.jpg",
    category: { name: "Cricket", color: "#003893" },
    status: { name: "Scheduled", color: "#000", background: "#FFF" },
    clips: 30,
    role: "Editor",
  },
  {
    id: "10",
    title: "Bangladesh vs Bhutan | FIFA Friendl...",
    date: "Jun 26, 2025",
    time: "12:10",
    thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594431/catalog/1685096358785175552/d1gf6aglkusikanteyhz.jpg",
    category: { name: "Soccer", color: "#00932C" },
    status: { name: "Scheduled", color: "#000", background: "#FFF" },
    clips: 30,
    role: "Editor",
  },
];
