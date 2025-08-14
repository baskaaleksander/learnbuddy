import React from "react";

function DescriptionSection({
  title,
  secondaryTitle,
  description,
  className,
}: {
  title: string;
  secondaryTitle: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`pt-24 px-[10%] flex flex-col items-center text-center ${className}`}
    >
      <h2 className="text-primary text-lg font-semibold">{title}</h2>
      <h3 className="text-3xl font-semibold mt-4">{secondaryTitle}</h3>
      <p className="mt-4 md:mt-6 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-3xl text-center">
        {description}
      </p>
    </div>
  );
}

export default DescriptionSection;
