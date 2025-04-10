# AI Email Processing Module

This module provides a comprehensive set of tools for AI-powered email processing, enabling semantic search, categorization, prioritization, and metadata extraction from emails.

## Features

- **Vector Database Integration**: Store and search emails using semantic similarity with Upstash Vector
- **Email Analysis**: Extract key information, categorize, and prioritize emails
- **Batch Processing**: Efficiently process multiple emails with optimized resource usage
- **Database Storage**: Store AI analysis results in PostgreSQL for future reference
- **Security**: User-specific namespaces ensure data isolation between users

## Core Components

### Main API (`ai.ts`)

The central export point that consolidates all AI functionality and provides the primary `enhanceEmail` function.

### Vector Operations (`utils/vectors.ts`)

- **Store emails** as vectors for semantic search
- **Query vectors** to find similar emails
- **Namespace management** to isolate user data
- **Batch operations** for efficient processing

### Search Utilities (`utils/search.ts`)

- **Semantic search** to find similar emails
- **Text query support** to search by content
- **Flexible matching** based on email content or direct queries

### Text Analysis (`utils/groq.ts`)

- **Categorization** to classify emails by type
- **Prioritization** to determine importance
- **Summarization** to create concise email summaries
- **Action item extraction** to identify tasks
- **Contact information extraction** to capture key people

### Database Integration (`utils/database.ts`)

- **Store analysis results** in PostgreSQL
- **Retrieve metadata** for previously analyzed emails
- **Query by category or priority** for organization

### Batch Processing (`utils/batch.ts`)

- **Process email batches** for efficiency
- **Store batch results** in vector and SQL databases
- **Analyze existing emails** without storing

### Data Cleaning (`utils/clean.ts`)

- **Clean HTML content** for better analysis
- **Extract relevant text** from complex emails
- **Sanitize metadata** for storage

## Namespace Architecture

Each user's emails are stored in their own isolated namespace in the vector database for enhanced security and organization. The namespace format is:

```
user_<userId>
```

This ensures that:
1. Users can only search their own emails
2. Vector operations scale more efficiently
3. User data remains logically separated

## Usage Examples

### Process a Single Email

```typescript
import { enhanceEmail } from '@/app/ai/new/ai';

// Process an email and store the results
const result = await enhanceEmail(email);
if (result.success) {
  const processedEmail = result.data;
  // Use the enhanced email with AI metadata
}
```

### Search for Similar Emails

```typescript
import { searchSimilarEmails } from '@/app/ai/new/ai';

// Find emails similar to the provided one
const matches = await searchSimilarEmails(email);
```

### Process Emails in Batch

```typescript
import { processBatchEmails } from '@/app/ai/new/ai';

// Process multiple emails efficiently
const batchResult = await processBatchEmails(emails);
```

## Error Handling

All functions include comprehensive error handling with detailed error messages. Vector operations include retry mechanisms to handle temporary network issues or rate limiting.

## Data Structures

### EmailAIMetadata (Database Schema)

```prisma
model EmailAIMetadata {
  id                 String   @id @default(uuid())
  emailId            String   @unique
  category           String?
  priority           String?
  priorityExplanation String?
  summary            String?
  ...
}
```

## Improvements over the Previous Version

1. **Better Type Safety**: Strong TypeScript typing throughout the codebase
2. **Enhanced Security**: User-specific namespaces for data isolation
3. **Improved Performance**: Batch processing and optimized database operations
4. **Expanded Functionality**: More comprehensive AI analysis 
5. **Database Integration**: Full PostgreSQL integration for storing analysis results
6. **Better Error Handling**: Comprehensive error management and recovery
7. **Consistent Architecture**: Standardized patterns across all utilities 