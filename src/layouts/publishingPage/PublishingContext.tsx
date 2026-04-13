import React, { createContext, useContext, useMemo, useState } from 'react';

export type TimeValue = { hours: string; minutes: string; period: 'AM' | 'PM' };

export type SelectedSocialMedia = {
  instagram: { selected: boolean; post: boolean; reel: boolean; story: boolean };
  tiktok: { selected: boolean };
  youtube: { selected: boolean; post: boolean; shorts: boolean };
  facebook: { selected: boolean; post: boolean; story: boolean };
  x: { selected: boolean };
};

export type MediaTypeSelection = {
  instagram: 'VIDEO' | 'IMAGE';
  facebook: 'VIDEO' | 'IMAGE';
  x: 'VIDEO' | 'IMAGE';
};

export interface PublishingContextValue {
  clipId?: string;
  isSocialMediaOpen: boolean;
  setIsSocialMediaOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSocialMedia: SelectedSocialMedia;
  setSelectedSocialMedia: React.Dispatch<React.SetStateAction<SelectedSocialMedia>>;
  mediaTypeSelections: MediaTypeSelection;
  setMediaTypeSelections: React.Dispatch<React.SetStateAction<MediaTypeSelection>>;
  handleSocialMediaToggle: (platform: keyof SelectedSocialMedia, subType?: 'post' | 'reel' | 'story' | 'shorts') => void;

  profile: string;
  setProfile: React.Dispatch<React.SetStateAction<string>>;
  privacy: string;
  setPrivacy: React.Dispatch<React.SetStateAction<string>>;
  restrictedLocation: string;
  setRestrictedLocation: React.Dispatch<React.SetStateAction<string>>;
  selectedThumbnail: number;
  setSelectedThumbnail: React.Dispatch<React.SetStateAction<number>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  scheduleEnabled: boolean;
  setScheduleEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  time: TimeValue;
  setTime: React.Dispatch<React.SetStateAction<TimeValue>>;
  timezone: string;
  setTimezone: React.Dispatch<React.SetStateAction<string>>;
}

const PublishingContext = createContext<PublishingContextValue | null>(null);

export const usePublishing = () => {
  const ctx = useContext(PublishingContext);
  if (!ctx) throw new Error('usePublishing must be used within PublishingProvider');
  return ctx;
};

export interface PublishingProviderProps {
  clipId?: string;
  initialState?: Partial<Omit<PublishingContextValue, 'handleSocialMediaToggle' | 'setIsSocialMediaOpen' | 'setSelectedSocialMedia' | 'setProfile' | 'setPrivacy' | 'setRestrictedLocation' | 'setSelectedThumbnail' | 'setDescription' | 'setTags' | 'setScheduleEnabled' | 'setDate' | 'setTime' | 'setTimezone'>>;
  children: React.ReactNode;
}

