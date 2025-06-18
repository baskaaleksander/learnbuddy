import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAiService {
  generateQuiz(pdfContent: string) {
    //mock data for quiz generation
    //     const prompt = `You are a quiz generator.
    //
    //       Your task is to read the input text and generate a multiple-choice quiz based only on its content. Follow these rules strictly:
    //
    //       Instructions:
    //       - Create exactly 10 multiple-choice questions.
    //       - Each question must have exactly 3 answer options.
    //       - Only one answer can be correct.
    //       - The correct answer must be copied **verbatim** from the list of options.
    //       - Do not add information that is not present in the source text.
    //       - Return the result as a pure JSON array, with no additional explanation or text.
    //       - The JSON structure must match this format exactly:
    //
    //       [
    //         {
    //           "question": "Question text here",
    //           "answers": [
    //             "Option A",
    //             "Option B",
    //             "Option C"
    //           ],
    //           "correct_answer": "Option B"
    //         },
    //         {
    //           "question": "Question text here",
    //           "answers": [
    //             "Option A",
    //             "Option B",
    //             "Option C"
    //           ],
    //           "correct_answer": "Option C"
    //         },
    //         ...
    //       ]
    //
    //       Text:
    //       """${pdfContent}"""
    // `;
    return [
      {
        question:
          'Jakie są główne cele napisania pracy dyplomowej według tekstu?',
        answers: [
          'Zaliczenie przedmiotu z historii literatury',
          'Wykazanie umiejętności zdobytych podczas studiów',
          'Przygotowanie się do egzaminu maturalnego',
        ],
        correct_answer: 'Wykazanie umiejętności zdobytych podczas studiów',
      },
      {
        question: 'Dlaczego warto nadać pracy dyplomowej osobisty sens?',
        answers: [
          'Ponieważ uczelnia tego wymaga',
          'Aby szybciej ją ukończyć',
          'Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami',
        ],
        correct_answer:
          'Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami',
      },
      {
        question:
          'Która z poniższych umiejętności NIE została wymieniona jako korzyść z pisania pracy dyplomowej?',
        answers: [
          'Zarządzanie złożonymi projektami',
          'Rozwijanie zdolności aktorskich',
          'Poprawa samooceny',
        ],
        correct_answer: 'Rozwijanie zdolności aktorskich',
      },
      {
        question:
          "Co według ustawy 'Prawo o szkolnictwie wyższym i nauce' jest warunkiem ukończenia studiów?",
        answers: [
          'Udział w co najmniej jednym seminarium zagranicznym',
          'Złożenie pracy dyplomowej i zdanie egzaminu dyplomowego',
          'Napisanie artykułu naukowego',
        ],
        correct_answer:
          'Złożenie pracy dyplomowej i zdanie egzaminu dyplomowego',
      },
      {
        question: 'Czym jest praca dyplomowa według definicji z tekstu?',
        answers: [
          'Zbiorem referatów zaliczeniowych z różnych przedmiotów',
          'Samodzielnym opracowaniem prezentującym wiedzę i umiejętności studenta',
          'Projektem grupowym realizowanym przez studentów ostatniego roku',
        ],
        correct_answer:
          'Samodzielnym opracowaniem prezentującym wiedzę i umiejętności studenta',
      },
    ];
  }

  generateSummary(pdfContent: string) {
    // Mock data for summary generation
    return {
      title: 'Streszczenie: Idea pracy dyplomowej',
      chapters: [
        {
          name: 'Cele rozdziału',
          bullet_points: [
            'Zrozumienie korzyści płynących z napisania pracy dyplomowej.',
            'Zwiększenie motywacji wewnętrznej do realizacji tego zadania.',
          ],
        },
        {
          name: 'Powody pisania pracy',
          bullet_points: [
            'Zwieńczenie wielu lat edukacji i okazja do praktycznego wykorzystania wiedzy.',
            'Wymóg formalny zgodny z ustawą „Prawo o szkolnictwie wyższym i nauce”.',
            'Potrzeba wykazania samodzielności i dojrzałości akademickiej.',
          ],
        },
        {
          name: 'Definicja pracy dyplomowej',
          bullet_points: [
            'Opis: Samodzielne opracowanie zagadnienia naukowego, technicznego, artystycznego lub praktycznego.',
            'Cel: Wykazanie umiejętności analizy, wyciągania wniosków i zastosowania wiedzy zgodnie z kierunkiem studiów.',
          ],
        },
        {
          name: 'Korzyści z pisania pracy',
          bullet_points: [
            'Rozwój umiejętności zarządzania projektami i czasem.',
            'Udoskonalenie kompetencji technicznych i koncepcyjnych.',
            'Poprawa komunikacji i współpracy zespołowej.',
            'Lepsza samoocena i motywacja.',
            'Przygotowanie do przyszłych wyzwań zawodowych.',
            'Specjalizacja w wybranej dziedzinie.',
          ],
        },
        {
          name: 'Rekomendowane podejście',
          bullet_points: [
            'Nie traktuj pracy wyłącznie jako obowiązku.',
            'Nadaj projektowi osobisty sens.',
            'Dzięki odpowiedniemu nastawieniu pisanie pracy może być rozwijającą przygodą.',
          ],
        },
      ],
    };
  }

  generateFlashcards(pdfContent: string) {
    // Mock data for flashcard generation
    return [
      {
        pytanie:
          'Jakie są główne cele rozdziału dotyczącego idei pracy dyplomowej?',
        odpowiedz:
          'Zrozumienie korzyści płynących z napisania pracy dyplomowej oraz zwiększenie motywacji wewnętrznej.',
      },
      {
        pytanie: 'Dlaczego pisanie pracy dyplomowej jest obowiązkowe?',
        odpowiedz:
          "Ponieważ jest to wymóg ustawowy zgodny z ustawą 'Prawo o szkolnictwie wyższym i nauce'.",
      },
      {
        pytanie: 'Czym jest praca dyplomowa według definicji?',
        odpowiedz:
          'To samodzielne opracowanie zagadnienia naukowego, technicznego, artystycznego lub praktycznego, które pokazuje wiedzę i umiejętności studenta.',
      },
      {
        pytanie: 'Jakie korzyści przynosi napisanie pracy dyplomowej?',
        odpowiedz:
          'Rozwój umiejętności zarządzania, komunikacji, selekcji informacji, lepsza samoocena i przygotowanie do wyzwań zawodowych.',
      },
      {
        pytanie: 'Jakie podejście do pracy dyplomowej rekomendują autorzy?',
        odpowiedz:
          'Nadanie pracy osobistego sensu, aby stała się wartościową przygodą, a nie tylko obowiązkiem.',
      },
      {
        pytanie: 'Jakie umiejętności możesz rozwinąć dzięki pracy dyplomowej?',
        odpowiedz:
          'Zarządzanie projektami, komunikacja, wyszukiwanie informacji, praca zespołowa, samoorganizacja.',
      },
      {
        pytanie:
          'Co możesz zyskać, traktując pracę dyplomową jako projekt osobisty?',
        odpowiedz:
          'Lepszą motywację, większe zaangażowanie i rozwój osobisty oraz zawodowy.',
      },
    ];
  }
}
