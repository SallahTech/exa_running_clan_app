import { StatsScreen } from '@/screens/Stats';
import { ClanGate } from '@/ui/ClanGate';

export default function StatsRoute() {
  return (
    <ClanGate>
      <StatsScreen />
    </ClanGate>
  );
}
