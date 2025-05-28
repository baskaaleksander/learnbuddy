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
}
