import { ShieldIcon, TruckIcon, CheckIcon } from "@/components/Icons";

export const metadata = { title: "За нас — Кейсове.нет" };

const stats = [
  { value: "50 000+", label: "доволни клиенти" },
  { value: "10 000+", label: "изпратени поръчки" },
  { value: "4.8/5", label: "оценка от клиенти" },
  { value: "24ч.", label: "експресна доставка" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl container-p py-14">
      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-accent">За нас</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold max-w-2xl">
        Кейсове<span className="gradient-text">.нет</span> — Качествени аксесоари за твоя телефон
      </h1>
      
      <div className="mt-6 max-w-3xl text-text-muted leading-relaxed space-y-4 text-sm">
        <p>
          Кейсове.нет е доказан онлайн магазин за мобилни телефони, калъфи, протектори и висококачествени GSM аксесоари. Нашата основна цел е да осигурим най-доброто обслужване за нашите клиенти, съчетано с отлични цени и максимално бързи доставки.
        </p>
        <p>
          Екипът на Кейсове.нет се гордее с отличното отношение и перфектното обслужване на клиентите си. Ние сме винаги внимателни и услужливи, като се стараем да помогнем във всяка една ситуация и да предложим най-доброто решение за вашия модел телефон.
        </p>
        <p>
          Осигуряваме качествено и експресно обслужване — всички поръчани стоки се обработват веднага и се изпращат с куриер, за да бъдат получени от клиента още на следващия работен ден.
        </p>
        <p className="font-bold text-text bg-accent/5 border border-accent/15 rounded-xl p-4 mt-4">
          ℹ️ Важно: Кейсове.нет работи изцяло като електронен магазин и няма физически шоурум. Всички поръчки се приемат онлайн и се доставят с куриер до офис или личен адрес.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border-c bg-surface p-5 text-center">
            <p className="font-heading text-2xl font-extrabold gradient-text">{s.value}</p>
            <p className="mt-1 text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-c bg-surface p-6">
          <ShieldIcon className="w-6 h-6 text-accent" />
          <h3 className="mt-3 font-heading font-bold">Перфектно обслужване</h3>
          <p className="mt-2 text-sm text-text-muted">
            Винаги насреща да помогнем по телефона или имейл с избора на точния аксесоар за Вашия телефон.
          </p>
        </div>
        <div className="rounded-2xl border border-border-c bg-surface p-6">
          <TruckIcon className="w-6 h-6 text-accent" />
          <h3 className="mt-3 font-heading font-bold">Бърза доставка</h3>
          <p className="mt-2 text-sm text-text-muted">
            Изпращаме пратките веднага, за да пристигнат при Вас на следващия ден с преглед и тест.
          </p>
        </div>
        <div className="rounded-2xl border border-border-c bg-surface p-6">
          <CheckIcon className="w-6 h-6 text-accent" />
          <h3 className="mt-3 font-heading font-bold">Супер цени</h3>
          <p className="mt-2 text-sm text-text-muted">
            Предлагаме едни от най-конкурентните цени на пазара за оригинални и съвместими аксесоари.
          </p>
        </div>
      </div>
    </div>
  );
}
