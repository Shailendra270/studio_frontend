export interface ClipData {
  id: string;
  title: string;
  date: string;
  time: string;
  thumbnail: string;
  timestamp: string;
  duration: string;
  aspectRatio: string;
  rating: number;
  tags: string[];
  event: string;
  type: string; 
  status: {
    name: string;
    color: string;
    background: string;
  };
  selected?: boolean;
  hasAI?: boolean;
  description?: string;
  publishedDate?: string;
  platforms?: string[];
  videoUrl?: string;
  poster?: string;

}

export const mockClipData: ClipData[] = [
  {
    id: "1",
    title: "Top off shot",
    date: "Sept 09, 2025",
    time: "12:10",
    thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_b084f2_2.jpg",
    timestamp: "00:10:47 - 00:11:37",
    duration: "00:00:50",
    aspectRatio: "16:9",
    rating: 4,
    tags: ["Lineups"],
    type: "Highlight",
    event: "Goal",
    status: { name: "Published", color: "#FFF", background: "#00CF45" },
    selected: false,
    platforms: ["YouTube", "Instagram", "TikTok", "Email"],
    // videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  },
  {
    id: "2",
    title: "Boundary! - Four",
    date: "Sept 09, 2025",
    time: "12:10",
    thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_6d640e_1.jpg",
    timestamp: "00:02:00 - 00:10:00",
    duration: "00:05:00",
    aspectRatio: "16:9",
    type: "Clip",
    rating: 5,
    tags: ["Shots on target", "Save", "Free kick", "+2"],
    event: "Corner kick",
    status: { name: "Unpublished", color: "#FFF", background: "#252525" },
    selected: false,
    hasAI: true,
    platforms: ["YouTube", "Instagram", "Email"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  },
  {
    id: "3",
    title: "Sent six runs!",
    date: "Sept 09, 2025",
    time: "12:10",
    thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_ba5b79_1.jpg",
    timestamp: "00:15:10 - 00:15:42",
    duration: "00:00:32",
    aspectRatio: "16:9",
     type: "Story",
    rating: 4,
    tags: ["Throw in", "Foul"],
    event: "Free kick",
    status: { name: "Unpublished", color: "#FFF", background: "#252525" },
    selected: false,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  },
  {
    id: "4",
    title: "Fantastic win!",
    date: "Sept 09, 2025",
    time: "12:10",
    thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_60f42e_1.jpg",
    timestamp: "00:16:30 - 00:17:02",
    duration: "00:00:26",
    aspectRatio: "16:9",
    rating: 5,
    tags: ["Offside"],
    type: "Highlight",
    event: "Foul",
    status: { name: "Unpublished", color: "#FFF", background: "#252525" },
    selected: false,
    hasAI: true,
    videoUrl: "//vjs.zencdn.net/v/oceans.mp4",
    platforms: ["YouTube", "Instagram", "Email"],
  },
  {
    id: "5",
    title: "Cracks it to - four",
    date: "Sept 09, 2025",
    time: "12:10",
    thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_1d9500_1.jpg",
    timestamp: "00:10:47 - 00:11:37",
    duration: "00:00:33",
    aspectRatio: "16:9",
    rating: 3,
    tags: ["Lineups"],
    type: "Highlight",
    event: "Goal",
    status: { name: "Published", color: "#FFF", background: "#00CF45" },
    selected: false,
    videoUrl: "//vjs.zencdn.net/v/oceans.mp4",
    platforms: ["YouTube", "Instagram", "TikTok", "Email"],

  },
  // {
  //   id: "6",
  //   title: "Dangerous attack 05",
  //   date: "Jun 26, 2025",
  //   time: "12:10",
  //   thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594421/catalog/1685096358785175552/wpl997ecb9dxpia7lctv.jpg",
  //   timestamp: "00:02:00 - 00:10:00",
  //   duration: "00:08:00",
  //   aspectRatio: "16:9",
  //   rating: 5,
  //   type: "Clip",
  //   tags: ["Shots on target", "Save", "Free kick", "+2"],
  //   event: "Corner kick",
  //   status: { name: "Unpublished", color: "#FFF", background: "#252525" },
  //   selected: false,
  //   hasAI: true,
  //   videoUrl: "//vjs.zencdn.net/v/oceans.mp4",
  //   platforms: ["YouTube", "Instagram", "Email"],
  //   description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas, quae. Quis, voluptas. Quis, voluptas. Quis, voluptas.",
  // },
  // {
  //   id: "7",
  //   title: "1st attack",
  //   date: "Jun 26, 2025",
  //   time: "12:10",
  //   thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_1000/v1690594400/catalog/1685096358785175552/upkvqobmwabmuua9upta.jpg",
  //   timestamp: "00:15:10 - 00:15:42",
  //   duration: "00:00:32",
  //   aspectRatio: "16:9",
  //   rating: 3,
  //   type: "Story",
  //   tags: ["Throw in", "Foul"],
  //   event: "Free kick",
  //   status: { name: "Unpublished", color: "#FFF", background: "#252525" },
  //   selected: false,
  //   videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  // },
  // {
  //   id: "8",
  //   title: "1st foul",
  //   date: "Jun 26, 2025",
  //   time: "12:10",
  //   thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_400/v1690594431/catalog/1685096358785175552/d1gf6aglkusikanteyhz.jpg",
  //   timestamp: "00:16:30 - 00:17:02",
  //   duration: "00:00:32",
  //   aspectRatio: "16:9",
  //   rating: 4,
  //   tags: ["Offside"],
  //   type: "Story",
  //   event: "Foul",
  //   status: { name: "Unpublished", color: "#FFF", background: "#252525" },
  //   selected: false,
  //   videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  // },
  // {
  //   id: "9",
  //   title: "Lineups",
  //   date: "Jun 26, 2025",
  //   time: "12:10",
  //   thumbnail: "https://res.cloudinary.com/upwork-cloud/image/upload/c_scale,w_1000/v1690594400/catalog/1685096358785175552/upkvqobmwabmuua9upta.jpg",
  //   timestamp: "00:10:47 - 00:11:37",
  //   duration: "00:00:50",
  //   aspectRatio: "16:9",
  //   rating: 4,
  //   type: "Highlight",
  //   tags: ["Lineups"],
  //   event: "Goal",
  //   status: { name: "Published", color: "#FFF", background: "#00CF45" },
  //   selected: false,
  //   videoUrl: "https://multistream-media-connect-data.s3.ap-south-1.amazonaws.com/Archive/multi_audio1.mp4"
  // },
];
