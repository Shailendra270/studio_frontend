import { ClipData } from "../clips_mockData/mockClips";

export interface PublishedEvent {
  date: string;
  published: number;
  failed: number;
  content: ClipData[];
}

export interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  publishedCount: number;
  failedCount: number;
  hasContent: boolean;
}

export const mockPublishedEvents: Record<string, PublishedEvent> = {
  "2025-09-01": {
    date: "2025-09-01",
    published: 3,
    failed: 0,
    content: [
      {
        id: "pub-101",
        title: "Asia Cup 25 - Afghanistan vs Hong Kong",
        date: "Sep 1, 2025",
        time: "10:31",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/02Ws56jDa/t_278f58_1.jpg",
        timestamp: "10:31 AM",
        duration: "00:04:52",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Cricket", "Asia Cup", "Highlights"],
        event: "Asia Cup 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Asia Cup 2025 Group Stage: Afghanistan vs Hong Kong – key highlights.",
        publishedDate: "2025-09-01",
        platforms: ["YouTube", "Facebook", "TikTok"]
      },
     {
        id: "pub-108",
        title: "Asia Cup 25 - Afghanistan vs Hong Kong",
        date: "Sep 1, 2025",
        time: "10:31",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/02Ws56jDa/t_c1bcbd_1.jpg",
        timestamp: "10:31 AM",
        duration: "00:02:35",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Cricket", "Asia Cup", "Highlights"],
        event: "Asia Cup 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Asia Cup 2025 Group Stage: Afghanistan vs Hong Kong – key highlights.",
        publishedDate: "2025-09-01",
        platforms: ["YouTube", "Facebook", "TikTok"]
      },
      {
        id: "pub-103",
        title: "Asia Cup 25 - Afghanistan vs Hong Kong",
        date: "Sep 1, 2025",
        time: "10:31",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/02Ws56jDa/t_fb8c7b_2.jpg",
        timestamp: "10:31 AM",
        duration: "00:03:24",
        aspectRatio: "16:9",
        rating: 3,
        tags: ["Cricket", "Asia Cup", "Highlights"],
        event: "Asia Cup 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Asia Cup 2025 Group Stage: Afghanistan vs Hong Kong – key highlights.",
        publishedDate: "2025-09-01",
        platforms: ["YouTube", "Facebook", "TikTok"]
      }
    ]
  },
  "2025-09-07": {
    date: "2025-09-07",
    published: 3,
    failed: 0,
    content: [
      {
        id: "pub-105",
        title: "Zimbabwe vs Sri Lanka",
        date: "Sep 7, 2025",
        time: "21:56",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_810168_1.jpg",
        timestamp: "09:56 PM",
        duration: "00:06:10",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Cricket", "ODI", "Highlights"],
        event: "Bilateral Series",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Zimbabwe vs Sri Lanka ODI match highlights – top batting and bowling.",
        publishedDate: "2025-09-07",
        platforms: ["YouTube", "Instagram", "TikTok"]
      },
       {
        id: "pub-107",
        title: "Zimbabwe vs Sri Lanka",
        date: "Sep 7, 2025",
        time: "21:56",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_e3f58d_1.jpg",
        timestamp: "09:56 PM",
        duration: "00:04:23",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Cricket", "ODI", "Highlights"],
        event: "Bilateral Series",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Zimbabwe vs Sri Lanka ODI match highlights – top batting and bowling.",
        publishedDate: "2025-09-07",
        platforms: ["YouTube", "Instagram", "TikTok"]
      },
      {
        id: "pub-121",
        title: "Zimbabwe vs Sri Lanka",
        date: "Sep 7, 2025",
        time: "21:56",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/Bgk0LrGbi/t_6d640e_1.jpg",
        timestamp: "09:56 PM",
        duration: "00:05:23",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Cricket", "ODI", "Highlights"],
        event: "Bilateral Series",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Zimbabwe vs Sri Lanka ODI match highlights – top batting and bowling.",
        publishedDate: "2025-09-07",
        platforms: ["YouTube", "Instagram", "TikTok"]
      }
    ]
  },
  "2025-09-09": {
    date: "2025-09-09",
    published: 2,
    failed: 0,
    content: [
      {
        id: "pub-104",
        title: "EFL League One leyton orient vs stockport stats",
        date: "Sep 9, 2025",
        time: "19:30",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/ynM6UeYRL/t_a5c144_1.jpg",
        timestamp: "07:30 PM",
        duration: "00:07:00",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Football", "Asia Cup", "Rivals"],
        event: "Asia Cup Super Four",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "EFL League One leyton orient vs stockport statsthriller match highlights.",
        publishedDate: "2025-09-09",
        platforms: ["YouTube", "Facebook", "TikTok", "Instagram"]
      },
       {
        id: "pub-114",
        title: "EFL League One leyton orient vs stockport stats",
        date: "Sep 9, 2025",
        time: "19:30",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/ynM6UeYRL/t_0cf7e6_1.jpg",
        timestamp: "03:25 PM",
        duration: "00:03:45",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Football", "Asia Cup", "Rivals"],
        event: "Asia Cup Super Four",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "EFL League One leyton orient vs stockport statsthriller match highlights.",
        publishedDate: "2025-09-09",
        platforms: ["YouTube", "Facebook", "TikTok", "Instagram"]
      }
    ]
  },
  "2025-09-12": {
    date: "2025-09-11",
    published: 3,
    failed: 0,
    content: [
      {
        id: "pub-106",
        title: "Barbados Royals vs Saint Lucia Kings",
        date: "Sep 11, 2025",
        time: "20:00",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/MJMrwL0dU/t_3e130f_1.jpg",
        timestamp: "08:00 PM",
        duration: "00:05:40",
        aspectRatio: "16:9",
        rating: 3,
        tags: ["Cricket", "T20I", "Highlights"],
        event: "England Tour",
        status: { name: "Published", color: "#FFF", background: "#FF4444" },
        selected: false,
        description: "CPL - Barbados Royals vs Saint Lucia Kings – quick match recap and highlights.",
        publishedDate: "2025-09-11",
        platforms: ["Facebook", "Instagram", "TikTok"]
      },
       {
        id: "pub-116",
        title: "Barbados Royals vs Saint Lucia Kings",
        date: "Sep 11, 2025",
        time: "20:00",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/MJMrwL0dU/t_cba408_1.jpg",
        timestamp: "08:00 PM",
        duration: "00:04:22",
        aspectRatio: "16:9",
        rating: 3,
        tags: ["Cricket", "T20I", "Highlights"],
        event: "England Tour",
        status: { name: "Published", color: "#FFF", background: "#FF4444" },
        selected: false,
        description: "CPL - Barbados Royals vs Saint Lucia Kings – quick match recap and highlights.",
        publishedDate: "2025-09-11",
        platforms: ["Facebook", "Instagram", "TikTok"]
      },
       {
        id: "pub-117",
        title: "Barbados Royals vs Saint Lucia Kings",
        date: "Sep 11, 2025",
        time: "20:00",
        thumbnail: "https://storage.googleapis.com/stream_outcome/video_sample_testing/MJMrwL0dU/t_634552_1.jpg",
        timestamp: "08:00 PM",
        duration: "00:02:36",
        aspectRatio: "16:9",
        rating: 3,
        tags: ["Cricket", "T20I", "Highlights"],
        event: "England Tour",
        status: { name: "Published", color: "#FFF", background: "#FF4444" },
        selected: false,
        description: "CPL - Barbados Royals vs Saint Lucia Kings – quick match recap and highlights.",
        publishedDate: "2025-09-11",
        platforms: ["Facebook", "Instagram", "TikTok"]
      }
    ]
  },
  "2025-10-02": {
    date: "2025-10-02",
    published: 2,
    failed: 0,
    content: [
      {
        id: "pub-201",
        title: "India vs West Indies - Match Highlights",
        date: "Oct 2, 2025",
        time: "14:30",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-xi6vR9wh6/20251011-Zentag-AI-Clip/t_984614_1.jpg",
        timestamp: "02:30 PM",
        duration: "00:05:45",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Cricket", "India", "West Indies", "Highlights"],
        event: "West Indies tour of India, 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "India vs West Indies - West Indies tour of India, 2025 - Match highlights featuring key moments.",
        publishedDate: "2025-10-02",
        platforms: ["YouTube", "Facebook", "Instagram"]
      },
      {
        id: "pub-202",
        title: "India vs West Indies - Best Moments",
        date: "Oct 2, 2025",
        time: "16:15",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-xi6vR9wh6/20251011-Zentag-AI-Clip/t_aa2454_1.jpg",
        timestamp: "04:15 PM",
        duration: "00:04:20",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Cricket", "India", "West Indies", "Best Moments"],
        event: "West Indies tour of India, 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "India vs West Indies - West Indies tour of India, 2025 - Best moments and key plays compilation.",
        publishedDate: "2025-10-02",
        platforms: ["YouTube", "TikTok", "Instagram"]
      }
    ]
  },
  "2025-10-01": {
    date: "2025-10-01",
    published: 3,
    failed: 0,
    content: [
      {
        id: "pub-301",
        title: "UCL 2024-25 - Arsenal vs Olympiacos - Match Highlights",
        date: "Oct 1, 2025",
        time: "20:45",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-WTlOMs2zx/20251010-Zentag-AI-Clip/t_b95a3c_1.jpg",
        timestamp: "08:45 PM",
        duration: "00:06:30",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Football", "UCL", "Arsenal", "Olympiacos", "Highlights"],
        event: "UCL 2024-25",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "UCL 2024-25 - Arsenal vs Olympiacos - Complete match highlights with all goals and key moments.",
        publishedDate: "2025-10-01",
        platforms: ["YouTube", "Facebook", "Instagram"]
      },
      {
        id: "pub-302",
        title: "UCL 2024-25 - Arsenal vs Olympiacos - Best Goals",
        date: "Oct 1, 2025",
        time: "21:30",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-WTlOMs2zx/20251013-Zentag-AI-Clip/t_b1caa4_1.jpg",
        timestamp: "09:30 PM",
        duration: "00:03:45",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Football", "UCL", "Arsenal", "Olympiacos", "Goals"],
        event: "UCL 2024-25",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "UCL 2024-25 - Arsenal vs Olympiacos - Collection of the best goals from the match.",
        publishedDate: "2025-10-01",
        platforms: ["YouTube", "TikTok", "Instagram"]
      },
      {
        id: "pub-303",
        title: "UCL 2024-25 - Arsenal vs Olympiacos - Key Saves & Tackles",
        date: "Oct 1, 2025",
        time: "22:15",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-WTlOMs2zx/20251013-Zentag-AI-Clip/t_b96b9d_1.jpg",
        timestamp: "10:15 PM",
        duration: "00:04:15",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Football", "UCL", "Arsenal", "Olympiacos", "Saves", "Tackles"],
        event: "UCL 2024-25",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "UCL 2024-25 - Arsenal vs Olympiacos - Best defensive plays, saves and tackles from both teams.",
        publishedDate: "2025-10-01",
        platforms: ["Facebook", "Instagram", "TikTok"]
      }
    ]
  },
  "2025-10-05": {
    date: "2025-10-05",
    published: 2,
    failed: 0,
    content: [
      {
        id: "pub-501",
        title: "Bundesliga - Borussia Dortmund vs RB Leipzig - Match Highlights",
        date: "Oct 5, 2025",
        time: "15:30",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-jaheVXYzv/20251011-Zentag-AI-Clip/t_c32fbd_1.jpg",
        timestamp: "03:30 PM",
        duration: "00:08:15",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Football", "Bundesliga", "Borussia Dortmund", "RB Leipzig", "Highlights"],
        event: "Bundesliga 2024-25",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Bundesliga - Borussia Dortmund vs RB Leipzig - Complete match highlights featuring all goals and key moments from this exciting encounter.",
        publishedDate: "2025-10-05",
        platforms: ["YouTube", "Facebook", "Instagram"]
      },
      {
        id: "pub-502",
        title: "Bundesliga - Borussia Dortmund vs RB Leipzig - Best Goals",
        date: "Oct 5, 2025",
        time: "16:15",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-jaheVXYzv/20251011-Zentag-AI-Clip/t_888617_1.jpg",
        timestamp: "04:15 PM",
        duration: "00:04:45",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Football", "Bundesliga", "Goals", "Borussia Dortmund", "RB Leipzig"],
        event: "Bundesliga 2024-25",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Bundesliga - Borussia Dortmund vs RB Leipzig - Collection of the best goals scored in this thrilling match.",
        publishedDate: "2025-10-05",
        platforms: ["YouTube", "Instagram", "TikTok"]
      }
    ]
  },
  "2025-10-10": {
    date: "2025-10-10",
    published: 3,
    failed: 0,
    content: [
      {
        id: "pub-601",
        title: "ICC WWC 25 - India Women vs South Africa Women - Match Highlights",
        date: "Oct 10, 2025",
        time: "14:00",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-yZgwpFYJW/20251010-Zentag-AI-Clip/t_814a5f_1.jpg",
        timestamp: "02:00 PM",
        duration: "00:09:30",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Cricket", "ICC WWC", "India Women", "South Africa Women", "Highlights"],
        event: "ICC Women's World Cup 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "ICC WWC 25 - India Women vs South Africa Women - Complete match highlights featuring all boundaries, wickets and key moments from this thrilling encounter.",
        publishedDate: "2025-10-10",
        platforms: ["YouTube", "Facebook", "Instagram"]
      },
      {
        id: "pub-602",
        title: "ICC WWC 25 - India Women vs South Africa Women - Best Batting",
        date: "Oct 10, 2025",
        time: "15:15",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-yZgwpFYJW/20251010-Zentag-AI-Clip/t_ba92cd_1.jpg",
        timestamp: "03:15 PM",
        duration: "00:05:45",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Cricket", "ICC WWC", "Batting", "India Women", "South Africa Women"],
        event: "ICC Women's World Cup 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "ICC WWC 25 - India Women vs South Africa Women - Collection of the best batting performances and boundaries from both teams.",
        publishedDate: "2025-10-10",
        platforms: ["YouTube", "Instagram", "TikTok"]
      },
      {
        id: "pub-603",
        title: "ICC WWC 25 - India Women vs South Africa Women - Best Bowling",
        date: "Oct 10, 2025",
        time: "16:30",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-yZgwpFYJW/20251010-Zentag-AI-Clip/t_22febd_1.jpg",
        timestamp: "04:30 PM",
        duration: "00:04:20",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Cricket", "ICC WWC", "Bowling", "India Women", "South Africa Women"],
        event: "ICC Women's World Cup 2025",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "ICC WWC 25 - India Women vs South Africa Women - Spectacular bowling performances, wickets and fielding highlights from the match.",
        publishedDate: "2025-10-10",
        platforms: ["Facebook", "Instagram", "Twitter"]
      }
    ]
  }
  ,
  "2025-11-07": {
    date: "2025-11-07",
    published: 2,
    failed: 0,
    content: [
      {
        id: "pub-701",
        title: "UCL_2024-25 - Man City Vs Dortmund",
        date: "Nov 7, 2025",
        time: "19:45",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-G9ogt1WJh/20251112-Zentag-AI-Clip/t_0bb4bf_1.jpg",
        timestamp: "07:45 PM",
        duration: "00:06:55",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Football", "UCL_2024-25", "Manchester City", "Dortmund", "Highlights"],
        event: "UCL_2024-25",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "UCL_2024-25 - Man City Vs Dortmund - full match highlights with all goals and key moments.",
        publishedDate: "2025-11-07",
        platforms: ["YouTube", "Facebook", "Instagram"]
      },
      {
        id: "pub-702",
        title: "UCL_2024-25 - Man City Vs Dortmund - Best Goals",
        date: "Nov 7, 2025",
        time: "21:05",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-G9ogt1WJh/20251112-Zentag-AI-Clip/t_393ff2_1.jpg",
        timestamp: "09:05 PM",
        duration: "00:04:12",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Football", "UCL_2024-25", "Goals"],
        event: "Premier League 2025-26",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "UCL_2024-25 - Man City Vs Dortmund - compilation of the best goals from the match.",
        publishedDate: "2025-11-07",
        platforms: ["YouTube", "TikTok", "Instagram"]
      },
      // {
      //   id: "pub-703",
      //   title: "UCL_2024-25 - Man City Vs Dortmund - Defensive Highlights",
      //   date: "Nov 7, 2025",
      //   time: "22:00",
      //   thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-G9ogt1WJh/20251112-Zentag-AI-Clip/t_d95ba8_1.jpg",
      //   timestamp: "10:00 PM",
      //   duration: "00:03:50",
      //   aspectRatio: "16:9",
      //   rating: 4,
      //   tags: ["Football", "UCL_2024-25", "Saves", "Tackles"],
      //   event: "Premier League 2025-26",
      //   status: { name: "Published", color: "#FFF", background: "#00CF45" },
      //   selected: false,
      //   description: "UCL_2024-25 - Man City Vs Dortmund - best saves and defensive plays.",
      //   publishedDate: "2025-11-07",
      //   platforms: ["Facebook", "Instagram", "TikTok"]
      // }
    ]
  },
  "2025-11-10": {
    date: "2025-11-10",
    published: 2,
    failed: 0,
    content: [
      {
        id: "pub-711",
        title: "Pakistan vs South Africa - ODI Highlights",
        date: "Nov 10, 2025",
        time: "13:20",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-EY8Mz1Lfk/20251110-Zentag-AI-Clip/t_9e282e_2.jpg",
        timestamp: "01:20 PM",
        duration: "00:07:10",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Cricket", "Pakistan", "South Africa", "Highlights"],
        event: "Pakistan vs South Africa ODI Series",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Pakistan vs South Africa ODI - full match highlights.",
        publishedDate: "2025-11-10",
        platforms: ["YouTube", "Facebook", "Instagram"]
      },
      {
        id: "pub-712",
        title: "Pakistan vs South Africa - Best Batting",
        date: "Nov 10, 2025",
        time: "14:40",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-EY8Mz1Lfk/20251110-Zentag-AI-Clip/t_8c4110_1.jpg",
        timestamp: "02:40 PM",
        duration: "00:04:30",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Cricket", "Batting", "Pakistan", "South Africa"],
        event: "Pakistan vs South Africa ODI Series",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "Pakistan vs South Africa ODI - best batting performances and boundaries.",  
        publishedDate: "2025-11-10",
        platforms: ["YouTube", "TikTok", "Instagram"]
      }
    ]
  },
  "2025-11-15": {
    date: "2025-11-15",
    published: 2,
    failed: 0,
    content: [
      {
        id: "pub-721",
        title: "La Liga - Barcelona vs Real Madrid - El Clásico Highlights",
        date: "Nov 15, 2025",
        time: "20:00",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-G9ogt1WJh/20251112-Zentag-AI-Clip/t_d95ba8_10.jpg",
        timestamp: "08:00 PM",
        duration: "00:08:05",
        aspectRatio: "16:9",
        rating: 5,
        tags: ["Football", "La Liga", "Barcelona", "Real Madrid", "Highlights"],
        event: "La Liga 2025-26",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "El Clásico - Barcelona vs Real Madrid - complete highlights with all goals and big moments.",
        publishedDate: "2025-11-15",
        platforms: ["YouTube", "Facebook", "Instagram"]
      },
      {
        id: "pub-722",
        title: "La Liga - Barcelona vs Real Madrid - Best Goals",
        date: "Nov 15, 2025",
        time: "21:30",
        thumbnail: "https://video.zentag.ai/Stream-Clips/Stream_id-G9ogt1WJh/20251112-Zentag-AI-Clip/t_393ff2_1.jpg",
        timestamp: "09:30 PM",
        duration: "00:03:55",
        aspectRatio: "16:9",
        rating: 4,
        tags: ["Football", "La Liga", "Goals"],
        event: "La Liga 2025-26",
        status: { name: "Published", color: "#FFF", background: "#00CF45" },
        selected: false,
        description: "El Clásico - Barcelona vs Real Madrid - best goals from the match.",
        publishedDate: "2025-11-15",
        platforms: ["YouTube", "TikTok", "Instagram"]
      }
    ]
  }
};


