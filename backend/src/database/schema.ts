import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { generateBase58Uuid } from 'src/utils/generateEmailCode';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const materialStatusEnum = pgEnum('material_status', [
  'pending',
  'processed',
  'failed',
]);
export const aiOutputTypeEnum = pgEnum('ai_output_type', [
  'summary',
  'flashcards',
  'quiz',
]);
export const flashcardStatusEnum = pgEnum('flashcard_status', [
  'known',
  'review',
]);
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',
  'tier1',
  'tier2',
  'unlimited',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
]);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  email: varchar('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token')
    .unique()
    .$defaultFn(() => generateBase58Uuid()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  stripeCustomerId: text('stripe_customer_id'),
});

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token')
    .unique()
    .$defaultFn(() => generateBase58Uuid()),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').default(''),
  description: text('description'),
  content: text('content').notNull(),
  status: materialStatusEnum('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiOutputs = pgTable('ai_outputs', {
  id: uuid('id').primaryKey().defaultRandom(),
  materialId: uuid('material_id')
    .notNull()
    .references(() => materials.id),
  type: aiOutputTypeEnum('type').notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  errorMessage: text('error_message'),
});

export const quizResults = pgTable('quiz_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  materialId: uuid('material_id')
    .notNull()
    .references(() => materials.id),
  aiOutputId: uuid('ai_output_id')
    .notNull()
    .references(() => aiOutputs.id),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  answers: jsonb('answers').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

export const quizPartials = pgTable('quiz_partials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  quizId: uuid('quiz_id').notNull(),
  currentQuestionIndex: integer('current_question_index').notNull(),
  answers: jsonb('answers').notNull(),
  lastUpdated: timestamp('last_updated').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flashcards = pgTable('flashcards', {
  id: uuid('id').primaryKey().defaultRandom(),
  aiOutputId: uuid('ai_output_id')
    .notNull()
    .references(() => aiOutputs.id),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flashcardProgress = pgTable('flashcard_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  flashcardId: uuid('flashcard_id')
    .notNull()
    .references(() => flashcards.id),
  status: flashcardStatusEnum('status').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  plan: subscriptionPlanEnum('plan').notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  materials: many(materials),
  quizResults: many(quizResults),
  flashcardProgress: many(flashcardProgress),
  subscriptions: many(subscriptions),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  user: one(users, {
    fields: [materials.userId],
    references: [users.id],
  }),
  aiOutputs: many(aiOutputs),
  quizResults: many(quizResults),
}));

export const aiOutputsRelations = relations(aiOutputs, ({ one }) => ({
  material: one(materials, {
    fields: [aiOutputs.materialId],
    references: [materials.id],
  }),
}));

export const quizResultsRelations = relations(quizResults, ({ one }) => ({
  user: one(users, {
    fields: [quizResults.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [quizResults.materialId],
    references: [materials.id],
  }),
  aiOutputs: one(aiOutputs, {
    fields: [quizResults.aiOutputId],
    references: [aiOutputs.id],
  }),
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  aiOutput: one(aiOutputs, {
    fields: [flashcards.aiOutputId],
    references: [aiOutputs.id],
  }),
  flashcardProgress: many(flashcardProgress),
}));

export const flashcardProgressRelations = relations(
  flashcardProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [flashcardProgress.userId],
      references: [users.id],
    }),
    flashcard: one(flashcards, {
      fields: [flashcardProgress.flashcardId],
      references: [flashcards.id],
    }),
  }),
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));
