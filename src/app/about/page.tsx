import { ShieldIcon, TruckIcon, CheckIcon } from "@/components/Icons";

export const metadata = { title: "За нас — Кейсове.нет" };

const stats = [
  { value: "50 000+", label: "доволни клиенти" },
  { value: "28", label: "продукта в каталога" },
  { value: "4.7/5", label: "среден рейтинг" },
  { value: "24-48ч.", label: "средно време за доставка" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl container-p py-14">
      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-accent-lime">За нас</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold max-w-2xl">
        Кейсове<span className="gradient-text">.нет</span> — защитаваме телефона ти с стил
      </h1>
      <p className="mt-4 max-w-2xl text-text-muted leading-relaxed">
        Кейсове.нет е онлайн магазин, специализиран изцяло в калъфи, протектори и GSM аксесоари за всички водещи марки
        смартфони. Вярваме, че защитата на телефона ти не трябва да е компромис между качество, дизайн и цена — затова
        подбираме всеки продукт лично и комбинираме калъфи с подходящите протектори в изгодни бъндели.
      </p>

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
          <ShieldIcon className="w-6 h-6 text-accent-lime" />
          <h3 className="mt-3 font-heading font-bold">Проверено качество</h3>
          <p className="mt-2 text-sm text-text-muted">
            Всеки продукт минава през тестове за прилягане и издръжливост, преди да влезе в каталога ни.
          </p>
        </div>
        <div className="rounded-2xl border border-border-c bg-surface p-6">
          <TruckIcon className="w-6 h-6 text-accent-lime" />
          <h3 className="mt-3 font-heading font-bold">Бърза логистика</h3>
          <p className="mt-2 text-sm text-text-muted">
            Работим с водещи куриери, за да получиш поръчката си възможно най-бързо, навсякъде в страната.
          </p>
        </div>
        <div className="rounded-2xl border border-border-c bg-surface p-6">
          <CheckIcon className="w-6 h-6 text-accent-lime" />
          <h3 className="mt-3 font-heading font-bold">Умни бъндели</h3>
          <p className="mt-2 text-sm text-text-muted">
            Съчетаваме калъф и протектор за един и същ модел, за да ти спестим пари и излишно търсене.
          </p>
        </div>
      </div>
    </div>
  );
}
