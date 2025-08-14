import React from "react";
import FeatureCard from "./feature-card";
import { CircleUser, PersonStanding, School } from "lucide-react";
import DescriptionSection from "./description-section";

function ForWho() {
  const forWho = [
    {
      title: "Schools",
      description:
        "Empower students with AI-generated materials for enhanced learning and engagement.",
      icon: <School />,
    },
    {
      title: "Students",
      description:
        "Maximize your study efficiency with personalized materials tailored to your learning style.",
      icon: <PersonStanding />,
    },
    {
      title: "Individuals",
      description:
        "Unlock your potential with AI-driven resources that adapt to your unique learning needs.",
      icon: <CircleUser />,
    },
  ];
  return (
    <div
      id="forwho"
      className="pt-24 px-[10%] flex flex-col items-center text-center"
    >
      <DescriptionSection
        title="For who?"
        secondaryTitle="Effortless learning for everyone"
        description="No matter your background, our platform adapts to your needs and helps you achieve your learning goals with ease."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full pt-12 md:pt-16 gap-y-10">
        {forWho.map((feature, index) => (
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
export default ForWho;
