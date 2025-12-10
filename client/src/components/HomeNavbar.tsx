import { Link, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import type { User } from "../types";

type Props = {
  isAuthenticated: boolean;
  user: User | null;
  onLogout: () => void;
  isScrolled?: boolean;
  routePhase?: "solo" | "expanding" | "full";
};

const tabs = [
  { label: "Home", to: "/" },
  { label: "Events", to: "/events" },
  { label: "Rankings", to: "/rankings" },
  { label: "Fighters", to: "/fighters" }
];

export default function HomeNavbar({
  isScrolled,
  routePhase = "full"
}: Props) {
  const location = useLocation();
  const [fadePhase, setFadePhase] = useState<"idle" | "out" | "in">("idle");

  const triggerFade = useCallback(
    (fadeInDelay: number, idleDelay: number) => {
      let isCancelled = false;
      setFadePhase("out");
      const fadeInTimer = window.setTimeout(() => {
        if (!isCancelled) setFadePhase("in");
      }, fadeInDelay);
      const idleTimer = window.setTimeout(() => {
        if (!isCancelled) setFadePhase("idle");
      }, idleDelay);
      return () => {
        isCancelled = true;
        window.clearTimeout(fadeInTimer);
        window.clearTimeout(idleTimer);
      };
    },
    []
  );

  useEffect(() => {
    if (typeof isScrolled === "undefined") return;
    return triggerFade(500, 1000);
  }, [isScrolled, triggerFade]);

  useEffect(() => {
    return triggerFade(200, 500);
  }, [location.pathname, triggerFade]);

  const fadeClass =
    fadePhase === "out"
      ? "opacity-0 transition-opacity duration-250 ease-out"
      : fadePhase === "in"
        ? "opacity-100 transition-opacity duration-250 ease-out"
        : "opacity-100";

  // Hide side content during solo and expanding phases
  const hideSideContent = routePhase === "solo" || routePhase === "expanding";

  return (
    <div
      className={`relative flex items-center justify-center text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-white ${fadeClass}`}
      style={{
        minHeight: "52px"
      }}
    >
      {/* Left side content: Home + Events */}
      <div
        className={`flex items-center justify-end overflow-hidden ${
          hideSideContent
            ? "w-0 opacity-0"
            : `flex-[1_1_0%] opacity-100 ${
                isScrolled
                  ? "gap-8 sm:gap-12 lg:gap-[5vw] pr-6 sm:pr-10"
                  : "gap-8 pr-6 sm:pr-10"
              }`
        }`}
        style={{
          transition: "width 1.3s ease-in-out, opacity 1.3s ease-in-out, gap 1.3s ease-in-out, padding 1.3s ease-in-out"
        }}
      >
        {tabs.slice(0, 2).map(tab => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`relative shrink-0 whitespace-nowrap pb-1 transition hover:text-red-600 ${
              location.pathname === tab.to ? "text-red-600" : "text-white/70"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Center spacer - login icon is now rendered separately in App.tsx */}
      <div className="flex shrink-0 items-center px-2" style={{ width: "60px" }} />

      {/* Right side content: Rankings + Fighters */}
      <div
        className={`flex items-center justify-start overflow-hidden ${
          hideSideContent
            ? "w-0 opacity-0"
            : `flex-[1_1_0%] opacity-100 ${
                isScrolled
                  ? "gap-8 sm:gap-12 lg:gap-[5vw] pl-6 sm:pl-10"
                  : "gap-8 pl-6 sm:pl-10"
              }`
        }`}
        style={{
          transition: "width 1.3s ease-in-out, opacity 1.3s ease-in-out, gap 1.3s ease-in-out, padding 1.3s ease-in-out"
        }}
      >
        {tabs.slice(2).map(tab => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`relative shrink-0 whitespace-nowrap pb-1 transition hover:text-red-600 ${
              location.pathname === tab.to ? "text-red-600" : "text-white/70"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
