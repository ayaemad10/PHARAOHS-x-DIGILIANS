/** Starter questions. Each one is answerable from the loaded records. No answers are stored here. */
export const suggestedQuestions = [
  "What happened in SAFFIRE-III Sample 2?",
  "Which SAFFIRE-III sensor responded first?",
  "What did the FLEX tests show at low oxygen?",
  "What is known about lunar-gravity burning?",
  "Which records report spread rate?",
  "What are the research gaps?",
];

/** Empty on purpose: a conversation starts with no answer until the reader asks something. */
export const defaultConversation = {
  id: "conv-start",
  title: "New question",
  messages: [],
};
