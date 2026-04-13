import { useState } from "react";

const PlaybackSpeedDropdown = ({
    playbackRate,
    setPlaybackRate,
}: {
    playbackRate: number;
    setPlaybackRate: (val: number) => void;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-[#18191B] text-white text-[16px] font-bold font-montserrat border-none outline-none cursor-pointer appearance-none pr-2"
            >
                <option value="2">2x</option>
                <option value="1.5">1.5x</option>
                <option value="1.25">1.25x</option>
                <option value="1">1x</option>
                <option value="0.5">0.5x</option>
            </select>
            <svg
                width="9"
                height="6"
                viewBox="0 0 9 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            >
                <path
                    d="M4.5 3.68205L1.38875 0.5L0.5 1.40897L4.5 5.5L8.5 1.40897L7.61125 0.5L4.5 3.68205Z"
                    fill="white"
                />
            </svg>
        </>
    );
};

export default PlaybackSpeedDropdown;
