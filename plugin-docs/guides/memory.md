# Memory Guide

The Radkit Tauri plugin includes a built-in vector memory system. This allows you to store text with semantic embeddings, enabling the agent to "remember" and retrieve information relevant to the current conversation.

## Concepts

*   **Embedding**: The plugin automatically handles generating embeddings for the text you save (using the configured LLM or a default model).
*   **Search**: You can query the memory with a natural language string. The system finds entries that are *semantically* similar, not just keyword matches.

## Saving Memory

Use `saveMemory` to store information. You can attach metadata for filtering or context.

```typescript
import { saveMemory } from "tauri-plugin-radkit-api";

const id = await saveMemory({
    text: "The user's favorite color is blue.",
    metadata: {
        category: "user_preference",
        timestamp: Date.now()
    }
});

console.log("Saved memory with ID:", id);
```

## Searching Memory

Use `searchMemory` to retrieve relevant information.

```typescript
import { searchMemory } from "tauri-plugin-radkit-api";

const results = await searchMemory({
    query: "What does the user like?",
    limit: 5,         // Max number of results
    minScore: 0.7     // Minimum similarity score (0.0 to 1.0)
});

results.forEach(entry => {
    console.log(`Found (${entry.score}): ${entry.text}`);
    // Access metadata via entry.metadata
});
```

## Deleting Memory

If information becomes outdated, you can remove it by ID.

```typescript
import { deleteMemory } from "tauri-plugin-radkit-api";

await deleteMemory("some-memory-id");
```
