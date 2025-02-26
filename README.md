Scrape data from Tally.xyz for a specific DAO.
Use AI to summarize several aspects for the proposal

- Logistics: When the proposal was submitted, when it is ready to vote on, when voting ends, the earliest execution time.
- Action: What actions does the proposal take
- Impact: What impact will this have on the protocol and the DAO treasury
- Context: What was discussed in the process (may need to include a reference to a forum post)

## User Story

1. **User Input**: The user enters their wallet address.
2. **Delegate Page Scraping**: The application navigates to the user's delegate page on Tally.xyz.
3. **DAO Membership Identification**: The application scrapes the DAOs the user is a member of.
4. **Database Entity Creation**: An entity for the user is created in the database.
5. **Proposal Scraping**: The application scrapes all proposals from the identified DAOs on the user's Tally page.
6. **Proposal Processing**: The application processes these proposals for each DAO.
7. **Proposal Summary**: The application provides a summary of the proposals to the user.

## Technical Details

### Scraping Process

1. **Setup Firecrawl.dev**:

   - Install Firecrawl.dev by following the installation instructions on their website.
   - Configure Firecrawl.dev with the necessary settings to access Tally.xyz.

2. **Navigate to Delegate Page**:

   - Use Firecrawl.dev to navigate to the user's delegate page on Tally.xyz using the provided wallet address.

3. **Scrape DAO Memberships**:

   - Extract the list of DAOs the user is a member of from the delegate page.
   - Store the DAO information in the database.

4. **Scrape Proposals**:

   - For each DAO, use Firecrawl.dev to navigate to the proposals page.
   - Extract details of each proposal, including submission date, voting dates, actions, and context.

5. **Data Storage**:

   - Store the scraped proposal data in the database, associating it with the respective DAO and user.

6. **Data Processing**:

   - Process the scraped data to generate summaries for logistics, actions, impact, and context.

7. **Summary Generation**:
   - Use AI algorithms to generate a concise summary of each proposal.
   - Present the summary to the user in a user-friendly format.

### Tools and Libraries

- **Firecrawl.dev**: Used for web scraping and navigation.
- **Database**: Used to store user, DAO, and proposal data.
- **AI Algorithms**: Used to generate summaries from the scraped data.

### Example URLs

