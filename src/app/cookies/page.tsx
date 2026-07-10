export const metadata = { title: "Политика за бисквитки — Кейсове.нет" };

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-4xl container-p py-14">
      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-accent">Поверителност</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold mb-8">Информация относно бисквитките</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-sm text-text-muted leading-relaxed space-y-6">
        <section className="rounded-2xl border border-border-c bg-surface p-6 sm:p-8">
          <p>
            За да осигурим правилното и качествено функциониране на нашия онлайн магазин, ние използваме малки файлове с данни, наречени „бисквитки“ (cookies), които се запазват на Вашето устройство.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">Какво представляват бисквитките?</h3>
          <p>
            Бисквитките са малки текстови файлове, които се съхраняват на Вашия компютър или мобилно устройство, когато посещавате даден уебсайт. Те позволяват на уебсайта да запаметява Вашите действия и предпочитания (като потребителско име, език, съдържание на количката и други настройки за показване) за определен период от време, за да не се налага да ги въвеждате всеки път, когато посещавате сайта или преминавате от една страница към друга.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">Какви видове бисквитки използваме?</h3>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>
              <strong>Задължителни бисквитки:</strong> Те са критично важни за функционирането на сайта, добавянето на продукти в количката, извършването на поръчки и сигурността на плащанията. Без тях магазинът не може да работи коректно.
            </li>
            <li>
              <strong>Функционални бисквитки:</strong> Използват се за запомняне на Вашите настройки и предпочитания за по-удобно сърфиране.
            </li>
            <li>
              <strong>Аналитични бисквитки:</strong> Помагат ни да разберем как посетителите взаимодействат със сайта (например кои страници се посещават най-често), чрез инструменти като Google Analytics, с цел подобряване на потребителското изживяване.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-text">Как да контролирате бисквитките?</h3>
          <p>
            Можете да контролирате и/или изтривате бисквитките, когато пожелаете — за подробности вижте <a href="https://aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-accent underline">aboutcookies.org</a>. Можете да изтриете всички бисквитки, които вече са запазени на Вашия компютър, а също така можете да настроите повечето браузъри да ги блокират. Ако направите това обаче, може да се наложи ръчно да настройвате някои параметри всеки път, когато посещавате даден сайт, а освен това е възможно някои услуги и функции на нашия онлайн магазин да не работят.
          </p>
        </section>
      </div>
    </div>
  );
}
