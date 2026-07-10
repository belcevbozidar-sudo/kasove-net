export const metadata = { title: "Лични данни (GDPR) — Кейсове.нет" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl container-p py-14">
      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-accent">Защита</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold mb-8">GDPR Защита на личните данни</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-sm text-text-muted leading-relaxed space-y-6">
        <section className="rounded-2xl border border-border-c bg-surface p-6 sm:p-8">
          <p>
            Във връзка с регламента за защита на личните данни на Европейския парламент <strong>Регламент (ЕС) 2016/679 (GDPR)</strong>, в сила от 25 май 2018 г., Кейсове.нет прилага строги правила за съхранение, събиране и сигурност на личните данни на клиентите ни.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">1. Основание за събиране и обработване</h3>
          <p>
            Ние събираме и обработваме Вашите лични данни само във връзка със сключването на договори за покупко-продажба от разстояние, обработка на поръчки, доставка на закупени стоки и счетоводни цели въз основа на законовите изисквания на Република България.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">2. Какви лични данни събираме</h3>
          <p>При извършване на поръчка ние събираме следните данни за доставка:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Име и фамилия</li>
            <li>Адрес за доставка (или офис на куриер)</li>
            <li>Телефонен номер за контакт</li>
            <li>Електронна поща (e-mail)</li>
          </ul>
          <p className="mt-3">За фирми и фактури допълнително се изискват ЕИК/Булстат, име на фирма и адрес на регистрация.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">3. Срок на съхранение</h3>
          <p>
            Личните данни се съхраняват за срок не по-дълъг от необходимото за изпълнение на поръчката или законово установения 5-годишен срок за съхранение на данните по счетоводни и данъчни цели.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">4. Вашите права като субект на данните</h3>
          <p>Имате право по всяко едно време на:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Право на достъп до обработваните Ваши лични данни.</li>
            <li>Право на коригиране или попълване на неточни данни.</li>
            <li>Право на изтриване („право да бъдеш забравен“), при липса на текущо законово задължение за съхранение.</li>
            <li>Право на ограничаване на обработването.</li>
          </ul>
          <p className="mt-3">Искания за упражняване на Вашите права могат да бъдат изпратени писмено на служебния ни имейл адрес.</p>
        </section>
      </div>
    </div>
  );
}
