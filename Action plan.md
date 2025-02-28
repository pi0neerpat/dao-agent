# Vote Prediction Feature – Updated Action Plan

## Overview

Enhance proposal analysis by integrating a vote prediction feature that uses a single AI query. The query will combine a provided user profile with proposal details to return a binary vote ("Yes" or "No") plus a brief explanation.

## User Story

As a DAO delegate, I want to see an AI-generated prediction on the proposal outcome along with its rationale, so I can better understand how my profile factors into the decision.

## Scope

- **Input Data**:
  - Provided user profile (already aggregated externally)
  - Proposal details (title, status, summary, extended description, voting stats, etc.)
- **Output**:
  - A binary vote prediction ("Yes" or "No")
  - A short explanation of the reasoning behind the prediction

## Code Changes Required

1. **Update Proposal Analysis Pipeline**

   - Modify the service layer (e.g., in proposalAnalyzer.js) to include a new function that performs the vote prediction.
   - Extend the existing AI query logic to combine both the proposal details and the provided user profile.
   - Update the prompt to request both a vote prediction and an explanation in a single response.

2. **Integrate Vote Prediction in the Test Flow**

   - In the test file (test.js), update the analysis flow to include the vote prediction alongside the summary and Q&A.
   - Add a step that collects the vote prediction result and attaches it to the analyzed proposal results.

3. **Update Output Format**

   - Enhance the analysis output (e.g., in saveAnalysisToFile) to include the vote prediction and its explanation along with the summary.

4. **Documentation & Testing**
   - Update documentation describing the new vote prediction feature.
   - Add unit tests covering different user profiles and proposal scenarios to validate the prediction logic and output format.

## Next Steps

- Finalize the new AI prompt and decide on the exact phrasing.
- Implement the modular vote prediction function.
- Integrate the function into the current analysis pipeline and update tests.
