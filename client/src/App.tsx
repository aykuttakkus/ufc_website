import { useEffect, useRef, useState, useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
// Deactivated pages - kept for future use
// import LoginPage from "./pages/LoginPage";
import FightersPage from "./pages/FightersPage.tsx";
import FighterDetailPage from "./pages/FighterDetailPage";
// import FavoritesPage from "./pages/FavoritesPage";
// import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import RankingsPage from "./pages/RankingsPage";
import EventDetailPage from "./pages/EventDetailPage";
// import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "./context/AuthContext";
import HomeNavbar from "./components/HomeNavbar";
import loginIconSvg from "./assets/image2.svg";


function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [transitionsReady, setTransitionsReady] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  // TV-style opening: solo (just icon) -> expanding (frame grows) -> full
  const [routePhase, setRoutePhase] = useState<"solo" | "expanding" | "full">("solo");

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "0px"
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setTransitionsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // TV-style opening animation sequence on route change
  useEffect(() => {
    let isCancelled = false;
    let expandRafId: number;
    let fullRafId: number;
    
    // Disable transitions temporarily during phase reset
    setTransitionsReady(false);
    setRoutePhase("solo");
    
    // Re-enable transitions after a frame, then start animation
    const enableTransitions = requestAnimationFrame(() => {
      if (!isCancelled) setTransitionsReady(true);
    });
    
    // After 200ms, start expanding the frame
    const expandTimer = window.setTimeout(() => {
      expandRafId = requestAnimationFrame(() => {
        if (!isCancelled) setRoutePhase("expanding");
      });
    }, 200);
    
    // After 900ms total, show full navbar
    const fullTimer = window.setTimeout(() => {
      fullRafId = requestAnimationFrame(() => {
        if (!isCancelled) setRoutePhase("full");
      });
    }, 900);
    
    return () => {
      isCancelled = true;
      cancelAnimationFrame(enableTransitions);
      cancelAnimationFrame(expandRafId);
      cancelAnimationFrame(fullRafId);
      window.clearTimeout(expandTimer);
      window.clearTimeout(fullTimer);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  // Determine outer frame width based on routePhase (memoized for performance)
  const outerFrameWidth = useMemo(() => {
    if (routePhase === "solo") return "80px";
    if (routePhase === "expanding") return "200px";
    return isScrolled ? "100%" : "min(100%, 64rem)";
  }, [routePhase, isScrolled]);

  // Memoize transition string to avoid recalculation on every render
  const transitionStyle = useMemo(() => {
    if (!transitionsReady) return "none";
    return "width 1.3s ease-out, margin 1.3s ease-out, padding 1.3s ease-out, border-radius 1.3s ease-out, transform 1.3s ease-out, box-shadow 1.3s ease-out";
  }, [transitionsReady]);

  // Memoize box-shadow to avoid recalculation on every render
  const boxShadow = useMemo(() => {
    if (routePhase === "full") {
      return isScrolled
        ? `0 25px 50px -12px rgba(0, 0, 0, 0.9),
           0 12px 24px -8px rgba(0, 0, 0, 0.8),
           inset 0 1px 0 rgba(255, 255, 255, 0.15),
           inset 0 -1px 0 rgba(255, 255, 255, 0.08),
           0 0 0 1px rgba(0, 0, 0, 0.3)`
        : `0 20px 40px -15px rgba(0, 0, 0, 0.7),
           0 8px 16px -8px rgba(0, 0, 0, 0.6),
           inset 0 1px 0 rgba(255, 255, 255, 0.15),
           inset 0 -1px 0 rgba(255, 255, 255, 0.08),
           0 0 0 1px rgba(0, 0, 0, 0.2)`;
    }
    return `0 8px 16px -6px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05)`;
  }, [routePhase, isScrolled]);

  // Memoize transform to avoid recalculation
  const transformStyle = useMemo(() => {
    return routePhase === "full" && isScrolled
      ? "perspective(1000px) rotateX(2deg)"
      : "perspective(1000px) rotateX(0.5deg)";
  }, [routePhase, isScrolled]);

  // Login icon rendered separately - completely independent from navbar animations (memoized)
  const loginIcon = useMemo(() => (
    <div className="login-icon inline-flex h-14 w-14 items-center justify-center overflow-visible origin-center">
      <img
        src={loginIconSvg}
        alt="Login icon"
        className="h-full w-full object-contain"
        loading="lazy"
        style={{
          imageRendering: 'crisp-edges', // Sharp rendering for SVG
          transform: 'translateZ(0)', // GPU acceleration
          backfaceVisibility: 'hidden', // Anti-aliasing fix
          WebkitBackfaceVisibility: 'hidden', // Safari specific
        }}
      />
    </div>
  ), [isAuthenticated, user]);
  return (    <div className="min-h-screen bg-black text-white">
      <div
        ref={sentinelRef}
        className="h-8 sm:h-10 lg:h-12"
        aria-hidden="true"
      />
      <header
        className={`sticky top-0 z-50 flex justify-center ${
          isScrolled && routePhase === "full" ? "px-0" : "px-3 sm:px-5 lg:px-6"
        }`}
        style={{
          transition: transitionsReady ? "padding 1.3s ease-out" : "none"
        }}
      >
        {/* Login icon - fixed position, independent from navbar */}
        <div
          className="absolute left-1/2 top-1/2 z-10 flex items-center gap-4"
          style={{
            transform: "translate(-50%, -50%)"
          }}
        >
          {loginIcon}
        </div>

        {/* User name - top right, only when authenticated - DEACTIVATED */}
        {/* {isAuthenticated && user && (
          <div className="absolute right-8 top-[1%] z-10 group">
            <Link
              to="/profile"
              className="flex items-center justify-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl transition-all duration-300 ease-in-out hover:scale-105"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
                borderTop: "1px solid rgba(255, 255, 255, 0.25)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
                borderRight: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 8px 16px -6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)"
              }}
            >
              <div className="login-icon inline-flex h-4 w-4 items-center justify-center overflow-visible origin-center">
                <img
                  src={loginIconSvg}
                  alt="Profile icon"
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-sm font-medium text-white/90 text-center">
                {user.name
                  .split(" ")
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ")}
              </span>
            </Link>
            <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out">
            <button
              onClick={handleLogout}
                className="w-full whitespace-nowrap px-4 py-2 rounded-full backdrop-blur-xl text-sm font-medium text-red-600 transition-all duration-300 ease-in-out hover:scale-105"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.25)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRight: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 8px 16px -6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)"
                }}
            >
                Çıkış Yap
            </button>
            </div>
          </div>
          )} */}

        <div
          className={`relative backdrop-blur-xl ${
            routePhase === "solo"
              ? "rounded-full px-2"
              : routePhase === "expanding"
                ? "rounded-full px-2"
                : isScrolled
                  ? "rounded-none px-6"
                  : "rounded-full px-6"
          }`}
          style={{
            transition: transitionStyle,
            width: outerFrameWidth,
            minHeight: "52px",
            marginLeft: "auto",
            marginRight: "auto",
            background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
            borderTop: "1px solid rgba(255, 255, 255, 0.25)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
            borderRight: "1px solid rgba(255, 255, 255, 0.15)",
            transform: transformStyle,
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
            boxShadow: boxShadow,
            willChange: "transform, width"
          }}
        >
          <HomeNavbar
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
            isScrolled={isScrolled}
            routePhase={routePhase}
          />
        </div>
      </header>

      {/* Routes */}
      <main>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Events list + event detail */}
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:ufcId" element={<EventDetailPage />} />

          {/* Rankings */}
          <Route path="/rankings" element={<RankingsPage />} />

          {/* Fighters list + fighter detail */}
          <Route path="/fighters" element={<FightersPage />} />
          <Route path="/fighters/:externalId" element={<FighterDetailPage />} />

          {/* Deactivated pages - kept for future use */}
          {/* <Route path="/favorites" element={<FavoritesPage />} /> */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          {/* <Route path="/profile" element={<ProfilePage />} /> */}
        </Routes>
      </main>
    </div>
  );
}

export default App;



