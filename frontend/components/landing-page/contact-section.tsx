import React from "react";
import ContactForm from "./contact-form";
import DescriptionSection from "./description-section";

function ContactSection() {
  return (
    <div className="pt-24 px-[10%] flex flex-col gap-8 text-center">
      <DescriptionSection
        title="Contact Us"
        secondaryTitle="We'd love to hear from you!"
        description="Have questions or feedback? Reach out to us anytime. We're here to help you on your learning journey."
      />
      <ContactForm />
    </div>
  );
}

export default ContactSection;
