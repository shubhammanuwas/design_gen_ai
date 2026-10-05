const dailyPrompts = [
  "Show us the New York you didn’t expect.",
  "A tiny moment that made your day here.",
  "What does your favorite block feel like?",
  "The best thing you found on the way home.",
  "A little Midwest meets Manhattan energy.",
  "Your weekend, in one city snapshot.",
  "The New York detail most people walk past.",
];

export function getDailyPrompt() {
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  const promptIndex = ((dayNumber % dailyPrompts.length) + dailyPrompts.length) % dailyPrompts.length;
  return dailyPrompts[promptIndex];
}