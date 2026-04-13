import React, { useState } from 'react';
import SectionHeader from './SectionHeader';
import SVGIcon from '@/components/common/SVGIcon';
import SparkleGradient from '@/assets/svg/SparkleGradient.svg';
import EmailIcon from '@/assets/svg/Social_media_Icons/Email.svg';
import { toast } from 'sonner';
import { sendEmail } from '@/api/emailApi';
import { useAppSelector } from '@/store';
import { selectUser } from '@/store/slices/authSlice';
import { selectCurrentClip } from '@/store/slices/clipsSlice';
import { updateClip } from '@/api/clipApi';
import { useEffect } from 'react';

const EmailTab: React.FC = () => {
  const clip = useAppSelector(selectCurrentClip);
  const user = useAppSelector(selectUser);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState((clip as any)?.title || '');
  const [body, setBody] = useState<string>(((clip as any)?.description as string) || '');
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [showVars, setShowVars] = useState(false);
  const [fmtState, setFmtState] = useState<{bold:boolean; italic:boolean; underline:boolean; strike:boolean}>({bold:false, italic:false, underline:false, strike:false});
  const [sendMenuOpen, setSendMenuOpen] = useState(false);

  const addRecipient = (value: string) => {
    const email = value.trim();
    if (!email) return;
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) { toast.error('Invalid email'); return; }
    if (recipients.includes(email)) return;
    setRecipients(prev => [...prev, email]);
    setRecipient('');
  };

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      addRecipient(recipient);
    }
    if (e.key === 'Backspace' && !recipient && recipients.length > 0) {
      setRecipients(prev => prev.slice(0, -1));
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  };

  const applyFormat = (type: 'bold' | 'italic' | 'underline' | 'strike' | 'link') => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (type === 'bold') document.execCommand('bold');
    else if (type === 'italic') document.execCommand('italic');
    else if (type === 'underline') document.execCommand('underline');
    else if (type === 'strike') document.execCommand('strikeThrough');
    else if (type === 'link') {
      const href = prompt('Enter link URL') || '#';
      document.execCommand('createLink', false, href);
    }
    setBody(el.innerHTML);
  };

  const insertAtCaret = (text: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand('insertText', false, text);
    setBody(el.innerHTML);
  };

  const insertVarChip = (label: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const span = document.createElement('span');
    span.setAttribute('data-var', label);
    span.setAttribute('contenteditable', 'false');
    span.className = 'inline-flex items-center gap-1 bg-[#1F2022] border border-[#3A3A3A] rounded-md px-2 py-1 text-xs text-white mr-2';
    span.textContent = label;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(span);
      const space = document.createTextNode(' ');
      span.after(space);
      range.setStartAfter(space);
      range.setEndAfter(space);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    }
    setBody(el.innerHTML);
  };

  const templateVars: Array<{ label: string; value: string }> = [
    { label: '{{clipId}}', value: String((clip as any)?._id || (clip as any)?.id || '') },
    { label: '{{clipTitle}}', value: String((clip as any)?.title || '') },
    { label: '{{previewLink}}', value: String((clip as any)?.videoUrl || '') },
    { label: '{{streamId}}', value: String((clip as any)?.streamId || '') },
    { label: '{{sportName}}', value: String((clip as any)?.customData?.sportName || '') },
    { label: '{{duration}}', value: String((clip as any)?.duration || '') },
    { label: '{{rating}}', value: String((clip as any)?.rating ?? '') },
    { label: '{{aspectRatio}}', value: String((clip as any)?.aspectRatio || '') },
    { label: '{{matchDateAndTime}}', value: String((clip as any)?.createdAt || '') },
    { label: '{{stream.fields.selectedLanguage}}', value: String((clip as any)?.customData?.language || 'English') },
  ];

  const resolveTemplate = (html: string) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const nodes = wrapper.querySelectorAll('[data-var]');
    nodes.forEach((node) => {
      const label = node.getAttribute('data-var') || '';
      const val = (templateVars.find(v => v.label === label)?.value) || label;
      const textNode = document.createTextNode(val);
      node.replaceWith(textNode);
    });
    let out = wrapper.innerHTML;
    templateVars.forEach(v => {
      const token = new RegExp(v.label.replace(/[{}]/g, '\\$&'), 'g');
      out = out.replace(token, v.value);
    });
    return out;
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!el.innerHTML) el.innerHTML = body || '';
    const onSelChange = () => {
      if (!document.activeElement || document.activeElement !== el) return;
      setFmtState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
      });
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, [editorRef.current]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Email" expanded={expanded} onClick={() => setExpanded(prev => !prev)} iconSrc={EmailIcon} />
      <div className={expanded ? '' : 'hidden'}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`} onClick={() => setSelected(prev => !prev)}>
              {selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#grad_email)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="grad_email" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <span className="text-sm text-white">Email</span>
          </div>

          {selected && (
            <div className="ml-9 space-y-4">
              {/* Recipient */}
              <div className="space-y-2">
                <label className="text-xs text-white font-medium">Recipient mail</label>
                <div className="w-full min-h-[42px] bg-[#252525] rounded-xl px-3 py-2 text-sm text-white flex items-center flex-wrap gap-2">
                  {recipients.map((r) => (
                    <span key={r} className="inline-flex items-center gap-2 bg-[#1F2022] border border-[#3A3A3A] rounded-lg px-3 py-1">
                      <span className="text-white text-xs">{r}</span>
                      <button type="button" className="text-white/80 hover:text-white" onClick={() => removeRecipient(r)} aria-label="Remove">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    onKeyDown={handleRecipientKeyDown}
                    onBlur={() => addRecipient(recipient)}
                    placeholder="Add recipient mail"
                    className="flex-1 min-w-[180px] bg-transparent outline-none text-white placeholder:text-white/60"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white font-medium">Subject</label>
                  {/* <button type="button" className="flex items-center gap-1 text-xs font-bold text-white hover:underline" onClick={() => setSubject((clip as any)?.title || subject)}>
                    <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Generate" />
                    <span>Generate</span>
                  </button> */}
                </div>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full h-[42px] bg-[#252525] rounded-xl px-4 text-sm text-white" />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white font-medium">Body</label>
                  {/* <button type="button" className="flex items-center gap-1 text-xs font-bold text-white hover:underline" onClick={async () => {
                    try {
                      if (!clip?._id) { setBody(body || ''); return; }
                      const res = await updateClip(clip._id, { description: body });
                      if (res.success) toast.success('Description saved to clip'); else toast.error(res.error || res.message || 'Failed to save');
                    } catch (e: any) { toast.error(e.message || 'Failed to save'); }
                  }}>
                    <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Generate" />
                    <span>Generate</span>
                  </button> */}
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setBody((e.target as HTMLDivElement).innerHTML)}
                  className="w-full bg-[#252525] rounded-xl p-4 text-white text-sm min-h-[120px] outline-none"
                />
                <div className="mt-2 bg-[#0F1011] border border-[#2A2A2A] rounded-xl px-3 py-2 flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex items-center h-8 rounded-full overflow-hidden bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white">
                        <button
                          type="button"
                          className="px-4 text-sm font-medium"
                          onClick={async () => {
                            try {
                              const htmlResolved = resolveTemplate(body);
                              const payload = {
                                to: recipients,
                                cc: [],
                                bcc: [],
                                subject,
                                html: htmlResolved,
                                text: htmlResolved.replace(/<[^>]+>/g, ''),
                                clip: {
                                  clipId: String((clip as any)?.id || (clip as any)?._id || ''),
                                  clipType: 'clip',
                                  duration: Number((clip as any)?.duration || 0),
                                  referenceUrl: String((clip as any)?.videoUrl || ''),
                                  aspectRatio: String((clip as any)?.aspectRatio || ''),
                                  streamId: String((clip as any)?.streamId || ''),
                                },
                                userId: String(user?.userId || localStorage.getItem('userId') || ''),
                              };
                              const res = await sendEmail(payload as any);
                              if (res?.status) {
                                toast.success('Email sent');
                              } else {
                                toast.error(res?.message || 'Failed to queue');
                              }
                            } catch (e: any) {
                              toast.error(e?.message || 'Failed to send');
                            }
                          }}
                        >
                          Send
                        </button>
                        <div className="w-px h-8 bg-white/40" />
                        <button type="button" className="px-2" onClick={() => setSendMenuOpen(o => !o)}>
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                      {/* {sendMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-40 bg-[#1B1B1B] border border-[#2A2A2A] rounded-xl shadow-lg p-2 z-50">
                          <button type="button" className="w-full text-left text-white text-xs px-3 py-2 rounded hover:bg-[#2A2A2A]" onClick={() => { toast.success('Send now'); setSendMenuOpen(false); }}>
                            Send now
                          </button>
                          <button type="button" className="w-full text-left text-white text-xs px-3 py-2 rounded hover:bg[#2A2A2A]" onClick={() => { toast.success('Save as draft'); setSendMenuOpen(false); }}>
                            Save as draft
                          </button>
                        </div>
                      )} */}
                    </div>
                    <button type="button" className={`w-7 h-7 rounded-lg font-bold ${fmtState.bold ? 'bg-white text-black' : 'bg-black text-white'}`} onClick={() => applyFormat('bold')}>B</button>
                    <button type="button" className={`w-7 h-7 rounded-lg italic ${fmtState.italic ? 'bg-white text-black' : 'bg-black text-white'}`} onClick={() => applyFormat('italic')}>I</button>
                    <button type="button" className={`w-7 h-7 rounded-lg underline ${fmtState.underline ? 'bg-white text-black' : 'bg-black text-white'}`} onClick={() => applyFormat('underline')}>U</button>
                    <button type="button" className={`w-7 h-7 rounded-lg line-through ${fmtState.strike ? 'bg-white text-black' : 'bg-black text-white'}`} onClick={() => applyFormat('strike')}>S</button>
                    <button type="button" className="w-7 h-7 bg-black text-white rounded-lg" disabled={true} onClick={() => applyFormat('link')}>🔗</button>
                    <button type="button" className="text-[#0051FF] text-sm" onClick={() => setShowPreview(p => !p)}>Preview</button>
                  </div>
                  <button type="button" className="text-white/80 text-xs px-2 py-1 rounded hover:bg-[#1B1B1B]" onClick={() => setShowVars(v => !v)}>{'{{ . }}'}</button>
                  {showVars && (
                    <div className="absolute right-2 top-full mt-2 w-[240px] bg-[#1B1B1B] border border-[#2A2A2A] rounded-xl shadow-lg p-2 z-50">
                      {templateVars.map(v => (
                        <button key={v.label} type="button" className="w-full text-left text-white text-xs px-3 py-2 rounded hover:bg-[#2A2A2A]" onClick={() => { insertVarChip(v.label); setShowVars(false); }}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {showPreview && (
                  <div className="mt-2 bg-[#252525] rounded-xl p-4 text-white text-sm" dangerouslySetInnerHTML={{ __html: resolveTemplate(body) }} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTab;
