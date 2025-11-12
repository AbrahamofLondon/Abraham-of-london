<<<<<<< HEAD
export const siteConfig = { siteUrl: "https://www.abrahamoflondon.org" };
export function absUrl(p: string): string {
  const base = siteConfig.siteUrl.replace(/\/+$/, "");
  const path = String(p || "").replace(/^\/+/, "");
  return `${base}/${path}`;
}
=======
// lib/siteConfig.ts - PRODUCTION SAFE VERSION

/* ---------- Site Configuration ---------- */
export const siteConfig = {
  // Core Site Information
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://abrahamoflondon.org',
  siteName: 'Abraham of London',
  title: 'Abraham of London - Leadership & Fatherhood Guidance',
  description: 'Transformative guidance for modern leaders and fathers seeking purpose, legacy, and authentic masculinity.',
  keywords: ['fatherhood', 'leadership', 'mentorship', 'masculinity', 'london', 'abraham'],
  author: 'Abraham Adaramola',
  locale: 'en_GB',
  twitterHandle: '@AbrahamAda48634',
  
  // Business Information
  business: {
    name: 'Abraham of London',
    email: 'info@abrahamoflondon.org',
    phone: '+44 208 622 5909',
    address: 'London, United Kingdom',
    founded: '2023',
    mission: 'Empowering leaders and fathers to build lasting legacies through disciplined strategy and authentic masculinity.'
  },

  // Social Links
  socialLinks: {
    tiktok: 'https://tiktok.com/@abrahamoflondon',
    x: 'https://x.com/AbrahamAda48634',
    instagram: 'https://www.instagram.com/abraham_of_london_/',
    facebook: 'https://www.facebook.com/share/16tvsnTgRG/',
    linkedin: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
    youtube: 'https://www.youtube.com/@abrahamoflondon',
    email: 'info@abrahamoflondon.org',
    phone: '+442086225909'
  },

  // Navigation
  navigation: {
    main: [
      { name: 'Home', href: '/' },
      { name: 'About', href: '/about' },
      { name: 'Books', href: '/books' },
      { name: 'Downloads', href: '/downloads' },
      { name: 'Blog', href: '/blog' },
      { name: 'Contact', href: '/contact' }
    ],
    footer: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Code of Conduct', href: '/conduct' }
    ]
  },

  // Strategy Page Content
  services: [
    { 
      title: "Commercial Strategy", 
      blurb: "Market sizing, pricing, offers, and GTM playbooks.",
      href: "/services/commercial-strategy",
      icon: "📈"
    },
    { 
      title: "Operating Model & Governance", 
      blurb: "Accountability frameworks, cadence, and decision rights.",
      href: "/services/operating-model",
      icon: "⚖️"
    },
    { 
      title: "Venture Acceleration", 
      blurb: "0→1 validation, prototype sprints, investor narrative.",
      href: "/services/venture-acceleration",
      icon: "🚀"
    }
  ],

  capabilities: [
    "Market & Competitor Intelligence",
    "Procurement & Supplier Governance",
    "Risk, Controls & Assurance",
    "Board-ready Reporting & KPIs",
    "Change & Stakeholder Management",
    "Strategic Planning & Execution",
    "Performance Measurement",
    "Digital Transformation"
  ],

  caseStudies: [
    { 
      title: "Turnaround of Supplier Governance", 
      result: "Reduced leakage by 12% within 2 quarters",
      href: "/case-studies/supplier-governance"
    },
    { 
      title: "Venture Go-to-Market Reset", 
      result: "Lifted qualified pipeline by 3.4x",
      href: "/case-studies/venture-gtm"
    },
    { 
      title: "Operating Model Transformation", 
      result: "Improved decision velocity by 40%",
      href: "/case-studies/operating-model"
    }
  ],

  // Books & Publications
  featuredBooks: [
    {
      title: "The Brotherhood Covenant",
      description: "A framework for authentic male relationships and accountability.",
      href: "/books/brotherhood-covenant",
      coverImage: "/books/brotherhood-covenant.jpg"
    },
    {
      title: "Principles for My Son",
      description: "Timeless wisdom for the next generation of leaders.",
      href: "/books/principles-for-my-son", 
      coverImage: "/books/principles-for-my-son.jpg"
    }
  ],

  // Downloads & Resources
  featuredDownloads: [
    {
      title: "Leadership Playbook",
      description: "Daily practices for effective leadership.",
      href: "/downloads/leadership-playbook",
      type: "playbook"
    },
    {
      title: "Entrepreneur Survival Checklist", 
      description: "Essential checklist for startup founders.",
      href: "/downloads/entrepreneur-survival-checklist",
      type: "checklist"
    }
  ],

  // Testimonials
  testimonials: [
    {
      quote: "Abraham's guidance transformed our leadership team's effectiveness.",
      author: "Tech Startup CEO",
      role: "London"
    },
    {
      quote: "The strategic frameworks provided immediate impact on our governance.",
      author: "Fortune 500 Director", 
      role: "Global Operations"
    }
  ],

  // Team Information
  team: {
    founder: {
      name: "Abraham Adaramola",
      role: "Founder & Strategic Advisor",
      bio: "Seasoned leader with 15+ years in strategy, governance, and leadership development.",
      image: "/team/abraham.jpg"
    }
  },

  // Values & Principles
  values: [
    {
      title: "Discipline",
      description: "Consistent execution and accountability in all endeavors.",
      icon: "🎯"
    },
    {
      title: "Legacy", 
      description: "Building something that outlasts our immediate efforts.",
      icon: "🌳"
    },
    {
      title: "Authenticity",
      description: "Genuine leadership that inspires trust and followership.",
      icon: "💎"
    }
  ],

  // Contact Information
  contact: {
    email: "info@abrahamoflondon.org",
    phone: "+44 208 622 5909",
    address: "London, United Kingdom",
    meetingLink: "https://calendly.com/abrahamoflondon/consultation",
    responseTime: "Within 24 hours"
  },

  // Legal & Compliance
  legal: {
    privacyPolicy: "/privacy",
    termsOfService: "/terms", 
    cookiePolicy: "/cookies",
    disclaimer: "Results may vary based on individual circumstances and commitment to implementation."
  }

} as const;

