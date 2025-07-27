import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from './open-ai.service';

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('OpenAiService', () => {
  let service: OpenAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAiService],
    }).compile();

    service = module.get<OpenAiService>(OpenAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateContent', () => {
    it('should return content from OpenAI API', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Mock content' } }],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockResponse,
      );

      const result = await service.generateContent('Test prompt');
      expect(result).toBe('Mock content');
    });
    it('should handle empty/null response', async () => {
      const mockResponse = {
        choices: [{ message: { content: null } }],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockResponse,
      );

      await expect(service.generateContent('Test prompt')).rejects.toThrow(
        'No content received from OpenAI',
      );
    });
    it('should handle API failures gracefully', async () => {
      const mockError = new Error('API error');
      (service as any).openai.chat.completions.create.mockRejectedValue(
        mockError,
      );

      await expect(service.generateContent('Test prompt')).rejects.toThrow(
        'Failed to generate content: API error',
      );
    });
  });
  describe('generateQuiz', () => {
    it('should parse valid quiz JSON correctly', async () => {
      const mockQuizResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  question: 'What is the capital of France?',
                  answers: ['Paris', 'London', 'Berlin'],
                  correct_answer: 'Paris',
                },
              ]),
            },
          },
        ],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockQuizResponse,
      );

      const result = await service.generateQuiz('Test prompt');
      expect(result).toEqual([
        {
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin'],
          correct_answer: 'Paris',
        },
      ]);
    });
    it('should throw error on invalid JSON', async () => {
      const mockQuizResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON string',
            },
          },
        ],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockQuizResponse,
      );

      await expect(service.generateQuiz('Test prompt')).rejects.toThrow(
        'Failed to generate quiz from OpenAI response',
      );
    });
    it('should handle malformed quiz structure', async () => {
      const mockQuizResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  questions: 'What is the capital of France?',
                  answers: ['Paris', 'London', 'Berlin'],
                  correct_answer: 'Paris',
                },
              ]),
            },
          },
        ],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockQuizResponse,
      );

      await expect(service.generateQuiz('Test prompt')).rejects.toThrow(
        'Failed to generate quiz from OpenAI response',
      );
    });
    it('should handle empty quiz content', async () => {
      const mockQuizResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockQuizResponse,
      );

      await expect(service.generateQuiz('Test prompt')).rejects.toThrow(
        'Failed to generate content: No content received from OpenAI',
      );
    });
  });
  describe('generateSummary', () => {
    it('should parse valid summary JSON correctly', async () => {
      const mockSummaryResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Summary',
                chapters: [
                  {
                    name: 'Chapter 1',
                    bullet_points: ['Point 1', 'Point 2'],
                  },
                ],
              }),
            },
          },
        ],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockSummaryResponse,
      );

      const result = await service.generateSummary('Test prompt');
      expect(result).toEqual({
        title: 'Test Summary',
        chapters: [
          {
            name: 'Chapter 1',
            bullet_points: ['Point 1', 'Point 2'],
          },
        ],
      });
    });
    it('should throw error on invalid JSON', async () => {
      const mockSummaryResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON string',
            },
          },
        ],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockSummaryResponse,
      );

      await expect(service.generateSummary('Test prompt')).rejects.toThrow(
        'Failed to generate summary from OpenAI response',
      );
    });
    it('should handle malformed summary structure', async () => {
      const mockSummaryResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Summary',
                chapters: [
                  {
                    name: 'Chapter 1',
                    bullet_points: 'Point 1, Point 2',
                  },
                ],
              }),
            },
          },
        ],
      };

      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockSummaryResponse,
      );

      await expect(service.generateSummary('Test prompt')).rejects.toThrow(
        'Failed to generate summary from OpenAI response',
      );
    });
    it('should handle empty summary content', async () => {
      const mockSummaryResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      };

      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockSummaryResponse,
      );

      await expect(service.generateSummary('Test prompt')).rejects.toThrow(
        'Failed to generate content: No content received from OpenAI',
      );
    });
  });
  describe('generateFlashcards', () => {
    it('should parse valid flashcards JSON correctly', async () => {
      const mockFlashcardsResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [
                  {
                    question: 'What is the capital of France?',
                    answer: 'Paris',
                  },
                  {
                    question: 'What is the largest planet in our solar system?',
                    answer: 'Jupiter',
                  },
                ],
              }),
            },
          },
        ],
      };

      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockFlashcardsResponse,
      );

      const result = await service.generateFlashcards('Test prompt');
      expect(result).toEqual(
        JSON.parse(mockFlashcardsResponse.choices[0].message.content),
      );
    });
    it('should throw error on invalid JSON', async () => {
      const mockFlashcardsResponse = {
        choices: [
          {
            message: {
              content: 'Invalid JSON string',
            },
          },
        ],
      };

      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockFlashcardsResponse,
      );

      await expect(service.generateFlashcards('Test prompt')).rejects.toThrow(
        'Failed to generate flashcards from OpenAI response',
      );
    });
    it('should handle malformed flashcards structure', async () => {
      const mockFlashcardsResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [
                  {
                    question: 'What is the capital of France?',
                    answers: ['Paris'],
                  },
                  {
                    question: 'What is the largest planet in our solar system?',
                    answers: ['Jupiter'],
                  },
                ],
              }),
            },
          },
        ],
      };

      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockFlashcardsResponse,
      );

      await expect(service.generateFlashcards('Test prompt')).rejects.toThrow(
        'Failed to generate flashcards from OpenAI response',
      );
    });
    it('should handle empty flashcards content', async () => {
      const mockFlashcardsResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      };
      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockFlashcardsResponse,
      );
      await expect(service.generateFlashcards('Test prompt')).rejects.toThrow(
        'Failed to generate content: No content received from OpenAI',
      );
    });
    it('should handle special characters in flashcards content', async () => {
      const mockFlashcardsResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [
                  {
                    question: 'What is the capital of France?',
                    answer: 'Paris & Co.',
                  },
                  {
                    question: 'What is the largest planet in our solar system?',
                    answer: 'Jupiter!',
                  },
                ],
              }),
            },
          },
        ],
      };

      (service as any).openai.chat.completions.create.mockResolvedValue(
        mockFlashcardsResponse,
      );

      const result = await service.generateFlashcards('Test prompt');
      expect(result).toEqual(
        JSON.parse(mockFlashcardsResponse.choices[0].message.content),
      );
    });
    it('should correctly handle flashcards with minimum and maximum card limits', async () => {
      const generateContentSpy = jest.spyOn(service, 'generateContent');

      const mockFlashcardsResponse = {
        flashcards: [
          {
            question: 'What is the capital of France?',
            answer: 'Paris',
          },
        ],
      };

      generateContentSpy.mockResolvedValue(
        JSON.stringify(mockFlashcardsResponse),
      );

      await service.generateFlashcards('Test prompt');

      expect(generateContentSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Your task is to carefully read the input text and return a JSON object with exactly 2 flashcards in the following structure:',
        ),
      );

      generateContentSpy.mockRestore();
    });
  });
});
