import React from "react";
import SVGIcon from "../../common/SVGIcon";
import AI_Icon from "../../../assets/svg/AI_Icon.svg";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  title?: string;
  videoUrl?: string;
};

const YouTubePostPreviewModal: React.FC<Props> = ({ isOpen, onClose, profileName, thumbnailUrl, description, tags, title, videoUrl }) => {
  if (!isOpen) return null;
  const text = (description || "") + (tags && tags.length ? ` ${tags.join(" ")}` : "");
  const ytTitle = title || "Bangladesh vs Bhutan 2025: Top highlights and dangerous moments";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative bg-[#2F2F31] rounded-[32px] border border-[#434343] w-full max-w-[880px] max-h-[92vh] overflow-hidden">
        <div className="relative px-8 pt-6 pb-2 flex items-center justify-center">
          <h2 className="text-white text-[20px] font-bold">Youtube video preview</h2>
          <button onClick={onClose} className="absolute right-8 top-6 text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 13.913L13.913 0L16 2.087L2.087 16L0 13.913Z" fill="currentColor"/><path d="M16 13.913L2.087 0L0 2.087L13.913 16L16 13.913Z" fill="currentColor"/></svg>
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="mx-auto w-[640px] bg-black rounded-md shadow-xl relative overflow-hidden">
            <div className="w-full pt-[56.25%]" />
            <div className="absolute inset-0">
              {videoUrl ? (
                <video src={videoUrl} autoPlay className="w-full h-full object-cover" controls controlsList="nodownload"/>
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Video" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#222]" />
              )}
            </div>
            {!videoUrl && (
              <>
              <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M2 4H22V20H14V19H21V5H3V8H2V4Z" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M2 10C3.31322 10 4.61358 10.2587 5.82683 10.7612C7.04009 11.2638 8.14248 12.0003 9.07107 12.9289C9.99965 13.8575 10.7362 14.9599 11.2388 16.1732C11.7413 17.3864 12 18.6868 12 20H10C10 18.9494 9.79307 17.9091 9.39104 16.9385C8.989 15.9679 8.39972 15.086 7.65685 14.3431C6.91399 13.6003 6.03207 13.011 5.06147 12.609C4.09086 12.2069 3.05057 12 2 12V10Z" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M2 13.5C2.85359 13.5 3.69883 13.6681 4.48744 13.9948C5.27606 14.3214 5.99261 14.8002 6.59619 15.4038C7.19978 16.0074 7.67856 16.7239 8.00522 17.5126C8.33187 18.3012 8.5 19.1464 8.5 20H6.5C6.5 19.4091 6.3836 18.8239 6.15746 18.2779C5.93131 17.732 5.59984 17.2359 5.18198 16.818C4.76412 16.4002 4.26804 16.0687 3.72208 15.8425C3.17611 15.6164 2.59095 15.5 2 15.5L2 13.5Z" fill="white"/><path d="M5 20C5 19.606 4.9224 19.2159 4.77164 18.8519C4.62087 18.488 4.3999 18.1573 4.12132 17.8787C3.84274 17.6001 3.51203 17.3791 3.14805 17.2284C2.78407 17.0776 2.39397 17 2 17L2 20H5Z" fill="white"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="15" viewBox="0 0 18 15" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M0 1.5C0 0.671573 0.671573 0 1.5 0H16.5C17.3284 0 18 0.671573 18 1.5V13.5C18 14.3284 17.3284 15 16.5 15H1.5C0.671573 15 0 14.3284 0 13.5V1.5ZM1.5 1C1.22386 1 1 1.22386 1 1.5V13.5C1 13.7761 1.22386 14 1.5 14H16.5C16.7761 14 17 13.7761 17 13.5V1.5C17 1.22386 16.7761 1 16.5 1H1.5Z" fill="white"/></svg>
              </div>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M2 2H7V2.66667H2.66667V7H2V2Z" fill="white" stroke="white" strokeWidth="0.25"/><path fillRule="evenodd" clipRule="evenodd" d="M14 2H9V2.66667H13.3333V7H14V2Z" fill="white" stroke="white" strokeWidth="0.25"/><path fillRule="evenodd" clipRule="evenodd" d="M2 14L7 14L7 13.3333L2.66667 13.3333L2.66667 9L2 9L2 14Z" fill="white" stroke="white" strokeWidth="0.25"/><path fillRule="evenodd" clipRule="evenodd" d="M14 14L9 14L9 13.3333L13.3333 13.3333L13.3333 9L14 9L14 14Z" fill="white" stroke="white" strokeWidth="0.25"/></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9.50753 2.4178C9.54771 2.17671 9.75631 2 10.0007 2H14.0007C14.2451 2 14.4537 2.17671 14.4939 2.4178L14.9407 5.09828C15.501 5.33725 16.0261 5.64235 16.5063 6.00368L19.0526 5.04975C19.2815 4.964 19.5388 5.0563 19.661 5.26797L21.661 8.73208C21.7832 8.94375 21.7345 9.21275 21.5458 9.3681L19.4468 11.0961C19.4824 11.3926 19.5007 11.6943 19.5007 12C19.5007 12.3058 19.4824 12.6075 19.4468 12.904L21.5458 14.632C21.7345 14.7873 21.7832 15.0563 21.661 15.268L19.661 18.7321C19.5388 18.9437 19.2814 19.036 19.0526 18.9503L16.5063 17.9964C16.0261 18.3577 15.501 18.6628 14.9407 18.9017L14.4939 21.5822C14.4537 21.8233 14.2451 22 14.0007 22H10.0007C9.75631 22 9.54771 21.8233 9.50753 21.5822L9.06079 18.9017C8.50046 18.6628 7.97532 18.3576 7.49516 17.9963L4.94888 18.9502C4.71999 19.036 4.46266 18.9437 4.34045 18.732L2.34045 15.2679C2.21824 15.0563 2.26698 14.7872 2.45568 14.6319L4.5547 12.9039C4.51905 12.6074 4.50073 12.3057 4.50073 12C4.50073 11.6942 4.51905 11.3925 4.5547 11.096L2.4557 9.36805C2.267 9.2127 2.21827 8.9437 2.34048 8.73203L4.34048 5.26792C4.46269 5.05625 4.72002 4.96396 4.9489 5.0497L7.49521 6.00364C7.97536 5.64233 8.50048 5.33724 9.06079 5.09828L9.50753 2.4178ZM10.4243 3L10.0011 5.53908C9.97191 5.71427 9.85197 5.86083 9.68602 5.92409C9.03345 6.17285 8.43098 6.52391 7.89828 6.9579C7.76049 7.07016 7.57348 7.10083 7.40705 7.03849L4.99472 6.13474L3.41828 8.86521L5.40637 10.5019C5.54334 10.6146 5.6103 10.7915 5.58233 10.9667C5.52866 11.3029 5.50073 11.648 5.50073 12C5.50073 12.352 5.52866 12.697 5.58232 13.0332C5.61029 13.2084 5.54333 13.3853 5.40636 13.4981L3.41826 15.1347L4.9947 17.8652L7.407 16.9615C7.57343 16.8991 7.76045 16.9298 7.89823 17.0421C8.43094 17.4761 9.03343 17.8271 9.68602 18.0759C9.85197 18.1392 9.97191 18.2857 10.0011 18.4609L10.4243 21H13.5772L14.0003 18.4609C14.0295 18.2857 14.1495 18.1392 14.3154 18.0759C14.968 17.8272 15.5705 17.4761 16.1032 17.0421C16.241 16.9298 16.428 16.8992 16.5944 16.9615L19.0067 17.8653L20.5832 15.1348L18.5951 13.4981C18.4581 13.3854 18.3912 13.2085 18.4191 13.0333C18.4728 12.6971 18.5007 12.352 18.5007 12C18.5007 11.648 18.4728 11.303 18.4191 10.9668C18.3912 10.7916 18.4581 10.6147 18.5951 10.5019L20.5832 8.86526L19.0068 6.13479L16.5945 7.03852C16.428 7.10087 16.241 7.07019 16.1032 6.95794C15.5705 6.52393 14.968 6.17286 14.3154 5.92409C14.1495 5.86083 14.0295 5.71427 14.0003 5.53908L13.5772 3H10.4243Z" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5ZM8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12Z" fill="white"/></svg>
              </div>
            </div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-6">
              <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white">⏮</div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">⏯</div>
              <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white">⏭</div>
            </div>
            <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-sm">0:00 / 00:55</span></div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M2 2H7V2.66667H2.66667V7H2V2Z" fill="white" stroke="white" strokeWidth="0.25"/><path fillRule="evenodd" clipRule="evenodd" d="M14 2H9V2.66667H13.3333V7H14V2Z" fill="white" stroke="white" strokeWidth="0.25"/><path fillRule="evenodd" clipRule="evenodd" d="M2 14L7 14L7 13.3333L2.66667 13.3333L2.66667 9L2 9L2 14Z" fill="white" stroke="white" strokeWidth="0.25"/><path fillRule="evenodd" clipRule="evenodd" d="M14 14L9 14L9 13.3333L13.3333 13.3333L13.3333 9L14 9L14 14Z" fill="white" stroke="white" strokeWidth="0.25"/></svg>
            </div>
            </>
            )}
          </div>
          <div className="mx-auto w-[640px] bg-[#0f0f0f] text-white rounded-b-md">
            <div className="border-t border-[#2a2a2a] p-4">
              <div className="text-[18px] font-semibold leading-tight">{ytTitle}</div>
              <div className="text-[13px] text-white/80 mt-1">{text ? `${text.slice(0, 64)}...more` : ""}</div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center"><SVGIcon src={AI_Icon} className="w-4 h-4" /></div>
                  <span className="text-[13px]">{profileName || "Your account"}</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="15" cy="12" r="3"/><rect width="20" height="14" x="2" y="5" rx="7"/></svg>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M8.00032 3.33335C5.06768 3.33335 2.50032 5.90071 2.50032 8.83335C2.50032 11.766 5.06768 14.3334 8.00032 14.3334C10.933 14.3334 13.5003 11.766 13.5003 8.83335C13.5003 5.90071 10.933 3.33335 8.00032 3.33335ZM1.83366 8.83335C1.83366 5.5338 4.70077 2.66669 8.00032 2.66669C11.2999 2.66669 14.167 5.5338 14.167 8.83335C14.167 12.1329 11.2999 15 8.00032 15C4.70077 15 1.83366 12.1329 1.83366 8.83335Z" fill="white"/></svg>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button className="flex items-center gap-2 bg-[#1B1B1B] rounded-lg px-4 py-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M1.33398 6.33398H5.00065V14.334H1.33398V6.33398ZM2.00065 7.00065V13.6673H4.33398V7.00065H2.00065Z" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M10.7342 2.92364C10.9859 2.25233 10.1456 1.71119 9.63858 2.21816L5.00065 6.85609V13.6673H11.1397C11.8913 13.6673 12.5499 13.1643 12.7477 12.4392L13.8864 8.2638C14.0599 7.62766 13.581 7.00068 12.9217 7.00068H9.68632C9.57699 7.00068 9.47462 6.94707 9.41235 6.85721C9.35007 6.76735 9.33582 6.65267 9.37421 6.5503L10.7342 2.92364ZM4.5634 6.35053L9.16718 1.74675C10.1811 0.73282 11.8619 1.8151 11.3584 3.15773L10.1673 6.33401H12.9217C14.0206 6.33401 14.8187 7.37897 14.5296 8.43921L13.3908 12.6146C13.114 13.6298 12.1919 14.334 11.1397 14.334H4.66732C4.48322 14.334 4.33398 14.1848 4.33398 14.0007V6.66734C4.33398 6.51953 4.43019 6.39419 4.5634 6.35053Z" fill="white"/></svg><span className="text-sm">Like</span></button>
                <button className="flex items-center gap-2 bg-[#1B1B1B] rounded-lg px-4 py-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M14.5879 9.34766L10.9212 9.34766L10.9212 1.34766L14.5879 1.34766L14.5879 9.34766ZM13.9212 8.68099L13.9212 2.01432L11.5879 2.01432L11.5879 8.68099L13.9212 8.68099Z" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M5.18767 12.758C4.93593 13.4293 5.77632 13.9705 6.28329 13.4635L10.9212 8.82555L10.9212 2.0143L4.78215 2.0143C4.03056 2.0143 3.37197 2.51733 3.17421 3.24243L2.03546 7.41784C1.86197 8.05398 2.34085 8.68096 3.00022 8.68096L6.23555 8.68096C6.34488 8.68096 6.44726 8.73457 6.50953 8.82443C6.5718 8.91429 6.58605 9.02897 6.54766 9.13134L5.18767 12.758ZM11.3585 9.33111L6.7547 13.9349C5.74076 14.9488 4.05996 13.8665 4.56345 12.5239L5.75455 9.34763L3.00022 9.34763C1.90127 9.34763 1.10313 8.30267 1.39229 7.24243L2.53103 3.06702C2.80789 2.05188 3.72993 1.34763 4.78215 1.34763L11.2546 1.34763C11.4387 1.34763 11.5879 1.49687 11.5879 1.68096L11.5879 9.0143C11.5879 9.16211 11.4917 9.28745 11.3585 9.33111Z" fill="white"/></svg><span className="text-sm">Dislike</span></button>
                <button className="flex items-center gap-2 bg-[#1B1B1B] rounded-lg px-4 py-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9.55443 1.84577C9.68686 1.79826 9.83486 1.83901 9.9243 1.94762L14.591 7.61429C14.6923 7.73737 14.6923 7.91501 14.591 8.03809L9.9243 13.7048C9.83486 13.8134 9.68686 13.8541 9.55443 13.8066C9.422 13.7591 9.33366 13.6336 9.33366 13.4929V10.1209C8.9015 10.0415 8.45589 10 8.00032 10C5.531 10 3.34664 11.2202 2.01723 13.092C1.92811 13.2174 1.76467 13.2656 1.62176 13.2085C1.47885 13.1514 1.39361 13.0038 1.41552 12.8515C1.97274 8.97724 5.30522 6.00002 9.33365 6.00002C9.33365 6.00002 9.33366 6.00002 9.33366 6.00002V2.15952C9.33366 2.01883 9.422 1.89328 9.55443 1.84577ZM10.0003 3.08864V6.34047C10.0003 6.43134 9.96322 6.51828 9.8976 6.58115C9.83198 6.64403 9.74354 6.67738 9.65275 6.6735C9.54697 6.66897 9.44059 6.66668 9.33365 6.66668C6.11377 6.66668 3.37818 8.7421 2.3923 11.6281C3.83572 10.2092 5.81573 9.33335 8.00032 9.33335C8.59711 9.33335 9.17903 9.39876 9.73913 9.52292C9.89173 9.55675 10.0003 9.69206 10.0003 9.84836V12.5637L13.9018 7.82619L10.0003 3.08864Z" fill="white"/></svg><span className="text-sm">Share</span></button>
                <button className="flex items-center gap-2 bg-[#1B1B1B] rounded-lg px-4 py-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M12.6673 14.6667H3.33398V14H12.6673V14.6667Z" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M7.66602 11.5V1.5H8.33268V11.5H7.66602Z" fill="white"/><path fillRule="evenodd" clipRule="evenodd" d="M8 11.8047L3.5286 7.33328L4 6.86188L8 10.8619L12 6.86188L12.4714 7.33328L8 11.8047Z" fill="white"/></svg><span className="text-sm">Download</span></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePostPreviewModal;

