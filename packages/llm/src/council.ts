import { KimiK2Client, KimiMessage, KimiTool } from './kimi-client';

// =========================
// COUNCIL MULTI-AGENT SYSTEM
// =========================

export interface CouncilRole {
  name: string;
  kind: 'researcher' | 'analyst' | 'editor' | 'critic' | 'custom';
  systemPrompt: string;
}

export interface CouncilStrategy {
  type: 'deliberate' | 'consensus' | 'critic';
  rounds?: number;
}

export interface CouncilContext {
  query: string;
  retrievedContext: string;
  orgName: string;
}

export interface CouncilNote {
  role: string;
  notes: string;
  citations: Array<{ docId: string; chunkIx: number }>;
  tokensUsed: number;
}

export interface CouncilResult {
  final: string;
  panel: CouncilNote[];
  allCitations: Array<{ docId: string; chunkIx: number }>;
  totalTokensIn: number;
  totalTokensOut: number;
  strategy: string;
}

export class Council {
  constructor(private client: KimiK2Client) {}

  /**
   * Run multi-agent council deliberation
   */
  async run(
    context: CouncilContext,
    roles: CouncilRole[],
    strategy: CouncilStrategy,
    tools?: KimiTool[]
  ): Promise<CouncilResult> {
    switch (strategy.type) {
      case 'deliberate':
        return this.runDeliberate(context, roles, strategy.rounds || 2, tools);
      case 'consensus':
        return this.runConsensus(context, roles, tools);
      case 'critic':
        return this.runCritic(context, roles, tools);
      default:
        return this.runConsensus(context, roles, tools);
    }
  }

  /**
   * Deliberate strategy: Multiple rounds where agents see each other's notes
   */
  private async runDeliberate(
    context: CouncilContext,
    roles: CouncilRole[],
    rounds: number,
    tools?: KimiTool[]
  ): Promise<CouncilResult> {
    const panel: CouncilNote[] = [];
    let totalTokensIn = 0;
    let totalTokensOut = 0;

    // Run multiple rounds
    for (let round = 0; round < rounds; round++) {
      const roundNotes: CouncilNote[] = [];

      for (const role of roles) {
        const messages: KimiMessage[] = [
          {
            role: 'system',
            content: this.buildRolePrompt(role, context, round, panel),
          },
          {
            role: 'user',
            content: context.query,
          },
        ];

        const response = await this.client.chat(messages, { tools });
        const content = response.choices[0]?.message?.content || '';
        const citations = this.client.parseCitations(content);

        roundNotes.push({
          role: role.name,
          notes: content,
          citations,
          tokensUsed: response.usage.total_tokens,
        });

        totalTokensIn += response.usage.prompt_tokens;
        totalTokensOut += response.usage.completion_tokens;
      }

      panel.push(...roundNotes);
    }

    // Final synthesis
    const final = await this.synthesize(context, panel, tools);
    totalTokensIn += final.tokensIn;
    totalTokensOut += final.tokensOut;

    return {
      final: final.content,
      panel,
      allCitations: this.collectAllCitations(panel),
      totalTokensIn,
      totalTokensOut,
      strategy: 'deliberate',
    };
  }

  /**
   * Consensus strategy: All agents work in parallel, then synthesize
   */
  private async runConsensus(
    context: CouncilContext,
    roles: CouncilRole[],
    tools?: KimiTool[]
  ): Promise<CouncilResult> {
    const panel: CouncilNote[] = [];
    let totalTokensIn = 0;
    let totalTokensOut = 0;

    // Run all roles in parallel
    const rolePromises = roles.map(async (role) => {
      const messages: KimiMessage[] = [
        {
          role: 'system',
          content: this.buildRolePrompt(role, context, 0, []),
        },
        {
          role: 'user',
          content: context.query,
        },
      ];

      const response = await this.client.chat(messages, { tools });
      const content = response.choices[0]?.message?.content || '';
      const citations = this.client.parseCitations(content);

      return {
        role: role.name,
        notes: content,
        citations,
        tokensUsed: response.usage.total_tokens,
        usage: response.usage,
      };
    });

    const results = await Promise.all(rolePromises);
    
    for (const result of results) {
      panel.push({
        role: result.role,
        notes: result.notes,
        citations: result.citations,
        tokensUsed: result.tokensUsed,
      });
      totalTokensIn += result.usage.prompt_tokens;
      totalTokensOut += result.usage.completion_tokens;
    }

    // Synthesize all notes
    const final = await this.synthesize(context, panel, tools);
    totalTokensIn += final.tokensIn;
    totalTokensOut += final.tokensOut;

    return {
      final: final.content,
      panel,
      allCitations: this.collectAllCitations(panel),
      totalTokensIn,
      totalTokensOut,
      strategy: 'consensus',
    };
  }

