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
    id: 'user-1',
    email: 'test@example.com',
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
    errorMessage: undefined,
  };
};
