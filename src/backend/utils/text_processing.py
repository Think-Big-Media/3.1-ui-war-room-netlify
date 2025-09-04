"""
Text processing utilities for document intelligence.
Handles text cleaning, keyword extraction, and preprocessing.
"""

import re
import string
from typing import List, Set
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import PorterStemmer
from nltk.tag import pos_tag

# Download required NLTK data (run once)
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords")

try:
    nltk.data.find("taggers/averaged_perceptron_tagger")
except LookupError:
    nltk.download("averaged_perceptron_tagger")

# Initialize NLTK components
STOP_WORDS = set(stopwords.words("english"))
STEMMER = PorterStemmer()

# Political and campaign-specific keywords to preserve
POLITICAL_KEYWORDS = {
    "campaign",
    "candidate",
    "election",
    "vote",
    "voter",
    "polling",
    "primary",
    "general",
    "democratic",
    "republican",
    "independent",
    "platform",
    "policy",
    "debate",
    "fundraising",
    "donation",
    "volunteer",
    "canvass",
    "phonebank",
    "voter registration",
    "absentee",
    "ballot",
    "precinct",
    "district",
    "constituency",
    "endorsement",
    "pac",
    "super pac",
    "fec",
    "contribution",
    "grassroots",
    "getv",
    "gotv",
    "ground game",
    "field",
    "digital",
    "social media",
    "facebook",
    "twitter",
    "instagram",
    "youtube",
    "tiktok",
    "messaging",
    "narrative",
    "opposition research",
    "tracking poll",
    "benchmark poll",
    "internal poll",
    "public poll",
    "survey",
    "focus group",
}


def clean_text(text: str) -> str:
    """
    Clean and normalize text for processing.

    Args:
        text: Raw text to clean

    Returns:
        Cleaned text
    """
    if not text:
        return ""

    # Remove extra whitespace and normalize line breaks
    text = re.sub(r"\n+", "\n", text)
    text = re.sub(r"\s+", " ", text)

    # Remove special characters but keep basic punctuation
    text = re.sub(r"[^\w\s\.\,\!\?\;\:\-\(\)]", " ", text)

    # Remove excessive punctuation
    text = re.sub(r"[\.]{2,}", ".", text)
    text = re.sub(r"[\!\?]{2,}", "!", text)

    # Fix spacing around punctuation
    text = re.sub(r"\s+([\.,:;!?])", r"\1", text)
    text = re.sub(r"([\.,:;!?])\s*", r"\1 ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def extract_keywords(text: str, max_keywords: int = 20) -> List[str]:
    """
    Extract important keywords from text using NLP techniques.

    Args:
        text: Input text
        max_keywords: Maximum number of keywords to return

    Returns:
        List of extracted keywords
    """
    if not text:
        return []

    try:
        # Tokenize and get part-of-speech tags
        tokens = word_tokenize(text.lower())
        pos_tags = pos_tag(tokens)

        # Filter for relevant parts of speech (nouns, adjectives, proper nouns)
        relevant_pos = {"NN", "NNS", "NNP", "NNPS", "JJ", "JJR", "JJS"}
        keywords = []

        for token, pos in pos_tags:
            # Skip if not relevant POS
            if pos not in relevant_pos:
                continue

            # Skip if stopword (unless it's a political keyword)
            if token in STOP_WORDS and token not in POLITICAL_KEYWORDS:
                continue

            # Skip if too short or contains only punctuation
            if len(token) < 3 or token in string.punctuation:
                continue

            # Add to keywords
            keywords.append(token)

        # Count frequency and get most common
        keyword_counts = Counter(keywords)
        most_common = keyword_counts.most_common(max_keywords)

        # Extract just the keywords (not counts)
        extracted_keywords = [keyword for keyword, count in most_common if count > 1]

        # Add political keywords that appear even once
        political_in_text = [kw for kw in POLITICAL_KEYWORDS if kw in text.lower()]
        extracted_keywords.extend(political_in_text)

        # Remove duplicates and return
        return list(set(extracted_keywords))[:max_keywords]

    except Exception as e:
        # Fallback to simple extraction if NLTK fails
        return extract_keywords_simple(text, max_keywords)


def extract_keywords_simple(text: str, max_keywords: int = 20) -> List[str]:
    """
    Simple keyword extraction fallback without NLTK.

    Args:
        text: Input text
        max_keywords: Maximum number of keywords

    Returns:
        List of keywords
    """
    if not text:
        return []

    # Simple tokenization
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())

    # Remove common stop words
    common_stop_words = {
        "the",
        "and",
        "for",
        "are",
        "but",
        "not",
        "you",
        "all",
        "can",
        "had",
        "her",
        "was",
        "one",
        "our",
        "out",
        "day",
        "get",
        "has",
        "him",
        "his",
        "how",
        "man",
        "new",
        "now",
        "old",
        "see",
        "two",
        "way",
        "who",
        "boy",
        "did",
        "its",
        "let",
        "put",
        "say",
        "she",
        "too",
        "use",
    }

    filtered_words = [word for word in words if word not in common_stop_words]

    # Count and return most frequent
    word_counts = Counter(filtered_words)
    return [word for word, count in word_counts.most_common(max_keywords)]


