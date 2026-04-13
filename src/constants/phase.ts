// Constants and option groups adapted for Studio template creation

export const PROGRAM_DATE_TIME = "PROGRAM-DATE-TIME";

export const backupInputTypes = [
  { label: "None", value: "none" },
  { label: "Secondary RTMP", value: "rtmp_secondary" },
  { label: "Backup URL", value: "backup_url" },
];

export const reservedChannelInputType = [
  { label: "Primary", value: "primary" },
  { label: "Reserved", value: "reserved" },
];

export const pushStreamInputTypes = [
  { label: "RTMP", value: "rtmp" },
  { label: "SRT", value: "srt" },
];

export const multiAudioOptions = [
  { label: "Disabled", value: "disabled" },
  { label: "Enabled", value: "enabled" },
];
