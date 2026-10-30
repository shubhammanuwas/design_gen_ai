const dailyPrompts = [
  "What Columbia campus moment deserves its own sitcom episode?",
  "Show us a Columbia study break with main-character energy.",
  "What Columbia detail looks like it knows your deadline is tomorrow?",
  "Capture a Columbia moment that would make a very tiny campus comedy.",
  "What on campus is working harder than your group project?",
  "Show us a Columbia scene that says, “I came for one thing and got distracted.”",
  "What Columbia campus moment needs a laugh track?",
];

export function getDailyPrompt() {
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  const promptIndex = ((dayNumber % dailyPrompts.length) + dailyPrompts.length) % dailyPrompts.length;
  return dailyPrompts[promptIndex];
}