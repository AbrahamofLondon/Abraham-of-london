// app/strategy/page.tsx - TEMPORARY FIX
import { redirect } from 'next/navigation';

export default function StrategyPage() {
  redirect('/');
}

export const metadata = {
  title: 'Strategy',
};