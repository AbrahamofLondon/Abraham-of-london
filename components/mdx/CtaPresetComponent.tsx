import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getCtaPreset,
  getThemeColors,
  getSortedItems,
  type CTAKey,
  type LinkItem,
  type ThemeTokens,
} from "./cta-presets";

interface CtaPresetProps {
  presetKey?: CTAKey | string;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

// Enhanced badge system with animations
const getBadgeConfig = (badge: string | undefined) => {
  const config = {
    new: {
      color: "bg-green-100 text-green-800 border-green-200",
      label: "New",
    },
    popular: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      label: "Popular",
    },
    featured: {
      color: "bg-purple-100 text-purple-800 border-purple-200",
      label: "Featured",
    },
    free: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "Free",
    },
    premium: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      label: "Premium",
    },
    exclusive: {
      color:
        "bg-gradient-to-r from-gold to-yellow-400 text-slate-900 border-yellow-300",
      label: "Exclusive",
    },
  } as const;

  return badge
    ? config[badge as keyof typeof config] ?? {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        label: badge,
      }
    : null;
};

// Enhanced link item with smooth animations
const LinkItemComponent: React.FC<{
  item: LinkItem;
  theme: ThemeTokens;
  featured?: boolean;
  compact?: boolean;
}> = ({ item, theme, featured = false, compact = false }) => {
  const badgeConfig = getBadgeConfig(item.badge);

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={item.href}
        className={`group block relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
          featured
            ? `bg-gradient-to-br ${theme.primary} border-transparent text-white shadow-xl ${theme.glow}`
            : `bg-white border-gray-100 hover:border-gray-200 text-gray-900 shadow-sm hover:shadow-lg ${theme.glow}`
        } ${compact ? "p-4" : "p-6"}`}
        {...(item.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {/* Background gradient for featured items */}
        {featured && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}

        <div className="relative z-10">
          <div
            className={`flex items-start justify-between ${
              compact ? "gap-3" : "gap-4"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-start space-x-3">
              {item.icon && (
                <motion.span
                  className={`flex-shrink-0 ${
                    featured ? "text-white" : "text-gray-600"
                  } ${compact ? "text-xl mt-0.5" : "text-2xl mt-0"}`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {item.icon}
                </motion.span>
              )}
              <div className="min-w-0 flex-1">
                <h3
                  className={`truncate font-semibold leading-tight ${
                    featured ? "text-white" : "text-gray-900"
                  } ${compact ? "text-base" : "text-lg"}`}
                >
                  {item.label}
                </h3>
                {item.sub && (
                  <p
                    className={`mt-1 leading-relaxed ${
                      featured ? "text-white/80" : "text-gray-600"
                    } ${compact ? "text-sm" : "text-base"}`}
                  >
                    {item.sub}
                  </p>
                )}
              </div>
            </div>

            {badgeConfig && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  featured ? "bg-white/20 text-white border-white/30" : badgeConfig.color
                }`}
              >
                {badgeConfig.label}
              </motion.span>
            )}
          </div>

          {/* Hover indicator */}
          <motion.div
            className={`absolute right-3 top-3 ${
              featured ? "text-white/60" : "text-gray-400"
            }`}
            initial={{ x: -5, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
          >
            →
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

// Enhanced category section with smooth animations
const CategorySection: React.FC<{
  title: string;
  items: LinkItem[];
  theme: ThemeTokens;
  compact?: boolean;
  columns?: number;
}> = ({ title, items, theme, compact = false, columns = 1 }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8 last:mb-0"
    >
      <h3
        className={`mb-4 font-semibold ${
          compact ? "text-lg" : "text-xl"
        } text-gray-900`}
      >
        {title}
      </h3>
      <div
        className={`grid gap-4 ${
          columns === 1
            ? "grid-cols-1"
            : columns === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {items.map((item, index) => (
          <motion.div
            key={`${item.href}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <LinkItemComponent item={item} theme={theme} compact={compact} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

// Main enhanced component
const CtaPresetComponent: React.FC<CtaPresetProps> = ({
  presetKey,
  title,
  description,
  compact = false,
  className,
}) => {
  const preset = presetKey ? getCtaPreset(presetKey) : null;
  const theme = getThemeColors(preset?.theme ?? "default");

  const actualTitle = title || preset?.title || "Call to Action";
  const actualDescription = description || preset?.description;
  const layout = preset?.layout || "grid";

  if (!preset) {
    return (
      <div
        className={`my-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 ${className ?? ""}`}
      >
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{actualTitle}</h2>
          {actualDescription && (
            <p className="mt-2 text-gray-600">{actualDescription}</p>
          )}
          <p className="mt-4 text-gray-500">Preset configuration not found.</p>
        </div>
      </div>
    );
  }

  // Sorted items for each category
  const featuredItem = preset.featured;
  const reads = getSortedItems(preset, "reads");
  const downloads = getSortedItems(preset, "downloads");
  const actions = getSortedItems(preset, "actions");
  const related = getSortedItems(preset, "related");

  const hasContent =
    featuredItem ||
    reads.length > 0 ||
    downloads.length > 0 ||
    actions.length > 0 ||
    related.length > 0;

  if (!hasContent) {
    return (
      <div
        className={`my-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 ${className ?? ""}`}
      >
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{actualTitle}</h2>
        </div>
        {actualDescription && (
          <p className="mt-2 text-center text-gray-600">
            {actualDescription}
          </p>
        )}
        <p className="mt-4 text-center text-gray-500">
          No content available for this preset.
        </p>
      </div>
    );
  }

  // Grid layout items: dedup in priority order
  const gridItems: LinkItem[] = [];
  const seen = new Set<string>();

  const addItems = (items: LinkItem[]) => {
    items.forEach((item) => {
      const key = `${item.href}::${item.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        gridItems.push(item);
      }
    });
  };

  if (featuredItem) addItems([featuredItem]);
  addItems(actions);
  addItems(reads);
  addItems(downloads);
  addItems(related);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={`my-8 rounded-3xl border border-gray-200/50 ${theme.gradient} backdrop-blur-sm ${
        className ?? ""
      }`}
    >
      <div className={compact ? "p-6" : "p-8"}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h2
            className={`font-bold text-gray-900 ${
              compact ? "text-2xl" : "text-3xl"
            }`}
          >
            {actualTitle}
          </h2>
          {actualDescription && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`mx-auto mt-4 max-w-2xl text-gray-600 leading-relaxed ${
                compact ? "text-base" : "text-lg"
              }`}
            >
              {actualDescription}
            </motion.p>
          )}
        </motion.header>

        {/* Content based on layout */}
        <div className="space-y-8">
          {/* Featured First Layout */}
          {layout === "featured-first" && featuredItem && (
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <LinkItemComponent
                item={featuredItem}
                theme={theme}
                featured
                compact={compact}
              />
            </motion.section>
          )}

          {/* Grid Layout - all items in responsive grid */}
          {layout === "grid" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {gridItems.map((item, index) => (
                <LinkItemComponent
                  key={`${item.href}-${index}`}
                  item={item}
                  theme={theme}
                  featured={
                    featuredItem != null &&
                    item.href === featuredItem.href &&
                    item.label === featuredItem.label
                  }
                  compact={compact}
                />
              ))}
            </motion.div>
          )}

          {/* Stack Layout - categorised sections */}
          {layout === "stack" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-8"
            >
              {featuredItem && (
                <CategorySection
                  title="Featured"
                  items={[featuredItem]}
                  theme={theme}
                  compact={compact}
                  columns={1}
                />
              )}
              {actions.length > 0 && (
                <CategorySection
                  title="Take Action"
                  items={actions}
                  theme={theme}
                  compact={compact}
                  columns={2}
                />
              )}
              {reads.length > 0 && (
                <CategorySection
                  title="Recommended Reads"
                  items={reads}
                  theme={theme}
                  compact={compact}
                  columns={2}
                />
              )}
              {downloads.length > 0 && (
                <CategorySection
                  title="Downloads & Resources"
                  items={downloads}
                  theme={theme}
                  compact={compact}
                  columns={2}
                />
              )}
              {related.length > 0 && (
                <CategorySection
                  title="Related"
                  items={related}
                  theme={theme}
                  compact={compact}
                  columns={1}
                />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CtaPresetComponent;