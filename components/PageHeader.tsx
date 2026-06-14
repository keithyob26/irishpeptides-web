export default function PageHeader({
  title, subtitle, badge
}: { title: string; subtitle?: string; badge?: { label: string; ok: boolean } }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-[#F1F5F9]">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#64748B] mt-0.5">{subtitle}</p>}
      </div>
      {badge && (
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
          badge.ok
            ? "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/25"
            : "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25"
        }`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}
