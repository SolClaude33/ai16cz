export type EmotionType = 'celebrating' | 'thinking' | 'talking' | 'angry' | 'idle';

interface EmotionKeywords {
  celebrating: string[];
  thinking: string[];
  angry: string[];
}

const emotionKeywords: EmotionKeywords = {
  celebrating: [
    'congratulations', 'great job', 'well done', 'excellent', 'amazing', 'fantastic',
    'wonderful', 'awesome', 'perfect', 'brilliant', 'impressive', 'outstanding',
    'success', 'achievement', 'celebrate', 'hooray', 'yay', 'bravo', 'superb',
    '🎉', '🎊', '✨', '🌟', '⭐', '🏆', '👏', 'good job', 'nice work', 'proud'
  ],
  thinking: [
    'let me explain', 'think about', 'consider this', 'ponder', 'analyze',
    'understand', 'concept', 'theory', 'principle', 'reason', 'because',
    'therefore', 'complex', 'intricate', 'detailed', 'specifically',
    'let\'s explore', 'imagine', 'suppose', 'hypothesis', 'question'
  ],
  angry: [
    'careful', 'watch out', 'warning', 'danger', 'oops', 'mistake', 'error',
    'incorrect', 'wrong', 'avoid', 'don\'t', 'shouldn\'t', 'risky', 'concern',
    'worried', 'caution', 'alert', 'attention', 'important', 'critical',
    'serious', 'issue', 'problem', '⚠️', '❗', '❌'
  ]
};

export function analyzeEmotion(text: string): EmotionType {
  const lowerText = text.toLowerCase();
  
  const scores = {
    celebrating: 0,
    thinking: 0,
    angry: 0
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[emotion as keyof typeof scores] += 1;
      }
    }
  }

  const maxEmotion = Object.entries(scores).reduce((max, [emotion, score]) => {
    return score > max.score ? { emotion, score } : max;
  }, { emotion: 'talking', score: 0 });

  if (maxEmotion.score === 0) {
    return 'talking';
  }

  if (maxEmotion.score >= 2) {
    return maxEmotion.emotion as EmotionType;
  }

  return 'talking';
}
