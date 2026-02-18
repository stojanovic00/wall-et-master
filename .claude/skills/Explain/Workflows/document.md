# Document Explanation Workflow

## Purpose
Interactive, step-by-step explanation of technical whitepapers, blog posts, and articles with focus on key concepts and implications.

## Input
Document is provided by:
- URL/link to article or whitepaper
- Copy/paste of text content
- PDF file path
- Specific section/paragraph selection

## Process

### Phase 1: Abstract Summary
1. Analyze the provided document/section
2. Provide **maximum 5-sentence** high-level summary covering:
   - Main thesis/argument
   - Key innovation or contribution
   - Important concepts introduced
   - Methodology or approach used
   - Practical implications or takeaways

**STOP:** Wait for user confirmation before proceeding to detailed breakdown.

---

### Phase 2: Step-by-Step Breakdown

For each major section or concept:

1. **Describe the section** - What's being discussed
2. **Quote key parts** - Relevant excerpts
3. **Explain significance** - Why this matters
4. **Clarify jargon** - Define technical terms introduced
5. **Connect concepts** - How it relates to previous sections

**Format:**
```
## Step N: [Section/Concept Title]

**What's discussed:**
[1-2 sentences summarizing the section]

**Key excerpt:**
> "Relevant quote from document"

**Significance:**
[Why this section matters, what problem it solves]

**Key terms:**
- **Term 1:** Definition/explanation
- **Term 2:** Definition/explanation

**Connection:**
[How this builds on or relates to previous concepts]

**STOP:** Ready for questions about Step N.
```

**After each step:**
- **STOP and wait** for user to say "proceed", "next", or ask questions
- If user asks questions, answer them about the current step
- Only proceed to next step after explicit confirmation

---

### Phase 3: Understanding Check (Quiz)

**Trigger:** User says "quiz me", "check my understanding", "test me"

Can be invoked:
- After any section (to check understanding of that specific concept)
- After completion (to check overall understanding)

**For conceptual content:**
1. Ask them to explain a key concept in their own words
2. Present a scenario and ask how the concept applies
3. Ask them to compare/contrast related ideas

**For technical/mathematical content:**
1. Give concrete numbers/values to work through
2. Ask them to apply formulas or mechanisms
3. Have them work through a real example

**For mechanisms/protocols:**
1. Present a scenario and ask what would happen
2. Ask them to trace through the process step-by-step
3. Give them edge cases to reason about

**Quiz Format:**
```
## Understanding Check

**Question:**
[Clear question about the concept, or problem to solve]

**Your turn:**
[Wait for user to answer]
```

**After user answers:**
- ✅ If correct: Confirm and optionally add insight
- ❌ If incorrect: Gently correct, explain why, point to relevant section
- ⚠️ If partially correct: Acknowledge what's right, clarify what's missing

---

### Phase 4: Completion

After all sections (and optional quiz):
1. Synthesize the main insights (2-3 sentences)
2. Highlight practical applications or implications
3. Ask if user wants deeper dive into any specific section

---

## Quiz Guidelines

### When to Quiz
- **After request only** - Never quiz unsolicited
- **Any time during explanation** - Not just at the end
- **One question at a time** - Don't overwhelm

### Question Types by Content

**For concepts/theory:**
- Explain in your own words
- Give a real-world example
- Compare with related concepts

**For mechanisms/protocols:**
- Walk through a scenario
- Trace process with specific values
- Identify what happens in edge cases

**For mathematical/economic models:**
- Calculate with concrete numbers
- Work through formula application
- Analyze impact of parameter changes

### Feedback Style
- ✅ **Correct:** Confirm + optional insight
- ❌ **Incorrect:** Gentle correction + explanation + point to relevant section
- ⚠️ **Partial:** Acknowledge right parts + clarify missing pieces
- Never make user feel bad for wrong answer
- Always provide learning opportunity

---

## Rules

### Abstraction Level
- **Start with big picture** - Don't dive into technical details immediately
- **Layer complexity gradually** - Build understanding step by step
- **Go deeper only when asked** - User controls depth with questions
- **Avoid tangents** - Stay focused on document's main flow

### Clarity
- **Translate jargon** - Define technical terms in plain language
- **Use analogies** - Relate complex concepts to familiar ideas
- **Provide context** - Explain why concepts matter, not just what they are
- **Visual structure** - Use formatting to make relationships clear

### Interactivity
- **Always stop after each section** - Never auto-proceed
- **Encourage questions** - Make it clear user can ask anything
- **Adapt depth** - Simplify if confused, add detail if they want more
- **Track understanding** - If user seems lost, backtrack and re-explain

### Scope
- **Focus on provided content** - Don't explain background unless asked
- **Note prerequisites** - Mention if section assumes prior knowledge
- **Link to related work** - Reference related concepts when relevant
- **Highlight implications** - Show practical applications

---

## Document Types

