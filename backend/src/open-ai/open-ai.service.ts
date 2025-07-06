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
    // const prompt = `You are a structured summary generator.

    //   Your task is to carefully read the input text and return a JSON summary that follows this exact structure:

    //   {
    //     title: 'Summary: [Insert an appropriate title here]',
    //     chapters: [
    //       {
    //         name: '[Chapter name 1]',
    //         bullet_points: [
    //           '[Main idea 1]',
    //           '[Main idea 2]',
    //           ...
    //         ]
    //       },
    //       {
    //         name: '[Chapter name 2]',
    //         bullet_points: [
    //           '[Main idea 1]',
    //           '[Main idea 2]',
    //           ...
    //         ]
    //       },
    //       ...
    //     ]
    //   }

    //   Instructions:
    //   - Use only the information from the provided text.
    //   - Do not add, assume, or fabricate any information.
    //   - Identify the main sections of the text and group key points logically under them.
    //   - Each chapter should have a clear name and a list of bullet points (concise, informative).
    //   - Use plain English and preserve the original meaning of the text.
    //   - Keep the structure strictly as shown above — valid JSON only, with no extra comments or explanations.
    //   - If the main title is not explicitly stated, generate one that captures the overall idea of the content.
    //   - Each bullet point must be short and reflect an important fact, purpose, definition, reason, benefit, or instruction from the text.

    //   Example output format:

    //   {
    //     title: 'Summary: The Idea Behind a Thesis',
    //     chapters: [
    //       {
    //         name: 'Objectives of the Chapter',
    //         bullet_points: [
    //           'Understand the benefits of writing a thesis.',
    //           'Increase internal motivation to complete this task.'
    //         ]
    //       },
    //       {
    //         name: 'Reasons for Writing a Thesis',
    //         bullet_points: [
    //           'It marks the culmination of many years of study and the opportunity to apply knowledge.',
    //           'It is a formal requirement according to the Polish Higher Education Law.',
    //           'It demonstrates academic independence and maturity.'
    //         ]
    //       }
    //     ]
    //   }

    //   Text:
    //   """${pdfContent}"""
    //   `;
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
    // const prompt = `You are a flashcard generator.

    //   Your task is to read the input text and generate a set of flashcards. Each flashcard must consist of a clear **question** and a concise **answer**, based only on the content of the text.

    //   Instructions:
    //   - Return the result strictly as a JavaScript array of objects in the following format:

    //   [
    //     {
    //       question: 'Your question here?',
    //       answer: 'The correct answer here.'
    //     },
    //     ...
    //   ]

    //   Rules:
    //   - Do not add any information that is not present in the original text.
    //   - Rephrase content into a natural Q&A format.
    //   - Cover all the main concepts, definitions, benefits, and recommendations from the text.
    //   - Each flashcard should contain only **one** key idea.
    //   - Avoid repeating the same point in multiple cards.
    //   - Use simple, precise, and natural language.
    //   - The structure and formatting must match the example exactly.

    //   Example output:

    //   [
    //     {
    //       question: 'What are the main objectives of the chapter about thesis writing?',
    //       answer: 'Understanding the benefits of writing a thesis and increasing internal motivation.'
    //     },
    //     {
    //       question: 'Why is writing a thesis mandatory?',
    //       answer: "Because it is a legal requirement under the Polish Higher Education Law."
    //     },
    //     {
    //       question: 'How is a thesis defined?',
    //       answer: 'It is an independent study of a scientific, technical, artistic, or practical topic that demonstrates the student’s skills and knowledge.'
    //     },
    //     {
    //       question: 'What are the key benefits of writing a thesis?',
    //       answer: 'Improved project management, communication, information selection, self-confidence, and career readiness.'
    //     }
    //   ]

    //   Text:
    //   """${pdfContent}"""
    //   `;

    return [
      {
        question:
          'Jakie są główne cele rozdziału dotyczącego idei pracy dyplomowej?',
        answer:
          'Zrozumienie korzyści płynących z napisania pracy dyplomowej oraz zwiększenie motywacji wewnętrznej.',
      },
      {
        question: 'Dlaczego pisanie pracy dyplomowej jest obowiązkowe?',
        answer:
          "Ponieważ jest to wymóg ustawowy zgodny z ustawą 'Prawo o szkolnictwie wyższym i nauce'.",
      },
      {
        question: 'Czym jest praca dyplomowa według definicji?',
        answer:
          'To samodzielne opracowanie zagadnienia naukowego, technicznego, artystycznego lub praktycznego, które pokazuje wiedzę i umiejętności studenta.',
      },
      {
        question: 'Jakie korzyści przynosi napisanie pracy dyplomowej?',
        answer:
          'Rozwój umiejętności zarządzania, komunikacji, selekcji informacji, lepsza samoocena i przygotowanie do wyzwań zawodowych.',
      },
      {
        question: 'Jakie podejście do pracy dyplomowej rekomendują autorzy?',
        answer:
          'Nadanie pracy osobistego sensu, aby stała się wartościową przygodą, a nie tylko obowiązkiem.',
      },
      {
        question: 'Jakie umiejętności możesz rozwinąć dzięki pracy dyplomowej?',
        answer:
          'Zarządzanie projektami, komunikacja, wyszukiwanie informacji, praca zespołowa, samoorganizacja.',
      },
      {
        question:
          'Co możesz zyskać, traktując pracę dyplomową jako projekt osobisty?',
        answer:
          'Lepszą motywację, większe zaangażowanie i rozwój osobisty oraz zawodowy.',
      },
    ];
  }
}
