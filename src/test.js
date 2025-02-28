import { config } from 'dotenv';
config();

import { getUserProfile } from './user.js';
import { getSurveyResults } from './survey.js';
const DELEGATE_ADDRESS = '0x1111fd96fD579642c0D589cd477188e29b47b738';

// 0x9492510bbcb93b6992d8b7bb67888558e12dcac4

async function test() {
    try {
        const profile = await getUserProfile(DELEGATE_ADDRESS, 1);
        // console.log('Profile:', profile);

        // Get user's survey results and add to profile
        const DUMMY_ANSWERS = ['person2', 'person2', 'person2', 'person2'];
        const surveyResults = await getSurveyResults(DUMMY_ANSWERS);
        console.log(surveyResults)

        // Analyze proposals and update profile

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
