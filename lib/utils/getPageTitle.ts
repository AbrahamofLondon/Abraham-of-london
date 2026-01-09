// lib/utils/getPageTitle.ts
import siteConfig from './config/site-config';

export const getPageTitle = (pageTitle: string) => {
  return `${pageTitle} | ${siteConfig.name}`;
};