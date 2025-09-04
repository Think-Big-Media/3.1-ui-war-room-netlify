"""Advanced Pattern Recommendation Engine

Intelligent recommendation system that provides contextual pattern suggestions
based on current problems, historical success patterns, and agent collaboration data.
"""

import asyncio
import json
import logging
import re
import math
from typing import Dict, List, Optional, Any, Tuple, Set, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.decomposition import LatentDirichletAllocation
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import PorterStemmer
from textblob import TextBlob

# Import knowledge manager components
from pieces_knowledge_manager import (
    KnowledgePattern, KnowledgeCategory, PatternPriority,
    RecommendationType, PatternRecommendation
)

logger = logging.getLogger(__name__)

class RecommendationStrategy(Enum):
    """Different recommendation strategies"""
    SIMILARITY_BASED = "similarity_based"
    SUCCESS_RATE_BASED = "success_rate_based"
    COLLABORATIVE_FILTERING = "collaborative_filtering"
    CONTENT_BASED = "content_based"
    HYBRID = "hybrid"
    CONTEXTUAL = "contextual"

class RecommendationConfidence(Enum):
    """Confidence levels for recommendations"""
    VERY_HIGH = "very_high"  # 0.9+
    HIGH = "high"           # 0.7-0.89
    MEDIUM = "medium"       # 0.5-0.69
    LOW = "low"            # 0.3-0.49
    VERY_LOW = "very_low"  # <0.3

@dataclass
class RecommendationContext:
    """Context for pattern recommendations"""
    problem_description: str
    current_code_context: Optional[str] = None
    programming_language: Optional[str] = None
    project_type: Optional[str] = None
    urgency_level: str = "medium"
    preferred_categories: List[str] = field(default_factory=list)
    excluded_patterns: List[str] = field(default_factory=list)
    agent_history: List[str] = field(default_factory=list)
    similar_problems_solved: List[str] = field(default_factory=list)
    constraints: Dict[str, Any] = field(default_factory=dict)

@dataclass
class EnhancedRecommendation:
    """Enhanced recommendation with detailed analysis"""
    pattern_id: str
    pattern_name: str
    recommendation_type: RecommendationType
    relevance_score: float
    confidence_level: RecommendationConfidence
    reasoning: str
    context_match_score: float
    success_probability: float
    implementation_difficulty: str
    estimated_time: str
    prerequisites: List[str] = field(default_factory=list)
    similar_successes: List[str] = field(default_factory=list)
    potential_issues: List[str] = field(default_factory=list)
    customization_suggestions: List[str] = field(default_factory=list)
    related_patterns: List[str] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class RecommendationExplanation:
    """Detailed explanation for recommendations"""
    main_factors: List[str]
    similarity_analysis: Dict[str, float]
    success_factors: Dict[str, Any]
    risk_analysis: Dict[str, Any]
    alternative_approaches: List[str]
    learning_insights: List[str]

