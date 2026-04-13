// Options and configuration for Video/Stream templates
// These are adapted to Studio and modeled after magnifi's config.

export const audioOptions = [
  { label: "PDI", value: "pdi" },
  { label: "ISO", value: "iso" },
  { label: "Track", value: "track" },
  // { label: "MP3", value: "mp3" },
  // { label: "AAC", value: "aac" },
  // { label: "AC3", value: "ac3" },
];

export const awsRegions = [
  { label: "US East (N. Virginia)", value: "us-east-1" },
  { label: "US West (Oregon)", value: "us-west-2" },
  { label: "EU (Frankfurt)", value: "eu-central-1" },
  { label: "EU (Ireland)", value: "eu-west-1" },
];

export const bitRateModes = [
  { label: "CBR", value: "CBR" },
  { label: "VBR", value: "VBR" },
  { label: "QVBR", value: "QVBR" },
];

export const fileTypes = [
  { label: "MP4", value: "mp4" },
  { label: "MOV", value: "mov" },
  { label: "TS", value: "ts" },
];

export const fpsModes = [
  { label: "Dynamic", value: "dynamic" },
  { label: "Fixed", value: "fixed" },
  // { label: "24", value: 24 },
  // { label: "25", value: 25 },
  // { label: "30", value: 30 },
  // { label: "50", value: 50 },
  // { label: "60", value: 60 },
];

export const streamingType = [
  { label: "HLS", value: "hls" },
  { label: "DASH", value: "dash" },
  // { label: "RTMP", value: "rtmp" },
];

export const mediaLiveInput = [
  { label: "HLS", value: "hls" },
  { label: "RTMP Push", value: "rtmp_push" },
  { label: "RTMP Pull", value: "rtmp_pull" },
  { label: "SRT Push", value: "srt_push" },
  { label: "SRT Pull", value: "srt_pull" },
];

export const mediaStaticInput = [
  // { label: "S3", value: "s3" },
  // { label: "URL", value: "url" },
  // { label: "File Upload", value: "upload" },
];

export const mediaLiveTemplateOption = [
  { label: "1080p (Full HD)", value: "1080p" },
  { label: "720p (HD)", value: "720p" },
  { label: "480p (SD)", value: "480p" },
];

export const gcpRegions = [
  { label: "US Central (Iowa)", value: "us-central1" },
  { label: "US East (South Carolina)", value: "us-east1" },
  { label: "US East (Virginia)", value: "us-east4" },
  { label: "US West (Oregon)", value: "us-west1" },
  { label: "US West (Los Angeles)", value: "us-west2" },
  { label: "North America (Montreal)", value: "northamerica-northeast1" },
  { label: "South America (São Paulo)", value: "southamerica-east1" },
  { label: "Europe West (Belgium)", value: "europe-west1" },
  { label: "Europe West (London)", value: "europe-west2" },
  { label: "Europe West (Frankfurt)", value: "europe-west3" },
  { label: "Europe West (Netherlands)", value: "europe-west4" },
  { label: "Europe West (Zurich)", value: "europe-west6" },
  { label: "Europe Central (Warsaw)", value: "europe-central2" },
  { label: "Asia East (Taiwan)", value: "asia-east1" },
  { label: "Asia East (Hong Kong)", value: "asia-east2" },
  { label: "Asia Northeast (Tokyo)", value: "asia-northeast1" },
  { label: "Asia Northeast (Osaka)", value: "asia-northeast2" },
  { label: "Asia Northeast (Seoul)", value: "asia-northeast3" },
  { label: "Asia Southeast (Singapore)", value: "asia-southeast1" },
  { label: "Asia Southeast (Jakarta)", value: "asia-southeast2" },
  { label: "Asia South (Mumbai)", value: "asia-south1" },
  { label: "Asia South (Delhi)", value: "asia-south2" },
  { label: "Australia Southeast (Sydney)", value: "australia-southeast1" },
  { label: "Middle East (Tel Aviv)", value: "me-west1" },
];

export const mediaLiveTemplateRegions = gcpRegions;

export const fillMultiAudioWithStreamOptions = [
  { label: "Copy from stream", value: "copy" },
  { label: "Manual", value: "manual" },
];
