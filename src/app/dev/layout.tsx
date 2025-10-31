
import { DevNavbar } from './DevNavbar';

export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <DevNavbar />
      <main>{children}</main>
    </section>
  );
}
