import React, { useState, useRef, useEffect } from 'react';
import SectionHeader from './SectionHeader';
import CloudIcon from '@/assets/svg/Social_media_Icons/cloud.svg';
import SVGIcon from '@/components/common/SVGIcon';
import SparkleGradient from '@/assets/svg/SparkleGradient.svg';
import { useAppSelector } from '@/store';
import { selectCurrentClip } from '@/store/slices/clipsSlice';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { publishToCloud } from '@/api/cloudPublish';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const CloudTab: React.FC = () => {
  const clip = useAppSelector(selectCurrentClip);
  const user = useSelector((state: RootState) => state.auth.user);
  const { canCreate } = usePermissions();
  const canPublish = canCreate('Published');
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(false);
  const [content, setContent] = useState('');
  const [storage, setStorage] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [title, setTitle] = useState('');
  const titleEditorRef = useRef<HTMLDivElement | null>(null);
  const [showVars, setShowVars] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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

  const insertVarChip = (label: string) => {
    const el = titleEditorRef.current;
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
    setTitle(el.innerText);
  };

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
    let out = wrapper.textContent || '';
    templateVars.forEach(v => {
      const token = new RegExp(v.label.replace(/[{}]/g, '\\$&'), 'g');
      out = out.replace(token, v.value);
    });
    return out;
  };

  useEffect(() => {
    const el = titleEditorRef.current;
    if (!el) return;
    const initial = String((clip as any)?.title || '');
    if (!el.textContent || el.textContent.trim().length === 0) {
      el.textContent = initial;
      if (!title || title.trim().length === 0) {
        setTitle(initial);
      }
    }
  }, [title, selected, expanded, clip]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Cloud" expanded={expanded} onClick={() => setExpanded(prev => !prev)} iconSrc={CloudIcon} />
      <div className={expanded ? '' : 'hidden'}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-[18px] h-[18px] rounded border-[1.5px] cursor-pointer flex items-center justify-center ${selected ? 'bg-white border-white' : 'bg-[#18191B] border-white'}`} onClick={() => setSelected(prev => !prev)}>
              {selected && (
                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.742432 2.87734L3.89243 6.02734L9.66743 0.777344" stroke="url(#grad_cloud)" strokeWidth="2.1" />
                  <defs>
                    <linearGradient id="grad_cloud" x1="12.9251" y1="3.43348" x2="7.00799" y2="-3.13514" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BBFF" />
                      <stop offset="1" stopColor="#0051FF" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
            <span className="text-sm text-white">Cloud</span>
          </div>

          {selected && (
            <div className="ml-9 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white font-medium">Content to publish</label>
                {/* <button className="w-full h-[42px] bg-[#252525] rounded-xl px-4 flex items-center justify-between text-sm text-white"> */}
                {/* <span>{content || 'Select files'}</span> */}
                {/* <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.6H15.2C15.4122 1.6 15.6157 1.68429 15.7657 1.83431C15.9157 1.98434 16 2.18783 16 2.4V15.2C16 15.4122 15.9157 15.6157 15.7657 15.7657C15.6157 15.9157 15.4122 16 15.2 16H0.8C0.587827 16 0.384344 15.9157 0.234315 15.7657C0.0842854 15.6157 0 15.4122 0 15.2V2.4C0 2.18783 0.0842854 1.98434 0.234315 1.83431C0.384344 1.68429 0.587827 1.6 0.8 1.6H4V0H5.6V1.6H10.4V0H12V1.6ZM1.6 6.4V14.4H14.4V6.4H1.6Z" fill="white"/></svg> */}
                <SearchableSelect
                  // label="Privacy"
                  placeholder="Select file"
                  options={[
                    { value: "Clip JSON", label: "Clip JSON" },
                    { value: "Thumbnail JPEG", label: "Thumbnail JPEG" },
                    { value: "MetaData JSON", label: "MetaData JSON" },
                  ]}
                  // value={privacy}
                  searchable={false}
                  onChange={(val) => setContent(String(val))}
                />
                {/* </button> */}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white font-medium">Storage</label>
                {/* <button className="w-full h-[42px] bg-[#252525] rounded-xl px-4 flex items-center justify-between text-sm text-white"> */}
                {/* <span>{content || 'Select files'}</span> */}
                {/* <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.6H15.2C15.4122 1.6 15.6157 1.68429 15.7657 1.83431C15.9157 1.98434 16 2.18783 16 2.4V15.2C16 15.4122 15.9157 15.6157 15.7657 15.7657C15.6157 15.9157 15.4122 16 15.2 16H0.8C0.587827 16 0.384344 15.9157 0.234315 15.7657C0.0842854 15.6157 0 15.4122 0 15.2V2.4C0 2.18783 0.0842854 1.98434 0.234315 1.83431C0.384344 1.68429 0.587827 1.6 0.8 1.6H4V0H5.6V1.6H10.4V0H12V1.6ZM1.6 6.4V14.4H14.4V6.4H1.6Z" fill="white"/></svg> */}
                <SearchableSelect
                  // label="Privacy"
                  placeholder="Select storage"
                  options={[
                    { value: "GCP_BUCKET", label: "gcp-multistream-dev (GCP bucket)" },
                  ]}
                  // value={privacy}
                  searchable={false}
                  onChange={(val) => {
                    const v = String(val);
                    setStorage(v);
                    if (v === 'GCP_BUCKET') {
                      setFolderPath('Studio_Model_StorageBucket/');
                    }
                  }}
                />
                {/* </button> */}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white font-medium">Folder path</label>
                <input type="text" value={folderPath} onChange={(e) => setFolderPath(e.target.value)} placeholder="Folder:/{{fileID}}–{{videoTitle}}" className="w-full h-[42px] bg-[#252525] rounded-xl px-4 text-sm text-white" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white font-medium">Title</label>
                  {/* <button type="button" className="flex items-center gap-1 text-xs font-bold text-white hover:underline" onClick={() => setTitle((clip as any)?.title || title)}>
                    <SVGIcon src={SparkleGradient} className="w-3 h-3 flex-shrink-0" aria-label="Generate" />
                    <span>Generate</span>
                  </button> */}
                </div>
                <div
                  ref={titleEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setTitle((e.target as HTMLDivElement).innerHTML)}
                  className="w-full bg-[#252525] rounded-xl p-3 text-white text-sm min-h-[42px] outline-none"
                />
                <div className="mt-2 bg-[#0F1011] border border-[#2A2A2A] rounded-xl px-3 py-2 flex items-center justify-between relative">
                  {/* <div className="flex items-center gap-3">
                    <div className="flex items-center h-8 rounded-full overflow-hidden bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white">
                      <button type="button" className="px-4 text-sm font-medium">
                        Publish
                      </button>
                      <div className="w-px h-8 bg-white/40" />
                      <button type="button" className="px-2 text-sm" onClick={() => setShowPreview(p => !p)}>Preview</button>
                    </div>
                  </div> */}
                  <div className="flex items-center gap-2">
                    {canPublish && (
                      <button type="button"
                        disabled={!storage || !folderPath || !title}
                        onClick={async () => {
                          try {
                            const include: string[] = ['clip'];
                            if (content === 'Clip JSON' || content === 'MetaData JSON') include.push('clip_json');
                            if (content === 'Thumbnail JPEG') include.push('thumbnail_jpeg');
                            const publishPromise = new Promise<any>((resolve, reject) => {
                              publishToCloud({
                                clipId: String((clip as any)?._id || (clip as any)?.id || ''),
                                title: String(resolveTemplate(title) || (clip as any)?.title || ''),
                                folderPath: String(folderPath || ''),
                                include,
                                userId: String(user?.userId || ''),
                              })
                                .then((resp) => {
                                  if (!resp?.status) return reject(new Error(resp?.message || 'Publish failed'));
                                  resolve(resp);
                                })
                                .catch(reject);
                            });
                            toast.promise(publishPromise, {
                              loading: 'Publishing to cloud…',
                              success: 'Published to cloud successfully',
                              error: (e) => e?.message || 'Publish failed',
                            });
                            await publishPromise;
                          } catch (e: any) {}
                        }}
                        className={`w-[100px] h-[32px] bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white text-sm font-medium rounded-xl transition-opacity ${(!storage || !folderPath) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                      >
                        Publish
                      </button>
                    )}
                    <button type="button" className="text-[#0051FF] text-sm ml-2" onClick={() => setShowPreview(p => !p)}>Preview</button>
                  </div>
                  <button type="button" className="text-white/80 text-xs px-2 py-1 rounded hover:bg-[#1B1B1B]" onClick={() => setShowVars(v => !v)}>{'{{ . }}'}</button>
                  {showVars && (
                    <div className="absolute right-2 top-full mt-2 w-[240px] bg-[#1B1B1B] border border-[#2A2A2A] rounded-xl shadow-lg p-2 z-50">
                      {templateVars.map(v => (
                        <button
                          key={v.label}
                          type="button"
                          className="w-full text-left text-white text-xs px-3 py-2 rounded hover:bg-[#2A2A2A]"
                          onClick={() => {
                            insertVarChip(v.label);
                            const el = titleEditorRef.current;
                            setTitle(el ? el.innerHTML : '');
                            setShowVars(false);
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {showPreview && (
                  <div className="mt-3 space-y-3">
                      <div className="bg-[#252525] rounded-xl p-4 text-white text-sm">
                      {(() => { const resolvedTitle = (resolveTemplate(title) || String((clip as any)?.title || '')); const ext = (content === 'Clip JSON' || content === 'MetaData JSON') ? '.json' : (content === 'Thumbnail JPEG' ? '.jpg' : '.mp4'); return (
                        <>
                          <div>Clip: {resolvedTitle}</div>
                          <div>Folder: {folderPath || '—'}</div>
                          <div>File: {resolvedTitle}{ext}</div>
                          <div>Full Path: {(folderPath || '')}{resolvedTitle}{ext}</div>
                        </>
                      ); })()}
                      </div>
                    <div className="bg-[#1B1B1B] rounded-xl p-4 text-white text-sm">
                      <div className="font-semibold mb-2">Files to be published</div>
                      <div className="flex items-center gap-2"><span>Clip</span><span className="text-green-400">✔</span></div>
                      {content && <div className="flex items-center gap-2"><span>{content}</span><span className="text-green-400">✔</span></div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudTab;
