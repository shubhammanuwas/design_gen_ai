const dailyPrompts = [
  "Show us a Columbia corner you didn’t expect to love.",
  "A tiny campus moment that made your day.",
  "What does your favorite Columbia building feel like?",
  "The best thing you found on your way across campus.",
  "A little Columbia tradition, old or new.",
  "Your Columbia weekend, in one snapshot.",
  "The campus detail most people walk past.",
];

export function getDailyPrompt() {
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  const promptIndex = ((dayNumber % dailyPrompts.length) + dailyPrompts.length) % dailyPrompts.length;
  return dailyPrompts[promptIndex];
}