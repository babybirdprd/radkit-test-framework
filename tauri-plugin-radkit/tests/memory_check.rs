use tauri_plugin_radkit::{SearchMemoryRequest, SourceType};
use radkit::runtime::memory::{ContentSource, MemoryEntry, SourceType as RadkitSourceType};
use serde_json::json;
use std::collections::HashMap;

#[test]
fn test_memory_serialization_compatibility() {
    // 1. Verify SearchMemoryRequest mapping
    let request = SearchMemoryRequest {
        query: "test".into(),
        limit: Some(5),
        min_score: Some(0.8),
        source_types: Some(vec![SourceType::UserFact, SourceType::Document]),
        metadata_filter: Some(json!({"key": "value"})),
    };

    // Simulate mapping logic from commands.rs
    let source_types = request.source_types.map(|types| {
        types.into_iter().map(|t| match t {
            SourceType::PastConversation => RadkitSourceType::PastConversation,
            SourceType::UserFact => RadkitSourceType::UserFact,
            SourceType::Document => RadkitSourceType::Document,
            SourceType::External => RadkitSourceType::External,
        }).collect::<Vec<_>>()
    });

    assert_eq!(source_types.as_ref().unwrap().len(), 2);
    let types = source_types.unwrap();
    assert!(types.contains(&RadkitSourceType::UserFact));
    assert!(types.contains(&RadkitSourceType::Document));

    let metadata_filter: Option<HashMap<String, serde_json::Value>> = match request.metadata_filter {
        Some(val) => Some(serde_json::from_value(val).unwrap()),
        None => None,
    };

    assert!(metadata_filter.is_some());
    assert_eq!(metadata_filter.unwrap().get("key").unwrap().as_str().unwrap(), "value");

    // 2. Verify MemoryEntry serialization
    let source = ContentSource::UserFact { category: Some("preferences".into()) };
    let entry = MemoryEntry {
        id: "123".into(),
        text: "I like dark mode".into(),
        source: source.clone(),
        score: 0.9,
        metadata: HashMap::new(),
    };

    // Simulate response construction
    let entry_json = json!({
        "id": entry.id,
        "text": entry.text,
        "score": entry.score,
        "source": entry.source,
        "metadata": entry.metadata
    });

    // Check if source matches expected structure
    let source_json = entry_json.get("source").unwrap();
    assert_eq!(source_json["type"], "user_fact");
    assert_eq!(source_json["category"], "preferences");
}