// Type exports for better TypeScript support
export type SiteConfig = typeof siteConfig;
export type Service = typeof siteConfig.services[0];
export type CaseStudy = typeof siteConfig.caseStudies[0];
export type Book = typeof siteConfig.featuredBooks[0];
export type Download = typeof siteConfig.featuredDownloads[0];
export type Testimonial = typeof siteConfig.testimonials[0];
export type Value = typeof siteConfig.values[0];
export type NavigationItem = typeof siteConfig.navigation.main[0];

/* ---------- Utility Functions ---------- */

/**
 * Safely generate absolute URL with comprehensive validation
 */
export const absUrl = (path: string): string => {
  try {
    if (!path || typeof path !== 'string') {
      console.warn('⚠️ Invalid path provided to absUrl:', path);
      return siteConfig.siteUrl;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Validate URL components
    if (!siteConfig.siteUrl || typeof siteConfig.siteUrl !== 'string') {
      console.error('❌ Invalid siteUrl in config');
      return `/${cleanPath}`;
    }

    return `${siteConfig.siteUrl}/${cleanPath}`;

  } catch (error) {
    console.error('💥 Critical error in absUrl:', error);
    return siteConfig.siteUrl;
  }
};

/**
 * Safely generate page title with fallbacks
 */
export const getPageTitle = (pageTitle?: string): string => {
  try {
    const baseTitle = siteConfig.siteName || 'Abraham of London';
    
    if (!pageTitle || typeof pageTitle !== 'string') {
      return baseTitle;
    }

    return `${pageTitle} | ${baseTitle}`;

  } catch (error) {
    console.error('💥 Error generating page title:', error);
    return 'Abraham of London';
  }
};

/**
 * Safely get page description with fallbacks
 */
export const getPageDescription = (pageDescription?: string): string => {
  try {
    const defaultDescription = siteConfig.description || 'Transformative guidance for modern leaders and fathers.';
    
    if (!pageDescription || typeof pageDescription !== 'string') {
      return defaultDescription;
    }

    return pageDescription;

  } catch (error) {
    console.error('💥 Error getting page description:', error);
    return 'Transformative guidance for modern leaders and fathers.';
  }
};

/**
 * Safely generate social image URL
 */
export const getSocialImageUrl = (path: string = '/social-image.jpg'): string => {
  try {
    if (!path || typeof path !== 'string') {
      return absUrl('/social-image.jpg');
    }

    return absUrl(path);

  } catch (error) {
    console.error('💥 Error generating social image URL:', error);
    return absUrl('/social-image.jpg');
  }
};

/* ---------- Data Access Functions with Comprehensive Safety ---------- */

/**
 * Safely get services with validation and fallbacks
 */
export const getServices = (): Service[] => {
  try {
    if (!siteConfig?.services || !Array.isArray(siteConfig.services)) {
      console.warn('⚠️ Services configuration is invalid - returning empty array');
      return [];
    }

    // Validate each service
    const validServices = siteConfig.services.filter((service): service is Service => {
      const isValid = service && 
                     typeof service === 'object' &&
                     typeof service.title === 'string' &&
                     typeof service.blurb === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid service:', service);
      }

      return isValid;
    });

    if (validServices.length !== siteConfig.services.length) {
      console.warn(`🔄 Filtered ${siteConfig.services.length - validServices.length} invalid services`);
    }

    return validServices;

  } catch (error) {
    console.error('💥 Critical error in getServices:', error);
    return [];
  }
};

