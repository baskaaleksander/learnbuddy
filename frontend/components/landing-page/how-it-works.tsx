import React from "react";
import UsingStepCard from "./using-step-card";

function HowItWorks() {
  const steps = [
    {
      title: "Upload your materials",
      description:
        "Easily upload your study materials, including notes, textbooks, and articles.",
    },
    {
      title: "Wait for AI to generate materials",
      description:
        "Our AI will analyze your materials and create personalized study resources.",
    },
    {
      title: "Study and track your progress",
      description:
        "Use the generated flashcards, summaries and many more to study effectively and monitor your progress over time.",
    },
  ];
  return (
    <div className="pt-24 px-[10%] flex flex-col items-center text-center">
      <h3 className="text-primary text-lg font-semibold">How it works?</h3>
      <h3 className="text-3xl font-semibold mt-4">
        Unlock your potential with a seamless and intuitive learning journey.
      </h3>
      <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-3xl text-center">
        LearnBuddy guides you step-by-step: set your learning goals, access
        curated resources, and track your progress—all in one place. Whether
        you're mastering new skills or revising old ones, our platform adapts to
        your needs, making learning efficient and enjoyable.
      </p>
      <div className="pt-24">
        {steps.map((step, index) => (
          <UsingStepCard
            key={index}
            title={step.title}
            description={step.description}
            number={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

export default HowItWorks;
