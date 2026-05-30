"""Port of apps/web/src/lib/llm/prompts/paragraph.ts (BV8)."""


def build_prompt(*, theme: str, persona: str, length: int, recycle_words: list[str]) -> str:
    theme_desc = _describe_theme(theme)
    persona_desc = _describe_persona(persona)
    if len(recycle_words) >= 2:
        recycle_clause = (
            "Work these previously saved vocabulary items into the prose naturally "
            "(not as a glossary or numbered list): "
            f"{', '.join(recycle_words)}. "
            "Each must appear at least once in the paragraph body; prefer the exact spellings given, "
            "but close morphological variants are acceptable if grammar demands it."
        )
    else:
        recycle_clause = (
            "This is a cold-start paragraph — do not reference any prior vocabulary list "
            "or pretend the reader saved words earlier."
        )

    return " ".join(
        [
            f"Write {theme_desc}, approximately {length} words long, with {persona_desc}.",
            recycle_clause,
            "In addition, introduce 2 to 3 NEW advanced words appropriate to the persona's vocabulary band.",
            "Return JSON with camelCase field names matching this shape:",
            '{ "paragraph": string, "hardWords": [{ "word": string, "ipa": string, '
            '"pronunciationGuide": string, "meaning": string, "exampleSentence": string }] }',
            'For each entry in hardWords, include the word\'s IPA phonetic transcription and a plain-English '
            'pronunciationGuide such as "SKWIR-uhl" or "es-CHOO". For meaning, use a short part-of-speech '
            'label, an interpunct (·), then the gloss (e.g. "noun · a whispering or rustling sound"); '
            "and a one-sentence example using the word in context.",
            "Drop any hardWords entry you cannot fully fill — never emit partial rows.",
        ]
    )


def _describe_theme(theme: str) -> str:
    mapping = {
        "horror": "a horror-themed paragraph",
        "comedy": "a comedic paragraph",
        "adventure": "an adventure-themed paragraph",
        "mythic-quest": "a mythic quest paragraph with legendary stakes",
        "survival": "a wilderness survival paragraph",
        "travelogue": "a travelogue-style paragraph with vivid place details",
        "mystery": "a mystery-themed paragraph",
        "sci-fi": "a science-fiction paragraph",
        "slice-of-life": "a slice-of-life paragraph",
    }
    return mapping.get(theme, f"a paragraph in the '{theme}' style")


def _describe_persona(persona: str) -> str:
    mapping = {
        "gre-aspirant": "vocabulary appropriate for a GRE aspirant",
        "business-english": "business-English diction",
        "storyteller": "a storyteller voice",
        "campfire-narrator": "a warm campfire narrator voice",
        "news-reader": "clear broadcast-news diction",
        "debate-coach": "precise debate-coach diction",
        "casual-conversationalist": "casual conversational diction",
    }
    return mapping.get(persona, f"vocabulary appropriate to a '{persona}' speaker")
