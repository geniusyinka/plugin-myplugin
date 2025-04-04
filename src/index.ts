import { Plugin } from "@elizaos/core";
import { diceRollAction } from "./actions/firstAction";

export const myNewPlugin: Plugin = {
    name: "my-plugin",
    description: "A plugin that does something",
    actions: [
        diceRollAction
    ],      
    evaluators: [
        // Add your evaluators here
    ],
    providers: [
        // Add your providers here
    ]
};