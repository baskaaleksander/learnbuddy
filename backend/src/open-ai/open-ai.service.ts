import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { FlashcardContent, Quiz, SummaryAiOutputContent } from '../utils/types';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private validateQuizStructure(data: any): data is Quiz[] {
    if (!Array.isArray(data)) {
      return false;
    }

    return data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.question === 'string' &&
        Array.isArray(item.answers) &&
        item.answers.length === 3 &&
        item.answers.every((answer: any) => typeof answer === 'string') &&
        typeof item.correct_answer === 'string' &&
        item.answers.includes(item.correct_answer),
    );
  }

  private validateSummaryStructure(data: any): data is SummaryAiOutputContent {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    if (typeof data.title !== 'string') {
      return false;
    }

    if (!Array.isArray(data.chapters)) {
      return false;
    }

    return data.chapters.every(
      (chapter: any) =>
        typeof chapter === 'object' &&
        chapter !== null &&
        typeof chapter.name === 'string' &&
        Array.isArray(chapter.bullet_points) &&
        chapter.bullet_points.every((point: any) => typeof point === 'string'),
    );
  }

  private validateFlashcardStructure(data: any): data is FlashcardContent {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    if (!Array.isArray(data.flashcards)) {
      return false;
    }

    return data.flashcards.every(
      (card: any) =>
        typeof card === 'object' &&
        card !== null &&
        typeof card.question === 'string' &&
        typeof card.answer === 'string',
    );
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content || content.trim() === '') {
        throw new Error('No content received from OpenAI');
      }
      return content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async generateQuiz(pdfContent: string): Promise<Array<Quiz>> {
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
      const parsed = JSON.parse(response);

      if (!this.validateQuizStructure(parsed)) {
        console.error('Invalid quiz structure received:', parsed);
        throw new Error('Response does not match expected Quiz structure');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse quiz response:', error);
      throw new Error('Failed to generate quiz from OpenAI response');
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
      - Bullet points should be short, capturing essential facts, definitions, reasons, benefits, or instructions.
      - Ensure the summary is structured, easy to read, and follows the provided format.
      - Let the number of chapters and bullet points be determined by the content of the text.
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
      const parsed = JSON.parse(response);

      if (!this.validateSummaryStructure(parsed)) {
        console.error('Invalid summary structure received:', parsed);
        throw new Error(
          'Response does not match expected SummaryAiOutputContent structure',
        );
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse summary response:', error);
      throw new Error('Failed to generate summary from OpenAI response');
    }
  }

  async generateFlashcards(pdfContent: string): Promise<FlashcardContent> {
    const wordsCount = pdfContent.trim().split(/\s+/).length;
    const minCards = 2;
    const maxCards = 20;
    let cardsCount = Math.ceil(wordsCount / 30);
    if (cardsCount < minCards) cardsCount = minCards;
    if (cardsCount > maxCards) cardsCount = maxCards;
    const prompt = `You are a flashcard generator.

        Your task is to carefully read the input text and return a JSON object with exactly ${cardsCount} flashcards in the following structure:

        {
          "flashcards": [
            {
              "question": "Your question here?",
              "answer": "The correct answer here."
            },
            {
              "question": "Another question here?",
              "answer": "The correct answer here."
            },
            ...
          ]
        }

        Instructions:
        - Use only the information from the provided text.
        - Do not add, assume, or fabricate any information.
        - Identify the key concepts, definitions, benefits, and recommendations from the text.
        - Rephrase content into a clear and natural question-and-answer format.
        - Each flashcard must reflect a single important idea from the text.
        - Use plain, precise language.
        - Do not repeat the same idea across multiple cards.
        - Always return exactly ${cardsCount} flashcards.
        - Keep the output strictly in the JSON format above — no extra text, comments, or formatting.

        Example output:

        {
          "flashcards": [
            {
              "question": "What are the main objectives of the chapter about thesis writing?",
              "answer": "Understanding the benefits of writing a thesis and increasing internal motivation."
            },
            {
              "question": "Why is writing a thesis mandatory?",
              "answer": "Because it is a legal requirement under the Polish Higher Education Law."
            }
          ]
        }

        Text:
        """${pdfContent}"""
      `.trim();

    const response = await this.generateContent(prompt);

    try {
      const parsed = JSON.parse(response);

      if (!this.validateFlashcardStructure(parsed)) {
        console.error('Invalid flashcard structure received:', parsed);
        throw new Error(
          'Response does not match expected FlashcardContent structure',
        );
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse flashcards response:', error);
      throw new Error('Failed to generate flashcards from OpenAI response');
    }
  }
}
