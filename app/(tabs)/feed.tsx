import { FeedScreen } from '@/screens/Feed';
import { ClanGate } from '@/ui/ClanGate';

export default function FeedRoute() {
  return (
    <ClanGate>
      <FeedScreen />
    </ClanGate>
  );
}
