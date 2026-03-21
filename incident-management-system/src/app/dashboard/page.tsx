import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export default async function DashboardIndex() {
  const cookieStore = await cookies();
  const token = cookieStore.get('incident_token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  const decoded = verifyToken(token!);

  if (!decoded) {
    redirect('/auth/login');
  }

  switch (decoded.role) {
    case 'ADMIN':
      redirect('/dashboard/admin');
    case 'MANAGER':
      redirect('/dashboard/manager');
    case 'DEVELOPER':
      redirect('/dashboard/developer');
    default:
      redirect('/auth/login');
  }
}
