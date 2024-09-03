import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';
import { experimental_buildOpenAssistantPrompt } from 'ai/prompts';
import { encode } from 'gpt-tokenizer'; // Import a tokenizer library compatible with your model

// Create a new HuggingFace Inference instance
const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// In-memory cache objects
interface Cache {
  learningMaterials: any | null;
  settings: any | null;
   prompt: any | null;
  concatenatedPrompts: string;
  combinedEngagement: string;
  messagesCache: string[]; // Explicitly define messagesCache as an array of strings
}

// Initialize cache with proper types
const cache: Cache = {
  learningMaterials: null,
  settings: null,
   prompt: null,
  concatenatedPrompts: '',
  combinedEngagement: '',
  messagesCache: [] // Initialize as an empty array of strings
};

interface Message {
  content: string;
  role: 'system' | 'user' | 'assistant';
}
// Fetch learning materials
async function fetchLearningMaterials() {
  if (cache.learningMaterials) {
    return cache.learningMaterials;
  }

  try {
    const response = await fetch('https://moneyversity-ai-chat.vercel.app/api/learningMaterials'); // This is for testing 
    const result = await response.json();
    if (result.success) {
      cache.learningMaterials = result.data;
      cache.concatenatedPrompts = result.data.map((material: { prompt: string }) => material.prompt).join('\n\n');
      return result.data;
    } else {
      console.error('Error fetching learning materials:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching learning materials:', error);
    return [];
  }
}

// Fetch settings
async function fetchSettings() {
  if (cache.settings) {
    return cache.settings;
  }

  try {
    const response = await fetch('https://moneyversity-ai-chat.vercel.app/api/settings');
    const result = await response.json();
    if (result.success) {
      cache.settings = result.data;
      cache.combinedEngagement = result.data.map((setting: any) => {
        const prompt = setting.engagingPrompt || '';
        const video = setting.engagingVideo ? `Watch this video: ${setting.engagingVideo}` : '';
        const image = setting.engagingImage ? `Here is an image related to the topic: ${setting.engagingImage}` : '';

        return [prompt, video, image].filter(Boolean).join('\n\n');
      }).join('\n\n');
      return result.data;
    } else {
      console.error('Error fetching settings:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return [];
  }
}

function trimMessages(messages: Message[], maxTokens: number) {
    let totalTokens = 0;
    const trimmedMessages: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
        const messageTokens = messages[i].content.split(' ').length; // A rough estimate
        if (totalTokens + messageTokens > maxTokens) {
            break;
        }
        totalTokens += messageTokens;
        trimmedMessages.unshift(messages[i]);
    }

    return trimmedMessages;
}

// Build the prompt with context from previous messages
function buildPrompt(messages: { content: string; role: 'system' | 'user' | 'assistant' }[]) {
  const context = messages.map(({ role, content }) => {
    if (role === 'user') {
      return `User: ${content}`;
    } else if (role === 'assistant') {
      return `Assistant: ${content}`;
    }
    return '';
  }).filter(Boolean).join('\n');

  return context;
}

async function fetchChatSettings() {
  // if (cache.prompt) {
  //   return cache.prompt;
  // }

  try {
    const response = await fetch('https://moneyversity-ai-chat.vercel.app/api/chatSettings');
    const result = await response.json();
    if (result.success) {
      cache.prompt = result.data;
      return result.data;
    } else {
      console.error('Error fetching chat settings:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching chat settings:', error);
    return [];
  }
}

async function fetchWithRetry(messages: Message[], retries = 10, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      messages = trimMessages(messages, 8192 - 100);
      const response = await Hf.textGenerationStream({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        inputs: experimental_buildOpenAssistantPrompt(messages),
        parameters: {
          
          stop_sequences: ['<|endofresponse|>', '**Video Link:**', '<|endoftext|>'],
          
        }
      });
      return response; // Return the response if successful
    } catch (error) {
      console.log(`Number of tokens in input: ${messages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0)}`);

      if (error instanceof Error) {
        console.warn(`Attempt ${i + 1} failed: ${error.message}`);
      } else {
        console.warn(`Attempt ${i + 1} failed with an unknown error`);
      }

      if (i < retries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error("All retry attempts failed.");
        throw error; // Re-throw the error after the last retry
      }
    }
  }
}







function estimateTokens(text: string): number {
    return encode(text).length; // Estimate the number of tokens using a tokenizer library
}


function trimMessagesToFitTokenLimit(messages: Message[], maxTokens: number) {
    let totalTokens = 0;
    const trimmedMessages: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
        const messageTokens = estimateTokens(messages[i].content);
        if (totalTokens + messageTokens > maxTokens) {
            break;
        }
        totalTokens += messageTokens;
        trimmedMessages.unshift(messages[i]);
    }

    return trimmedMessages;
}

