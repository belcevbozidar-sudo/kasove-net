import StarRating from "./StarRating";
import SectionHeading from "./SectionHeading";

const reviews = [
  {
    name: "Ивана П.",
    text: "Взех бъндела калъф + протектор за iPhone-а си и спестих доста. Качеството е много добро, калъфът пасва перфектно.",
    rating: 5,
  },
  {
    name: "Георги Т.",
    text: "Поръчах в четвъртък, пристигна на другия ден. Armor калъфът за Xiaomi-то ми издържа две падания без драскотина.",
    rating: 5,
  },
  {
    name: "Мария Д.",
    text: "Много добро обслужване и бърз отговор на запитване. Протекторът се лепна без нито един мехур от първия път.",
    rating: 4.5,
  },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl container-p py-14">
      <SectionHeading eyebrow="Отзиви" title="Какво казват клиентите ни" />
      <div className="grid gap-4 sm:grid-cols-3">
        {reviews.map((r) => (
          <div key={r.name} className="flex flex-col gap-3 rounded-2xl border border-border-c bg-surface p-6">
            <StarRating rating={r.rating} size="md" />
            <p className="text-sm text-text-muted leading-relaxed">&ldquo;{r.text}&rdquo;</p>
            <p className="mt-auto text-sm font-semibold">{r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