export const getCalendarData = (year: number, month: number): CalendarDay[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const calendar: CalendarDay[] = [];

  // Add previous month days to fill the first week
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const eventData = mockPublishedEvents[dateStr];
    
    calendar.push({
      day,
      isCurrentMonth: false,
      publishedCount: eventData?.published || 0,
      failedCount: eventData?.failed || 0,
      hasContent: Boolean(eventData)
    });
  }

  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const eventData = mockPublishedEvents[dateStr];
    
    calendar.push({
      day,
      isCurrentMonth: true,
      publishedCount: eventData?.published || 0,
      failedCount: eventData?.failed || 0,
      hasContent: Boolean(eventData)
    });
  }

  // Fill remaining days with next month
  const remainingDays = 42 - calendar.length; // 6 weeks * 7 days
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  
  for (let day = 1; day <= remainingDays; day++) {
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const eventData = mockPublishedEvents[dateStr];
    
    calendar.push({
      day,
      isCurrentMonth: false,
      publishedCount: eventData?.published || 0,
      failedCount: eventData?.failed || 0,
      hasContent: Boolean(eventData)
    });
  }

  return calendar;
};

export const getContentForDate = (dateStr: string): ClipData[] => {
  return mockPublishedEvents[dateStr]?.content || [];
};

export const getEventDataForDate = (dateStr: string): PublishedEvent | null => {
  return mockPublishedEvents[dateStr] || null;
};
