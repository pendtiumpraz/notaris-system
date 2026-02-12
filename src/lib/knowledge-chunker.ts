/**
 * Knowledge Chunker Utility
 * Split knowledge base content into searchable chunks for RAG
 */

const DEFAULT_MAX_CHUNK_SIZE = 1500; // characters (~430 tokens)
const DEFAULT_OVERLAP = 100; // characters overlap between chunks

interface ChunkResult {
  content: string;
  metadata: {
    heading?: string;
    index: number;
  };
}

/**
 * Split content into chunks for knowledge base search
 * Strategy:
 * 1. Split by headings (## or ###) first
 * 2. If a section is too large, split by paragraphs
 * 3. If a paragraph is too large, split by sentences
 * 4. Add overlap from previous chunk for context continuity
 */
export function chunkContent(
  content: string,
  maxChunkSize: number = DEFAULT_MAX_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): ChunkResult[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // If content is small enough, return as single chunk
  if (content.length <= maxChunkSize) {
    return [{ content: content.trim(), metadata: { index: 0 } }];
  }

  const chunks: ChunkResult[] = [];

  // Step 1: Split by headings
  const sections = splitByHeadings(content);

  for (const section of sections) {
    if (section.content.length <= maxChunkSize) {
      chunks.push({
        content: section.content.trim(),
        metadata: {
          heading: section.heading,
          index: chunks.length,
        },
      });
    } else {
      // Step 2: Split large sections by paragraphs
      const paragraphChunks = splitByParagraphs(section.content, maxChunkSize, overlap);

      for (const pChunk of paragraphChunks) {
        chunks.push({
          content: pChunk.trim(),
          metadata: {
            heading: section.heading,
            index: chunks.length,
          },
        });
      }
    }
  }

  // Apply overlap between chunks
  if (overlap > 0 && chunks.length > 1) {
    for (let i = 1; i < chunks.length; i++) {
      const prevContent = chunks[i - 1].content;
      const overlapText = prevContent.slice(-overlap);
      // Only add overlap if it doesn't start mid-word
      const cleanOverlap = overlapText.includes(' ')
        ? overlapText.slice(overlapText.indexOf(' ') + 1)
        : overlapText;
      chunks[i].content = `...${cleanOverlap} ${chunks[i].content}`;
    }
  }

  // Re-index
  chunks.forEach((chunk, i) => {
    chunk.metadata.index = i;
  });

  return chunks;
}

/**
 * Split content by markdown headings
 */
function splitByHeadings(content: string): Array<{ heading?: string; content: string }> {
  const lines = content.split('\n');
  const sections: Array<{ heading?: string; content: string }> = [];
  let currentHeading: string | undefined;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n').trim(),
        });
      }
      currentHeading = headingMatch[1].trim();
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n').trim(),
    });
  }

  return sections;
}

/**
 * Split text by paragraphs, merging small paragraphs and splitting large ones
 */
function splitByParagraphs(text: string, maxSize: number, _overlap: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (para.length > maxSize) {
      // Save current chunk if exists
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // Split large paragraph by sentences
      const sentenceChunks = splitBySentences(para, maxSize);
      chunks.push(...sentenceChunks);
    } else if (currentChunk.length + para.length + 2 > maxSize) {
      // Current chunk would be too large, save it and start new
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      // Add paragraph to current chunk
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Split text by sentences as last resort
 */
function splitBySentences(text: string, maxSize: number): string[] {
  // Split by sentence-ending punctuation
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 > maxSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