export const PublishingProvider: React.FC<PublishingProviderProps> = ({ clipId, initialState, children }) => {
  const [isSocialMediaOpen, setIsSocialMediaOpen] = useState(initialState?.isSocialMediaOpen ?? false);
  const [selectedSocialMedia, setSelectedSocialMedia] = useState<SelectedSocialMedia>(
    initialState?.selectedSocialMedia ?? {
      instagram: { selected: false, post: false, reel: false, story: false },
      tiktok: { selected: false },
      youtube: { selected: false, post: false, shorts: false },
      facebook: { selected: false, post: false, story: false },
      x: { selected: false },
    }
  );

  const [mediaTypeSelections, setMediaTypeSelections] = useState<MediaTypeSelection>(
    initialState?.mediaTypeSelections ?? {
      instagram: 'VIDEO',
      facebook: 'VIDEO',
      x: 'VIDEO',
    }
  );

  const [profile, setProfile] = useState(initialState?.profile ?? 'Studio Main');
  const [privacy, setPrivacy] = useState(initialState?.privacy ?? 'Public');
  const [restrictedLocation, setRestrictedLocation] = useState(initialState?.restrictedLocation ?? 'Belgium');
  const [selectedThumbnail, setSelectedThumbnail] = useState(initialState?.selectedThumbnail ?? 1);
  const [title, setTitle] = useState(initialState?.title ?? 'My Awesome Video');
  const [description, setDescription] = useState(
    initialState?.description ??
      'Bangladesh kicks off the match with high energy, pushing forward early in the first half. Great defensive work by Bhutan to intercept that dangerous pass in the midfield. Bangladesh\'s striker takes a powerful shot, but the Bhutan goalkeeper saves it beautifully!'
  );
  const [tags, setTags] = useState<string[]>(
    initialState?.tags ?? [
      '#bangladesh',
      '#bhutan',
      '#soccerindia',
      '#soccermoments',
      '#indiasport',
      '#soccermoments',
      '#indiasport',
      '#bhutan',
      '#bangladesh',
      '#indiasport',
      '#bhutan',
      '#bangladesh',
    ]
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(initialState?.scheduleEnabled ?? false);
  const [date, setDate] = useState(initialState?.date ?? '25.07.25');
  const [time, setTime] = useState<TimeValue>(initialState?.time ?? { hours: '08', minutes: '30', period: 'AM' });
  const [timezone, setTimezone] = useState(initialState?.timezone ?? 'CEST');

  const handleSocialMediaToggle = (platform: keyof SelectedSocialMedia, subType?: 'post' | 'reel' | 'story' | 'shorts') => {
    setSelectedSocialMedia(prev => {
      if (platform === 'instagram') {
        if (subType) {
          return {
            ...prev,
            instagram: { ...prev.instagram, [subType]: !prev.instagram[subType] },
          };
        }
        const nextSelected = !prev.instagram.selected;
        return {
          ...prev,
          instagram: {
            selected: nextSelected,
            post: false,
            reel: false,
            story: false,
          },
        };
      }
      if (platform === 'youtube') {
        if (subType) {
          return {
            ...prev,
            youtube: { ...prev.youtube, [subType]: !prev.youtube[subType as 'post' | 'shorts'] },
          };
        }
        const nextSelected = !prev.youtube.selected;
        return {
          ...prev,
          youtube: {
            selected: nextSelected,
            post: false,
            shorts: false,
          },
        };
      }
      if (platform === 'facebook') {
        if (subType) {
          return {
            ...prev,
            facebook: { ...prev.facebook, [subType]: !prev.facebook[subType as 'post' | 'story'] },
          };
        }
        const nextSelected = !prev.facebook.selected;
        return {
          ...prev,
          facebook: {
            selected: nextSelected,
            post: false,
            story: false,
          },
        };
      }
      return {
        ...prev,
        [platform]: { ...prev[platform], selected: !prev[platform].selected },
      } as SelectedSocialMedia;
    });
  };

  const value = useMemo(
    () => ({
      clipId,
      isSocialMediaOpen,
      setIsSocialMediaOpen,
      selectedSocialMedia,
      setSelectedSocialMedia,
      mediaTypeSelections,
      setMediaTypeSelections,
      handleSocialMediaToggle,

      profile,
      setProfile,
      privacy,
      setPrivacy,
      restrictedLocation,
      setRestrictedLocation,
      selectedThumbnail,
      setSelectedThumbnail,
      title,
      setTitle,
      description,
      setDescription,
      tags,
      setTags,
      scheduleEnabled,
      setScheduleEnabled,
      date,
      setDate,
      time,
      setTime,
      timezone,
      setTimezone,
    }),
    [
      clipId,
      isSocialMediaOpen,
      selectedSocialMedia,
      mediaTypeSelections,
      profile,
      privacy,
      restrictedLocation,
      selectedThumbnail,
      title,
      description,
      tags,
      scheduleEnabled,
      date,
      time,
      timezone,
    ]
  );

  return <PublishingContext.Provider value={value}>{children}</PublishingContext.Provider>;
};

export default PublishingContext;
