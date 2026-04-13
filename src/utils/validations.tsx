// Validation schemas for each step Add New Video Modal
import * as Yup from "yup";
import moment from "moment";

export const step1Schema = Yup.object().shape({
  title: Yup.string().required("Match name is required"),
  // tournamentId is optional
  tournamentId: Yup.string().notRequired(),
  competitionId: Yup.string().notRequired(),
  category: Yup.string().required("Sport selection is required"),
  team1Id: Yup.string().notRequired(),
  team2Id: Yup.string().notRequired(),
  matchId: Yup.string()
    .trim()
    .matches(/^\d{7}$/, { message: "Match ID must be 7 digits", excludeEmptyString: true })
    .notRequired(),
  scheduleAt: Yup.boolean().default(false),
  date: Yup.string().required("Date is required"),
  time: Yup.string().notRequired(),
  timeMinutes: Yup.string().notRequired(),
  amPm: Yup.string().notRequired(),
  timezone: Yup.string().notRequired(),
});

export const step2Schema = Yup.object()
  .shape({
    videoUrl: Yup.string()
      .test("url-or-srt", "Please enter a valid URL", function (value) {
        if (!value) return false;
        const srtPattern = /^srt:\/\/[^\s]+(:\d+)?(\?.+)?$/i;
        if (srtPattern.test(value)) return true;
        try {
          const u = new URL(value);
          return !!u.protocol && (u.protocol.startsWith("http") || u.protocol.startsWith("rtmp") || u.protocol.startsWith("ftp"));
        } catch {
          return false;
        }
      })
      .required("Video URL is required"),
    sharingOptions: Yup.string().notRequired(),
    streamTemplate: Yup.string().notRequired(),
    videoTemplateId: Yup.string().notRequired(),
    videoType: Yup.string().required("Video type is required"),
    streamLanguage: Yup.string().notRequired(),
  });

// Time validation patterns
export const secondPattern = /(^([0-1]?\d|2[0-3]):([0-5]?\d):([0-5]?\d)$)|(^([0-5]?\d):([0-5]?\d)$)|(^[0-5]?\d$)/;
export const milliSecondPattern = /(^([01]\d|2[0-3]):[0-5]\d:[0-5]\d:\d{3}$)/;
export const milliSecondDecimalPattern = /(^([01]\d|2[0-3]):[0-5]\d:[0-5]\d.\d{3}$)/;

// Time validation functions
export const validateStartTimeOnSeconds = (
  startTime: string,
  endTime: string,
  validateStartTimeAtZero: boolean,
  useMilliSecondDecimalPattern = false,
) => {
  if (!startTime) {
    return "Start time can't be empty";
  }
  const finalMilliSecondPattern = useMilliSecondDecimalPattern ? milliSecondDecimalPattern : milliSecondPattern;
  if (!secondPattern.test(startTime) && !finalMilliSecondPattern.test(startTime)) {
    return "Invalid time format";
  }

  if (isSame(startTime, "00:00:00") && validateStartTimeAtZero) {
    return "Start time must be greater than 00:00:00";
  }

  if (isSame(startTime, endTime)) {
    return "Start time and End time cannot be same";
  }

  if (!isSameOrBefore(startTime, endTime)) {
    return "Start time must be less than End time";
  }

  return "";
};

export const validateStartTimeOnMilliSeconds = (startTime: string, endTime: string) => {
  if (!startTime) {
    return "Start time can't be empty";
  }

  if (!milliSecondPattern.test(startTime)) {
    return "Invalid time format";
  }

  if (isSameMilliSeconds(startTime, "00:00:00:0000")) {
    return "Start time must be greater than 00:00:01:000";
  }

  if (isSameMilliSeconds(startTime, endTime)) {
    return "Start time and End time cannot be same";
  }

  if (!isSameOrBeforeMilliSeconds(startTime, endTime)) {
    return "Start time must be less than End time";
  }

  return "";
};

export const validateEndTimeOnSeconds = (endTime: string, useMilliSecondDecimalPattern = false) => {
  if (!endTime) {
    return "End time can't be empty";
  }

  const finalMilliSecondPattern = useMilliSecondDecimalPattern ? milliSecondDecimalPattern : milliSecondPattern;

  if (!secondPattern.test(endTime) && !finalMilliSecondPattern.test(endTime)) {
    return "Invalid time format";
  }

  return "";
};

