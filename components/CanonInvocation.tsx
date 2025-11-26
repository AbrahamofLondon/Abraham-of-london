import * as React from "react";
import clsx from "clsx";

interface CanonInvocationProps {
  className?: string;
}

export default function CanonInvocation({ className }: CanonInvocationProps) {
  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-softGold/25 bg-black/60 px-6 py-10 sm:px-10 sm:py-14",
        "shadow-[0_0_40px_rgba(0,0,0,0.65)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_rgba(245,216,130,0.18),_transparent_55%)]",
        className,
      )}
    >
      <div className="relative space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-softGold/80">
          Invocation · For Builders & Reformers
        </p>

        <div className="space-y-3 font-serif text-lg leading-relaxed text-cream sm:text-xl">
          <p>
            Before clay touched breath,
            <br />
            Before time learned to turn,
            <br />
            Before kingdoms rose or crumbled into dust —
          </p>

          <p className="font-semibold text-softGold">
            Purpose was written.
          </p>

          <p>
            It waited for builders.
            <br />
            It waited for fathers.
            <br />
            It waited for mothers.
            <br />
            It waited for nations that remembered their name.
          </p>

          <p>
            It waited for men who would refuse the drift,
            <br />
            Women who would defy the darkness,
            <br />
            And children who would carry light in their bones.
          </p>

          <p>
            The world bends to those who walk in alignment.
            <br />
            History bows to those who walk with fire.
            <br />
            Civilisation remembers those who build with eternity in mind.
          </p>

          <p className="mt-4 text-center text-base font-semibold uppercase tracking-[0.3em] text-softGold">
            Stand. · Rise. · Take your place.
          </p>

          <p>
            The blueprint is older than empires.
            <br />
            The calling is louder than chaos.
            <br />
            The future belongs to the aligned.
          </p>

          <p>
            You are not here by accident.
            <br />
            You are a builder.
          </p>

          <p className="font-semibold text-softGold">
            Leave a mark that outlives your breath.
          </p>
        </div>
      </div>
    </section>
  );
}