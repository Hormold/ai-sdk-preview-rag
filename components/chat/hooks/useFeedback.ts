import { useState } from "react";
import { toast } from "sonner";
import type { Message } from "../types";

export function useFeedback(allMessages: Message[]) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          messages: allMessages,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });

      if (response.ok) {
        setFeedbackGiven(true);
        toast.success('Thanks for your feedback!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error('Failed to submit feedback');
    }
  };

  return { feedbackGiven, handleFeedback };
}
