import { HomeScreen } from '@/screens/Home';
import { ClanGate } from '@/ui/ClanGate';

export default function HomeRoute() {
  return (
    <ClanGate>
      <HomeScreen />
    </ClanGate>
  );
}