/**
 * Safely get capabilities with validation
 */
export const getCapabilities = (): string[] => {
  try {
    if (!siteConfig?.capabilities || !Array.isArray(siteConfig.capabilities)) {
      console.warn('⚠️ Capabilities configuration is invalid - returning empty array');
      return [];
    }

    // Validate each capability is a string
    const validCapabilities = siteConfig.capabilities.filter((capability): capability is string => {
      return typeof capability === 'string' && capability.length > 0;
    });

    if (validCapabilities.length !== siteConfig.capabilities.length) {
      console.warn(`🔄 Filtered ${siteConfig.capabilities.length - validCapabilities.length} invalid capabilities`);
    }

    return validCapabilities;

  } catch (error) {
    console.error('💥 Critical error in getCapabilities:', error);
    return [];
  }
};

/**
 * Safely get case studies with validation
 */
export const getCaseStudies = (): CaseStudy[] => {
  try {
    if (!siteConfig?.caseStudies || !Array.isArray(siteConfig.caseStudies)) {
      console.warn('⚠️ Case studies configuration is invalid - returning empty array');
      return [];
    }

    const validCaseStudies = siteConfig.caseStudies.filter((caseStudy): caseStudy is CaseStudy => {
      const isValid = caseStudy && 
                     typeof caseStudy === 'object' &&
                     typeof caseStudy.title === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid case study:', caseStudy);
      }

      return isValid;
    });

    if (validCaseStudies.length !== siteConfig.caseStudies.length) {
      console.warn(`🔄 Filtered ${siteConfig.caseStudies.length - validCaseStudies.length} invalid case studies`);
    }

    return validCaseStudies;

  } catch (error) {
    console.error('💥 Critical error in getCaseStudies:', error);
    return [];
  }
};

/**
 * Safely get featured books with validation
 */
export const getFeaturedBooks = (): Book[] => {
  try {
    if (!siteConfig?.featuredBooks || !Array.isArray(siteConfig.featuredBooks)) {
      console.warn('⚠️ Featured books configuration is invalid - returning empty array');
      return [];
    }

    const validBooks = siteConfig.featuredBooks.filter((book): book is Book => {
      const isValid = book && 
                     typeof book === 'object' &&
                     typeof book.title === 'string' &&
                     typeof book.description === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid book:', book);
      }

      return isValid;
    });

    if (validBooks.length !== siteConfig.featuredBooks.length) {
      console.warn(`🔄 Filtered ${siteConfig.featuredBooks.length - validBooks.length} invalid books`);
    }

    return validBooks;

  } catch (error) {
    console.error('💥 Critical error in getFeaturedBooks:', error);
    return [];
  }
};

/**
 * Safely get featured downloads with validation
 */
