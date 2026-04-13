import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePublishing } from './PublishingContext';
import { useAppSelector } from '@/store';
import { selectCurrentClip } from '@/store/slices/clipsSlice';
import { publishSocialPost, PublishRequest, MediaInput } from '@/api/socialApi';
import { Loader2 } from 'lucide-react';

const PublishActions: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedSocialMedia,
    title,
    description,
    scheduleEnabled,
    date,
    time,
    timezone,
    privacy,
    profile,
  } = usePublishing();
  
  const currentClip = useAppSelector(selectCurrentClip);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!currentClip?.download_url) {
      toast.error('No media available to publish');
      return;
    }

    setIsPublishing(true);
    let successCount = 0;
    let failCount = 0;

    const media: MediaInput[] = [{
      url: currentClip.download_url,
      type: 'video', // Assuming video for now
      durationInSeconds: currentClip.duration,
    }];

    // Calculate Scheduled Time
    let publishAt: string | undefined = undefined;
    if (scheduleEnabled) {
      // Parse date/time to ISO
      // Assuming date is DD.MM.YY and time is HH:MM AM/PM
      // Ideally use moment or date-fns for robust parsing
      // strict parsing logic needed here or use a library
      // For now, let's assume immediate if parsing fails or implement basic
    }

    const promises: Promise<any>[] = [];

    // Iterate selected platforms
    if (selectedSocialMedia.youtube.selected) {
      promises.push(publishSocialPost({
        platform: 'youtube',
        media,
        caption: description,
        options: { title, visibility: privacy.toLowerCase() },
        flags: { isShort: selectedSocialMedia.youtube.shorts },
        publishAt,
      }).then(() => successCount++).catch((e) => {
        console.error('YouTube publish error', e);
        failCount++;
        toast.error(`YouTube: ${e.response?.data?.error || e.message}`);
      }));
    }

    if (selectedSocialMedia.instagram.selected) {
       // Check sub-types
       const flags = {
           isReel: selectedSocialMedia.instagram.reel,
           isStory: selectedSocialMedia.instagram.story,
       };
       promises.push(publishSocialPost({
           platform: 'instagram',
           media,
           caption: description,
           flags,
           publishAt,
       }).then(() => successCount++).catch(e => {
           failCount++;
           toast.error(`Instagram: ${e.response?.data?.error || e.message}`);
       }));
    }

    if (selectedSocialMedia.facebook.selected) {
        const flags = {
            isStory: selectedSocialMedia.facebook.story,
            isReel: false // Add if needed
        };
        promises.push(publishSocialPost({
            platform: 'facebook',
            media,
            caption: description,
            flags,
            publishAt
        }).then(() => successCount++).catch(e => {
            failCount++;
            toast.error(`Facebook: ${e.response?.data?.error || e.message}`);
        }));
    }

    if (selectedSocialMedia.x.selected) {
        promises.push(publishSocialPost({
            platform: 'x-twitter',
            media,
            caption: description, // Twitter checks length in backend
            publishAt
        }).then(() => successCount++).catch(e => {
            failCount++;
            toast.error(`X (Twitter): ${e.response?.data?.error || e.message}`);
        }));
    }
    
    if (selectedSocialMedia.tiktok.selected) {
        promises.push(publishSocialPost({
            platform: 'tiktok',
            media,
            caption: description,
            options: { visibility: privacy.toLowerCase() },
            publishAt
        }).then(() => successCount++).catch(e => {
            failCount++;
            toast.error(`TikTok: ${e.response?.data?.error || e.message}`);
        }));
    }

    await Promise.all(promises);
    setIsPublishing(false);

    if (successCount > 0) {
        toast.success(`Successfully published to ${successCount} platform(s)`);
        if (failCount === 0) {
            // Optional: navigate away or clear form
        }
    }
  };

  return (
    <div className="flex items-center justify-center gap-5 pt-6 pb-8">
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        className="w-[160px] h-[42px] bg-[#1B1B1B] border-white text-white hover:bg-[#252525]"
        disabled={isPublishing}
      >
        Cancel
      </Button>
      <Button
        onClick={handlePublish}
        className="w-[160px] h-[42px] bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white hover:opacity-90"
        disabled={isPublishing}
      >
        {isPublishing ? <Loader2 className="animate-spin" /> : (scheduleEnabled ? 'Schedule' : 'Publish')}
      </Button>
    </div>
  );
};

export default PublishActions;
