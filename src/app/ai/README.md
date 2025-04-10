# Email AI Processing System

This module provides advanced email processing capabilities using AI models. It includes tools for categorization, summarization, sentiment analysis, importance scoring, and more.

## Key Features

### 1. Multi-Label Categorization

The system can categorize emails into multiple relevant categories using either:
- Local transformer models (via xenova/transformers)
- Groq LLM API (with fallback to local models)

Supported categories include:
- Work
- Personal
- Marketing
- Financial
- Social
- Travel
- Shopping
- Updates
- Newsletters
- Receipts
- Scheduling
- Support
- Alerts
- Educational
- Invoices
- Shipping
- Legal
- Healthcare
- Events
- Promotions
- Job
- Entertainment
- Food
- Technology
- Security

### 2. Email Cleaning and Processing

The system includes advanced email processing functions:
- HTML to plain text conversion
- Signature removal
- Reply/quoted text removal
- Whitespace normalization
- Length limiting for API compatibility

### 3. Comprehensive Email Analysis

For deeper insight into emails, the system can:
- Analyze sentiment (Positive, Negative, Neutral)
- Assess importance (Critical, High, Medium, Low)
- Determine if a response is required
- Suggest a response timeframe
- Extract key topics/keywords
- Generate brief summaries

### 4. Email Response Generation

The system can generate appropriate responses to emails based on their content and optional user instructions.

## API Reference

### Email Categorization

```typescript
// Single category
const result = await categorizeEmail(emailContent, false);
console.log("Category:", result.labels[0]);

// Multiple categories
const multiResult = await categorizeEmail(emailContent);
console.log("Primary category:", multiResult.primaryCategory);
console.log("All categories:", multiResult.categories);
```

### Email Analysis

```typescript
// Analyze email sentiment, importance, etc.
const analysis = await analyzeEmail({
  subject: "Meeting Tomorrow",
  body: "Can we discuss the project status tomorrow at 2pm?",
  from: "colleague@example.com"
});

console.log("Sentiment:", analysis.sentiment);
console.log("Importance:", analysis.importance);
console.log("Requires response:", analysis.requiresResponse);
console.log("Keywords:", analysis.keywords);
```

### Email Response Generation

```typescript
// Generate a response
const response = await generateEmailResponse(
  {
    subject: "Project Status Update",
    body: "Please provide an update on the current project status by EOD.",
    from: "manager@example.com"
  },
  "Keep it brief and focus on completed milestones"
);

console.log("Generated response:", response);
```

## Configuration

The system uses environment variables for API configuration:
- `GROQ_API_KEY`: Your Groq API key for LLM processing

When Groq API is not available, the system falls back to local transformer models.

## Performance Considerations

- HTML-to-text conversion is optimized to handle various HTML formats
- Email processing uses heuristics to efficiently clean and prepare content
- For large volumes of emails, batch processing is recommended with appropriate rate limiting 