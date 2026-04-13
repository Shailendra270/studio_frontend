import {SelectOption} from "../components/ui/searchable-select";

// Options for select fields
  export const sportOptions: SelectOption[] = [
    { value: "football", label: "American Football" },
    { value: "soccer", label: "Soccer" },
    { value: "cricket", label: "Cricket" },
    { value: "basketball", label: "Basketball" },
    { value: "hockey", label: "Hockey" },
    { value: "tennis", label: "Tennis" },
    { value: "baseball", label: "Baseball" },
    { value: "golf", label: "Golf" },
  ];

  export const timezoneOptions: SelectOption[] = [
    // { value: "CEST", label: "CEST" },
    { value: "UTC", label: "UTC" },
    // { value: "IST", label: "IST" },
  ];

  export const sharingOptions: SelectOption[] = [
    { value: "dont-share", label: "Don't share this stream" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "restricted", label: "Restricted" },
  ];

  export const videoTemplateOptions: SelectOption[] = [
    { value: "cricketmatchtemplate", label: "Cricket Match Template" },
    { value: "footballhighlighttemplate", label: "Football Highlight Template" },
    { value: "footballmatchtemplate", label: "Football Match Template" },
    { value: "esportsstreamtemplate", label: "Esports Stream Template" },
    { value: "tennisrallytemplate", label: "Tennis Rally Template" },
  ];

  export const recordingServerOptions: SelectOption[] = [
    { value: "default", label: "Default Server" },
    { value: "recording-server-1", label: "Recording-server-1" },
    { value: "backup-recording-server-1", label: "Backup-recording-server-1" },
    { value: "archive-recording-server", label: "Archive-recording-server" },
    { value: "live-recording-server", label: "Live-recording-server" },
    { value: "cloud-recording-server", label: "Cloud-recording-server" },
  ];

  export const analysisServerOptions: SelectOption[] = [
    { value: "default", label: "Default Server" },
    { value: "analysis-server-1", label: "Analysis-server-1" },
    { value: "analysis-server-2", label: "Analysis-server-2" },
    { value: "stats-analysis-server", label: "Stats-analysis-server" },
    { value: "stream-analysis-server", label: "Stream-analysis-server" },
    { value: "metadata-analysis-server", label: "Metadata-analysis-server" },
    { value: "video-analysis-node-1", label: "Video-analysis-node-1" },
  ];

  export const storageOptions: SelectOption[] = [
    { value: "Studiopocbucket", label: "Studio-POC-Bucket" },
    { value: "analytics-dev-gcs", label: "Analytics-Dev-GCS" },
    { value: "stream-storage-us-east1", label: "Stream-Storage-US-EAST-1" },
    { value: "ak-test-gcs-1", label: "Ak-Test-GCS-1" },
    { value: "gcp-test-storage-3", label: "GCP-Test-Storage-3" },
    { value: "ak-dev-gcs-5", label: "Ak-Dev-GCS-5" },
  ];

  export const videoTypeOptions: SelectOption[] = [
    { value: "live", label: "Live Video" },
    { value: "recorded", label: "Recorded Video" },
  ];

  export const competitionTypeOptions: SelectOption[] = [
    { value: "international", label: "International" },
    { value: "domestic", label: "Domestic" },
  ];

  export const languageOptions: SelectOption[] = [
    { value: "english", label: "English" },
    { value: "italian", label: "Italian" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "portuguese", label: "Portuguese" },
  ];

  export  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  export const statusOptions = ["All", "Scheduled", "Published", "Failed"];
