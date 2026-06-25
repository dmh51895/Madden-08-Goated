import AppShell from "../../components/AppShell";

const PANELS = [
  "home","standings","teams","schedules","leaders","player","gamecenter",
  "draft","tradechart","freeagents","injuries","playoffs","records",
  "coaches","power","breakdown","teammgmt","duplicates","settings","setup",
];

export function generateStaticParams() {
  return PANELS.map((p) => ({ panel: p }));
}

export default function PanelPage({ params }) {
  return <AppShell initialPanel={params.panel} />;
}
