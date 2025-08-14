import React from "react";
import FeatureCard from "./feature-card";
import {
  BookDown,
  MessageCircleQuestion,
  NotebookText,
  Zap,
} from "lucide-react";
import DescriptionSection from "./description-section";

function Features() {
  const features = [
    {
      title: "Instant created materials",
      description:
        "Generate study materials instantly with the power of AI, saving you time and effort.",
      icon: <Zap />,
    },
    {
      title: "Flashcards",
      description:
        "Create and customize flashcards for effective learning and quick revision.",
      icon: <BookDown />,
    },
    {
      title: "Summaries",
      description:
        "Summarize complex topics into concise notes for easier understanding and retention.",
      icon: <NotebookText />,
    },
    {
      title: "Quizzes",
      description:
        "Test your knowledge with quizzes that adapt to your learning pace and style.",
      icon: <MessageCircleQuestion />,
    },
  ];
  return (
    <div
      id="features"
      className="pt-24 px-[10%] flex flex-col items-center text-center"
    >
      <DescriptionSection
        title="Features"
        secondaryTitle="Learning never have been easier"
        description="Discover a suite of powerful features designed to make your learning experience faster, smarter, and more effective."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full pt-12 md:pt-16 gap-y-10">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </div>
  );
}

export default Features;
