# Code Explanation Workflow

## Purpose
Interactive, step-by-step code explanation that adapts to user's understanding level.

## Input
Code is provided by:
- User copy/paste in chat
- IDE selection (automatically captured)
- File path reference

## Process

### Phase 1: Abstract Summary
1. Analyze the provided code
2. Provide **maximum 5-sentence** high-level summary covering:
   - What the code does (purpose)
   - Key components/functions involved
   - Important data transformations
   - Notable patterns or techniques used
   - Expected input/output behavior

**STOP:** Wait for user confirmation before proceeding to detailed explanation.

---

### Phase 2: Step-by-Step Breakdown

For each logical step in the code:

1. **Describe the step** - What happens at this point
2. **Show the code** - Relevant lines for this step
3. **Explain why** - Purpose of this step
4. **Note key details** - Important variables, conditions, or side effects

**Format:**
```
## Step N: [Brief title]

**What happens:**
[1-2 sentences describing the action]

**Code:**
```[language]
[relevant code snippet]
```

**Why:**
[Explanation of purpose]

**Key details:**
- Detail 1
- Detail 2

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
- After any step (to check understanding of that specific step)
- After completion (to check overall understanding)

**For conceptual code:**
1. Ask a question about the logic/flow
2. Present a scenario and ask what would happen
3. Ask them to predict output for given input

**For mathematical/algorithmic code:**
1. Give them concrete values to work through
2. Ask them to calculate step-by-step
3. Have them trace through the algorithm manually

**Quiz Format:**
```
## Understanding Check

**Question:**
[Clear question about the concept or calculation problem]

**Your turn:**
[Wait for user to answer]
```

**After user answers:**
- ✅ If correct: Confirm and optionally add insight
- ❌ If incorrect: Gently correct, explain why, point to relevant step
- ⚠️ If partially correct: Acknowledge what's right, clarify what's missing

---

### Phase 4: Completion

After all steps (and optional quiz):
1. Provide brief recap (2-3 sentences)
2. Ask if user wants deeper dive into any specific part

---

## Quiz Guidelines

### When to Quiz
- **After request only** - Never quiz unsolicited
- **Any time during explanation** - Not just at the end
- **One question at a time** - Don't overwhelm

### Question Types by Content

**For algorithms/logic:**
- Trace through with different inputs
- Predict output given input
- Identify what would break the code

**For mathematical code:**
- Calculate with concrete numbers
- Work through formula step-by-step
- Identify edge cases

**For architecture/patterns:**
- Explain why pattern was chosen
- Describe what would happen if X changed
- Compare with alternative approaches

### Feedback Style
- ✅ **Correct:** Confirm + optional insight
- ❌ **Incorrect:** Gentle correction + explanation + point to relevant step
- ⚠️ **Partial:** Acknowledge right parts + clarify missing pieces
- Never make user feel bad for wrong answer
- Always provide learning opportunity

---

## Rules

### Abstraction Level
- **Start high-level** - Don't dive into implementation details immediately
- **Go deeper only when asked** - User controls depth with questions
- **Avoid rabbit holes** - Stay focused on the main flow unless user requests tangents

### Clarity
- **Use simple language** - Avoid jargon unless necessary
- **Show, don't just tell** - Include code snippets for each step
- **Relate to familiar concepts** - Use analogies when helpful

### Interactivity
- **Always stop after each step** - Never auto-proceed through multiple steps
- **Encourage questions** - Make it clear user can ask anything
- **Adapt explanations** - If user seems confused, simplify; if they want more, add detail

### Scope
- **Focus on what's provided** - Don't explain unrelated code unless asked
- **Track dependencies** - Note when functions call other functions, but don't explain those unless asked
- **Mention context** - If code depends on external state/config, note it

---

## Example Flow

**User:** "explain this code" [pastes upscaling function]

**Assistant:**
> **Abstract Summary:**
> This function multiplies two 18-decimal fixed-point numbers and scales the result back to 18 decimals. It performs overflow checking to ensure the multiplication doesn't exceed uint256 limits. The result is rounded down by dividing by 10^18. This is used throughout the codebase to handle decimal math in Solidity, which doesn't have native floating-point support. The "Down" in the name indicates truncation toward zero.

> Ready to proceed with step-by-step breakdown?

**User:** "yes"

**Assistant:**
> ## Step 1: Multiply the numbers
>
> **What happens:** The function multiplies two fixed-point numbers together.
>
> **Code:**
> ```solidity
> uint256 product = a * b;
> ```
>
> **Why:** When you multiply 1.5 × 2.0 in fixed-point (1.5e18 × 2.0e18), you get 3.0e36 - double the precision we want.
>
> **STOP:** Questions about Step 1?

**User:** "what is e18?"

**Assistant:**
> `e18` means "× 10^18" (scientific notation). In Solidity:
> - `1e18` = 1,000,000,000,000,000,000
> - It represents 1.0 in 18-decimal fixed-point
> - `1.5e18` = 1,500,000,000,000,000,000 (represents 1.5)
>
> Ready to proceed to Step 2?

[After completing all steps...]

**User:** "quiz me"

**Assistant:**
> ## Understanding Check
>
> **Question:**
> Given this mulDown function, calculate the result manually:
> ```
> a = 1.5 (represented as 1.5e18 = 1,500,000,000,000,000,000)
> b = 2.0 (represented as 2.0e18 = 2,000,000,000,000,000,000)
> ```
>
> What is `mulDown(a, b)`?
>
> Show your calculation step by step:
> 1. What is `product = a * b`?
> 2. What is `product / ONE`?
> 3. What does the final result represent?
>
> **Your turn:**

**User:** "1. product = 3e36, 2. 3e18, 3. represents 3.0"

**Assistant:**
> ✅ **Correct!**
>
> Perfect understanding! You correctly:
> - Calculated the product: 1.5e18 × 2.0e18 = 3.0e36
> - Scaled it back: 3.0e36 / 1e18 = 3.0e18
> - Interpreted the result: 3.0e18 represents 3.0 in fixed-point
>
> **Extra insight:** Notice how the intermediate `product` had double precision (36 decimals), which is why we must divide by ONE to get back to 18 decimals. This is the core of fixed-point multiplication.
>
> Want another quiz or ready to move on?

---

## Notes
- Maximum 5 sentences for abstract summary (strict)
- One step at a time (strict)
- Stop after every single step (strict)
- User controls depth through questions
- No unsolicited deep dives
