"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function About() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-left",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".about-right",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        },
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* LEFT */}
          <div className="about-left lg:col-span-4">
            <h2 className="font-league text-secondary text-5xl lg:text-6xl tracking-tight">
              ABOUT ME
            </h2>

            <div className="mt-6 w-fit rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
              <img
                className="h-auto w-64 lg:w-72 select-none"
                src="/images/running.GIF"
                alt="Animated GIF of the audio engineer, Jacob Paulson, running in place and throwing a peace sign."
                loading="lazy"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="about-right lg:col-span-8">
            {/* Divider: top on mobile, left on desktop */}
            <div className="border-t border-secondary/30 pt-8 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
              <p className="font-league text-secondary/80 text-lg leading-relaxed max-w-prose">
                Born in Denver, Colorado into a family of 6 who were all
                obsessed with music, I grew up listening to anything and
                everything. My parents made sure to share their music tastes
                with me growing up and my brothers shared their love for video
                games. When I was 8 years old I played Nintendo’s Legend of
                Zelda: Ocarina of time and instantly fell in love with the score
                and audio in that game. Ever since then I have strived through
                indie game development and music production to try and recreate
                that magic I felt as a kid. I continue to keep that feeling in
                mind as I put forward industry quality mixes and creative sound
                design for video games. It’s an incredibly important thing to me
                to help artists achieve their vision for their music or game.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
