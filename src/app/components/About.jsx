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
        }
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
        }
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
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
                faucibus ex sapien vitae pellentesque sem placerat. In id cursus
                mi pretium tellus duis convallis. Tempus leo eu aenean sed diam
                urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum
                egestas. Iaculis massa nisl malesuada lacinia integer nunc
                posuere. Ut hendrerit semper vel class aptent taciti sociosqu.
                <br />
                <br />
                Ad litora torquent per conubia nostra inceptos himenaeos. Lorem
                ipsum dolor sit amet consectetur adipiscing elit. Quisque
                faucibus ex sapien vitae pellentesque sem placerat. In id cursus
                mi pretium tellus duis convallis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
