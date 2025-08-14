import React from "react";
import UsingStepCard from "./using-step-card";
import DescriptionSection from "./description-section";

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
      <DescriptionSection
        title="How it works?"
        secondaryTitle="Unlock your potential with a seamless and intuitive learning journey."
        description="LearnBuddy guides you step-by-step: set your learning goals, access curated resources, and track your progress—all in one place. Whether you're mastering new skills or revising old ones, our platform adapts to your needs, making learning efficient and enjoyable."
      />
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
