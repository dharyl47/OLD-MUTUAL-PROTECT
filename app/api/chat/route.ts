import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';
import { experimental_buildOpenAssistantPrompt } from 'ai/prompts';

// Create a new HuggingFace Inference instance
const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// Function to split a message into chunks if it exceeds a certain length
function splitMessage(content: any, chunkSize = 800) {
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}

function buildPrompt(
  messages: { content: string; role: 'system' | 'user' | 'assistant' }[]
) {
  return (
    messages
      .map(({ content, role }) => {
        if (role === 'user') {
          return `<|prompter|>${content}<|endoftext|>`;
        } else {
          return `<|assistant|>${content}<|endoftext|>`;
        }
      })
      .join('') + '<|assistant|>'
  );
}

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  let { messages } = await req.json();

  // Define the prompt including Old Mutual information
  const prompt = `
    Please only answer using the information provided between (START Old Mutual Protect) and (END Old Mutual Protect) in the Old Mutual Protect - RSA Reference Guide.
    If user question is not related in the Old Mutual Protect - RSA Reference Guide please respond to the user with this templated message
    "I'm sorry, I currently don't have information on that topic. Please ask about Old Mutual Protect life insurance products or related topics."

    Available Information:
     If user question is not related in the Old Mutual Protect - RSA Reference Guide please respond to the user with this templated message
    "I'm sorry, I currently don't have information on that topic. Please ask about Old Mutual Protect life insurance products or related topics."

    Refined Prompt with HTML Formatting Instructions:

Please format all responses using basic HTML tags for readability. Specifically:

Use <p> tags for paragraphs.
Use <br> tags for line breaks between sections.
Use <ul> for unordered lists and <ol> for ordered lists, with <li> for each list item.
Bold important points using <b>, and italicize text using <i>.
Use <h1>, <h2>, or <h3> tags for headings and subheadings to organize content.
For links, use <a href="URL"> to embed hyperlinks.
Use <blockquote> to highlight important quotes.
Insert horizontal lines using <hr> to separate different sections of the response.
Make sure to return the response in proper HTML formatting.

            (START Old Mutual Protect)
Life Insurance Overview: Life insurance is a contract where an owner (policyholder) and an insurer agree that the insurer will pay a designated beneficiary a sum of money in exchange for regular premium payments, should the insured person die during the benefit term. The insurance amount can be paid either as a single lump sum or in monthly installments.

Old Mutual offers four types of life insurance cover:

Life Cover: Pays a lump sum on death or terminal illness.
Life Income Cover: Pays monthly income after the insured person passes away.
Last Survivor Cover: Covers two lives and pays out after both have passed away.
Accidental Death Cover: Pays a lump sum if the insured person dies due to an accident.
Old Mutual Protect Life Cover: Life Cover pays a lump sum if the insured person passes away or is diagnosed with a terminal illness. Add-ons are available for extra coverage based on individual needs.

Key Features:

Disability Cover: Provides payouts if the insured person becomes disabled and can no longer work. Includes:

Own Occupation Benefit: Pays out if you can no longer perform your job.
Partial Functional Impairment Benefit: Covers partial impairments.
Child Impairment Benefit: Covers impairments in children.
Functional Impairment Cover: Provides benefits for partial impairments that affect daily living, including:

Partial Functional Impairment Benefit
Child Impairment Benefit
Physical Impairment Cover: Provides financial support for physical impairments.

Severe Illness Cover: Pays out if diagnosed with a severe illness, with benefits including:

Top-up Benefit: Increases payout in specific scenarios.
Mild Illness Benefit: Covers less severe health conditions.
Child Illness Benefit: Provides payouts if a child is seriously ill.
For Women Benefit: Special coverage for women’s health concerns.
Rider Benefits:

Premium Protection: Policyholders can select a maximum of two Premium Protection benefits, ensuring that premiums are taken care of in the event of death, disability, or retrenchment.

Premium Protection Death
Premium Protection Disability or Premium Protection Functional Impairment
Premium Protection Retrenchment
Cashback Feature: Optional benefit where a portion of premiums is refunded after a certain period without claims.

Coverage Limits:

Minimum Coverage: R100,000.
Maximum Coverage:
Employed: No maximum limit (based on salary).
Home Executives: Up to R4,000,000 (subject to three times the yearly salary of the spouse/partner for cover above R2,500,000).
Students: Up to R1,000,000.
Unemployed: Up to R650,000.
Benefit Term: Choose between whole-life cover or a fixed term of at least 5 years.

End Age: Life Cover can last your whole life or end at age 100.

Yearly Cover Increase: Policyholders can opt to increase their coverage yearly by:

0%, 5%, or 10% at a fixed rate.
Inflation-linked increases based on the Consumer Price Index (CPI).
Currency-linked options based on the GBP, USD, or EUR exchange rates.
Underwriting Method:

No Medical Tests: Required in some cases for smaller amounts.
Medical Tests or Questions: May be required for larger amounts.
Underwriting Credit: Policyholders may qualify for underwriting credits based on the level of medical underwriting completed.

Terminal Illness Benefit: Life Cover includes a built-in Terminal Illness Benefit, allowing policyholders to claim the full amount if diagnosed with a terminal illness expected to result in death within 12 months. After the claim is paid, the policy terminates.

The terminal illness benefit stops upon:

The insured person's death.
The benefit end date.
If the benefit lapses.
If the contract is canceled.
12 months before the benefit end date (for term cover).
Claiming Life Cover:

Claim Example (No Add-ons):
If Julian has R1,000,000 Life Cover on Lydia’s life and Lydia dies, Julian will receive a single payout of R1,000,000.

Claim Example (With One Add-on):
If Xander has R1,000,000 Life Cover and a R500,000 Severe Illness Cover add-on, and Jackie suffers a heart attack assessed at 75% severity, resulting in a payout of R375,000, both the Severe Illness Cover and Life Cover will reduce by R375,000. The remaining Life Cover will be R625,000, with a Severe Illness add-on of R125,000.

Claim Example (With Two Add-ons):
If Camilla has R1,000,000 Life Cover, R500,000 Severe Illness Cover, and R500,000 Disability Cover on Colin’s life, and Colin suffers a permanent disability, a claim on the Disability Cover will reduce both the Disability and Life Cover by R500,000, leaving a balance of R500,000 in Life Cover and R500,000 in Severe Illness Cover.

Linked Cover:
A claim on any add-on will also reduce the amount of any linked cover. For example, if a claim on an add-on reduces the Life Cover below the value of another add-on, the second add-on will be adjusted downward to match the remaining Life Cover.

Exclusions:

Suicide: No payout will be made if the insured person commits suicide within the first two years of the policy.
General Exclusions: Include death resulting from activities like extreme sports, riots, or criminal activities.
Old Mutual Protect Life Income Cover: Life Income Cover is a monthly income plan for beneficiaries after the insured person dies. Payments are guaranteed for at least 5 years or the chosen term.

Suitable for:

Families needing a steady income to pay off debts or support dependents.
Key Features:

Cover Type: Monthly payments, guaranteed for at least 5 years.
Minimum Entry Age: 18 years old.
Maximum Entry Age: 80 years old.
Premium Frequency: Monthly or yearly, with an option to skip one premium per year.
Cover Amount: Minimum of R3,000 per month, no upper limit (based on salary).
Increases: Policyholders can choose yearly increases of 0%, 5%, or inflation-linked adjustments.
Claiming Life Income Cover:

Claim Example:
If Peyton has R10,000 per month Life Income Cover and dies on 10 December 2032, her first payment will be on 28 February 2033. A lump sum of R30,000 will cover payments for December 2032, January 2033, and February 2033, followed by monthly payments of R10,000 until the end of the term.
Guaranteed Payments:
Payments are guaranteed for five years, even if the insured person dies less than five years before the cover end date.

In-Claim Escalation:
If scheduled yearly cover increases are active on the Life Income Cover before the claim event date, they will continue while in claim status. No premium will be required during this period.

Premium Refund:
All premiums paid after the claim event will be refunded.

If the beneficiary dies while receiving Life Income Cover payments, a lump sum will be paid to the beneficiary’s estate for the remaining value of the payments.

Old Mutual Protect Last Survivor Cover: A specific beneficiary cannot be nominated to receive the payout. The payout will be made to the estate of the last surviving insured person to help settle estate duties and other obligations.

Last Survivor Cover pays out when the second (last) insured person dies or is diagnosed with a terminal illness. Typically suitable for spouses.

Suitable for:

Couples wanting financial security after both have passed away and families looking to mitigate estate taxes.
Key Features:

Minimum Entry Age: 15 years old.
Maximum Entry Age: 80 years old.
Premium Frequency: Monthly or yearly.
Cover Term: Whole-life cover, guaranteed until the last insured person passes away.
Scheduled Yearly Increases: Policyholders can choose yearly increases of 0%, 5%, 10%, or inflation-linked adjustments.
Terminal Illness Benefit: Applies to the second insured person after the first dies.
Claiming Last Survivor Cover:

Claim Example:
If Delilah and Kieran take out R2,000,000 Last Survivor Cover, no claim will be payable when Kieran dies. When Delilah dies, the full R2,000,000 will be paid out.
Old Mutual Protect Accidental Death Cover: Accidental Death Cover provides a payout if the insured person dies as a direct result of an accident.

Suitable for:

People who may have been declined regular life cover due to health reasons or those wanting extra cover for accidental death.
Key Features:

Minimum Entry Age: 15 years old.
Maximum Entry Age: 60 years old.
Coverage Limits:
Employed/Home Executives: Up to R2,000,000.
Students/Unemployed: Up to R650,000.
Yearly Increases: 0%, 5%, or 10% fixed rate, or inflation-linked increases.
Claiming Accidental Death Cover:

Claim Example:
If Paul dies in a car accident, the full payout will be made.
If Joe is bitten by a dog and bleeds to death, the claim will be paid as it is considered an unexpected, visible event.
If Jack contracts malaria from a mosquito bite and dies, the claim will be denied, as it is considered a disease, not an accident.
Exclusions:

Suicide: Within the first two years of the policy.
General Exclusions: Include high-risk activities such as extreme sports, riots, criminal activities, and disease-related deaths.
Specific exclusions include death caused by:
Extreme climbing (e.g., altitude climbing above 5,000 meters).
Cave diving.
Motorized racing.
BASE jumping or sky diving.
War-related events.

            (END Old Mutual Protect)
            Refined Prompt with HTML Formatting Instructions:

Please format all responses using basic HTML tags for readability. Specifically:

Use <p> tags for paragraphs.
Use <br> tags for line breaks between sections.
Use <ul> for unordered lists and <ol> for ordered lists, with <li> for each list item.
Bold important points using <b>, and italicize text using <i>.
Use <h1>, <h2>, or <h3> tags for headings and subheadings to organize content.
For links, use <a href="URL"> to embed hyperlinks.
Use <blockquote> to highlight important quotes.
Insert horizontal lines using <hr> to separate different sections of the response.
Make sure to return the response in proper HTML formatting.

            
            Always ensure your response is polite, clear, and helpful. If additional details are requested, provide them only if they are within the scope of the available information.
             If user question is not related in the Old Mutual Protect - RSA Reference Guide please respond to the user with this templated message
    "I'm sorry, I currently don't have information on that topic. Please ask about Old Mutual Protect life insurance products or related topics."
            `;
 // Apply the prompt to each user message
  messages = messages.map((message: any) => {
    if (message.role === 'user') {
      return { ...message, content: `${prompt} ${message.content}, can you answer with html code as formatiing? Please format all responses using basic HTML tags for readability. Specifically: Use <p> tags for paragraphs. Use <br> tags for line breaks between sections. Use <ul> for unordered lists and <ol> for ordered lists, with <li> for each list item. Bold important points using <b>, and italicize text using <i>. Use <h1>, <h2>, or <h3> tags for headings and subheadings to organize content. For links, use <a href="URL"> to embed hyperlinks. Use <blockquote> to highlight important quotes. Insert horizontal lines using <hr> to separate different sections of the response. Make sure to return the response in proper HTML formatting.` };
    } else {
      return message;
    }
  });

  // Split large inputs into chunks
  messages = messages.flatMap((message: any) =>
    splitMessage(message.content).map((chunk) => ({
      ...message,
      content: chunk
    }))
  );

  // Build the final prompt with chunks
  const finalPrompt = buildPrompt(messages);

  // Request to Hugging Face API with valid parameters
  const response = Hf.textGenerationStream({
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    inputs: finalPrompt,
    parameters: {
      max_new_tokens: 512, // Increase to handle longer outputs
      repetition_penalty: 1.1,
      truncate: 2000, // Increase the input token limit
      return_full_text: false,
    },
  });

  // Convert the response into a friendly text-stream
  const stream = HuggingFaceStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}