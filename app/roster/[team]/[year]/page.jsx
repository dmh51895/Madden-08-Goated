import AppShell from "../../../../components/AppShell";

const TEAMS = ["CHI","CIN","BUF","DEN","CLE","TB","ARI","LAC","KC","IND","DAL","MIA","PHI","ATL","SF","NYG","JAX","NYJ","DET","GB","CAR","NE","LV","LAR","BAL","WAS","NO","SEA","PIT","TEN","MIN","HOU"];
const YEARS = ["2020","2021","2022","2023","2024","2025","2026"];

export function generateStaticParams() {
  const out = [];
  for (const team of TEAMS) for (const year of YEARS) out.push({ team, year });
  return out;
}

export default function RosterPage({ params }) {
  return <AppShell initialPanel="teams" initialTeam={params.team} initialYear={parseInt(params.year)} />;
}
