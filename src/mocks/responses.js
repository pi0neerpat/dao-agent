import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load mock data from JSON files
// const delegateData = JSON.parse(readFileSync(join(__dirname, '../../example_delegate.json')));
// const daoData = JSON.parse(readFileSync(join(__dirname, '../../example_dao.json')));
// const proposalData = JSON.parse(readFileSync(join(__dirname, '../../example_proposal.json')));

export const mockResponses = {
    // delegate: delegateData,
    // dao: daoData,
    // proposal: proposalData
};

export default mockResponses;
