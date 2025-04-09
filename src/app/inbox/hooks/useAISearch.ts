import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { searchSimilarEmails } from '@/app/ai/actions/searchSimilarEmails';
import type { Email, InboxResponse } from '../types';

type SimilarEmailResult = {
  id: string;
  score: number;
  metadata?: {
    subject?: string;
    userId?: string;
  };
}

export function useAISearch() {
  const [similarEmails, setSimilarEmails] = useState<Email[]>([]);
  const [isAISearchActive, setIsAISearchActive] = useState(false);

  // Set up a mutation for handling the AI search
  const aiSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      // First get the semantic search results
      const results = await searchSimilarEmails(query);
      
      if (!results || !Array.isArray(results)) {
        throw new Error((results as any)?.error || 'Failed to perform AI search');
      }
      
      // Extract the IDs of similar emails
      const emailIds = results.map(result => result.id);
      
      if (emailIds.length === 0) {
        return { semanticResults: results, fullEmails: [] };
      }
      
      // Fetch the full email details for each matching ID
      const emailDetailsPromises = emailIds.map(async (id) => {
        // Fetch single email details from the API
        try {
          const response = await fetch(`/api/emails/${id}`);
          if (!response.ok) {
            console.warn(`Could not fetch details for email ${id}`);
            return null;
          }
          const emailData = await response.json();
          return emailData;
        } catch (error) {
          console.error(`Error fetching email ${id}:`, error);
          return null;
        }
      });
      
      // Wait for all email details to be fetched
      const emailDetails = await Promise.all(emailDetailsPromises);
      
      // Filter out any null results and combine with the semantic scores
      const fullEmails = emailDetails
        .filter(Boolean)
        .map((email) => {
          const matchingResult = results.find(r => r.id === email.id);
          const emailWithScore = {
            ...email,
            labels: [...(email.labels || []), 'AI_SEARCH'], // Add AI_SEARCH label
          };
          
          // Add the AI score as a custom property
          if (matchingResult) {
            (emailWithScore as any).aiScore = matchingResult.score;
          }
          
          return emailWithScore;
        });
      
      return { semanticResults: results, fullEmails };
    },
    onSuccess: (data) => {
      if (data.fullEmails.length === 0) {
        // No full email details could be fetched, use the semantic results
        const fallbackEmails: Email[] = data.semanticResults.map(result => {
          // Ensure we have a proper Email object with all required fields
          const email: Email = {
            id: String(result.id),
            threadId: String(result.id),
            subject: typeof result.metadata?.subject === 'string' ? result.metadata.subject : 'No Subject',
            from: 'AI Search Result',
            snippet: `Score: ${result.score.toFixed(4)}`,
            isRead: true,
            labels: ['AI_SEARCH'],
            createdAt: new Date(),
          };
          
          // Store the score in the emails map for display
          (email as any).aiScore = result.score;
          return email;
        });
        
        setSimilarEmails(fallbackEmails);
      } else {
        // Use the full email details
        setSimilarEmails(data.fullEmails);
      }
      
      setIsAISearchActive(true);
    },
    onError: (error) => {
      console.error('AI search error:', error);
      setSimilarEmails([]);
      setIsAISearchActive(false);
    }
  });
  
  // Function to perform the AI search
  const performAISearch = (query: string) => {
    if (!query.trim()) return;
    aiSearchMutation.mutate(query);
  };
  
  // Function to clear AI search results
  const clearAISearch = () => {
    setSimilarEmails([]);
    setIsAISearchActive(false);
  };
  
  return {
    similarEmails,
    isAISearchActive,
    isAISearchLoading: aiSearchMutation.isPending,
    aiSearchError: aiSearchMutation.error,
    performAISearch,
    clearAISearch,
  };
} 