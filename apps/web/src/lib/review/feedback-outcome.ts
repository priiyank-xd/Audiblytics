export type ReviewFeedbackOutcome = 'got-it' | 'almost' | 'forgot';

export type ReviewFeedbackButton = 'easy' | 'medium' | 'hard' | 'again';

export function mapFeedbackButtonToOutcome(button: ReviewFeedbackButton): ReviewFeedbackOutcome {
  switch (button) {
    case 'easy':
      return 'got-it';
    case 'medium':
      return 'almost';
    case 'hard':
    case 'again':
      return 'forgot';
  }
}
