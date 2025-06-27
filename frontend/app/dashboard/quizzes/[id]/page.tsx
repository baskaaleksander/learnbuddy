import React, { use } from "react";

function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  return <div>QuizPage {id}</div>;
}

export default QuizPage;