export const validateEndTimeOnMilliSeconds = (endTime: string, startTime: string, useMilliSecondDecimalPattern = false) => {
  if (!endTime) {
    return "End time can't be empty";
  }

  const finalMilliSecondPattern = useMilliSecondDecimalPattern ? milliSecondDecimalPattern : milliSecondPattern;

  if (!finalMilliSecondPattern.test(endTime)) {
    return "Invalid time format";
  }

  if (!isDiffBetweenStartAndEndTime(startTime, endTime)) {
    return "Difference between start and end time must be at least 1 second.";
  }

  return "";
};

export const validateTitle = (title: string) => {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 150) {
    return "Title must be at most 150 characters long.";
  } else {
    return "";
  }
};

export const validateStartTime = (
  startTime: string,
  endTime: string,
  moveTimeStampBy: { value: string },
  validateStartTimeAtZero = true,
  useMilliSecondDecimalPattern = false,
) => {
  return moveTimeStampBy?.value === "seconds"
    ? validateStartTimeOnSeconds(startTime, endTime, validateStartTimeAtZero, useMilliSecondDecimalPattern)
    : validateStartTimeOnMilliSeconds(startTime, endTime);
};

export const validateEndTime = (endTime: string, startTime: string, moveTimeStampBy: { value: string }, useMilliSecondDecimalPattern = false) => {
  return moveTimeStampBy?.value === "seconds"
    ? validateEndTimeOnSeconds(endTime, useMilliSecondDecimalPattern)
    : validateEndTimeOnMilliSeconds(endTime, startTime, useMilliSecondDecimalPattern);
};

export const hasRequiredData = (obj: Record<string, unknown>) => {
  return ["ballPosition", "batsmanPosition", "shotType", "wicketTerm", "outcome", "player"].some((field) => {
    const hasField = Object.prototype.hasOwnProperty.call(obj, field);
    if (!hasField) return false;
    return Boolean(obj[field]);
  });
};

export const formatTimestringToSeconds = (timestamp: string) => {
  const duration = moment.duration(timestamp.replace(/(\d{2}:\d{2}:\d{2}):(\d{3})$/, "$1.$2"));
  const totalSeconds =
    duration.hours() * 3600 + duration.minutes() * 60 + duration.seconds() + duration.milliseconds() / 1000;

  return totalSeconds;
};

export const openNewDownloadTab = (url: string) => {
  // Open the link in a new tab with desired features (optional)
  window.open(url, "_blank");
};

export const parseTime = (timeStr: string) => {
  const [hrs, mins, secs, ms = 0] = timeStr.split(":").map(Number);
  const totalSeconds = hrs * 3600 + mins * 60 + secs + ms / 1000;

  return totalSeconds;
};

export const isSameOrBefore = (startTime: string, endTime: string) => {
  return moment(startTime, "H:mm:ss").isSameOrBefore(moment(endTime, "H:mm:ss"));
};

export const isSame = (startTime: string, endTime: string) => {
  return moment(startTime, "H:mm:ss").isSame(moment(endTime, "H:mm:ss"));
};

export const titleValidation = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(2, "Too Short!")
    .max(150, "Too Long!")
    .required("Required"),
  startTime: Yup.string()
    .matches(/(^([0-1]?\d|2[0-3]):([0-5]?\d):([0-5]?\d)$)|(^([0-5]?\d):([0-5]?\d)$)|(^[0-5]?\d$)/, "Invalid!")
    .test("not empty", "Start time cant be empty", function (value) {
      return !!value;
    })
    .test("start_time_test", "Start time must be greater than 00:00:00", function (value) {
      const endTime = "00:00:00";
      return !isSame(value, endTime);
    })
    .test("start_time_test", "Start time OR End time cannot be same", function (value) {
      const { endTime } = this.parent;
      return !isSame(value, endTime);
    })
    .test("start_time_test", "Start time must be before end time", function (value) {
      const { endTime } = this.parent;
      return isSameOrBefore(value, endTime);
    })
    .min(7, "Invalid!")
    .required("Required"),
  endTime: Yup.string()
    .matches(/^([0-1]?\d|2[0-3])(?::([0-5]?\d))?(?::([0-5]?\d))?$/, "Invalid!")
    .min(7, "Invalid!")
    .required("Required"),
  reasonForRating: Yup.string().max(256, "Character limit exceeded (max 256 characters)"),
});

