import SVGIcon from "@/components/common/SVGIcon";
import authSocialMediaIcon from "../../assets/svg/Social_media_Icons/auth_social_media_icon.svg";

const SocialIcons = () => {
  return (
    <div className="flex gap-3 lg:gap-4">
      <div className="relative w-[148px] h-[36px] flex-shrink-0 rounded-lg bg-white/7 flex items-center justify-center transition-colors cursor-pointer">
        {/* Composite social icons graphic */}
        <SVGIcon src={authSocialMediaIcon} className="w-[148px] h-[36px] pointer-events-none" />

        {/* Clickable areas overlayed for each icon */}
        <a
          href="https://www.linkedin.com/company/zentag-ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          title="LinkedIn"
          className="absolute top-0 left-0 h-full w-1/3 z-10 block"
        />
        <a
          href="https://www.instagram.com/zentagai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          title="Instagram"
          className="absolute top-0 h-full w-1/3 z-10 block"
          style={{ left: "33.3333%" }}
        />
        <a
          href="https://x.com/zentagai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
          title="X"
          className="absolute top-0 h-full w-1/3 z-10 block"
          style={{ left: "66.6667%" }}
        />
      </div>
    </div>
  );
};

export default SocialIcons;
