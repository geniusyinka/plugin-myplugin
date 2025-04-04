import { Plugin } from "@elizaos/core";
import { diceRollAction } from "./actions/firstAction";
import { diceRollEvaluator } from "./evaluators/firstEval";
export const myNewPlugin: Plugin = {
    name: "my-plugin",
    description: "A plugin that does something",
    actions: [
        diceRollAction
    ],      
    evaluators: [
        // Add your evaluators here
        diceRollEvaluator
    ],
    providers: [
        // Add your providers here
    ]
};