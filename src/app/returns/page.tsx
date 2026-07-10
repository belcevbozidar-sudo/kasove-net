export const metadata = { title: "Връщане на продукти — Кейсове.нет" };

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl container-p py-14">
      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-accent">Услуги</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold mb-8">Връщане на продукти</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-sm text-text-muted leading-relaxed space-y-6">
        <section className="rounded-2xl border border-border-c bg-surface p-6 sm:p-8">
          <p>
            Всеки клиент, закупил продукт от онлайн магазина Кейсове.нет, има право да се откаже от покупката и да върне продукта в рамките на <strong>14 календарни дни</strong> от датата на получаване.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">Условия за връщане на стока</h3>
          <p>За да бъде прието връщането на стоката, тя трябва да отговаря на следните условия:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Да бъде в пълна окомплектовка и в оригиналната си ненарушена опаковка.</li>
            <li>Да няма видими следи от употреба, драскотини или увреждания.</li>
            <li>Да бъде придружена от оригиналната фактура/касов бон, получени при покупката.</li>
            <li><strong>Защитни фолиа и стъклени протектори</strong>: Рекламация или връщане за тях не се приема, ако продуктът е бил отлепен от фабричното си фолио или е бил монтиран/ползван.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">Процедура по връщане</h3>
          <p>
            1. Преди да изпратите продукта обратно, е необходимо да се свържете с нас на дежурния телефон или имейл адрес, за да уточните пратката.
          </p>
          <p>
            2. Изпратете продукта до посочения от оператора адрес. Разходите за куриерски услуги по връщането са изцяло за сметка на купувача.
          </p>
          <p>
            3. След като получим обратно стоката и се уверим в нейния отличен търговски вид, ние ще възстановим заплатената сума по банков път в срок до 30 дни от получаването на върнатия артикул.
          </p>
        </section>

        <section className="rounded-xl bg-accent/5 border border-accent/25 p-4 text-xs font-bold text-text leading-relaxed">
          Моля, преглеждайте пратките си пред куриера при доставката. Всички рекламации за увреждане по време на транспорта са валидни само ако е съставен протокол за щета в присъствието на куриера.
        </section>
      </div>
    </div>
  );
}
