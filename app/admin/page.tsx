'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/schools'); }, [router]);
  return null;
}
