import { describe, expect, it } from "vitest";

import { builtInCards } from "../src/content/cards";
import { CATEGORIES, STAGES } from "../src/game";

describe("built-in deck", () => {
  it("contains exactly 360 unique cards", () => {
    expect(builtInCards).toHaveLength(360);
    expect(new Set(builtInCards.map((card) => card.id)).size).toBe(360);
    expect(new Set(builtInCards.map((card) => card.text.toLocaleLowerCase("ru-RU"))).size).toBe(360);
  });

  it("is balanced by stage and category", () => {
    for (const stage of STAGES) {
      expect(builtInCards.filter((card) => card.stage === stage)).toHaveLength(120);
    }
    for (const category of CATEGORIES) {
      expect(builtInCards.filter((card) => card.category === category)).toHaveLength(72);
    }
    for (const stage of STAGES) {
      for (const category of CATEGORIES) {
        expect(builtInCards.filter((card) => card.stage === stage && card.category === category)).toHaveLength(24);
      }
    }
  });

  it("keeps every prompt readable and free of design-tell dashes", () => {
    for (const card of builtInCards) {
      expect(card.text.length).toBeGreaterThanOrEqual(24);
      expect(card.text.length).toBeLessThanOrEqual(220);
      expect(card.text).not.toMatch(/[—–]/u);
      expect(card.text).toMatch(/[.?!][»”"]?$/u);
      expect(card.source).toBe("builtIn");
    }
  });

  it("does not contain the reported abstract or confusing prompts", () => {
    const deck = builtInCards.map((card) => card.text).join("\n");
    expect(deck).not.toContain("Что ты умеешь ценить только после небольшой паузы?");
    expect(deck).not.toContain("Какой твой выбор обычно удивляет людей, которые плохо тебя знают?");
    expect(deck).not.toContain("Изобрази Илию, который слышит тихий спокойный голос.");
    expect(deck).not.toContain("Придумай группе добрый вызов до следующей встречи.");
    expect(deck).not.toContain("Назови одно качество каждого из двух участников, которое пригодилось бы в совместном служении.");
  });

  it("does not contain the prompts reported after live play", () => {
    const deck = builtInCards.map((card) => card.text);
    const rejected = [
      "Покажи без слов, как ты ищешь место на переполненной парковке.",
      "Расскажи о поездке, которая пошла не по плану, но всё равно удалась.",
      "Какое время дня для служения тебе нравится больше всего?",
      "Как совместное служение помогло тебе лучше узнать друга?",
      "Какой совместный труд особенно сблизил тебя с кем-то?",
      "Какой пример напарника научил тебя говорить проще?",
      "Попроси всех за пять секунд найти в кадре предмет одного цвета.",
      "Начни медленную волну, которую повторит весь круг.",
      "Что делает перерыв после служения особенно приятным?",
      "Разыграйте втроём сцену, где все уступают друг другу место.",
    ];

    rejected.forEach((prompt) => expect(deck).not.toContain(prompt));
  });

  it("keeps group cards compatible with a two-person Zoom call", () => {
    const groupDeck = builtInCards
      .filter((card) => card.mode !== "answer")
      .map((card) => card.text.toLocaleLowerCase("ru-RU"))
      .join("\n");
    const roomOnlyFragments = [
      "человеку слева",
      "человеку справа",
      "втроём",
      "трем участникам",
      "трём участникам",
      "двух участников",
      "двум участникам",
      "уступают друг другу место",
      "медленную волну",
    ];

    roomOnlyFragments.forEach((fragment) => expect(groupDeck).not.toContain(fragment));
  });

  it("includes Ukraine as lived context without making every card about it", () => {
    const contextualCards = builtInCards.filter((card) => /украин|україн|киев|київ|львов|львів|одесс|одес|карпат/i.test(card.text));
    expect(contextualCards.length).toBeGreaterThanOrEqual(12);
    expect(contextualCards.length).toBeLessThanOrEqual(36);
  });

  it("keeps the approved childhood and spiritual themes present without taking over the deck", () => {
    const childhoodCards = builtInCards.filter((card) => /детств|ребён|маленьк|мультфильм|школ/iu.test(card.text));
    const newWorldCards = builtInCards.filter((card) => /новом мире|новый мир/iu.test(card.text));
    const spiritualStoryCards = builtInCards.filter((card) => /истин|Иегов|братств/iu.test(card.text));

    expect(childhoodCards.length).toBeGreaterThanOrEqual(20);
    expect(childhoodCards.length).toBeLessThanOrEqual(48);
    expect(newWorldCards.length).toBeGreaterThanOrEqual(8);
    expect(newWorldCards.length).toBeLessThanOrEqual(20);
    expect(spiritualStoryCards.length).toBeGreaterThanOrEqual(12);
  });

  it("keeps the most personal spiritual questions out of the opening stage", () => {
    const deeperCards = builtInCards.filter((card) =>
      /истина появилась|полюбить Иегову|благодарен Иегове|любовь братства/iu.test(card.text),
    );

    expect(deeperCards.length).toBeGreaterThanOrEqual(5);
    deeperCards.forEach((card) => expect(card.stage).not.toBe("spark"));
  });

  it("keeps the approved anchor questions in the deck", () => {
    const deck = builtInCards.map((card) => card.text);

    expect(deck).toEqual(
      expect.arrayContaining([
        "Какой твой поступок в детстве привёл взрослых в шок?",
        "Расскажи, как истина появилась в твоей жизни.",
        "Что помогло тебе по-настоящему полюбить Иегову?",
        "За что тебе сейчас особенно хочется благодарить Иегову?",
        "В какой момент любовь братства ощущалась особенно сильно?",
        "Какое ремесло или хобби хочется освоить в новом мире?",
        "Как будет выглядеть твой дом в новом мире и что будет рядом?",
      ]),
    );
  });

  it("addresses players without assuming gender", () => {
    const genderedForms = [
      "мог",
      "был",
      "хотел",
      "научился",
      "начал",
      "встречал",
      "готовил",
      "служил",
      "растерялся",
      "согласился",
      "спросил",
      "увидел",
      "собирался",
      "устроил",
      "искал",
      "понял",
      "забыл",
      "принял",
      "попробовал",
      "мечтал",
      "получил",
      "ожидал",
      "любил",
      "отправил",
      "гордился",
      "почувствовал",
      "решил",
      "добавил",
      "назвал",
      "попытался",
      "оговорился",
      "сумел",
      "пожалел",
      "съел",
      "носил",
      "рад",
      "готов",
      "одет",
      "первым",
      "сам",
      "могла",
      "была",
      "хотела",
      "научилась",
      "начала",
      "встречала",
      "готовила",
      "служила",
      "растерялась",
      "согласилась",
      "спросила",
      "увидела",
      "собиралась",
      "устроила",
      "искала",
      "поняла",
      "забыла",
      "приняла",
      "попробовала",
      "мечтала",
      "получила",
      "ожидала",
      "любила",
      "отправила",
      "гордилась",
      "почувствовала",
      "решила",
      "добавила",
      "назвала",
      "попыталась",
      "оговорилась",
      "сумела",
      "пожалела",
      "съела",
      "носила",
      "рада",
      "готова",
      "одета",
      "сама",
      "благодарен",
      "благодарна",
      "уверен",
      "уверена",
      "должен",
      "должна",
      "согласен",
      "согласна",
      "виноват",
      "виновата",
      "свободен",
      "свободна",
      "занят",
      "занята",
      "прав",
      "права",
      "способен",
      "способна",
      "вынужден",
      "вынуждена",
      "знаком",
      "знакома",
    ].join("|");
    const afterYou = new RegExp(`ты[^?!]{0,100}(?<![\\p{L}])(?:${genderedForms})(?![\\p{L}])`, "iu");
    const beforeYou = new RegExp(
      `(?<![\\p{L}])(?:${genderedForms})(?![\\p{L}])[^?!]{0,40}(?:ли )?ты`,
      "iu",
    );
    const singularGroupRole = /выбери (?:любого )?участника|позови участника|другой участник|следующий участник/iu;
    const genderedDirectRole = /ты\s+(?:ведущий|ведущая|герой|героиня|актёр|актриса)\b/iu;

    builtInCards.forEach((card) => {
      expect(card.text).not.toMatch(afterYou);
      expect(card.text).not.toMatch(beforeYou);
      expect(card.text).not.toMatch(singularGroupRole);
      expect(card.text).not.toMatch(genderedDirectRole);
      expect(card.text).not.toMatch(/\([а-яё]\)/iu);
      expect(card.text).not.toContain("«Сегодня я не ожидал");
      expect(card.text).not.toContain("«Полностью согласен»");
    });
  });

  it("does not bring back the abstract prompts removed by the editorial pass", () => {
    const deck = builtInCards.map((card) => card.text).join("\n");
    const rejectedFragments = [
      "Что после тяжёлого дня помогает тебе больше",
      "Как тебе удаётся не терять связь",
      "Что делает видеозвонок похожим",
      "Что о человеке быстрее узнаёшь",
      "по одному качеству, которое цените в напарнике",
      "всего из пяти слов",
      "по которому он так скучал",
      "а вокруг никто не понимает зачем",
    ];

    rejectedFragments.forEach((fragment) => expect(deck).not.toContain(fragment));
  });
});
