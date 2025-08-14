import React from "react";
import AccordionComp from "./accordion-comp";
import DescriptionSection from "./description-section";

function FaqPricing() {
  const questions = [
    {
      question: "Is this platform suitable for beginners?",
      answer:
        "Absolutely! Our platform is designed to cater to learners of all levels, including beginners. We provide resources and support to help you get started on your learning journey.",
    },
    {
      question: "Can I use this platform for self-study?",
      answer:
        "Yes, our platform is perfect for self-study. You can access a wide range of materials and resources to help you learn at your own pace.",
    },
    {
      question: "Are there any prerequisites to use this platform?",
      answer:
        "No prerequisites are required. Our platform is designed to be user-friendly and accessible to everyone.",
    },
    {
      question: "Is there a free plan available?",
      answer:
        "Yes, we offer a free plan for new users to explore the platform and its features before committing to a subscription.",
    },
  ];
  return (
    <div
      id="faq"
      className="py-24 px-[10%] flex flex-col items-center text-center"
    >
      <DescriptionSection
        title="FAQ"
        secondaryTitle="Frequently Asked Questions"
        description="Find answers to the most common questions about our platform, features, and how to get started."
      />
      <AccordionComp questions={questions} />
    </div>
  );
}

export default FaqPricing;