export const getFeaturedDownloads = (): Download[] => {
  try {
    if (!siteConfig?.featuredDownloads || !Array.isArray(siteConfig.featuredDownloads)) {
      console.warn('⚠️ Featured downloads configuration is invalid - returning empty array');
      return [];
    }

    const validDownloads = siteConfig.featuredDownloads.filter((download): download is Download => {
      const isValid = download && 
                     typeof download === 'object' &&
                     typeof download.title === 'string' &&
                     typeof download.description === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid download:', download);
      }

      return isValid;
    });

    if (validDownloads.length !== siteConfig.featuredDownloads.length) {
      console.warn(`🔄 Filtered ${siteConfig.featuredDownloads.length - validDownloads.length} invalid downloads`);
    }

    return validDownloads;

  } catch (error) {
    console.error('💥 Critical error in getFeaturedDownloads:', error);
    return [];
  }
};

/**
 * Safely get testimonials with validation
 */
export const getTestimonials = (): Testimonial[] => {
  try {
    if (!siteConfig?.testimonials || !Array.isArray(siteConfig.testimonials)) {
      console.warn('⚠️ Testimonials configuration is invalid - returning empty array');
      return [];
    }

    const validTestimonials = siteConfig.testimonials.filter((testimonial): testimonial is Testimonial => {
      const isValid = testimonial && 
                     typeof testimonial === 'object' &&
                     typeof testimonial.quote === 'string' &&
                     typeof testimonial.author === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid testimonial:', testimonial);
      }

      return isValid;
    });

    if (validTestimonials.length !== siteConfig.testimonials.length) {
      console.warn(`🔄 Filtered ${siteConfig.testimonials.length - validTestimonials.length} invalid testimonials`);
    }

    return validTestimonials;

  } catch (error) {
    console.error('💥 Critical error in getTestimonials:', error);
    return [];
  }
};

/**
 * Safely get values with validation
 */
export const getValues = (): Value[] => {
  try {
    if (!siteConfig?.values || !Array.isArray(siteConfig.values)) {
      console.warn('⚠️ Values configuration is invalid - returning empty array');
      return [];
    }

    const validValues = siteConfig.values.filter((value): value is Value => {
      const isValid = value && 
                     typeof value === 'object' &&
                     typeof value.title === 'string' &&
                     typeof value.description === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid value:', value);
      }

      return isValid;
    });

    if (validValues.length !== siteConfig.values.length) {
      console.warn(`🔄 Filtered ${siteConfig.values.length - validValues.length} invalid values`);
    }

    return validValues;

  } catch (error) {
    console.error('💥 Critical error in getValues:', error);
    return [];
  }
};

/* ---------- Navigation Helpers ---------- */

/**
 * Safely get main navigation with validation
 */
export const getMainNavigation = (): NavigationItem[] => {
  try {
    if (!siteConfig?.navigation?.main || !Array.isArray(siteConfig.navigation.main)) {
      console.warn('⚠️ Main navigation configuration is invalid - returning empty array');
      return [];
    }

    const validNavItems = siteConfig.navigation.main.filter((item): item is NavigationItem => {
      const isValid = item && 
                     typeof item === 'object' &&
                     typeof item.name === 'string' &&
                     typeof item.href === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid navigation item:', item);
      }

      return isValid;
    });

    return validNavItems;

  } catch (error) {
    console.error('💥 Critical error in getMainNavigation:', error);
    return [];
  }
};

/**
 * Safely get footer navigation with validation
 */
export const getFooterNavigation = (): NavigationItem[] => {
  try {
    if (!siteConfig?.navigation?.footer || !Array.isArray(siteConfig.navigation.footer)) {
      console.warn('⚠️ Footer navigation configuration is invalid - returning empty array');
      return [];
    }

    const validNavItems = siteConfig.navigation.footer.filter((item): item is NavigationItem => {
      const isValid = item && 
                     typeof item === 'object' &&
                     typeof item.name === 'string' &&
                     typeof item.href === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid footer navigation item:', item);
      }

      return isValid;
    });

    return validNavItems;

  } catch (error) {
    console.error('💥 Critical error in getFooterNavigation:', error);
    return [];
  }
};

/* ---------- Safe Data Access Helpers ---------- */

/**
 * Safely get contact info with fallbacks
 */