export const isSameOrBeforeMilliSeconds = (startTime: string, endTime: string) => {
  return moment(startTime, "HH:mm:ss:SSS").isSameOrBefore(moment(endTime, "HH:mm:ss:SSS"));
};

export const isSameMilliSeconds = (startTime: string, endTime: string) => {
  return moment(startTime, "HH:mm:ss:SSS").isSame(moment(endTime, "HH:mm:ss:SSS"));
};

export const titleMilliSecondsValidation = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(2, "Too Short!")
    .max(150, "Too Long!")
    .required("Required"),
  startTime: Yup.string()
    .matches(/(^([01]\d|2[0-3]):[0-5]\d:[0-5]\d:\d{3}$)/, "Invalid!")
    .test("not empty", "Start time cant be empty", function (value) {
      return !!value;
    })
    .test("start_time_test", "Start time must be greater than 00:00:01:000", function (value) {
      const endTime = "00:00:00:0000";
      return !isSameMilliSeconds(value, endTime);
    })
    .test("start_time_test", "Start time OR End time cannot be same", function (value) {
      const { endTime } = this.parent;
      return !isSameMilliSeconds(value, endTime);
    })
    .test("start_time_test", "Start time must be less than end time", function (value) {
      const { startTime } = this.parent;
      return isSameOrBeforeMilliSeconds(value, startTime);
    })
    .min(12, "Invalid!")
    .required("Required"),
  endTime: Yup.string()
    .min(12, "Invalid!")
    .required("Required")
    .matches(/^([0-1]?\d|2[0-3])(?::([0-5]?\d))?(?::([0-5]?\d))?(?:.([0-9]{1,3}))?$/, "Invalid!")
    .test("end_time_test", `Clip below 1 second won't generate`, function (value) {
      const { startTime } = this.parent;
      return isDiffBetweenStartAndEndTime(startTime, value);
    }),
  reasonForRating: Yup.string().max(256, "Character limit exceeded (max 256 characters)"),
});

export const isDiffBetweenStartAndEndTime = (startTime, endTime) => {
  const startMoment = moment(startTime, "HH:mm:ss:SSS");
  const endMoment = moment(endTime, "HH:mm:ss:SSS");
  const diffInSeconds = endMoment.diff(startMoment, "seconds");
  if (diffInSeconds >= 1) {
    return true;
  }
};

// Clip validation schema for SaveNewClip component
export const clipValidationSchema = Yup.object().shape({
  clipName: Yup.string()
    .trim()
    .min(2, "Clip name must be at least 2 characters")
    .max(150, "Clip name must be at most 150 characters")
    .required("Clip name is required"),
  clipStartTime: Yup.string()
    .matches(/(^([0-1]?\d|2[0-3]):([0-5]?\d):([0-5]?\d)$)|(^([0-5]?\d):([0-5]?\d)$)|(^[0-5]?\d$)/, "Invalid time format")
    .test("not empty", "Start time can't be empty", function (value) {
      return !!value;
    })
    .test("start_time_test", "Start time must be greater than 00:00:00", function (value) {
      const endTime = "00:00:00";
      return !isSame(value, endTime);
    })
    .test("start_time_test", "Start time and End time cannot be same", function (value) {
      const { clipEndTime } = this.parent;
      return !isSame(value, clipEndTime);
    })
    .test("start_time_test", "Start time must be before end time", function (value) {
      const { clipEndTime } = this.parent;
      return isSameOrBefore(value, clipEndTime);
    })
    .required("Start time is required"),
  clipEndTime: Yup.string()
    .matches(/(^([0-1]?\d|2[0-3]):([0-5]?\d):([0-5]?\d)$)|(^([0-5]?\d):([0-5]?\d)$)|(^[0-5]?\d$)/, "Invalid time format")
    .test("not empty", "End time can't be empty", function (value) {
      return !!value;
    })
    .required("End time is required"),
});
