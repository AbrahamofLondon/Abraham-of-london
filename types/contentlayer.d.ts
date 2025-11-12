// types/contentlayer.d.ts
import type { Post, Download, Event, Book, Resource, Strategy } from 'contentlayer2/generated';

declare module 'contentlayer2/generated' {
  export type { Post, Download, Event, Book, Resource, Strategy };
}

export type AllTypes = Post | Download | Event | Book | Resource | Strategy;