### Whitepapers
- Focus on: Problem → Solution → Innovation → Impact
- Emphasize: Technical mechanisms and novel contributions
- Watch for: Mathematical formulas, protocol designs, economic models

### Blog Posts
- Focus on: Main argument → Supporting evidence → Conclusions
- Emphasize: Key insights and practical takeaways
- Watch for: Code examples, diagrams, case studies

### Research Papers
- Focus on: Research question → Methodology → Findings → Significance
- Emphasize: Experimental setup and results interpretation
- Watch for: Statistical analysis, experimental design, limitations

### Technical Documentation
- Focus on: Concepts → Architecture → Implementation → Usage
- Emphasize: How systems work and how to use them
- Watch for: API specs, configuration options, best practices

---

## Example Flow

**User:** "explain this whitepaper" [provides Balancer V2 whitepaper URL]

**Assistant:**
> **Abstract Summary:**
> Balancer V2 introduces a generalized AMM architecture with a single Vault contract managing all pool assets. The key innovation is separating asset management from pool logic, allowing pools to share liquidity and enabling gas-efficient multi-hop swaps. It introduces three pool specializations (General, Minimal Swap Info, Two Token) optimized for different use cases. The protocol uses a novel "flash swap" mechanism where settlements happen after all swaps execute. This architecture reduces gas costs by 30-50% compared to Balancer V1 while enabling composability between pools.

> Ready to proceed with step-by-step breakdown?

**User:** "yes"

**Assistant:**
> ## Step 1: The Single Vault Architecture
>
> **What's discussed:**
> Balancer V2's core innovation is consolidating all pool assets into one Vault contract instead of each pool managing its own tokens.
>
> **Key excerpt:**
> > "The Vault is Balancer V2's core contract. A single instance of it exists for the entire network, and it is the entity used to interact with Pools by Liquidity Providers who join and exit them, Traders who swap, and Asset Managers who withdraw and deposit tokens."
>
> **Significance:**
> This design allows multiple pools to share the same tokens without moving assets between contracts, dramatically reducing gas costs and enabling novel features like internal balances and batch swaps.
>
> **Key terms:**
> - **Vault:** Single contract holding all assets for all Balancer pools
> - **Internal Balance:** User deposits held in Vault for gas-efficient operations
> - **Asset Manager:** External contract that can invest idle pool assets
>
> **Connection:**
> This is the foundational change that enables everything else in V2. Traditional AMMs (like Uniswap V2) require each pool to be a separate contract holding its own tokens.
>
> **STOP:** Questions about Step 1?

**User:** "what's the benefit of shared tokens?"

**Assistant:**
> Great question! When pools share tokens in the Vault:
>
> 1. **Multi-hop swaps are cheaper:** DAI→USDC→WETH can happen with only 2 token transfers (DAI in, WETH out) instead of 4, because USDC just changes accounting in the Vault
>
> 2. **Flash swaps work:** You can receive tokens first, use them, then pay at the end of the transaction - all without actual token transfers in between
>
> 3. **Liquidity is more efficient:** If three pools all use USDC, that USDC sits in one place and can be used by all three simultaneously
>
> **Analogy:** Instead of each store having its own bank account (V1), there's one central bank (Vault) and stores just update ledgers (V2). Moving money between stores is just accounting, not actual transfers.
>
> Ready to proceed to Step 2?

[After completing all steps...]

**User:** "quiz me"

**Assistant:**
> ## Understanding Check
>
> **Scenario:**
> You want to swap 100 DAI for WETH using Balancer V2. There's no direct DAI/WETH pool, but there are:
> - Pool A: DAI/USDC
> - Pool B: USDC/WETH
>
> **Questions:**
> 1. How many token transfers happen in the Vault architecture?
> 2. What happens to USDC during this swap?
> 3. How is this different from traditional AMMs like Uniswap V2?
>
> **Your turn:**

**User:** "1. Two transfers (DAI in, WETH out). 2. USDC just changes accounting in the Vault, no actual transfer. 3. In Uniswap V2 there would be 4 transfers because each pool is separate."

**Assistant:**
> ✅ **Excellent!**
>
> You nailed all three points:
> - Only 2 actual token transfers (DAI enters Vault, WETH exits Vault)
> - USDC stays in the Vault the whole time, just accounting changes
> - Traditional AMMs would do: DAI→Pool A, USDC→User, USDC→Pool B, WETH→User (4 transfers!)
>
> **Extra insight:** This is why Balancer calls them "multi-hop" swaps - you hop through intermediate pools without the tokens actually moving. The Vault acts like a clearinghouse, settling everything at the end.
>
> This is also how flash swaps work - you can receive WETH first, use it for something, then provide the DAI payment at the end of the transaction!
>
> Want to quiz on another concept or explore flash swaps deeper?

---

## Notes
- Maximum 5 sentences for abstract summary (strict)
- One section/concept at a time (strict)
- Stop after every single step (strict)
- Define all jargon when first encountered
- Use quotes from source material
- Connect concepts to build understanding
- User controls depth through questions
