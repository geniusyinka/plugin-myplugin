import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback
} from "@elizaos/core";

export const diceRollAction: Action = {
    name: "ROLL_DICE",
    similes: ['DICE', 'RANDOM_NUMBER'],
    description: "Rolls a virtual dice with awareness of past rolls.",
  
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        return text.includes('roll') && (text.includes('dice') || text.includes('die'));
    },
  
    handler: async (
        runtime: IAgentRuntime,
        memory: Memory,
        state: State,
        _options: any, 
        callback: HandlerCallback
    ) => {
        // Generate a random number between 1 and 6 (standard dice)
        const randomNumber = Math.floor(Math.random() * 6) + 1;
      
        // Try to get roll count
        let rollCount = 1;
        try {
            const cached = await runtime.cacheManager.get(`${memory.roomId}-roll-count`);
            if (cached && typeof cached === 'string') {
                rollCount = parseInt(cached, 10);
            }
            // Increment the roll count
            rollCount++;
            // Save the new count back to cache
            await runtime.cacheManager.set(`${memory.roomId}-roll-count`, rollCount.toString());
            console.log(`Current roll count for room ${memory.roomId}: ${rollCount}`);
        } catch (error) {
            console.error('Error retrieving roll count:', error);
        }
      
        // Basic response
        let response = `🎲 I rolled a dice for you and got: ${randomNumber}`;
      
        // If this isn't the first roll, add context
        if (rollCount > 1) {
            response += `\nThat's roll #${rollCount} for our conversation!`;

            // Look for evaluator-generated statistics
            try {
                const recentMemories = await runtime.knowledgeManager.getMemories({
                    roomId: memory.roomId,
                    count: 10
                });

                const now = Date.now();
                const statMemory = recentMemories.find(mem => 
                    (mem.content?.metadata as any)?.type === 'dice_statistics' &&
                    mem.content?.text?.startsWith('In this conversation, the dice has been rolled') &&
                    (mem.content?.metadata as any)?.expiresAt > now
                );

                if (statMemory?.content?.metadata) {
                    const stats = statMemory.content.metadata as {
                        type: string;
                        rollCount: number;
                        average: number;
                        highest: number;
                        lowest: number;
                        rolls: number[];
                        expiresAt: number;
                    };
            
                    // Add observations from evaluator's analysis
                    if (randomNumber > stats.average) {
                        response += `\nNice! That's above your average roll of ${stats.average.toFixed(1)}!`;
                    }
                    if (randomNumber === stats.highest) {
                        response += "\nYou're matching your highest roll!";
                    }
                    if (randomNumber > stats.highest) {
                        response += "\n🎉 That's your highest roll yet!";
                    }
                    if (randomNumber === 6) {
                        response += "\n🎯 Perfect roll!";
                    }
                    if (stats.rollCount >= 5) {
                        response += `\nFun fact: In this conversation, your rolls have averaged ${stats.average.toFixed(1)}!`;
                    }
                }
            } catch (error) {
                console.error('Error retrieving dice statistics:', error);
            }
        }
      
        // Store the message in the message manager
        await runtime.messageManager.createMemory({
            content: {
                text: response,
                thought: `User asked to roll a dice. Generated random number: ${randomNumber}.`
            },
            agentId: runtime.agentId,
            roomId: memory.roomId,
            userId: memory.userId,
            createdAt: Date.now()
        });

        if (callback) {
            await callback({
                thought: `User asked to roll a dice. Generated random number: ${randomNumber}.`,
                text: response
            });
        }
      
        return true;
    },
  
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Roll a dice for me",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "🎲 I rolled a dice for you and got: 4",
                    thought: "User asked to roll a dice. Generated random number: 4.",
                    action: "ROLL_DICE",
                },
            },
        ]
    ],
};
