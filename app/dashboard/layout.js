import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE, verifyToken } from '@/lib/server/security';

export default async function AuthenticatedDashboard({ children }) {
  const jar = await cookies();
  const session = verifyToken(jar.get(COOKIE)?.value);
  if (!session || !['admin', 'staff'].includes(session.role)) redirect('/login');
  return children;
}
