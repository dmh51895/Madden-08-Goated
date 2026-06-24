import AppShell from "../../../components/AppShell";
import PLAYER_IDS from "../../../data/playerIds.json";

export function generateStaticParams() {
  return PLAYER_IDS.map((id) => ({ id: String(id) }));
}

export default function PlayerProfilePage({ params }) {
  return <AppShell initialPanel="player" initialPlayer={params.id} />;
}
