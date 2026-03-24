import { useState, useRef } from "react";
import { TiLocationArrow } from "react-icons/ti";
import { Link } from "react-router-dom";

export const BentoTilt = ({ children, className = "" }) => {
  const [transformStyle, setTransformStyle] = useState("");
  const itemRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!itemRef.current) return;

    const { left, top, width, height } =
      itemRef.current.getBoundingClientRect();

    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * 5;
    const tiltY = (relativeX - 0.5) * -5;

    const newTransform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(.95, .95, .95)`;
    setTransformStyle(newTransform);
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div
      ref={itemRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({ src, title, description, isComingSoon }) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoverOpacity, setHoverOpacity] = useState(0);
  const hoverButtonRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!hoverButtonRef.current) return;
    const rect = hoverButtonRef.current.getBoundingClientRect();

    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setHoverOpacity(1);
  const handleMouseLeave = () => setHoverOpacity(0);

  return (
    <div className="relative size-full">
      <video
        src={src}
        loop
        muted
        autoPlay
        className="absolute left-0 top-0 size-full object-cover object-center"
      />
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title special-font">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
        </div>

        {isComingSoon && (
          <div
            ref={hoverButtonRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="border-hsla relative flex w-fit cursor-pointer items-center gap-1 overflow-hidden rounded-full bg-black px-5 py-2 text-xs uppercase text-white/20"
          >
            {/* Radial gradient hover effect */}
            <div
              className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
              style={{
                opacity: hoverOpacity,
                background: `radial-gradient(100px circle at ${cursorPosition.x}px ${cursorPosition.y}px, #656fe288, #00000026)`,
              }}
            />
            <TiLocationArrow className="relative z-20" />
            <p className="relative z-20">coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const BentoMovieCardImage = ({
  src,
  title,
  description,
  isComingSoon,
}) => {
  return (
    <div className="relative size-full h-[600px]">
      <img
        src={src}
        loop
        muted
        autoPlay
        className="absolute left-0 top-0 size-full object-cover object-center "
      />
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-gray-200">
        <div>
          <h1 className="uppercase md:text-4xl text-2xl font-black font-zentry special-font">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const BentoCardImage = ({ src, title, description, isComingSoon }) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoverOpacity, setHoverOpacity] = useState(0);
  const hoverButtonRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!hoverButtonRef.current) return;
    const rect = hoverButtonRef.current.getBoundingClientRect();

    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setHoverOpacity(1);
  const handleMouseLeave = () => setHoverOpacity(0);

  return (
    <div className="relative size-full h-[600px]">
      <img
        src={src}
        loop
        muted
        autoPlay
        className="absolute left-0 top-0 size-full object-cover object-center "
      />
      <div className="absolute left-0 top-0 size-full bg-black/50 transform rotate-1"></div>
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-gray-200">
        <div>
          <h1 className="uppercase md:text-4xl text-2xl font-black font-zentry special-font">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Features = () => (
  <section className="bg-black pb-52">
    <div className="container mx-auto px-3 md:px-10">
      <div className="px-5 py-32">
        <p className="font-circular-web text-2xl md:text-3xl text-blue-50">
          Welcome to MindCare
        </p>
        <p className="max-w-md font-circular-web text-lg text-blue-50 opacity-50">
          Discover features designed to enhance your mental well-being, bringing
          relaxation, engagement, and personalized support into your daily life.
        </p>
      </div>

      <a href={"https://framevr.io/zenithai"} className="cursor-pointer">
        <BentoTilt className="border-hsla relative mb-7 h-96 w-full overflow-hidden rounded-md md:h-[65vh] ">
          <BentoCard
            src="videos/feature-1.mp4"
            title={
              <>
                Medit<b>a</b>t<b>a</b>ion Room
              </>
            }
            description="Embrace the serenity of guided meditation, designed to calm your mind and nurture inner peace."
          />
        </BentoTilt>
      </a>

      <div className="grid h-[95vh] w-full grid-cols-2 grid-rows-2 gap-7">
        <BentoTilt className="bento-tilt_1 row-span-1 md:col-span-1">
          <a href="/face-detection">
            <BentoCard
              src="videos/feature-4.mp4"
              title={
                <>
                  Reco<b>m</b>mended Movies
                </>
              }
              description="Get movie recommendations that resonate with your emotional state and uplift your spirit."
            />
          </a>
        </BentoTilt>

        <BentoTilt className="bento-tilt_1 md:col-span-1">
          <a href="/games">
            <BentoCard
              src="videos/feature-3.mp4"
              title={
                <>
                  Reco<b>m</b>mended Ga<b>m</b>es
                </>
              }
              description="Engage in meaningful conversations with an AI companion for emotional support and guidance."
            />
          </a>
        </BentoTilt>

        <BentoTilt className="bento-tilt_2">
          <a href="/profile">
            <div className="flex size-full flex-col justify-between bg-violet-300 p-5">
              <h1 className="bento-title special-font max-w-64 text-black">
                Mood<b> Tracking</b>
              </h1>
              <p className="text-black">
                Track your mood patterns, build healthy habits, and view your
                emotional progress over time.
              </p>
              <TiLocationArrow className="m-5 scale-[5] self-end" />
            </div>
          </a>
        </BentoTilt>

        <BentoTilt className="bento-tilt_2">
          <video
            src="videos/feature-5.mp4"
            loop
            muted
            autoPlay
            className="size-full object-cover object-center"
          />
        </BentoTilt>
      </div>
    </div>
  </section>
);

export default Features;
