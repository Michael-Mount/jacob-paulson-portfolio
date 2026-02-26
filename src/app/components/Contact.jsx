"use client";

export default function Contact() {
  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-md p-8 md:p-10">
          <h5 className="font-league text-secondary text-5xl lg:text-6xl tracking-tight">
            CONTACT
          </h5>

          <p className="mt-4 text-secondary/70 text-lg max-w-prose">
            Want to work together or ask about a project? Email me anytime.
          </p>

          <a
            href="mailto:jacobryanpaulson@gmail.com"
            className="mt-6 inline-flex w-fit items-center rounded-2xl border border-secondary/20 bg-secondary/5 px-5 py-3 text-secondary font-semibold hover:bg-secondary/10 transition"
          >
            jacobryanpaulson@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
}
