# Explain

## Purpose
Language-agnostic code explanation skill that breaks down complex code into digestible steps with interactive clarification.

## Available Workflows

### Code Explanation
**Location:** `Workflows/code.md`
**Trigger:** "explain this code" or "explain [code/function/logic]"
**Description:** Interactive step-by-step code explanation with pause points for clarification questions.

**Process:**
1. Abstract summary (max 5 sentences)
2. Step-by-step breakdown
3. Stop after each step for questions
4. Continue only after user confirmation

**When to use:** When you need to understand unfamiliar code, complex algorithms, or system interactions.

### Document Explanation
**Location:** `Workflows/document.md`
**Trigger:** "explain this whitepaper/article/post" or "explain [document URL]"
**Description:** Interactive breakdown of technical whitepapers, blog posts, and articles with concept clarification.

**Process:**
1. Abstract summary (max 5 sentences)
2. Section-by-section breakdown
3. Stop after each section for questions
4. Define jargon and connect concepts

**When to use:** For understanding whitepapers, technical articles, research papers, or blog posts about complex topics.

---

## Usage

To invoke workflows:

**For Code:**
- "explain this code" - For code copied/pasted or selected in IDE
- "explain how X works" - For specific functions/logic

**For Documents:**
- "explain this whitepaper" - Provide URL or paste content
- "explain this article" - For blog posts and technical articles
- "explain this section" - For specific paragraphs/sections

**During Explanation:**
- "proceed" or "next" - Continue to next step
- Ask questions anytime - Get clarification on current step
- "quiz me" or "test me" - Check understanding with questions/problems

---

## Features

### Interactive Quiz Mode
After explaining any step or section:
- **"quiz me"** - Get questions to verify understanding
- **Mathematical problems** - Work through calculations manually
- **Scenario-based questions** - Apply concepts to real situations
- **Immediate feedback** - Know if you got it right and why

## Notes
- Works with any programming language or document type
- Depth of explanation controlled by user questions
- No excessive detail unless explicitly requested
- Focuses on "what" and "why", not just "how"
- Quiz mode adapts to content type (code vs concepts vs math)
