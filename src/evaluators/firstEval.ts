import {
    Evaluator,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State
  } from "@elizaos/core";

  export const diceRollEvaluator: Evaluator = {
    name: 'DICE_ROLL_EVALUATOR',
    similes: ['DICE_STATS', 'ROLL_PATTERNS'],
    description: 'Analyzes dice rolling patterns and builds statistical knowledge over time',
    alwaysRun: true, 

    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        console.log('🎲 DICE_ROLL_EVALUATOR checking if analysis needed...');
        
        const lastProcessedId = await runtime.cacheManager.get(`${message.roomId}-dice-last-processed`);
        
        // Get recent messages since last processing
        const messages = await runtime.messageManager.getMemories({
          roomId: message.roomId,
          count: 10
        });
  
        // If we've processed this message already, skip
        if (lastProcessedId && messages[0]?.id === lastProcessedId) {
          return false;
        }
  
        // Run analysis if we have enough new messages containing dice rolls
        const diceRollMessages = messages.filter(msg => 
          msg.content?.text?.includes('🎲 I rolled a dice for you and got:')
        );
  
        const shouldAnalyze = diceRollMessages.length >= 2; // Analyze after every 2 dice rolls
        console.log(`🎲 Found ${diceRollMessages.length} unprocessed dice rolls. Should analyze: ${shouldAnalyze}`);
        
        return shouldAnalyze;
      },

      handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        console.log('🎲 DICE_ROLL_EVALUATOR analyzing dice roll patterns...');
        
        // Get recent messages to analyze
        const messages = await runtime.messageManager.getMemories({
          roomId: message.roomId,
          count: 20 // Look at last 20 messages
        });
  
        // Extract dice rolls
        const diceRolls = messages
          .filter(msg => msg.content?.text?.includes('🎲 I rolled a dice for you and got:'))
          .map(msg => {
            const match = msg.content?.text?.match(/got: (\d+)/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter(num => num !== null) as number[];
  
        if (diceRolls.length === 0) {
          return { result: 'No dice rolls to analyze' };
        }
  
        // Calculate statistics
        const total = diceRolls.reduce((sum, num) => sum + num, 0);
        const average = total / diceRolls.length;
        const highest = Math.max(...diceRolls);
        const lowest = Math.min(...diceRolls);
        
        // Store analysis as a memory
        await runtime.knowledgeManager.createMemory({
          content: {
            text: `In this conversation, the dice has been rolled ${diceRolls.length} times. ` +
                  `Average roll: ${average.toFixed(1)}, Highest: ${highest}, Lowest: ${lowest}. ` +
                  `The numbers rolled were: ${diceRolls.join(', ')}.`,
            metadata: {
              type: 'dice_statistics',
              rollCount: diceRolls.length,
              average: average,
              highest: highest,
              lowest: lowest,
              rolls: diceRolls,
              expiresAt: Date.now() + (30 * 1000) // Stats expire in 30 seconds
            }
          },
          agentId: runtime.agentId,
          roomId: message.roomId,
          createdAt: Date.now(),
          userId: message.userId
        });
  
        // Set a flag indicating evaluator is active
        await runtime.cacheManager.set(`${message.roomId}-evaluator-active`, 'true');
  
        // Store the last processed message ID
        await runtime.cacheManager.set(`${message.roomId}-dice-last-processed`, messages[0]?.id || '');
  
        return {
          result: 'dice roll patterns analyzed',
          statistics: {
            rollCount: diceRolls.length,
            average,
            highest,
            lowest,
            rolls: diceRolls
          }
        };
      },

      examples: [],
    };

    export default {
        name: 'simple-dice-roll-plugin',
        description: 'Adds dice rolling with statistical analysis',
        evaluators: [diceRollEvaluator],
        actions: [],
      };