
'use server';
/**
 * @fileOverview A ticket summarization AI flow.
 *
 * - summarizeTicket - A function that handles the ticket summarization process.
 * - SummarizeTicketInput - The input type for the summarizeTicket function.
 * - SummarizeTicketOutput - The return type for the summarizeTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTicketInputSchema = z.object({
  description: z.string().describe('The description of the ticket.'),
});
export type SummarizeTicketInput = z.infer<typeof SummarizeTicketInputSchema>;

const SummarizeTicketOutputSchema = z.object({
  summary: z.string().describe("A one-sentence summary of the ticket's issue."),
});
export type SummarizeTicketOutput = z.infer<typeof SummarizeTicketOutputSchema>;

export async function summarizeTicket(input: SummarizeTicketInput): Promise<SummarizeTicketOutput> {
  return summarizeTicketFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTicketPrompt',
  input: {schema: SummarizeTicketInputSchema},
  output: {schema: SummarizeTicketOutputSchema},
  prompt: `Summarize the following support ticket description into a single, concise sentence that captures the main issue.

Description: {{{description}}}`,
});

const summarizeTicketFlow = ai.defineFlow(
  {
    name: 'summarizeTicketFlow',
    inputSchema: SummarizeTicketInputSchema,
    outputSchema: SummarizeTicketOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
