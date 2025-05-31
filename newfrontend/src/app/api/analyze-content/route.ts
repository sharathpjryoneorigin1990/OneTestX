import { NextResponse } from 'next/server';

type Sentiment = 'positive' | 'neutral' | 'negative';

// Enhanced sentiment word lists
const POSITIVE_WORDS = new Set([
  'happy', 'joy', 'love', 'amazing', 'wonderful', 'great', 'excellent', 'fantastic',
  'awesome', 'perfect', 'best', 'superb', 'outstanding', 'brilliant', 'fabulous',
  'terrific', 'delightful', 'pleased', 'thrilled', 'ecstatic', 'blissful', 'grateful',
  'thankful', 'blessed', 'inspiring', 'motivating', 'energizing', 'refreshing', 'renewing',
  'vitality', 'wellness', 'healthy', 'balanced', 'harmonious', 'peaceful', 'calm', 'serene'
]);

const NEGATIVE_WORDS = new Set([
  'sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'worst', 'bad', 'poor',
  'disappointing', 'frustrating', 'annoying', 'stressful', 'anxious', 'depressed',
  'miserable', 'painful', 'tiring', 'exhausting', 'draining', 'overwhelming', 'difficult'
]);

// Health and wellness related terms
const HEALTH_ENTITIES = [
  'wellness', 'health', 'fitness', 'nutrition', 'exercise', 'yoga', 'meditation',
  'mindfulness', 'self-care', 'wellbeing', 'lifestyle', 'routine', 'habit', 'productivity',
  'energy', 'vitality', 'balance', 'harmony', 'sleep', 'hydration', 'nutrition', 'diet',
  'workout', 'fitness', 'mental health', 'physical health', 'emotional wellbeing'
];

// Common words to exclude from keywords
const COMMON_WORDS = new Set([
  'the', 'and', 'or', 'but', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'is', 'are',
  'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'can', 'may', 'might', 'must', 'that', 'this', 'these', 'those', 'they',
  'them', 'their', 'there', 'here', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom'
]);

export const runtime = 'edge';

// Enhanced sentiment analysis
function analyzeSentiment(text: string): { sentiment: Sentiment; score: number } {
  const words = text.toLowerCase().split(/\s+/);
  let positive = 0;
  let negative = 0;
  let total = 0;

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length < 3) return;
    
    if (POSITIVE_WORDS.has(cleanWord)) {
      positive++;
      total++;
    } else if (NEGATIVE_WORDS.has(cleanWord)) {
      negative++;
      total++;
    }
  });

  const score = total > 0 ? (positive - negative) / total : 0;
  
  if (score > 0.1) return { sentiment: 'positive', score };
  if (score < -0.1) return { sentiment: 'negative', score };
  return { sentiment: 'neutral', score: 0 };
}

// Extract entities with context awareness
function extractEntities(text: string) {
  const entities: Array<{ type: string; text: string; relevance: number }> = [];
  const lowerText = text.toLowerCase();

  // Check for health and wellness terms
  HEALTH_ENTITIES.forEach(term => {
    if (lowerText.includes(term.toLowerCase())) {
      // Calculate relevance based on term length and context
      const occurrences = (lowerText.match(new RegExp(term, 'gi')) || []).length;
      const relevance = 0.7 + (Math.min(occurrences * 0.1, 0.3));
      
      entities.push({
        type: 'HEALTH_TERM',
        text: term,
        relevance: parseFloat(relevance.toFixed(2))
      });
    }
  });

  return entities;
}

// Improved keyword extraction
function extractKeywords(text: string, count = 10): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const wordFrequency: Record<string, number> = {};
  
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3 && !COMMON_WORDS.has(cleanWord)) {
      // Give more weight to title case words
      const isTitleCase = /^[A-Z]/.test(word) && word.length > 0;
      wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + (isTitleCase ? 1.5 : 1);
    }
  });

  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    // Input validation
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be less than 10,000 characters' },
        { status: 400 }
      );
    }

    // Enhanced sentiment analysis
    const { sentiment, score: sentimentScore } = analyzeSentiment(content);
    
    // Improved keyword extraction
    const keywords = extractKeywords(content, 10);
    
    // Enhanced entity recognition
    const entities = extractEntities(content);

    // Generate summary (first sentence or first 100 chars)
    const firstSentence = content.match(/^[^.!?]+[.!?]/)?.[0] || content.slice(0, 100) + '...';
    
    // Calculate readability metrics
    const words = content.split(/\s+/);
    const wordsCount = words.length;
    const sentences = content.split(/[.!?]+/).filter(Boolean).length;
    const syllables = words.reduce((count, word) => count + Math.max(1, Math.floor(word.length / 3)), 0);
    
    // Flesch-Kincaid Grade Level
    const fkGrade = 0.39 * (wordsCount / Math.max(1, sentences)) + 11.8 * (syllables / Math.max(1, wordsCount)) - 15.59;
    const readabilityScore = Math.min(100, Math.max(0, (fkGrade / 16) * 100));
    
    // Determine readability level
    let readabilityLevel = 'Standard';
    if (fkGrade < 6) readabilityLevel = 'Easy';
    if (fkGrade > 12) readabilityLevel = 'Difficult';

    // Calculate reading time (average reading speed: 200 words per minute)
    const readingTime = Math.max(1, Math.ceil(wordsCount / 200));
    
    // Calculate average word length
    const totalChars = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = wordsCount > 0 ? totalChars / wordsCount : 0;

    return NextResponse.json({
      sentiment,
      sentimentScore: parseFloat(sentimentScore.toFixed(2)),
      keywords,
      entities: entities.length > 0 ? entities : [
        {
          type: 'CONTENT_ANALYSIS',
          text: 'Wellness Content',
          relevance: 0.8
        }
      ],
      summary: firstSentence,
      metrics: {
        wordCount: wordsCount,
        sentenceCount: sentences,
        readingTime: readingTime,
        characterCount: content.length,
        averageWordLength: parseFloat(avgWordLength.toFixed(2)),
      },
      readability: {
        score: Math.round(readabilityScore),
        level: readabilityLevel,
        description: `This text is at a ${Math.max(0, fkGrade).toFixed(1)} grade reading level (${readabilityLevel.toLowerCase()}).`
      },
      version: '1.1.0',
      analyzedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error analyzing content:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to analyze content',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      },
      { status: 500 }
    );
  }
}
