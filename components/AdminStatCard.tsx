export default function AdminStatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="card border-t-8 border-t-accent p-5">
      <p className="kicker text-mute">{label}</p>
      <p className="display mt-3 text-5xl">{value}</p>
    </div>
  );
}