  /**
   * Critic strategy: Run consensus, then add critic review
   */
  private async runCritic(
    context: CouncilContext,
    roles: CouncilRole[],
    tools?: KimiTool[]
  ): Promise<CouncilResult> {
    // First run consensus
    const consensusResult = await this.runConsensus(context, roles, tools);

    // Add critic role
    const criticRole: CouncilRole = {
      name: 'Critic',
      kind: 'critic',
      systemPrompt: KimiK2Client.buildCouncilRolePrompt('critic', context.orgName, context.retrievedContext),
    };

    const criticMessages: KimiMessage[] = [
      {
        role: 'system',
        content: `${criticRole.systemPrompt}

PANEL NOTES TO REVIEW:
${consensusResult.panel.map(p => `${p.role}:\n${p.notes}`).join('\n\n')}

PROPOSED FINAL ANSWER:
${consensusResult.final}`,
      },
      {
        role: 'user',
        content: 'Review the panel notes and proposed answer. Identify any issues, gaps, or improvements needed.',
      },
    ];

    const criticResponse = await this.client.chat(criticMessages, { tools });
    const criticContent = criticResponse.choices[0]?.message?.content || '';
    const criticCitations = this.client.parseCitations(criticContent);

    consensusResult.panel.push({
      role: 'Critic',
      notes: criticContent,
      citations: criticCitations,
      tokensUsed: criticResponse.usage.total_tokens,
    });

    consensusResult.totalTokensIn += criticResponse.usage.prompt_tokens;
    consensusResult.totalTokensOut += criticResponse.usage.completion_tokens;
    consensusResult.strategy = 'critic';
    consensusResult.allCitations = this.collectAllCitations(consensusResult.panel);

    return consensusResult;
  }

  /**
   * Build role-specific prompt with context and previous notes
   */
  private buildRolePrompt(
    role: CouncilRole,
    context: CouncilContext,
    round: number,
    previousNotes: CouncilNote[]
  ): string {
    let prompt = KimiK2Client.buildCouncilRolePrompt(
      role.kind,
      context.orgName,
      context.retrievedContext
    );

    if (round > 0 && previousNotes.length > 0) {
      prompt += `\n\nPREVIOUS ROUND NOTES:\n`;
      for (const note of previousNotes) {
        prompt += `\n${note.role}:\n${note.notes}\n`;
      }
      prompt += `\nConsider these notes in your analysis for Round ${round + 1}.`;
    }

    return prompt;
  }

  /**
   * Synthesize all panel notes into final answer
   */
  private async synthesize(
    context: CouncilContext,
    panel: CouncilNote[],
    tools?: KimiTool[]
  ): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
    const panelSummary = panel
      .map(p => `${p.role}:\n${p.notes}`)
      .join('\n\n---\n\n');

    const messages: KimiMessage[] = [
      {
        role: 'system',
        content: `You are the Editor for ${context.orgName}. Synthesize the panel's notes into a clear, comprehensive final answer.

PANEL NOTES:
${panelSummary}

Your task:
1. Combine insights from all panel members
2. Resolve any contradictions
3. Ensure all claims have citations [CIT:doc_id:chunk_ix]
4. Produce a polished, coherent final answer
5. Be concise but complete`,
      },
      {
        role: 'user',
        content: `Synthesize the panel's analysis for: ${context.query}`,
      },
    ];

    const response = await this.client.chat(messages, { tools });
    
    return {
      content: response.choices[0]?.message?.content || '',
      tokensIn: response.usage.prompt_tokens,
      tokensOut: response.usage.completion_tokens,
    };
  }

  /**
   * Collect all unique citations from panel
   */
  private collectAllCitations(panel: CouncilNote[]): Array<{ docId: string; chunkIx: number }> {
    const citationMap = new Map<string, { docId: string; chunkIx: number }>();

    for (const note of panel) {
      for (const citation of note.citations) {
        const key = `${citation.docId}:${citation.chunkIx}`;
        if (!citationMap.has(key)) {
          citationMap.set(key, citation);
        }
      }
    }

    return Array.from(citationMap.values());
  }

  /**
   * Create default council roles
   */
  static createDefaultRoles(orgName: string): CouncilRole[] {
    return [
      {
        name: 'Researcher',
        kind: 'researcher',
        systemPrompt: KimiK2Client.buildCouncilRolePrompt('researcher', orgName),
      },
      {
        name: 'Analyst',
        kind: 'analyst',
        systemPrompt: KimiK2Client.buildCouncilRolePrompt('analyst', orgName),
      },
      {
        name: 'Editor',
        kind: 'editor',
        systemPrompt: KimiK2Client.buildCouncilRolePrompt('editor', orgName),
      },
    ];
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createCouncil(client: KimiK2Client): Council {
  return new Council(client);
}