def extract_sentences(text: str, max_sentences: int = 5) -> List[str]:
    """
    Extract important sentences from text.

    Args:
        text: Input text
        max_sentences: Maximum sentences to return

    Returns:
        List of important sentences
    """
    if not text:
        return []

    try:
        sentences = sent_tokenize(text)

        # Score sentences based on length and keyword density
        scored_sentences = []
        keywords = set(extract_keywords(text, 50))  # Get more keywords for scoring

        for sentence in sentences:
            # Skip very short or long sentences
            if len(sentence.split()) < 5 or len(sentence.split()) > 50:
                continue

            # Count keywords in sentence
            sentence_words = set(word_tokenize(sentence.lower()))
            keyword_count = len(sentence_words.intersection(keywords))

            # Score based on keyword density
            score = keyword_count / len(sentence_words) if sentence_words else 0

            scored_sentences.append((sentence, score))

        # Sort by score and return top sentences
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        return [sentence for sentence, score in scored_sentences[:max_sentences]]

    except Exception:
        # Fallback to first few sentences
        sentences = text.split(". ")
        return sentences[:max_sentences]


def summarize_text(text: str, max_length: int = 500) -> str:
    """
    Create a summary of the text.

    Args:
        text: Input text
        max_length: Maximum summary length

    Returns:
        Text summary
    """
    if not text or len(text) <= max_length:
        return text

    # Extract important sentences
    important_sentences = extract_sentences(text, 3)

    if not important_sentences:
        # Fallback to first part of text
        return text[:max_length] + "..."

    # Join sentences and trim if needed
    summary = ". ".join(important_sentences)

    if len(summary) > max_length:
        summary = summary[:max_length].rsplit(".", 1)[0] + "."

    return summary


def detect_document_language(text: str) -> str:
    """
    Simple language detection for documents.

    Args:
        text: Input text

    Returns:
        Language code (default: 'en')
    """
    if not text:
        return "en"

    # Simple heuristic based on common words
    spanish_indicators = ["el", "la", "de", "que", "y", "en", "un", "es", "se", "no"]
    french_indicators = ["le", "de", "et", "à", "un", "il", "être", "et", "en", "avoir"]
    german_indicators = [
        "der",
        "die",
        "und",
        "in",
        "den",
        "von",
        "zu",
        "das",
        "mit",
        "sich",
    ]

    text_lower = text.lower()

    # Count indicators
    spanish_count = sum(1 for word in spanish_indicators if word in text_lower)
    french_count = sum(1 for word in french_indicators if word in text_lower)
    german_count = sum(1 for word in german_indicators if word in text_lower)

    # Return most likely language
    if spanish_count > 3:
        return "es"
    elif french_count > 3:
        return "fr"
    elif german_count > 3:
        return "de"
    else:
        return "en"  # Default to English


def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract basic entities from text (names, organizations, locations).

    Args:
        text: Input text

    Returns:
        Dictionary of entity types and lists
    """
    entities = {
        "organizations": [],
        "locations": [],
        "people": [],
        "political_terms": [],
    }

    if not text:
        return entities

    # Political organizations pattern
    org_patterns = [
        r"\b[A-Z][a-z]+ (Campaign|Committee|PAC|Party|Association|Union)\b",
        r"\b(Democratic|Republican|Independent|Green|Libertarian) Party\b",
        r"\bSuper PAC\b",
        r"\b[A-Z]{2,} PAC\b",
    ]

    for pattern in org_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["organizations"].extend(matches)

    # Location patterns (basic)
    location_patterns = [
        r"\b[A-Z][a-z]+, [A-Z]{2}\b",  # City, State
        r"\b[A-Z][a-z]+ County\b",
        r"\b[A-Z][a-z]+ District\b",
    ]

    for pattern in location_patterns:
        matches = re.findall(pattern, text)
        entities["locations"].extend(matches)

    # Political terms
    political_matches = [term for term in POLITICAL_KEYWORDS if term in text.lower()]
    entities["political_terms"] = political_matches

    # Remove duplicates
    for key in entities:
        entities[key] = list(set(entities[key]))

    return entities


def chunk_text_intelligently(
    text: str, chunk_size: int = 1000, overlap: int = 200
) -> List[str]:
    """
    Intelligently chunk text while preserving sentence boundaries.

    Args:
        text: Text to chunk
        chunk_size: Target chunk size in characters
        overlap: Overlap between chunks

    Returns:
        List of text chunks
    """
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    try:
        sentences = sent_tokenize(text)
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            # If adding this sentence would exceed chunk size
            if len(current_chunk) + len(sentence) > chunk_size and current_chunk:
                chunks.append(current_chunk.strip())

                # Start new chunk with overlap
                if overlap > 0 and chunks:
                    # Find overlap point
                    overlap_text = (
                        current_chunk[-overlap:]
                        if len(current_chunk) > overlap
                        else current_chunk
                    )
                    current_chunk = overlap_text + " " + sentence
                else:
                    current_chunk = sentence
            else:
                current_chunk += " " + sentence if current_chunk else sentence

        # Add final chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    except Exception:
        # Fallback to simple character-based chunking
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunks.append(text[i : i + chunk_size])
        return chunks


def is_meaningful_content(text: str, min_words: int = 10) -> bool:
    """
    Check if text contains meaningful content.

    Args:
        text: Text to check
        min_words: Minimum word count

    Returns:
        True if content is meaningful
    """
    if not text:
        return False

    # Count words
    words = re.findall(r"\b\w+\b", text)
    if len(words) < min_words:
        return False

    # Check for repetitive content
    unique_words = set(word.lower() for word in words)
    if len(unique_words) / len(words) < 0.3:  # Less than 30% unique words
        return False

    # Check for meaningful sentences
    sentences = sent_tokenize(text)
    meaningful_sentences = [s for s in sentences if len(s.split()) >= 3]

    return len(meaningful_sentences) >= 2
