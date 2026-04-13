import React, { useState } from 'react';
import SectionHeader from './SectionHeader';
import WebhookIcon from '@/assets/svg/Social_media_Icons/webhook.svg';

const WebhookTab: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(false);
  const [url, setUrl] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [folderPath, setFolderPath] = useState('');

  return (
    <div className="space-y-4">
      <SectionHeader title="Webhook" expanded={expanded} onClick={() => setExpanded(prev => !prev)} iconSrc={WebhookIcon} />
      <div className={expanded ? '' : 'hidden'}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`} onClick={() => setSelected(prev => !prev)}>
              {selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#grad_webhook)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="grad_webhook" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <span className="text-sm text-white">Webhook</span>
          </div>

          {selected && (
            <div className="ml-9 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white font-medium">URL</label>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example-webhook" className="w-full h-[42px] bg-[#252525] rounded-xl px-4 text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white font-medium">Auth key</label>
                <input type="text" value={authKey} onChange={(e) => setAuthKey(e.target.value)} placeholder="Enter auth key" className="w-full h-[42px] bg-[#252525] rounded-xl px-4 text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white font-medium">Folder path</label>
                <input type="text" value={folderPath} onChange={(e) => setFolderPath(e.target.value)} placeholder="Folder:/{{fileID}}–{{videoTitle}}" className="w-full h-[42px] bg-[#252525] rounded-xl px-4 text-sm text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebhookTab;
