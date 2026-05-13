import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import MainLayout from '../components/MainLayout';
import ModerationDashboard from '../components/ModerationDashboard';

export default async function ModerationPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <MainLayout user={{ alias: session.alias, badgeNumber: session.userId }}>
      <ModerationDashboard />
    </MainLayout>
  );
}
