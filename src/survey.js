import { chat } from './service/ollama/ollama.js';

const MODEL = process.env.OLLAMA_MODEL || 'mistral'

export const pairs = [
    {
        imageUrl: "https://raw.githubusercontent.com/dao-agent/web3-personas/main/images/round1.jpg",
        person1: {
            name: "Vitalik Buterin",
            attributes: ["Open Participation", "Censorship Resistance", "Public Goods"]
        },
        person2: {
            name: "Satoshi Nakamoto",
            attributes: ["Decentralization", "Trustlessness", "Sound Money"]
        }
    },
    {
        imageUrl: "https://raw.githubusercontent.com/dao-agent/web3-personas/main/images/round2.jpg",
        person1: {
            name: "Elon Musk",
            attributes: ["People’s Crypto", "Cautious Innovation", "Sustainability"]
        },
        person2: {
            name: "Erik Voorhees",
            attributes: ["Financial Sovereignty", "Self-Custody", "Liberty"]
        }
    },
        }
    },
    {
        person1: {
            name: "Danny Ryan",
            attributes: ["Decentralized Governance", "Proof-of-Stake", "Transparency"],
            imageUrl: "https://raw.githubusercontent.com/dao-agent/web3-personas/main/images/danny.jpg"
        },
        person2: {
            name: "Aya Miyaguchi",
            attributes: ["Community Empowerment", "Core Values", "Infinite Garden"],
            imageUrl: "https://raw.githubusercontent.com/dao-agent/web3-personas/main/images/aya.jpg"
        }
    },
    {
        person1: {
            name: "Michael Saylor",
            attributes: ["Digital Gold", "Inflation Hedge", "Institutional Adoption"],
            imageUrl: "https://raw.githubusercontent.com/dao-agent/web3-personas/main/images/michael.jpg"
        },
        person2: {
            name: "Brian Armstrong",
            attributes: ["Economic Freedom", "Open Financial System", "Custodianship"],
            imageUrl: "https://raw.githubusercontent.com/dao-agent/web3-personas/main/images/brian.jpg"
        }
    }
];

const parseAnswers = (answers) => {
    if (answers.length !== pairs.length) {
        throw new Error("Answers length must match number of pairs.");
    }

    const result = answers.reduce((acc, answer, index) => {
        const pair = pairs[index];
        if (answer === "person1") {
            acc.selected.push(...pair.person1.attributes);
            acc.negative.push(...pair.person2.attributes);
        } else if (answer === "person2") {
            acc.selected.push(...pair.person2.attributes);
            acc.negative.push(...pair.person1.attributes);
        } else {
            throw new Error(`Invalid answer at index ${index}: ${answer}`);
        }
        return acc;
    }, { selected: [], negative: [] });

    return result;
}

export const getSurveyResults = async (answers) => {
    const attributes = parseAnswers(answers);

    const summary = await generatePersonaSummary(attributes);
    return summary
}

const generatePersonaSummary = async (attributes) => {
    const { selected, negative } = attributes;

    const prompt = `Given a person with the following characteristics:
Strongly values: ${selected.join(', ')}
Does not prioritize: ${negative.join(', ')}

Generate a 2-3 sentence summarizing their beliefs and hopes for the future of blockchain and web3. Don't be afraid to be bold or controversial.
Focus on their values and priorities. Make it funny a fortune and polarizing. Your response should start with "you are" or "you will be".`;

    let response = '';
    try {
        await chat(MODEL, prompt, (json) => {
            if (json.message?.content) {
                response += json.message.content;
            }
        });
        return response;
    } catch (error) {
        console.error('Error generating persona summary:', error);
        return 'Unable to generate persona summary';
    }
}