export const getContactInfo = () => {
  try {
    return siteConfig.contact || {};
  } catch (error) {
    console.error('💥 Error getting contact info:', error);
    return {};
  }
};

/**
 * Safely get business info with fallbacks
 */
export const getBusinessInfo = () => {
  try {
    return siteConfig.business || {};
  } catch (error) {
    console.error('💥 Error getting business info:', error);
    return {};
  }
};

/**
 * Safely get social links with fallbacks
 */
export const getSocialLinks = () => {
  try {
    return siteConfig.socialLinks || {};
  } catch (error) {
    console.error('💥 Error getting social links:', error);
    return {};
  }
};

/**
 * Safely get Twitter handle with validation
 */
export const getTwitterHandle = (): string => {
  try {
    const handle = siteConfig.twitterHandle || '@AbrahamAda48634';
    return handle.replace('@', '');
  } catch (error) {
    console.error('💥 Error getting Twitter handle:', error);
    return 'AbrahamAda48634';
  }
};

/**
 * Safely get legal links with fallbacks
 */
export const getLegalLinks = () => {
  try {
    return siteConfig.legal || {};
  } catch (error) {
    console.error('💥 Error getting legal links:', error);
    return {};
  }
};

/* ---------- Search and Filter Helpers ---------- */

/**
 * Safely find service by slug with validation
 */
export const findServiceBySlug = (slug: string): Service | undefined => {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to findServiceBySlug:', slug);
      return undefined;
    }

    const services = getServices();
    return services.find(service => service.href?.includes(slug));

  } catch (error) {
    console.error(`💥 Error finding service with slug "${slug}":`, error);
    return undefined;
  }
};

/**
 * Safely find book by slug with validation
 */
export const findBookBySlug = (slug: string): Book | undefined => {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to findBookBySlug:', slug);
      return undefined;
    }

    const books = getFeaturedBooks();
    return books.find(book => book.href?.includes(slug));

  } catch (error) {
    console.error(`💥 Error finding book with slug "${slug}":`, error);
    return undefined;
  }
};

/**
 * Safely find download by slug with validation
 */
export const findDownloadBySlug = (slug: string): Download | undefined => {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to findDownloadBySlug:', slug);
      return undefined;
    }

    const downloads = getFeaturedDownloads();
    return downloads.find(download => download.href?.includes(slug));

  } catch (error) {
    console.error(`💥 Error finding download with slug "${slug}":`, error);
    return undefined;
  }
};

/* ---------- Validation Helpers ---------- */

/**
 * Safely validate service object
 */
export const isValidService = (service: unknown): service is Service => {
  try {
    return typeof service === 'object' && 
           service !== null && 
           'title' in service && 
           typeof (service as any).title === 'string';
  } catch (error) {
    console.error('💥 Error validating service:', error);
    return false;
  }
};

/**
 * Safely validate case study object
 */
export const isValidCaseStudy = (caseStudy: unknown): caseStudy is CaseStudy => {
  try {
    return typeof caseStudy === 'object' && 
           caseStudy !== null && 
           'title' in caseStudy && 
           typeof (caseStudy as any).title === 'string';
  } catch (error) {
    console.error('💥 Error validating case study:', error);
    return false;
  }
};

/* ---------- Comprehensive Data Export ---------- */

/**
 * Safely get all static data for generation with comprehensive error handling
 */
export const getAllStaticData = () => {
  try {
    return {
      services: getServices(),
      capabilities: getCapabilities(),
      caseStudies: getCaseStudies(),
      books: getFeaturedBooks(),
      downloads: getFeaturedDownloads(),
      testimonials: getTestimonials(),
      values: getValues(),
      navigation: {
        main: getMainNavigation(),
        footer: getFooterNavigation()
      }
    };
  } catch (error) {
    console.error('💥 Critical error in getAllStaticData:', error);
    // Return safe empty structure
    return {
      services: [],
      capabilities: [],
      caseStudies: [],
      books: [],
      downloads: [],
      testimonials: [],
      values: [],
      navigation: {
        main: [],
        footer: []
      }
    };
  }
};

// Export everything as default for easy importing
export default siteConfig;
>>>>>>> test-netlify-fix
