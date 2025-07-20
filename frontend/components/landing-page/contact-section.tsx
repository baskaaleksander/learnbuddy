import React from "react";
import ContactForm from "./contact-form";

function ContactSection() {
  return (
    <div className="pt-24 px-[10%] flex flex-col gap-8 text-center">
      <div>
        <h2 className="text-primary text-lg font-semibold">Contact Us</h2>
        <h3 className="text-3xl font-semibold mt-4">
          We&apos;d love to hear from you!
        </h3>
        <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-3xl ">
          Have questions or feedback? Reach out to us anytime. We&apos;re here
          to help you on your learning journey.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}

export default ContactSection;
