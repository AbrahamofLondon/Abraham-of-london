// lib/server/events-data.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const eventsDirectory = path.join(process.cwd(), 'events');

export function getAllEvents(fields: string[] = []) {
  const fileNames = fs.readdirSync(eventsDirectory);
  const events = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(eventsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    const items: { [key: string]: any } = {};

    fields.forEach((field) => {
      if (field === 'slug') {
        items[field] = slug;
      }
      if (typeof data[field] !== 'undefined') {
        items[field] = data[field];
      }
    });

    return items;
  });

  return events;
}

// You can also add other server-side data-fetching functions here, e.g., getEventBySlug