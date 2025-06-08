import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAiService {

    generateQuiz(pdfContent: string) {

        //mock data for quiz generation
        return [
            {
              "pytanie": "Jakie są główne cele napisania pracy dyplomowej według tekstu?",
              "odpowiedzi": {
                "A": "Zaliczenie przedmiotu z historii literatury",
                "B": "Wykazanie umiejętności zdobytych podczas studiów",
                "C": "Przygotowanie się do egzaminu maturalnego"
              },
              "poprawna_odpowiedz": "B"
            },
            {
              "pytanie": "Dlaczego warto nadać pracy dyplomowej osobisty sens?",
              "odpowiedzi": {
                "A": "Ponieważ uczelnia tego wymaga",
                "B": "Aby szybciej ją ukończyć",
                "C": "Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami"
              },
              "poprawna_odpowiedz": "C"
            },
            {
              "pytanie": "Która z poniższych umiejętności NIE została wymieniona jako korzyść z pisania pracy dyplomowej?",
              "odpowiedzi": {
                "A": "Zarządzanie złożonymi projektami",
                "B": "Rozwijanie zdolności aktorskich",
                "C": "Poprawa samooceny"
              },
              "poprawna_odpowiedz": "B"
            },
            {
              "pytanie": "Co według ustawy 'Prawo o szkolnictwie wyższym i nauce' jest warunkiem ukończenia studiów?",
              "odpowiedzi": {
                "A": "Udział w co najmniej jednym seminarium zagranicznym",
                "B": "Złożenie pracy dyplomowej i zdanie egzaminu dyplomowego",
                "C": "Napisanie artykułu naukowego"
              },
              "poprawna_odpowiedz": "B"
            },
            {
              "pytanie": "Czym jest praca dyplomowa według definicji z tekstu?",
              "odpowiedzi": {
                "A": "Zbiorem referatów zaliczeniowych z różnych przedmiotów",
                "B": "Samodzielnym opracowaniem prezentującym wiedzę i umiejętności studenta",
                "C": "Projektem grupowym realizowanym przez studentów ostatniego roku"
              },
              "poprawna_odpowiedz": "B"
            }
          ]
    }

    generateSummary(pdfContent: string) {
      // Mock data for summary generation
      return {
              "title": "Streszczenie: Idea pracy dyplomowej",
              "chapters": [
                {
                  "name": "Cele rozdziału",
                  "bullet_points": [
                    "Zrozumienie korzyści płynących z napisania pracy dyplomowej.",
                    "Zwiększenie motywacji wewnętrznej do realizacji tego zadania."
                  ]
                },
                {
                  "name": "Powody pisania pracy",
                  "bullet_points": [
                    "Zwieńczenie wielu lat edukacji i okazja do praktycznego wykorzystania wiedzy.",
                    "Wymóg formalny zgodny z ustawą „Prawo o szkolnictwie wyższym i nauce”.",
                    "Potrzeba wykazania samodzielności i dojrzałości akademickiej."
                  ]
                },
                {
                  "name": "Definicja pracy dyplomowej",
                  "bullet_points": [
                    "Opis: Samodzielne opracowanie zagadnienia naukowego, technicznego, artystycznego lub praktycznego.",
                    "Cel: Wykazanie umiejętności analizy, wyciągania wniosków i zastosowania wiedzy zgodnie z kierunkiem studiów."
                  ]
                },
                {
                  "name": "Korzyści z pisania pracy",
                  "bullet_points": [
                    "Rozwój umiejętności zarządzania projektami i czasem.",
                    "Udoskonalenie kompetencji technicznych i koncepcyjnych.",
                    "Poprawa komunikacji i współpracy zespołowej.",
                    "Lepsza samoocena i motywacja.",
                    "Przygotowanie do przyszłych wyzwań zawodowych.",
                    "Specjalizacja w wybranej dziedzinie."
                  ]
                },
                {
                  "name": "Rekomendowane podejście",
                  "bullet_points": [
                    "Nie traktuj pracy wyłącznie jako obowiązku.",
                    "Nadaj projektowi osobisty sens.",
                    "Dzięki odpowiedniemu nastawieniu pisanie pracy może być rozwijającą przygodą."
                  ]
                }
              ]
            }
    }

    generateFlashcards(pdfContent: string) {
      // Mock data for flashcard generation
      return [
                {
                  "pytanie": "Jakie są główne cele rozdziału dotyczącego idei pracy dyplomowej?",
                  "odpowiedz": "Zrozumienie korzyści płynących z napisania pracy dyplomowej oraz zwiększenie motywacji wewnętrznej."
                },
                {
                  "pytanie": "Dlaczego pisanie pracy dyplomowej jest obowiązkowe?",
                  "odpowiedz": "Ponieważ jest to wymóg ustawowy zgodny z ustawą 'Prawo o szkolnictwie wyższym i nauce'."
                },
                {
                  "pytanie": "Czym jest praca dyplomowa według definicji?",
                  "odpowiedz": "To samodzielne opracowanie zagadnienia naukowego, technicznego, artystycznego lub praktycznego, które pokazuje wiedzę i umiejętności studenta."
                },
                {
                  "pytanie": "Jakie korzyści przynosi napisanie pracy dyplomowej?",
                  "odpowiedz": "Rozwój umiejętności zarządzania, komunikacji, selekcji informacji, lepsza samoocena i przygotowanie do wyzwań zawodowych."
                },
                {
                  "pytanie": "Jakie podejście do pracy dyplomowej rekomendują autorzy?",
                  "odpowiedz": "Nadanie pracy osobistego sensu, aby stała się wartościową przygodą, a nie tylko obowiązkiem."
                },
                {
                  "pytanie": "Jakie umiejętności możesz rozwinąć dzięki pracy dyplomowej?",
                  "odpowiedz": "Zarządzanie projektami, komunikacja, wyszukiwanie informacji, praca zespołowa, samoorganizacja."
                },
                {
                  "pytanie": "Co możesz zyskać, traktując pracę dyplomową jako projekt osobisty?",
                  "odpowiedz": "Lepszą motywację, większe zaangażowanie i rozwój osobisty oraz zawodowy."
                }
              ]
    }
}