- **Typical DAO**: [NounsDAO](https://www.tally.xyz/gov/nounsdao/proposals)
- **Delegate**: [NounsDAO Delegate](https://www.tally.xyz/gov/nounsdao/delegate/0xb1a32fc9f9d8b2cf86c068cae13108809547ef71)

### Relevant Data

#### Delegate Data (example_delegate.json)

- **Delegate Address**: `0xb1a32fc9f9d8b2cf86c068cae13108809547ef71`
- **Voting Power**: `542`
- **Received Delegations**: `8`
- **Proposals Created**: `0`
- **Proposals Voted On**: List of proposals with vote details (e.g., votes for, votes against, voted status)

#### DAO Data (example_dao.json)

- **DAO Name**: `NounsDAO`
- **Image**: ![DAO Image](https://static.tally.xyz/1decbb17-b472-4eb9-9141-92c3f86770de_400x400.jpg)

#### Proposal Data (example_proposal.md)

- **Proposal ID**: `756`
- **Proposal Title**: `#🎨 Noundry: Add Dynamic Accessory`
- **Proposed On**: `Feb 22nd, 2025`
- **Voting Period**: `Feb 25, 2025 - Mar 1, 2025`
- **Current Votes**:
  - **For**: `8`
  - **Against**: `1`
  - **Abstain**: `0`
- **Actions**: List of actions with details (e.g., method, parameters)
- **Summary**: Description of the proposal
- **Impact Overview**: Impact details (if available)
- **Status**: Current status of the proposal (e.g., published onchain, voting period started)

## Implementation Plan

### Phase 1: Scraping

1. **Setup Project**:

   - Initialize a new Node.js project.
   - Install necessary dependencies (e.g., Firecrawl.dev, database libraries).

2. **Firecrawl.dev Configuration**:

   - Configure Firecrawl.dev to access Tally.xyz.
   - Write Node.js scripts to navigate to delegate pages and scrape DAO memberships.

3. **Database Setup**:

   - Design the database schema to store user, DAO, and proposal data.
   - Implement database connection and CRUD operations using Node.js.

4. **Scraping Scripts**:

   - Implement Node.js scripts to scrape delegate data, DAO memberships, and proposals.
   - Store the scraped data in the database.

5. **Testing**:
   - Test the scraping scripts to ensure data is correctly extracted and stored.
   - Validate the data integrity and completeness.

### Phase 2: Data Processing

1. **Create Data Models**:

   - Define structured models for the scraped data:
     - DelegateModel (voting power, delegations, voting history)
     - DAOModel (name, proposals list, governance parameters)
     - ProposalModel (title, dates, votes, status, actions)
   - Implement data validation and transformation utilities

2. **Implement Data Processors**:

   - Create separate processors for each data type:
     ```
     /src/processors/
     ├── delegate.js    # Process delegate data
     ├── dao.js         # Process DAO data
     ├── proposal.js    # Process proposal data
     └── index.js       # Export all processors
     ```
   - Each processor should:
     - Parse markdown/JSON responses
     - Extract relevant information
     - Transform data into structured models
     - Store processed data for AI analysis

3. **AI Processing Pipeline**:

   - Set up OpenAI/LangChain integration
   - Create prompts for different analysis types:
     - Logistics analysis (dates, deadlines, requirements)
     - Action analysis (what the proposal will do)
     - Impact analysis (treasury, protocol changes)
     - Context analysis (background, discussions, related proposals)
   - Implement summary generation with specific focus areas

4. **Data Aggregation**:

   - Combine processed data from different sources
   - Create relationships between entities:
     - Delegate → DAOs they participate in
     - DAOs → Their proposals
     - Proposals → Voting history and delegate participation
   - Generate comprehensive reports

5. **Storage and Retrieval**:

   - Implement caching strategy for processed data
   - Store AI-generated summaries
   - Create query interface for accessing processed data

6. **Testing and Validation**:

   - Unit tests for data processors
   - Integration tests for AI pipeline
   - Validation of summary accuracy
   - Performance testing for data processing

7. **Monitoring and Logging**:
   - Track processing success/failure rates
   - Monitor AI response quality
   - Log processing times and resource usage
   - Alert on processing errors

### Expected Outputs

1. **Delegate Analysis**:

   ```json
   {
     "address": "0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71",
     "summary": {
       "votingPower": "542 votes (381.69% of Quorum)",
       "participation": "Inactive delegate",
       "votingPattern": "No recent votes",
       "influence": "High voting power but low participation"
     }
   }
   ```

2. **Proposal Summary**:

   ```json
   {
     "id": "756",
     "title": "#🎨 Noundry: Add Dynamic Accessory",
     "analysis": {
       "logistics": {
         "submission": "Feb 22nd, 2025",
         "votingPeriod": "Feb 25 - Mar 1, 2025",
         "executionTime": "Earliest possible: Mar 2, 2025"
       },
       "actions": "Adding dynamic accessory trait with placeholder for future updates",
       "impact": "Enables first dynamic Nouns NFT with evolving artwork",
       "context": "Part of ongoing Nounish art development initiatives"
     }
   }
   ```

3. **DAO Overview**:
   ```json
   {
     "name": "NounsDAO",
     "metrics": {
       "activeProposals": 4,
       "recentActivity": "High",
       "treasuryImpact": "Medium",
       "communityEngagement": "Strong"
     }
   }
   ```

### Phase 3: User Interface (Future Phase)

1. **Frontend Development**:

   - Design and implement a user-friendly interface to display the proposal summaries.
   - Allow users to input their wallet address and view their delegate data and proposal summaries.

2. **Backend API**:
   - Develop backend APIs to serve the processed data to the frontend.
   - Ensure secure and efficient data retrieval.

### Phase 4: Deployment (Future Phase)

1. **Deployment Setup**:

   - Set up deployment pipelines for both frontend and backend.
   - Deploy the application to a cloud provider.

2. **Monitoring and Maintenance**:
   - Implement monitoring tools to track the application's performance.
   - Set up maintenance routines to ensure data accuracy and system reliability.
