import { RunsScreen } from '@/screens/Runs';
import { ClanGate } from '@/ui/ClanGate';

export default function RunsRoute() {
  return (
    <ClanGate>
      <RunsScreen />
    </ClanGate>
  );
}
