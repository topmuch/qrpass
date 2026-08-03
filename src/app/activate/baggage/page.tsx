import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ActivateBaggagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const code = params.code || params.qr || '';
  const destination = code ? `/hajj/activate?qr=${encodeURIComponent(code)}` : '/hajj/activate';
  redirect(destination);
}
