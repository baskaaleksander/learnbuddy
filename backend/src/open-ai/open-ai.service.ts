import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { FlashcardContent, SummaryAiOutputContent } from 'src/utils/types';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  async generateContent(prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async generateQuiz(pdfContent: string) {
    const prompt = `You are a quiz generator.
    
          Your task is to read the input text and generate a multiple-choice quiz based only on its content. Follow these rules strictly:
    
          Instructions:
          - Create exactly 10 multiple-choice questions.
          - Each question must have exactly 3 answer options.
          - Only one answer can be correct.
          - The correct answer must be copied **verbatim** from the list of options.
          - Do not add information that is not present in the source text.
          - Return the result as a pure JSON array, with no additional explanation or text.
          - The JSON structure must match this format exactly:
    
          [
            {
              "question": "Question text here",
              "answers": [
                "Option A",
                "Option B",
                "Option C"
              ],
              "correct_answer": "Option B"
            },
            {
              "question": "Question text here",
              "answers": [
                "Option A",
                "Option B",
                "Option C"
              ],
              "correct_answer": "Option C"
            },
            ...
          ]
    
          Text:
          """${pdfContent}"""
    `;

    const response = await this.generateContent(prompt);

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse quiz response:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  async generateSummary(pdfContent: string): Promise<SummaryAiOutputContent> {
    const prompt = `You are a structured summary generator.

      Your task is to carefully read the input text and return a JSON summary that follows this exact structure:

      {
        title: 'Summary: [Insert an appropriate title here]',
        chapters: [
          {
            name: '[Chapter name 1]',
            bullet_points: [
              '[Main idea 1]',
              '[Main idea 2]',
              ...
            ]
          },
          {
            name: '[Chapter name 2]',
            bullet_points: [
              '[Main idea 1]',
              '[Main idea 2]',
              ...
            ]
          },
          ...
        ]
      }

      Instructions:
      - Use only the information from the provided text.
      - Do not add, assume, or fabricate any information.
      - Identify the main sections of the text and group key points logically under them.
      - Each chapter should have a clear name and a list of bullet points (concise, informative).
      - Use plain English and preserve the original meaning of the text.
      - Keep the structure strictly as shown above — valid JSON only, with no extra comments or explanations.
      - If the main title is not explicitly stated, generate one that captures the overall idea of the content.
      - Each bullet point must be short and reflect an important fact, purpose, definition, reason, benefit, or instruction from the text.

      Example output format:

      {
        title: 'Summary: The Idea Behind a Thesis',
        chapters: [
          {
            name: 'Objectives of the Chapter',
            bullet_points: [
              'Understand the benefits of writing a thesis.',
              'Increase internal motivation to complete this task.'
            ]
          },
          {
            name: 'Reasons for Writing a Thesis',
            bullet_points: [
              'It marks the culmination of many years of study and the opportunity to apply knowledge.',
              'It is a formal requirement according to the Polish Higher Education Law.',
              'It demonstrates academic independence and maturity.'
            ]
          }
        ]
      }

      Text:
      """${pdfContent}"""
      `;
    const response = await this.generateContent(prompt);

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse quiz response:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  async generateFlashcards(pdfContent: string): Promise<
    Array<{
      question: string;
      answer: string;
    }>
  > {
    const prompt = `You are a flashcard generator.

      Your task is to read the input text and generate a set of flashcards. Each flashcard must consist of a clear **question** and a concise **answer**, based only on the content of the text.

      Instructions:
      - Return the result strictly as a JavaScript array of objects in the following format:

      [
        {
          question: 'Your question here?',
          answer: 'The correct answer here.'
        },
        ...
      ]

      Rules:
      - Do not add any information that is not present in the original text.
      - Rephrase content into a natural Q&A format.
      - Cover all the main concepts, definitions, benefits, and recommendations from the text.
      - Each flashcard should contain only **one** key idea.
      - Avoid repeating the same point in multiple cards.
      - Use simple, precise, and natural language.
      - The structure and formatting must match the example exactly.

      Example output:

      [
        {
          question: 'What are the main objectives of the chapter about thesis writing?',
          answer: 'Understanding the benefits of writing a thesis and increasing internal motivation.'
        },
        {
          question: 'Why is writing a thesis mandatory?',
          answer: "Because it is a legal requirement under the Polish Higher Education Law."
        },
        {
          question: 'How is a thesis defined?',
          answer: 'It is an independent study of a scientific, technical, artistic, or practical topic that demonstrates the student’s skills and knowledge.'
        },
        {
          question: 'What are the key benefits of writing a thesis?',
          answer: 'Improved project management, communication, information selection, self-confidence, and career readiness.'
        }
      ]

      Text:
      """${pdfContent}"""
      `;

    const response = await this.generateContent(prompt);

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse quiz response:', error);
      throw new Error('Failed to generate quiz');
    }
  }
}
