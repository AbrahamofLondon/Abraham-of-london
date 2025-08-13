// lib/siteConfig.ts

// Enhanced social configuration with proper validation
export const siteConfig = {
  title: 'Abraham of London',
  description: 'Fatherhood, leadership, and life lessons — empowering men to reclaim the narrative.',
  author: 'Abraham Adaramola',
  email: 'info@abrahamoflondon.org',
  phone: '+44 20 8062 25909',
  whatsapp: '+44 7496 334022',
  socialLinks: [
    { 
      href: 'mailto:info@abrahamoflondon.org', 
      label: 'Email', 
      icon: '/assets/images/social/email.svg',
      ariaLabel: 'Send us an email'
    },
    { 
      href: 'tel:+442086225909', 
      label: 'Phone', 
      icon: '/assets/images/social/phone.svg',
      ariaLabel: 'Call us'
    },
    {
      href: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
      label: 'LinkedIn',
      icon: '/assets/images/social/linkedin.svg',
      external: true,
      ariaLabel: 'Follow us on LinkedIn'
    },
    {
      href: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09',
      label: 'X (Twitter)',
      icon: '/assets/images/social/twitter.svg',
      external: true,
      ariaLabel: 'Follow us on X (Twitter)'
    },
    {
      href: 'https://www.facebook.com/share/1MRrKpUzMG/',
      label: 'Facebook',
      icon: '/assets/images/social/facebook.svg',
      external: true,
      ariaLabel: 'Follow us on Facebook'
    },
    {
      href: 'https://wa.me/447496334022',
      label: 'WhatsApp',
      icon: '/assets/images/social/whatsapp.svg',
      external: true,
      ariaLabel: 'Message us on WhatsApp'
    },
    {
      href: 'https://www.instagram.com/abraham_of_london',
      label: 'Instagram',
      icon: '/assets/images/social/instagram.svg',
      external: true,
      ariaLabel: 'Follow us on Instagram'
    },
  ],
};