function sanitizeMessages(messages: Message[]): Message[] {
    return messages.map(message => ({
        ...message,
        content: message.content.replace(/<\|endoftext\|>/g, ''),
    }));
}


function truncateConversationHistory(messages: Message[], maxMessages: number = 5): Message[] {
    return messages.slice(-maxMessages);
}

export async function POST(req: Request) {
  let { messages }: { messages: Message[] } = await req.json();

  // Ensure learning materials and settings are cached
  await fetchLearningMaterials();
  await fetchSettings();
   await fetchChatSettings();
   
  // Fetch the existing messagesCache
  const existingMessages = cache.messagesCache;

  // Append new messages to the cache
  cache.messagesCache = [...existingMessages, ...messages.map((message: Message) => message.content)];

  messages = truncateConversationHistory(messages);
  messages = sanitizeMessages(messages);

  const maxAllowedTokens = 8192 - 100; // Considering 100 tokens for max_new_tokens
  messages = trimMessagesToFitTokenLimit(messages, maxAllowedTokens);



  // Build the context from previous messages
  const context = buildPrompt(messages);

  // Construct the prompt with dynamic content
  // const prompt = `
  //   Here is the context of the conversation:
  //   ${context}

  //   Below is the information if someone asks anything:
  //   ${cache.concatenatedPrompts}

  //   Below is a fun fact you can share with the user if it’s relevant to the question or fits naturally into the conversation, always include the video and image if it is not empty:
  //   If the user specifically asks for a fun fact please provide our current fun fact data below.
  //   ${cache.combinedEngagement}

  //   End of Fun Fact
  //   After the fun fact is inserted, ask if they want to continue with building their user profile or if they have any additional questions.

  //   Note: Only ask one question at a time. Don't ask the same question if the user already provided an answer.
    
  //   After asking the consent, ask below:
  //   Insert fun fact-  Start and End of "components of estate planning" in Fun Fact. 
  //   Please only ask questions if the user has not provided an answer already:

  //   Name: 'What is your name?'
  //   Date of Birth: 'What is your date of birth?'

  //   After asking the date of birth two questions, ask below:
  //   'Before we proceed, I want to ensure you're comfortable with us collecting and storing this information securely. This data will only be used to help create your estate plan. Do you consent to this?'
   
  //   Marital Status: 'What is your marital status? (Single, Married)'
  //   If married, ask: 'What type of marriage do you have? (Community of Property, Out of Community of Property with Accrual, Out of Community of Property without Accrual, I can’t remember)'

  //   Dependents: 
  //   'Please list the types of dependents you have. (Spouse, Children, Stepchildren, Grandchildren, Other dependents)'
  //   'How many dependents are over the age of 18?'
  //   'How many dependents are under the age of 18?'

  //   Risk Tolerance: Ask this question: 'How do you feel about risk when it comes to investing in your estate? (Low Risk, Medium Risk, High Risk)'

  //   Email Address: Ask this question: 'What is your email address?'
  // `;

  //  Below are the previous conversation you have from the users, use this information and analyze it so that we can continue the conversation.
  //       This is the Start of the previous conversation
  //       ${cache.messagesCache}\n\n
  //       This is the End of the previous conversation

  //        Below are the instructions on how to interact with the user.
  //       \n
  //       ${cache.prompt.friendlyTone}\n\n

  //        Below is the information if someone asks anything:
  //       ${cache.concatenatedPrompts}
  //       \n\n

  messages = messages.map((message: Message) => {
    if (message.role === 'user') {
      return {
        ...message,
        content: `
       
        Below is the instructions if the user requested of Account Deletion
        If the user requests the deletion of their Estate Planning Profile: Ask for user name using only this templated message "Can you please provide your user name so I can assist you with deleting your Estate Planning Profile?".
        Else (once the user name is provided):
        Respond: "Your deletion request has been submitted. Your Estate Planning account will be deleted within 24 hours."
        If the user name has (not found) in his/her name: Ask for user name using only this templated message "It seems the user you provided is not in our database. Can you please provide your user name so I can assist you with deleting your Estate Planning Profile?".
       
        Below is the Instructions on how to interact with users
        Important Note: When interacting with the user, do not include stage numbers or prompt instructions in your responses. Focus only on the user-facing messages as specified.

Stage 1: Starting Message
If the user responds with "yes" or "absolutely":
Ask: "Great choice! Estate planning can help ensure your assets are protected and distributed according to your wishes. I've got a short video that explains the basics. Want to watch?"
Proceed to Stage 2.
Else:
Proceed to Stage 3.
Stage 2: Initial Selection
If the user responds with "yes" or "watch":
Respond with exactly: "Initiate video".
Else:
Proceed to Stage 3.
Stage 3: Initiate Video
If the user responds with "No, Let's move on":
Proceed to Stage 4.
Else:
Proceed to Stage 4.
Stage 4: Ask user Consent
If the user consents based on Privacy Policy (https://moneyveristylms.vercel.app/privacy) proceed to Stage 5.
Else if the user responds with "no" in the Privacy Policy:
Inform the user: "I understand and respect your decision. Unfortunately, without your consent to collect and store your information, we won’t be able to proceed with creating your estate plan. If you have any questions or need further information about our data privacy practices, please let me know."
Else:
Inform the user that you understand if they change their mind or have questions, and remain in Stage 4.
Stage 5: Profiling - Name
If the user provides their name:
Save the name and proceed to Stage 6.
Else:
Ask for their name again.
Stage 6: Date of Birth
If the user provides their date of birth:
Save the date of birth and proceed to Stage 7.
Else:
Ask for their date of birth again.
Stage 7: Marital Status
If the user responds with "Single," "Married," "Divorced," or "Widowed":
Save the marital status.
If the user is "Married":
Ask user: "Excellent. Are you married in or out of community of property, and does your marriage include the accrual system?" and proceed to Stage 7,1.
Save type of marriage
Else:
Proceed to Stage 8.
Stage 7.1 Type of Marriage
If the user is Out of Community of Property with Accrual or Out of Community of Property without Accrual
Proceed to Stage 7.3
Else
Proceed to Stage 8
Stage 7.2 Can't Remember Type of Marriage
If the user Can' Remember the type of Marriage
Ask: "No worries! Here’s a brief description of each type to help you remember:
Proceed to Stage 7.1
Stage 7.3 Document of Marriage
Ask: "Excellent. In order to calculate the accrual, we need to know the specifics of your antenuptial contract (ANC). Please upload your antenuptial contract."
Save the document name
Else
Proceed to stage 8
Stage 8: Dependents
If the user has dependents (Spouse, Children, Stepchildren, Grandchildren):
Save dependents
Proceed to Stage 9
Stage Stage 9: Dependents Under 18
Ask how many are under 18.
Save number of dependents under 18
Proceed to Stage 9.1
Stage 9.1: Dependents Over 18
Ask how many are over 18.
Save number of dependents over 18
Proceed to Stage 10
Stage 10: Risk Tolerance
If the user provides their risk tolerance:
Save the risk tolerance and proceed to Stage 11.
Else:
Ask for their risk tolerance again.
Stage 11: Email Address
If the user provides their email address:
Save the email and conclude the conversation with:
"Thanks! Is there anything else you’d like to add about your personal particulars or any questions you have at this stage?"
If the user responds with "no":
Reply with: "Thanks for using our Estate Planning Chatbot, {name}! Have a great day, and we're looking forward to helping you secure your future!"
Else:
Continue assisting the user based on their response.
Else:
Ask for their email address again.
        \n\n${message.content}`,
      };
    } else {
      return message;
    }
  });

// console.log(cache.concatenatedPrompts); // Logging messages with all cached contents

  // Clear the cache after use
  cache.learningMaterials = null;
  cache.settings = null;
  cache.concatenatedPrompts = '';
  cache.combinedEngagement = '';

  try {
    const inputs = experimental_buildOpenAssistantPrompt(messages);

     const response = await fetchWithRetry(messages);
    if (!response) {
      throw new Error("Failed to get a response from the model.");
    }

    // Convert the response into a friendly text-stream
    const stream = HuggingFaceStream(response);

    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Failed to generate a response:", error);
    return new Response("An error occurred while generating the response. Please try again later.", { status: 500 });
  }


}