import React, { useState } from 'react';
import SectionHeader from './SectionHeader';
import ShareIcon from '@/assets/svg/Social_media_Icons/share.svg';
import { Plus, Minus } from 'lucide-react';

const ShareTab: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [SnapchatSelected, setSnapchatSelected] = useState(false);
  const [telegramSelected, setTelegramSelected] = useState(false);
  const [linkSelected, setLinkSelected] = useState(false);
  const [telegramAccounts, setTelegramAccounts] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Share" expanded={expanded} onClick={() => setExpanded(prev => !prev)} iconSrc={ShareIcon} />
      <div className={expanded ? '' : 'hidden'}>
        <div className="space-y-4">
          {/* WhatsApp */}
          <div className="flex items-center gap-3">
            <div className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${SnapchatSelected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`} onClick={() => setSnapchatSelected(prev => !prev)}>
              {SnapchatSelected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#grad_share_w)" strokeWidth="2.1" /><defs><linearGradient id="grad_share_w" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse"><stop stopColor="#00BBFF" /><stop offset="1" stopColor="#0051FF" /></linearGradient></defs></svg>
              )}
            </div>
            <span className="text-sm text-white">Snapchat</span>
            <button className="ml-auto" onClick={() => setSnapchatSelected(prev => !prev)}>{SnapchatSelected ? <Minus size={12} className="text-white" /> : <Plus size={12} className="text-white" />}</button>
          </div>

          {/* Telegram */}
          <div className="flex items-center gap-3">
            <div className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${telegramSelected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`} onClick={() => setTelegramSelected(prev => !prev)}>
              {telegramSelected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#grad_share_t)" strokeWidth="2.1" /><defs><linearGradient id="grad_share_t" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse"><stop stopColor="#00BBFF" /><stop offset="1" stopColor="#0051FF" /></linearGradient></defs></svg>
              )}
            </div>
            <span className="text-sm text-white">Telegram</span>
            <button className="ml-auto" onClick={() => setTelegramSelected(prev => !prev)}>{telegramSelected ? <Minus size={12} className="text-white" /> : <Plus size={12} className="text-white" />}</button>
          </div>
          {telegramSelected && (
            <div className="ml-9 space-y-2">
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Add account" className="h-[36px] bg-[#252525] rounded-xl px-3 text-sm text-white" onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) { setTelegramAccounts(prev => [...prev, val]); (e.target as HTMLInputElement).value = ''; }
                  }
                }} />
                <span className="text-xs text-white/70">+ Add account</span>
              </div>
              {telegramAccounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {telegramAccounts.map((acc, idx) => (
                    <div key={idx} className="bg-[#1B1B1B] rounded-full px-3 py-1 text-sm text-white">{acc}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link */}
          <div className="flex items-center gap-3">
            <div className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${linkSelected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`} onClick={() => setLinkSelected(prev => !prev)}>
              {linkSelected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#grad_share_l)" strokeWidth="2.1" /><defs><linearGradient id="grad_share_l" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse"><stop stopColor="#00BBFF" /><stop offset="1" stopColor="#0051FF" /></linearGradient></defs></svg>
              )}
            </div>
            <span className="text-sm text-white">Link</span>
            <button className="ml-auto" onClick={() => setLinkSelected(prev => !prev)}>{linkSelected ? <Minus size={12} className="text-white" /> : <Plus size={12} className="text-white" />}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareTab;
