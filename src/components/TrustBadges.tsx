import { TruckIcon, ShieldIcon, ReturnIcon, LockIcon } from "./Icons";

const items = [
  { icon: TruckIcon, title: "Бърза доставка", text: "До 24-48ч. в цялата страна" },
  { icon: ReturnIcon, title: "30 дни връщане", text: "Без излишни въпроси" },
  { icon: ShieldIcon, title: "Оригинални материали", text: "Прецизно прилягане, гарантирано" },
  { icon: LockIcon, title: "Сигурно плащане", text: "Карта или наложен платеж" },
];

export default function TrustBadges() {
  return (
    <section className="mx-auto max-w-7xl container-p py-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-border-c bg-surface p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent-lime">
              <item.icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-text-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
