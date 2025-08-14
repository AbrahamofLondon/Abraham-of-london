// components/homepage/AboutSection.tsx
import Image from "next/image";
import { motion } from "framer-motion";

type Achievement = { title: string; description: string; year: number };

interface Props {
  bio: string;
  achievements: Achievement[];
  portraitSrc: string;
}

export default function AboutSection({
  bio,
  achievements,
  portraitSrc,
}: Props) {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-16 text-deepCharcoal">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-serif text-3xl text-forest mb-4">
            About Abraham
          </h2>
          <p className="leading-relaxed">{bio}</p>

          {achievements?.length > 0 && (
            <ul className="mt-6 grid gap-3">
              {achievements.map((a, i) => (
                <li key={`${a.title}-${i}`} className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-forest" />
                  <div>
                    <p className="font-semibold">
                      {a.title}{" "}
                      <span className="text-sm text-forest/70">({a.year})</span>
                    </p>
                    <p className="text-sm text-deepCharcoal/80">
                      {a.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-72 h-72 md:w-80 md:h-80 mx-auto rounded-full overflow-hidden shadow-card"
        >
          <Image
            src={portraitSrc}
            alt="Portrait of Abraham of London"
            fill
            sizes="(max-width: 768px) 18rem, 20rem"
            className="object-cover"
            priority={false}
          />
        </motion.div>
      </div>
    </section>
  );
}




