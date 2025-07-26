export const createMockQuiz = () => {
  return {
    id: 'quiz-1',
    materialId: 'material-1',
    type: 'quiz',
    content: [
      {
        answers: [
          'Zaliczenie przedmiotu z historii literatury',
          'Wykazanie umiejętności zdobytych podczas studiów',
          'Przygotowanie się do egzaminu maturalnego',
        ],
        question:
          'Jakie są główne cele napisania pracy dyplomowej według tekstu?',
        correct_answer: 'Wykazanie umiejętności zdobytych podczas studiów',
      },
      {
        answers: [
          'Ponieważ uczelnia tego wymaga',
          'Aby szybciej ją ukończyć',
          'Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami',
        ],
        question: 'Dlaczego warto nadać pracy dyplomowej osobisty sens?',
        correct_answer:
          'Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami',
      },
    ],
    createdAt: new Date(),
    errorMessage: null,
  };
};

export const createMockQuizWithoutCorrectAnswers = () => {
  return {
    id: 'quiz-1',
    materialId: 'material-1',
    type: 'quiz',
    content: [
      {
        answers: [
          'Zaliczenie przedmiotu z historii literatury',
          'Wykazanie umiejętności zdobytych podczas studiów',
          'Przygotowanie się do egzaminu maturalnego',
        ],
        question:
          'Jakie są główne cele napisania pracy dyplomowej według tekstu?',
      },
      {
        answers: [
          'Ponieważ uczelnia tego wymaga',
          'Aby szybciej ją ukończyć',
          'Ponieważ może to uczynić ją przygodą z wartościowymi wnioskami',
        ],
        question: 'Dlaczego warto nadać pracy dyplomowej osobisty sens?',
      },
    ],
    createdAt: new Date(),
    errorMessage: undefined,
  };
};
export const createQuizPartial = () => {
  return {
    id: 'quiz-partial-1',
    userId: 'user-1',
    quizId: 'quiz-1',
    currentQuestionIndex: '1',
    answers: [
      {
        answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        question: 1,
        isCorrect: true,
      },
    ],
    lastUpdated: new Date(),
    createdAt: new Date(),
  };
};

export const createQuizResult = () => {
  return {
    id: 'quiz-result-1',
    userId: 'user-1',
    aiOutputId: 'quiz-1',
    score: 1,
    totalQuestions: 2,
    answers: [
      {
        answer: 'Wykazanie umiejętności zdobytych podczas studiów',
        question: 1,
        isCorrect: true,
      },
      {
        answer: 'Aby szybciej ją ukończyć',
        question: 2,
        isCorrect: false,
      },
    ],
    materialId: 'material-1',
    completedAt: new Date(),
  };
};
export const createMockMaterial = () => {
  return {
    id: 'material-1',
    userId: 'user-1',
    title: 'Test Material',
    description: 'This is a test material',
    status: 'processed',
    content: 'test-file.pdf',
    createdAt: new Date(),
  };
};

export const createMockAIOutput = () => {
  return {
    id: 'quiz-1',
    materialId: 'material-1',
    type: 'quiz',
    content: createMockQuiz().content,
    createdAt: new Date(),
    errorMessage: undefined,
  };
};

export const createMockQuizLatestResult = () => {
  return {
    score: 8,
    completedAt: new Date(),
  };
};

export const createMockQuizOutputType = () => {
  return {
    ...createMockAIOutput(),
    averageScore: 7.5,
    totalAttempts: 3,
    averagePercentage: 75.0,
    bestScore: 9,
    latestResult: createMockQuizLatestResult(),
    material: createMockMaterial(),
  };
};

export const createMockPaginatedQuizResponse = () => {
  return {
    data: [createMockQuizOutputType()],
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  };
};

export const createMockQuestionAndAnswer = () => {
  return {
    question: 1,
    answer: 'Test answer',
  };
};

export const createMockQuizPartialInput = () => {
  return {
    currentQuestionIndex: 1,
    questionsAndAnswers: [createMockQuestionAndAnswer()],
  };
};

export const createMockQuizWithPartialOutputType = () => {
  return {
    ...createMockAIOutput(),
    partialData: {
      currentQuestionIndex: 1,
      questionsAndAnswers: [
        {
          question: 1,
          answer: 'Test answer',
          isCorrect: true,
        },
      ],
    },
    material: createMockMaterial(),
  };
};

export const createMockUser = () => {
  return {
    id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    role: 'user',
    tokensUsed: 0,
    emailVerificationToken: 'verification-token',
  };
};

export const createMockJob = () => {
  return {
    id: 'job-1',
    data: {
      userId: 'user-1',
      quizId: 'quiz-1',
      quizPartialData: createMockQuizPartialInput(),
    },
  };
};

export const createMockSummary = () => {
  return {
    id: 'summary-1',
    materialId: 'material-1',
    type: 'summary',
    content: {
      title: 'Test Summary',
      chapters: [
        {
          name: 'Chapter 1',
          bullet_points: ['Point 1', 'Point 2'],
          isKnown: false,
          isImportant: true,
        },
      ],
    },
    createdAt: new Date(),
    errorMessage: null,
  };
};

export const createMockFlaschardsAiOutput = () => {
  return {
    id: 'flashcards-1',
    materialId: 'material-1',
    type: 'flashcards',
    content: {
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
    },
    createdAt: new Date(),
    errorMessage: null,
  };
};
export const createMockFlashcard = () => {
  return {
    id: 'flashcard-1',
    aiOutputId: 'flashcards-1',
    question: 'What is the capital of France?',
    answer: 'Paris',
    createdAt: new Date(),
  };
};
export const createMockFlashcardProgress = (status: 'known' | 'review') => {
  return {
    id: 'flashcard-progress-1',
    flashcardId: 'flashcard-1',
    userId: 'user-1',
    status: status,
    updatedAt: new Date(),
  };
};

export const createMockSubPlan = () => {
  return {
    id: 'plan_123',
    name: 'Test Plan',
    price: 1000,
    interval: 'monthly',
    price_id: 'price_123',
    tokens_monthly: 120,
    createdAt: '2023-01-01T00:00:00Z',
  };
};
