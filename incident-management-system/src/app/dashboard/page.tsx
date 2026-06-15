import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api-utils';

export default async function DashboardIndex() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/auth/login');
  }

  switch (currentUser.role) {
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
