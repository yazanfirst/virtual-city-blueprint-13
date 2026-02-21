import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md";
  linkTo?: string;
}

const Logo = ({ size = "md", linkTo = "/" }: LogoProps) => {
  const imgSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <Link to={linkTo} className="flex items-center gap-3 transition-all duration-300 hover:opacity-80">
      <img
        src="/virtual-city-logo.svg"
        alt="Virtual Shop City"
        className={`${imgSize} rounded-lg border border-primary/30`}
      />
      <span className={`font-display ${textSize} font-bold text-primary tracking-wide hidden xs:inline`}>
        Virtual Shop City
      </span>
    </Link>
  );
};

export default Logo;