class AdvancedPatternRecommendationEngine:
    """Sophisticated pattern recommendation engine with multiple strategies"""
    
    def __init__(self, knowledge_manager):
        self.knowledge_manager = knowledge_manager
        
        # ML Models and vectorizers
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 3),
            max_df=0.8,
            min_df=2
        )
        self.lda_model = None
        self.kmeans_model = None
        
        # Pattern analysis
        self.pattern_embeddings: Dict[str, np.ndarray] = {}
        self.pattern_topics: Dict[str, List[float]] = {}
        self.pattern_clusters: Dict[str, int] = {}
        
        # Success tracking
        self.recommendation_history: List[Dict[str, Any]] = []
        self.success_patterns: Dict[str, float] = {}
        self.collaboration_matrix: Dict[str, Dict[str, float]] = defaultdict(dict)
        
        # NLP components
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
        
        # Recommendation weights for hybrid approach
        self.strategy_weights = {
            RecommendationStrategy.SIMILARITY_BASED: 0.25,
            RecommendationStrategy.SUCCESS_RATE_BASED: 0.20,
            RecommendationStrategy.COLLABORATIVE_FILTERING: 0.15,
            RecommendationStrategy.CONTENT_BASED: 0.20,
            RecommendationStrategy.CONTEXTUAL: 0.20
        }
        
        # Configuration
        self.min_recommendation_score = 0.3
        self.max_recommendations = 20
        self.enable_learning = True
        self.enable_explanation = True
        
        # Statistics
        self.stats = {
            "recommendations_generated": 0,
            "successful_recommendations": 0,
            "failed_recommendations": 0,
            "average_relevance_score": 0.0,
            "strategy_usage": Counter(),
            "last_model_update": None
        }
        
        # Initialize components
        self._initialize_recommendation_engine()
    
    def _initialize_recommendation_engine(self):
        """Initialize the recommendation engine components"""
        logger.info("Initializing Advanced Pattern Recommendation Engine...")
        
        # Initialize NLP models
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
        except Exception as e:
            logger.warning(f"Failed to download NLTK data: {e}")
        
        # Initialize pattern analysis
        asyncio.create_task(self._initialize_pattern_analysis())
        
        logger.info("Recommendation engine initialized successfully")
    
    async def _initialize_pattern_analysis(self):
        """Initialize pattern analysis components"""
        try:
            patterns = list(self.knowledge_manager.knowledge_patterns.values())
            
            if len(patterns) < 5:
                logger.info("Insufficient patterns for ML model initialization")
                return
            
            # Extract text features
            pattern_texts = []
            for pattern in patterns:
                text = f"{pattern.name} {pattern.description} {pattern.content}"
                pattern_texts.append(self._preprocess_text(text))
            
            # Fit TF-IDF vectorizer
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(pattern_texts)
            
            # Generate embeddings
            for i, pattern in enumerate(patterns):
                self.pattern_embeddings[pattern.id] = tfidf_matrix[i].toarray()[0]
            
            # Fit LDA model for topic modeling
            if len(patterns) >= 10:
                self.lda_model = LatentDirichletAllocation(n_components=min(8, len(patterns)//2), random_state=42)
                topic_matrix = self.lda_model.fit_transform(tfidf_matrix)
                
                for i, pattern in enumerate(patterns):
                    self.pattern_topics[pattern.id] = topic_matrix[i].tolist()
            
            # Fit clustering model
            if len(patterns) >= 8:
                n_clusters = min(5, len(patterns)//3)
                self.kmeans_model = KMeans(n_clusters=n_clusters, random_state=42)
                cluster_labels = self.kmeans_model.fit_predict(tfidf_matrix.toarray())
                
                for i, pattern in enumerate(patterns):
                    self.pattern_clusters[pattern.id] = cluster_labels[i]
            
            self.stats["last_model_update"] = datetime.utcnow().isoformat()
            logger.info("Pattern analysis models initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize pattern analysis: {e}")
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for analysis"""
        try:
            # Remove code blocks
            text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
            text = re.sub(r'`.*?`', '', text)
            
            # Remove URLs and special characters
            text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
            text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
            
            # Normalize whitespace
            text = ' '.join(text.split())
            
            # Convert to lowercase
            text = text.lower()
            
            return text
            
        except Exception as e:
            logger.warning(f"Text preprocessing failed: {e}")
            return text.lower()
    
    async def generate_recommendations(self, context: RecommendationContext, 
                                     strategy: RecommendationStrategy = RecommendationStrategy.HYBRID,
                                     max_results: Optional[int] = None) -> List[EnhancedRecommendation]:
        """Generate pattern recommendations based on context and strategy"""
        try:
            max_results = max_results or self.max_recommendations
            logger.info(f"Generating recommendations using {strategy.value} strategy")
            
            recommendations = []
            
            if strategy == RecommendationStrategy.HYBRID:
                # Use hybrid approach combining multiple strategies
                recommendations = await self._generate_hybrid_recommendations(context, max_results)
            elif strategy == RecommendationStrategy.SIMILARITY_BASED:
                recommendations = await self._generate_similarity_recommendations(context, max_results)
            elif strategy == RecommendationStrategy.SUCCESS_RATE_BASED:
                recommendations = await self._generate_success_rate_recommendations(context, max_results)
            elif strategy == RecommendationStrategy.COLLABORATIVE_FILTERING:
                recommendations = await self._generate_collaborative_recommendations(context, max_results)
            elif strategy == RecommendationStrategy.CONTENT_BASED:
                recommendations = await self._generate_content_based_recommendations(context, max_results)
            elif strategy == RecommendationStrategy.CONTEXTUAL:
                recommendations = await self._generate_contextual_recommendations(context, max_results)
            
            # Post-process recommendations
            recommendations = await self._post_process_recommendations(recommendations, context)
            
            # Generate explanations if enabled
            if self.enable_explanation:
                for rec in recommendations:
                    rec.reasoning = await self._generate_detailed_reasoning(rec, context)
            
            # Update statistics
            self.stats["recommendations_generated"] += len(recommendations)
            self.stats["strategy_usage"][strategy.value] += 1
            
            # Store recommendation history
            if self.enable_learning:
                await self._store_recommendation_session(context, recommendations, strategy)
            
            logger.info(f"Generated {len(recommendations)} recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            return []
    
    async def _generate_hybrid_recommendations(self, context: RecommendationContext, max_results: int) -> List[EnhancedRecommendation]:
        """Generate recommendations using hybrid approach"""
        all_recommendations = []
        
        # Generate recommendations from each strategy
        strategies = [
            RecommendationStrategy.SIMILARITY_BASED,
            RecommendationStrategy.SUCCESS_RATE_BASED,
            RecommendationStrategy.COLLABORATIVE_FILTERING,
            RecommendationStrategy.CONTENT_BASED,
            RecommendationStrategy.CONTEXTUAL
        ]
        
        for strategy in strategies:
            try:
                strategy_recs = []
                if strategy == RecommendationStrategy.SIMILARITY_BASED:
                    strategy_recs = await self._generate_similarity_recommendations(context, max_results)
                elif strategy == RecommendationStrategy.SUCCESS_RATE_BASED:
                    strategy_recs = await self._generate_success_rate_recommendations(context, max_results)
                elif strategy == RecommendationStrategy.COLLABORATIVE_FILTERING:
                    strategy_recs = await self._generate_collaborative_recommendations(context, max_results)
                elif strategy == RecommendationStrategy.CONTENT_BASED:
                    strategy_recs = await self._generate_content_based_recommendations(context, max_results)
                elif strategy == RecommendationStrategy.CONTEXTUAL:
                    strategy_recs = await self._generate_contextual_recommendations(context, max_results)
                
                # Weight the scores
                weight = self.strategy_weights.get(strategy, 0.2)
                for rec in strategy_recs:
                    rec.relevance_score *= weight
                    rec.reasoning = f"[{strategy.value}] {rec.reasoning}"
                
                all_recommendations.extend(strategy_recs)
                
            except Exception as e:
                logger.warning(f"Strategy {strategy.value} failed: {e}")
        
        # Combine and deduplicate recommendations
        combined_recs = {}
        for rec in all_recommendations:
            if rec.pattern_id in combined_recs:
                # Combine scores from multiple strategies
                existing = combined_recs[rec.pattern_id]
                existing.relevance_score += rec.relevance_score
                existing.reasoning += f" + {rec.reasoning}"
                
                # Update other metrics
                existing.context_match_score = max(existing.context_match_score, rec.context_match_score)
                existing.success_probability = max(existing.success_probability, rec.success_probability)
            else:
                combined_recs[rec.pattern_id] = rec
        
        # Sort by combined relevance score
        final_recommendations = sorted(
            combined_recs.values(),
            key=lambda x: x.relevance_score,
            reverse=True
        )
        
        return final_recommendations[:max_results]
    
    async def _generate_similarity_recommendations(self, context: RecommendationContext, max_results: int) -> List[EnhancedRecommendation]:
        """Generate recommendations based on semantic similarity"""
        recommendations = []
        
        try:
            # Preprocess query
            query_text = self._preprocess_text(
                f"{context.problem_description} {context.current_code_context or ''}"
            )
            
            if not query_text.strip():
                return []
            
            # Vectorize query
            query_vector = self.tfidf_vectorizer.transform([query_text])
            
            # Calculate similarities
            similarities = []
            for pattern_id, pattern_embedding in self.pattern_embeddings.items():
                similarity = cosine_similarity(query_vector, pattern_embedding.reshape(1, -1))[0][0]
                similarities.append((pattern_id, similarity))
            
            # Sort by similarity
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            # Generate recommendations
            for pattern_id, similarity in similarities[:max_results]:
                if similarity < self.min_recommendation_score:
                    break
                
                pattern = self.knowledge_manager.knowledge_patterns.get(pattern_id)
                if not pattern or pattern_id in context.excluded_patterns:
                    continue
                
                # Filter by preferred categories
                if context.preferred_categories and pattern.category.value not in context.preferred_categories:
                    continue
                
                recommendation = EnhancedRecommendation(
                    pattern_id=pattern_id,
                    pattern_name=pattern.name,
                    recommendation_type=RecommendationType.SIMILAR_PATTERN,
                    relevance_score=similarity,
                    confidence_level=self._calculate_confidence_level(similarity),
                    reasoning=f"High semantic similarity ({similarity:.2f}) to your problem description",
                    context_match_score=similarity,
                    success_probability=pattern.confidence_score,
                    implementation_difficulty=self._estimate_difficulty(pattern),
                    estimated_time=self._estimate_implementation_time(pattern),
                    similar_successes=self._find_similar_successes(pattern),
                    related_patterns=self._find_related_patterns(pattern_id)
                )
                
                recommendations.append(recommendation)
            
        except Exception as e:
            logger.error(f"Similarity-based recommendation failed: {e}")
        
        return recommendations
    
    async def _generate_success_rate_recommendations(self, context: RecommendationContext, max_results: int) -> List[EnhancedRecommendation]:
        """Generate recommendations based on historical success rates"""
        recommendations = []
        
        try:
            patterns = list(self.knowledge_manager.knowledge_patterns.values())
            
            # Filter patterns with usage data
            patterns_with_usage = [
                p for p in patterns 
                if (p.success_count + p.failure_count) > 0 
                and p.id not in context.excluded_patterns
            ]
            
            # Filter by preferred categories
            if context.preferred_categories:
                patterns_with_usage = [
                    p for p in patterns_with_usage
                    if p.category.value in context.preferred_categories
                ]
            
            # Calculate success rates
            pattern_success_rates = []
            for pattern in patterns_with_usage:
                total_usage = pattern.success_count + pattern.failure_count
                success_rate = pattern.success_count / total_usage if total_usage > 0 else 0
                
                # Weight by usage frequency
                weighted_score = success_rate * math.log(total_usage + 1)
                pattern_success_rates.append((pattern, success_rate, weighted_score))
            
            # Sort by weighted success rate
            pattern_success_rates.sort(key=lambda x: x[2], reverse=True)
            
            # Generate recommendations
            for pattern, success_rate, weighted_score in pattern_success_rates[:max_results]:
                if success_rate < 0.3:  # Minimum success rate threshold
                    break
                
                # Calculate context relevance
                context_relevance = await self._calculate_context_relevance(pattern, context)
                
                final_score = (weighted_score * 0.7) + (context_relevance * 0.3)
                
                recommendation = EnhancedRecommendation(
                    pattern_id=pattern.id,
                    pattern_name=pattern.name,
                    recommendation_type=RecommendationType.SIMILAR_PATTERN,
                    relevance_score=final_score,
                    confidence_level=self._calculate_confidence_level(success_rate),
                    reasoning=f"High success rate ({success_rate:.1%}) with {pattern.success_count + pattern.failure_count} uses",
                    context_match_score=context_relevance,
                    success_probability=success_rate,
                    implementation_difficulty=self._estimate_difficulty(pattern),
                    estimated_time=self._estimate_implementation_time(pattern),
                    similar_successes=self._find_similar_successes(pattern),
                    related_patterns=self._find_related_patterns(pattern.id)
                )
                
                recommendations.append(recommendation)
            
        except Exception as e:
            logger.error(f"Success rate-based recommendation failed: {e}")
        
        return recommendations
    
    async def _generate_collaborative_recommendations(self, context: RecommendationContext, max_results: int) -> List[EnhancedRecommendation]:
        """Generate recommendations based on collaborative filtering"""
        recommendations = []
        
        try:
            # This is a simplified collaborative filtering approach
            # In a full implementation, this would analyze agent usage patterns
            
            if not context.agent_history:
                return recommendations
            
            # Find patterns used by similar agents/contexts
            similar_contexts = self._find_similar_contexts(context)
            
            # Score patterns based on collaborative signals
            pattern_scores = Counter()
            
            for similar_context in similar_contexts:
                for pattern_id in similar_context.get("patterns_used", []):
                    if pattern_id not in context.excluded_patterns:
                        similarity_weight = similar_context.get("similarity_score", 0.5)
                        pattern_scores[pattern_id] += similarity_weight
            
            # Generate recommendations
            for pattern_id, score in pattern_scores.most_common(max_results):
                pattern = self.knowledge_manager.knowledge_patterns.get(pattern_id)
                if not pattern:
                    continue
                
                # Filter by preferred categories
                if context.preferred_categories and pattern.category.value not in context.preferred_categories:
                    continue
                
                recommendation = EnhancedRecommendation(
                    pattern_id=pattern_id,
                    pattern_name=pattern.name,
                    recommendation_type=RecommendationType.COMPLEMENTARY_SOLUTION,
                    relevance_score=score,
                    confidence_level=self._calculate_confidence_level(score),
                    reasoning=f"Recommended by similar users/contexts (collaborative score: {score:.2f})",
                    context_match_score=score,
                    success_probability=pattern.confidence_score,
                    implementation_difficulty=self._estimate_difficulty(pattern),
                    estimated_time=self._estimate_implementation_time(pattern),
                    similar_successes=self._find_similar_successes(pattern),
                    related_patterns=self._find_related_patterns(pattern.id)
                )
                
                recommendations.append(recommendation)
            
        except Exception as e:
            logger.error(f"Collaborative filtering recommendation failed: {e}")
        
        return recommendations
    
    async def _generate_content_based_recommendations(self, context: RecommendationContext, max_results: int) -> List[EnhancedRecommendation]:
        """Generate recommendations based on content analysis"""
        recommendations = []
        
        try:
            # Analyze problem context for keywords and patterns
            problem_keywords = self._extract_keywords(context.problem_description)
            
            # Score patterns based on content matching
            pattern_scores = []
            
            for pattern_id, pattern in self.knowledge_manager.knowledge_patterns.items():
                if pattern_id in context.excluded_patterns:
                    continue
                
                # Filter by preferred categories
                if context.preferred_categories and pattern.category.value not in context.preferred_categories:
                    continue
                
                # Calculate content-based score
                content_score = self._calculate_content_match_score(pattern, problem_keywords, context)
                
                if content_score > self.min_recommendation_score:
                    pattern_scores.append((pattern, content_score))
            
            # Sort by content score
            pattern_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Generate recommendations
            for pattern, score in pattern_scores[:max_results]:
                recommendation = EnhancedRecommendation(
                    pattern_id=pattern.id,
                    pattern_name=pattern.name,
                    recommendation_type=RecommendationType.SIMILAR_PATTERN,
                    relevance_score=score,
                    confidence_level=self._calculate_confidence_level(score),
                    reasoning=f"Strong content match based on keywords and description analysis",
                    context_match_score=score,
                    success_probability=pattern.confidence_score,
                    implementation_difficulty=self._estimate_difficulty(pattern),
                    estimated_time=self._estimate_implementation_time(pattern),
                    similar_successes=self._find_similar_successes(pattern),
                    related_patterns=self._find_related_patterns(pattern.id)
                )
                
                recommendations.append(recommendation)
            
        except Exception as e:
            logger.error(f"Content-based recommendation failed: {e}")
        
        return recommendations
    
    async def _generate_contextual_recommendations(self, context: RecommendationContext, max_results: int) -> List[EnhancedRecommendation]:
        """Generate recommendations based on contextual factors"""
        recommendations = []
        
        try:
            patterns = list(self.knowledge_manager.knowledge_patterns.values())
            
            # Score patterns based on contextual relevance
            contextual_scores = []
            
            for pattern in patterns:
                if pattern.id in context.excluded_patterns:
                    continue
                
                # Filter by preferred categories
                if context.preferred_categories and pattern.category.value not in context.preferred_categories:
                    continue
                
                # Calculate contextual relevance
                contextual_score = 0.0
                
                # Language match
                if context.programming_language and pattern.language:
                    if context.programming_language.lower() == pattern.language.lower():
                        contextual_score += 0.3
                
                # Urgency match
                if context.urgency_level == "critical" and pattern.priority == PatternPriority.CRITICAL:
                    contextual_score += 0.2
                elif context.urgency_level == "high" and pattern.priority in [PatternPriority.HIGH, PatternPriority.CRITICAL]:
                    contextual_score += 0.15
                
                # Project type relevance
                if context.project_type:
                    project_relevance = self._calculate_project_type_relevance(pattern, context.project_type)
                    contextual_score += project_relevance * 0.2
                
                # Historical success in similar contexts
                historical_relevance = self._calculate_historical_contextual_relevance(pattern, context)
                contextual_score += historical_relevance * 0.3
                
                if contextual_score > self.min_recommendation_score:
                    contextual_scores.append((pattern, contextual_score))
            
            # Sort by contextual score
            contextual_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Generate recommendations
            for pattern, score in contextual_scores[:max_results]:
                recommendation = EnhancedRecommendation(
                    pattern_id=pattern.id,
                    pattern_name=pattern.name,
                    recommendation_type=RecommendationType.CONTEXTUAL,
                    relevance_score=score,
                    confidence_level=self._calculate_confidence_level(score),
                    reasoning=f"High contextual relevance based on language, urgency, and project type",
                    context_match_score=score,
                    success_probability=pattern.confidence_score,
                    implementation_difficulty=self._estimate_difficulty(pattern),
                    estimated_time=self._estimate_implementation_time(pattern),
                    similar_successes=self._find_similar_successes(pattern),
                    related_patterns=self._find_related_patterns(pattern.id)
                )
                
                recommendations.append(recommendation)
            
        except Exception as e:
            logger.error(f"Contextual recommendation failed: {e}")
        
        return recommendations
    
    # Helper methods for recommendation generation
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text"""
        try:
            # Use TextBlob for keyword extraction
            blob = TextBlob(text)
            
            # Get noun phrases
            noun_phrases = list(blob.noun_phrases)
            
            # Get important words (excluding stop words)
            words = [word.lower() for word in blob.words if word.lower() not in self.stop_words and len(word) > 3]
            
            # Combine and deduplicate
            keywords = list(set(noun_phrases + words))
            
            return keywords[:20]  # Limit to top 20 keywords
            
        except Exception as e:
            logger.warning(f"Keyword extraction failed: {e}")
            return []
    
    def _calculate_content_match_score(self, pattern: 'KnowledgePattern', keywords: List[str], context: RecommendationContext) -> float:
        """Calculate content-based matching score"""
        try:
            score = 0.0
            
            # Create searchable text from pattern
            pattern_text = f"{pattern.name} {pattern.description} {pattern.content}".lower()
            
            # Keyword matching
            if keywords:
                matched_keywords = sum(1 for keyword in keywords if keyword.lower() in pattern_text)
                keyword_score = matched_keywords / len(keywords)
                score += keyword_score * 0.4
            
            # Tag matching
            problem_words = set(context.problem_description.lower().split())
            tag_matches = sum(1 for tag in pattern.tags if any(word in tag.lower() for word in problem_words))
            if pattern.tags:
                tag_score = tag_matches / len(pattern.tags)
                score += tag_score * 0.3
            
            # Category relevance
            category_keywords = {
                'security': ['security', 'vulnerability', 'authentication', 'encryption'],
                'performance': ['performance', 'optimization', 'speed', 'efficiency'],
                'refactoring': ['refactor', 'clean', 'restructure', 'improve']
            }
            
            for category, cat_keywords in category_keywords.items():
                if any(keyword in context.problem_description.lower() for keyword in cat_keywords):
                    if category in pattern.category.value:
                        score += 0.2
            
            # Description similarity
            problem_blob = TextBlob(context.problem_description)
            pattern_blob = TextBlob(pattern.description)
            
            # Simple word overlap similarity
            problem_words = set(problem_blob.words)
            pattern_words = set(pattern_blob.words)
            
            if problem_words and pattern_words:
                overlap = len(problem_words.intersection(pattern_words))
                union = len(problem_words.union(pattern_words))
                similarity = overlap / union if union > 0 else 0
                score += similarity * 0.1
            
            return min(1.0, score)
            
        except Exception as e:
            logger.warning(f"Content match score calculation failed: {e}")
            return 0.0
    
    async def _calculate_context_relevance(self, pattern: 'KnowledgePattern', context: RecommendationContext) -> float:
        """Calculate how relevant a pattern is to the given context"""
        try:
            relevance = 0.0
            
            # Language relevance
            if context.programming_language and pattern.language:
                if context.programming_language.lower() == pattern.language.lower():
                    relevance += 0.3
            
            # Category preference
            if context.preferred_categories:
                if pattern.category.value in context.preferred_categories:
                    relevance += 0.2
            
            # Similar problems solved
            if context.similar_problems_solved:
                problem_similarity = self._calculate_problem_similarity(
                    context.similar_problems_solved, 
                    [pattern.description]
                )
                relevance += problem_similarity * 0.3
            
            # Agent history relevance
            if context.agent_history:
                # Check if similar agents have used this pattern successfully
                agent_relevance = self._calculate_agent_relevance(pattern, context.agent_history)
                relevance += agent_relevance * 0.2
            
            return min(1.0, relevance)
            
        except Exception as e:
            logger.warning(f"Context relevance calculation failed: {e}")
            return 0.0
    
    def _calculate_problem_similarity(self, problems1: List[str], problems2: List[str]) -> float:
        """Calculate similarity between two sets of problems"""
        try:
            if not problems1 or not problems2:
                return 0.0
            
            # Simple text similarity approach
            text1 = ' '.join(problems1).lower()
            text2 = ' '.join(problems2).lower()
            
            words1 = set(text1.split())
            words2 = set(text2.split())
            
            if not words1 or not words2:
                return 0.0
            
            intersection = len(words1.intersection(words2))
            union = len(words1.union(words2))
            
            return intersection / union if union > 0 else 0.0
            
        except Exception as e:
            logger.warning(f"Problem similarity calculation failed: {e}")
            return 0.0
    
    def _calculate_agent_relevance(self, pattern: 'KnowledgePattern', agent_history: List[str]) -> float:
        """Calculate relevance based on agent history"""
        try:
            # Simplified agent relevance calculation
            # In a full implementation, this would analyze collaboration patterns
            
            if pattern.source_agent in agent_history:
                return 0.8
            
            # Check if pattern has been successful with similar agents
            similar_agents = 0
            for agent in agent_history:
                if agent in self.success_patterns:
                    if pattern.id in self.success_patterns:
                        similar_agents += 1
            
            return min(0.6, similar_agents * 0.2)
            
        except Exception as e:
            logger.warning(f"Agent relevance calculation failed: {e}")
            return 0.0
    
    def _calculate_project_type_relevance(self, pattern: 'KnowledgePattern', project_type: str) -> float:
        """Calculate relevance based on project type"""
        try:
            project_keywords = {
                'web': ['web', 'html', 'css', 'javascript', 'react', 'vue', 'angular'],
                'api': ['api', 'rest', 'graphql', 'endpoint', 'service'],
                'mobile': ['mobile', 'android', 'ios', 'react-native', 'flutter'],
                'desktop': ['desktop', 'electron', 'tkinter', 'qt', 'gui'],
                'data': ['data', 'analysis', 'pandas', 'numpy', 'machine learning', 'ai']
            }
            
            project_type_lower = project_type.lower()
            pattern_text = f"{pattern.name} {pattern.description} {pattern.content}".lower()
            
            # Direct match
            if project_type_lower in pattern_text:
                return 1.0
            
            # Keyword match
            keywords = project_keywords.get(project_type_lower, [])
            if keywords:
                matches = sum(1 for keyword in keywords if keyword in pattern_text)
                return min(1.0, matches / len(keywords))
            
            return 0.0
            
        except Exception as e:
            logger.warning(f"Project type relevance calculation failed: {e}")
            return 0.0
    
    def _calculate_historical_contextual_relevance(self, pattern: 'KnowledgePattern', context: RecommendationContext) -> float:
        """Calculate relevance based on historical success in similar contexts"""
        try:
            # Simplified historical relevance
            # In a full implementation, this would analyze historical success patterns
            
            base_relevance = pattern.confidence_score
            
            # Boost for patterns with high usage frequency
            if pattern.usage_frequency > 5:
                base_relevance += 0.1
            
            # Boost for recent patterns
            if pattern.created_at and (datetime.utcnow() - pattern.created_at).days < 30:
                base_relevance += 0.05
            
            return min(1.0, base_relevance)
            
        except Exception as e:
            logger.warning(f"Historical contextual relevance calculation failed: {e}")
            return 0.0
    
    def _find_similar_contexts(self, context: RecommendationContext) -> List[Dict[str, Any]]:
        """Find similar contexts from recommendation history"""
        try:
            similar_contexts = []
            
            # This is a placeholder implementation
            # In a full system, this would analyze the recommendation history
            # to find contexts with similar characteristics
            
            for history_entry in self.recommendation_history[-50:]:  # Last 50 sessions
                similarity_score = 0.0
                
                # Compare problem descriptions
                if history_entry.get("problem_description"):
                    text_similarity = self._calculate_problem_similarity(
                        [context.problem_description],
                        [history_entry["problem_description"]]
                    )
                    similarity_score += text_similarity * 0.6
                
                # Compare languages
                if context.programming_language and history_entry.get("programming_language"):
                    if context.programming_language == history_entry["programming_language"]:
                        similarity_score += 0.2
                
                # Compare categories
                if context.preferred_categories and history_entry.get("preferred_categories"):
                    common_categories = set(context.preferred_categories).intersection(
                        set(history_entry["preferred_categories"])
                    )
                    if common_categories:
                        similarity_score += 0.2
                
                if similarity_score > 0.5:
                    similar_contexts.append({
                        "similarity_score": similarity_score,
                        "patterns_used": history_entry.get("recommended_patterns", [])
                    })
            
            return similar_contexts[:10]  # Return top 10 similar contexts
            
        except Exception as e:
            logger.warning(f"Similar contexts search failed: {e}")
            return []
    
    def _calculate_confidence_level(self, score: float) -> RecommendationConfidence:
        """Calculate confidence level from score"""
        if score >= 0.9:
            return RecommendationConfidence.VERY_HIGH
        elif score >= 0.7:
            return RecommendationConfidence.HIGH
        elif score >= 0.5:
            return RecommendationConfidence.MEDIUM
        elif score >= 0.3:
            return RecommendationConfidence.LOW
        else:
            return RecommendationConfidence.VERY_LOW
    
    def _estimate_difficulty(self, pattern: 'KnowledgePattern') -> str:
        """Estimate implementation difficulty"""
        try:
            # Simple heuristic based on content length and complexity indicators
            content_length = len(pattern.content)
            description_length = len(pattern.description)
            
            complexity_indicators = [
                'complex', 'advanced', 'enterprise', 'distributed', 'async',
                'concurrent', 'multithreaded', 'optimization', 'algorithm'
            ]
            
            content_lower = pattern.content.lower()
            complexity_count = sum(1 for indicator in complexity_indicators if indicator in content_lower)
            
            # Calculate difficulty score
            difficulty_score = (content_length / 1000) + (complexity_count * 0.2) + (description_length / 500)
            
            if difficulty_score < 1:
                return "Easy"
            elif difficulty_score < 2:
                return "Medium"
            elif difficulty_score < 3:
                return "Hard"
            else:
                return "Expert"
                
        except Exception as e:
            logger.warning(f"Difficulty estimation failed: {e}")
            return "Medium"
    
    def _estimate_implementation_time(self, pattern: 'KnowledgePattern') -> str:
        """Estimate implementation time"""
        try:
            difficulty = self._estimate_difficulty(pattern)
            
            time_estimates = {
                "Easy": "15-30 minutes",
                "Medium": "1-2 hours", 
                "Hard": "4-8 hours",
                "Expert": "1-3 days"
            }
            
            return time_estimates.get(difficulty, "1-2 hours")
            
        except Exception as e:
            logger.warning(f"Time estimation failed: {e}")
            return "Unknown"
    
    def _find_similar_successes(self, pattern: 'KnowledgePattern') -> List[str]:
        """Find similar successful patterns"""
        try:
            similar_patterns = []
            
            # Find patterns in the same category with high success rates
            for other_pattern in self.knowledge_manager.knowledge_patterns.values():
                if (other_pattern.id != pattern.id and 
                    other_pattern.category == pattern.category and
                    other_pattern.confidence_score > 0.7):
                    similar_patterns.append(other_pattern.name)
            
            return similar_patterns[:5]  # Return top 5
            
        except Exception as e:
            logger.warning(f"Similar successes search failed: {e}")
            return []
    
    def _find_related_patterns(self, pattern_id: str) -> List[str]:
        """Find related patterns"""
        try:
            related = []
            
            # Use clustering to find related patterns
            if pattern_id in self.pattern_clusters:
                cluster_id = self.pattern_clusters[pattern_id]
                
                for other_pattern_id, other_cluster_id in self.pattern_clusters.items():
                    if other_pattern_id != pattern_id and other_cluster_id == cluster_id:
                        if other_pattern_id in self.knowledge_manager.knowledge_patterns:
                            pattern_name = self.knowledge_manager.knowledge_patterns[other_pattern_id].name
                            related.append(pattern_name)
            
            return related[:5]  # Return top 5
            
        except Exception as e:
            logger.warning(f"Related patterns search failed: {e}")
            return []
    
    async def _post_process_recommendations(self, recommendations: List[EnhancedRecommendation], 
                                          context: RecommendationContext) -> List[EnhancedRecommendation]:
        """Post-process recommendations for quality and diversity"""
        try:
            if not recommendations:
                return recommendations
            
            # Remove duplicates
            unique_recs = {}
            for rec in recommendations:
                if rec.pattern_id not in unique_recs:
                    unique_recs[rec.pattern_id] = rec
                else:
                    # Keep the one with higher relevance score
                    if rec.relevance_score > unique_recs[rec.pattern_id].relevance_score:
                        unique_recs[rec.pattern_id] = rec
            
            # Filter by minimum relevance score
            filtered_recs = [
                rec for rec in unique_recs.values() 
                if rec.relevance_score >= self.min_recommendation_score
            ]
            
            # Ensure diversity (different categories)
            diverse_recs = []
            categories_used = set()
            
            # First, add top recommendations from each category
            sorted_recs = sorted(filtered_recs, key=lambda x: x.relevance_score, reverse=True)
            
            for rec in sorted_recs:
                pattern = self.knowledge_manager.knowledge_patterns.get(rec.pattern_id)
                if pattern:
                    category = pattern.category.value
                    if category not in categories_used or len(diverse_recs) < 5:
                        diverse_recs.append(rec)
                        categories_used.add(category)
            
            # Add remaining high-scoring recommendations
            for rec in sorted_recs:
                if rec not in diverse_recs and len(diverse_recs) < self.max_recommendations:
                    diverse_recs.append(rec)
            
            # Sort final recommendations by relevance score
            diverse_recs.sort(key=lambda x: x.relevance_score, reverse=True)
            
            return diverse_recs
            
        except Exception as e:
            logger.error(f"Post-processing failed: {e}")
            return recommendations
    
    async def _generate_detailed_reasoning(self, recommendation: EnhancedRecommendation, 
                                         context: RecommendationContext) -> str:
        """Generate detailed reasoning for recommendation"""
        try:
            pattern = self.knowledge_manager.knowledge_patterns.get(recommendation.pattern_id)
            if not pattern:
                return recommendation.reasoning
            
            reasoning_parts = []
            
            # Base reasoning
            reasoning_parts.append(recommendation.reasoning)
            
            # Success rate reasoning
            if pattern.success_count + pattern.failure_count > 0:
                success_rate = pattern.success_count / (pattern.success_count + pattern.failure_count)
                reasoning_parts.append(f"Success rate: {success_rate:.1%} ({pattern.success_count + pattern.failure_count} total uses)")
            
            # Recency reasoning
            if pattern.created_at:
                days_ago = (datetime.utcnow() - pattern.created_at).days
                if days_ago < 7:
                    reasoning_parts.append("Recently added pattern")
                elif days_ago < 30:
                    reasoning_parts.append("Recent pattern")
            
            # Category reasoning
            reasoning_parts.append(f"Category: {pattern.category.value.replace('_', ' ').title()}")
            
            # Language reasoning
            if pattern.language and context.programming_language:
                if pattern.language.lower() == context.programming_language.lower():
                    reasoning_parts.append(f"Exact language match: {pattern.language}")
            
            # Difficulty reasoning
            reasoning_parts.append(f"Difficulty: {recommendation.implementation_difficulty}")
            
            # Join all reasoning parts
            detailed_reasoning = ". ".join(reasoning_parts)
            
            return detailed_reasoning
            
        except Exception as e:
            logger.warning(f"Detailed reasoning generation failed: {e}")
            return recommendation.reasoning
    
    async def _store_recommendation_session(self, context: RecommendationContext, 
                                          recommendations: List[EnhancedRecommendation],
                                          strategy: RecommendationStrategy):
        """Store recommendation session for learning"""
        try:
            session_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "problem_description": context.problem_description,
                "programming_language": context.programming_language,
                "preferred_categories": context.preferred_categories,
                "strategy_used": strategy.value,
                "recommended_patterns": [rec.pattern_id for rec in recommendations],
                "recommendation_count": len(recommendations),
                "avg_relevance_score": sum(rec.relevance_score for rec in recommendations) / len(recommendations) if recommendations else 0
            }
            
            self.recommendation_history.append(session_data)
            
            # Keep only last 1000 sessions
            if len(self.recommendation_history) > 1000:
                self.recommendation_history = self.recommendation_history[-1000:]
            
        except Exception as e:
            logger.warning(f"Session storage failed: {e}")
    
    async def update_recommendation_feedback(self, pattern_id: str, success: bool, 
                                           feedback_details: Optional[str] = None):
        """Update recommendation effectiveness based on feedback"""
        try:
            if success:
                self.stats["successful_recommendations"] += 1
                self.success_patterns[pattern_id] = self.success_patterns.get(pattern_id, 0) + 1
            else:
                self.stats["failed_recommendations"] += 1
            
            # Update pattern confidence in knowledge manager
            await self.knowledge_manager._update_knowledge_from_feedback({
                "pattern_id": pattern_id,
                "feedback_type": "success" if success else "failure",
                "details": feedback_details or "",
                "source_agent": "RecommendationEngine"
            })
            
            # Recalculate average relevance score
            total_recs = self.stats["successful_recommendations"] + self.stats["failed_recommendations"]
            if total_recs > 0:
                self.stats["average_relevance_score"] = self.stats["successful_recommendations"] / total_recs
            
            logger.info(f"Updated feedback for pattern {pattern_id}: {'success' if success else 'failure'}")
            
        except Exception as e:
            logger.error(f"Feedback update failed: {e}")
    
    def get_recommendation_statistics(self) -> Dict[str, Any]:
        """Get recommendation engine statistics"""
        return {
            **self.stats,
            "pattern_embeddings_count": len(self.pattern_embeddings),
            "pattern_topics_count": len(self.pattern_topics),
            "pattern_clusters_count": len(set(self.pattern_clusters.values())) if self.pattern_clusters else 0,
            "recommendation_history_size": len(self.recommendation_history),
            "success_patterns_tracked": len(self.success_patterns),
            "models_initialized": {
                "tfidf_vectorizer": hasattr(self.tfidf_vectorizer, 'vocabulary_'),
                "lda_model": self.lda_model is not None,
                "kmeans_model": self.kmeans_model is not None
            }
        }
    
    def configure_strategy_weights(self, weights: Dict[RecommendationStrategy, float]):
        """Configure strategy weights for hybrid approach"""
        total_weight = sum(weights.values())
        if abs(total_weight - 1.0) > 0.01:
            logger.warning(f"Strategy weights don't sum to 1.0 (sum={total_weight}). Normalizing...")
            for strategy in weights:
                weights[strategy] = weights[strategy] / total_weight
        
        self.strategy_weights.update(weights)
        logger.info("Strategy weights updated")
    
    def set_recommendation_threshold(self, threshold: float):
        """Set minimum recommendation score threshold"""
        self.min_recommendation_score = max(0.0, min(1.0, threshold))
        logger.info(f"Recommendation threshold set to {self.min_recommendation_score}")

# Export main classes
__all__ = [
    'AdvancedPatternRecommendationEngine',
    'RecommendationContext', 
    'EnhancedRecommendation',
    'RecommendationStrategy',
    'RecommendationConfidence'
]