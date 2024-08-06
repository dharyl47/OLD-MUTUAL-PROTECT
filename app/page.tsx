'use client';
import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import CustomInput from "@/app/components/CustomInput";
import CustomCheckBox from "@/app/components/CustomCheckBox"; // Import the CustomCheckBox component
import EmbeddedVideo from '@/app/components/EmbeddedVideo';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

interface Checkboxes {
  spouse: boolean;
  children: boolean;
  stepchildren: boolean;
  grandchildren: boolean;
  other: boolean;
}

interface CheckboxesAsset {
  primaryResidents: boolean;
  otherRealEstate: boolean;
  bankAccounts: boolean;
  investmentAccounts: boolean;
  businessInterests: boolean;
  personalProperty: boolean;
  otherAsset: boolean;
}

interface Message {
  id: string;
  content: string;
  role: string;
  encryptedName?: string; // Optional field for encrypted name
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat();
  const [inputStr, setInputStr] = useState(input);
  const [submitOnNextUpdate, setSubmitOnNextUpdate] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [videoTriggerMessageId, setVideoTriggerMessageId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: "Hi there! 😊 Welcome to Moneyversity's Estate Planning Chatbot. 🤖 I'm here to secure your future and that of your loved ones. Ready to get started?"
    }]);
  }, [setMessages]);

  useEffect(() => {
    if (submitOnNextUpdate) {
      const formEvent = { preventDefault: () => {} };
      handleSubmit(formEvent as React.FormEvent<HTMLFormElement>);
      setSubmitOnNextUpdate(false);
    }
  }, [submitOnNextUpdate, handleSubmit]);

 useEffect(() => {
  const triggerMessage = messages.find(message => 
    message.content.includes("initiate video") || 
    message.content.includes("Initiate video")
  );
  if (triggerMessage) {
    setVideoTriggerMessageId(triggerMessage.id);
  }
}, [messages]);

  const handleButtonClick = (message: any) => {
   // setInputStr(message);
    handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>);
    setSubmitOnNextUpdate(true);
  };

   const [checkboxes, setCheckboxes] = useState<Checkboxes>({
    spouse: false,
    children: false,
    stepchildren: false,
    grandchildren: false,
    other: false
  });

// Function to format camelCase keys into readable text
const formatLabel = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase words
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space between uppercase letters
    .toLowerCase() // Convert all text to lowercase
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize the first letter of each word
};

     const [checkboxesAsset, setCheckboxesAsset ] = useState<CheckboxesAsset>({
    primaryResidents: false,
    otherRealEstate: false,
    bankAccounts: false,
    investmentAccounts: false,
    businessInterests: false,
    personalProperty: false,
    otherAsset: false
  });

 const updateInputStr = (assetState: any, otherState: any) => {
    const checkedItems = [
      ...Object.keys(assetState).filter(key => assetState[key]),
      ...Object.keys(otherState).filter(key => otherState[key])
    ];
    setInputStr(checkedItems.join(', '));
  };

  useEffect(() => {
    handleInputChange({ target: { value: inputStr } } as React.ChangeEvent<HTMLInputElement>);
  }, [inputStr]);

  const handleCheckboxChangeAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setCheckboxesAsset(prevState => {
      const newState = { ...prevState, [id]: checked };
      updateInputStr(newState, checkboxes);
      return newState;
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setCheckboxes(prevState => {
      const newState = { ...prevState, [id]: checked };
      updateInputStr(checkboxesAsset, newState);
      return newState;
    });
  };
  
 const setAllCheckboxesFalse = () => {
    setCheckboxes(prevState => {
      const newState: Checkboxes = {
        spouse: false,
        children: false,
        stepchildren: false,
        grandchildren: false,
        other: false,
      };
     
      return newState;
    });

    setCheckboxesAsset(prevState => {
      const newState: CheckboxesAsset = {
        primaryResidents: false,
        otherRealEstate: false,
        bankAccounts: false,
        investmentAccounts: false,
        businessInterests: false,
        personalProperty: false,
        otherAsset: false,
      };
     
      return newState;
    });
  };

  async function userProfile(messageAI: any) {
  try {
    const response = await axios.post('http://localhost:3000/api/chat', {
      messages: [{ 
        content: "Analyze this data and extract the user name. Respond only with the user name, like 'john doe', and nothing else. " + messageAI, 
        role: 'user',  
        createdAt: new Date() 
      }]
    });

    let newMessages: Message[] = [];
    if (typeof response.data === 'string') {
      const responseLines = response.data.split('\n').filter(line => line.trim() !== '');
      newMessages = responseLines.map(content => ({
        id: uuidv4(),
        content,
        role: 'assistant' // Ensure role is set if not in the response
      }));
    } else if (Array.isArray(response.data.messages)) {
      newMessages = response.data.messages.map((msg: any) => ({
        ...msg,
        id: uuidv4()
      }));
    } else {
      throw new Error('Invalid response format');
    }

    // Encrypt the user name
    const userName = newMessages[0].content;
    const secretKey = 'MLKN87y8VSH&Y*SF'; // Replace with your own secret key
    const encryptedName = CryptoJS.AES.encrypt(userName, secretKey).toString();

    // Add encrypted name to the message object
    const updatedMessages = newMessages.map((msg: Message) => ({
      ...msg,
      encryptedName
    }));

    setUserName( newMessages[0].content);

    // Log the name and encrypted name
    console.log(`Name: ${userName}`);
    console.log(`Encrypted Name: ${encryptedName}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

  const renderMessages = () => {
  return messages.map((message, index) => {
    const isVideoTrigger = message.id === videoTriggerMessageId;
    const isMaritalStatusQuestion = message.content.includes("Are you married, single, divorced, or widowed?");
    const isDependentsQuestion = message.content.includes("Do you have dependents?");
    const isMajorAsset = message.content.includes("What are your major assets");
    const funFact = message.content.includes("Before we continue with your assets");

    
    // Split message content by "<prompt>" and take the first part
    const filteredContent = message.content.split('<|prompter|>')[0];

    return (
      <div key={message.id} className={message.role === "user" ? "text-white" : "text-white"}>
        {message.role === "assistant" && index === 0 ? (
          <>
            <div>{`Moneyversity: ${filteredContent.replace(/<\|endoftext\|>/g, "")}`}</div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => handleButtonClick("Absolutely")}
                className="px-4 py-2 rounded-md border border-[#8DC63F] text-[#8DC63F]"
              >
                Absolutely
              </button>
              <button
                onClick={() => handleButtonClick("Tell me more")}
                className="px-4 py-2 rounded-md border border-[#8DC63F] text-[#8DC63F]"
              >
                Tell me more
              </button>
              <button
                onClick={() => handleButtonClick("Not now")}
                className="px-4 py-2 rounded-md border border-[#8DC63F] text-[#8DC63F]"
              >
                Not now
              </button>
            </div>
          </>
        ) : (
          <div className={message.role === "user" ? "mb-2 text-right mt-4" : "mb-2"}>
            {isVideoTrigger ? (
              <>
                <p className="bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block">
                  Here you go! 🎥
                </p>
                <EmbeddedVideo embedUrl="https://www.youtube.com/embed/cMoaGEpffds" />
                <p className="bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block mt-2">
                  Now, let's get to know you a bit better. Who am I talking to? 🤔
                </p>
              </>
            ) : (
              <p className={message.role === "user" ? "bg-[#8dc63f] text-white rounded-lg py-2 px-4 inline-block" : "bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block"}>
                {` ${filteredContent.replace(/<\|endoftext\|>/g, "")}`}
              </p>
            )}

            {isMaritalStatusQuestion && (
              <div className="space-x-2 mt-2">
                <button
                  onClick={() => handleButtonClick("Single")}
                  className="px-2 py-2 rounded-md border border-[#8DC63F] text-[#8DC63F]"
                >
                  Single
                </button>
                <button
                  onClick={() => handleButtonClick("Married")}
                  className="px-2 py-2 rounded-md border border-[#8DC63F] text-[#8DC63F]"
                >
                  Married
                </button>
                <button
                  onClick={() => handleButtonClick("Divorced")}
                  className="px-2 py-2 rounded-md border border-[#8DC63F] text-[#8DC63F]"
                >
                  Divorced
                </button>
                <button
                  onClick={() => handleButtonClick("Widowed")}
                  className="px-2 py-2 rounded-md border border-[#8DC63F] text-[#8DC63F]"
                >
                  Widowed
                </button>
                
              </div>
              
            )}
              {isDependentsQuestion && (
                <div className="flex flex-col space-y-2 mt-2">
                   <label className="text-white">Please select your dependents:</label>
                   {Object.entries(checkboxes).map(([key, value]) => (
                    <div key={key} className={`${value ? 'bg-[#8DC63F]' : ''} flex items-center ps-4 border border-[#8DC63F] rounded mt-2 text-white`}>
                      <CustomCheckBox
                        id={key}
                        name="dependents"
                        className="w-4 h-4 rounded"
                        value={key.charAt(0).toUpperCase() + key.slice(1)}
                        checked={value}
                        onChange={handleCheckboxChange}
                      />
                      <label
                        htmlFor={key}
                        className="w-full py-4 ms-2 text-sm font-medium text-white"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {isMajorAsset && (
                <div className="flex flex-col space-y-2 mt-2">
                   <label className="text-white">(Select all that apply)</label>
                   {Object.entries(checkboxesAsset).map(([key, value]) => (
                    <div key={key} className={`${value ? 'bg-[#8DC63F]' : ''} flex items-center ps-4 border border-[#8DC63F] rounded mt-2 text-white`}>
                      <CustomCheckBox
                        id={key}
                        name="dependents"
                        className="w-4 h-4 rounded"
                        value={key.charAt(0).toUpperCase() + key.slice(1)}
                        checked={value}
                        onChange={handleCheckboxChangeAsset}
                      />
                      <label
                        htmlFor={key}
                        className="w-full py-4 ms-2 text-sm font-medium text-white"
                      >
                       {formatLabel(key)}
                      </label>
                    </div>
                  ))}
                </div>
              )}
          {funFact && (
  <>
    <div className="flex flex-col space-y-2 mt-2">
      <p className="bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block">
        <span className="bg-[#2f2f2f] text-white rounded-lg py-2 inline-block font-semibold">
        Fun Fact
        </span><br />
        Modern wills often include digital assets 📱 like social media accounts, digital currencies 🌐💰, and
        online business interests, reflecting our increasingly digital lives.
      </p>
      <img
        src="https://i.ibb.co/MDvDj7Y/your-image.jpg"
        alt="Fun Fact Image"
        className="w-[270px] h-[210px] rounded-lg mt-2"
      />
    </div>
    <div className="flex flex-col space-y-2 mt-2">
      <p className="bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block">
        Pretty neat, right? Now, lets get back to securing your future! 😊
      </p>
    </div>
    <div className="flex flex-col space-y-2 mt-2">
      <p className="bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block">
        Please list the assets and people or organisations you want to leave them to. 
        If you'd rather not type it all out, you can upload a document instead
      </p>
      <div className="flex space-x-2 mt-2">
        <button className="bg-[#8DC63F] text-white rounded-lg py-2 px-4" style={{ borderRadius: '10px' }}>
          Upload Document
        </button>
        <button className="border border-[#8DC63F] text-[#8DC63F] rounded-lg py-2 px-4 bg-transparent" style={{ borderRadius: '10px' }}>
          Maybe Later
        </button>
      </div>
    </div>
  </>
)}

          </div>
        )}
      </div>
    );
  });
};

  return (
    <div className="fixed inset-0">
  {isOpen && (
    <div id="chat-container" className="fixed inset-0 flex items-end sm:w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 mx-auto">
      <div className="bg-[#212121] shadow-md rounded-lg w-full h-full">
        <div className="p-4 border-b text-white rounded-t-lg flex items-center bg-gradient-to-b from-[#84c342] to-[#149d6e]">
          <p
            id="estate-icon"
            className="bg-[#8dc63f] text-white px-4 py-4 mr-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </p>
          <p className="text-lg font-semibold">Estate Planning Bot</p>
          <div className="ml-auto flex items-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-gray-400 focus:outline-none focus:text-gray-400 ml-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
        <div id="chatbox" className="p-4 h-[calc(100vh-210px)] overflow-y-auto">
          {renderMessages()}
        </div>
        <form className="w-full" onSubmit={(e) => { e.preventDefault();  
        if (inputStr.trim()) {
          handleSubmit(e);
          setAllCheckboxesFalse();
          setInputStr(''); // Clear the input field after submit
        } }}>
          <div className="p-4 border-t flex">
            <CustomInput
              className="send-input bg-[#212121] text-white border-none focus:outline-none w-full"
              id="user-input"
              value={inputStr}
              onChange={(e: any) => {
                setInputStr(e.target.value);
                handleInputChange(e);
              }}
              placeholder="Type a message"
            />
            <button
              id="send-button"
              type="submit"
              className="bg-[#8dc63f] text-white px-4 py-2 rounded-md ml-2"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
  {!isOpen && (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-5 right-5 bg-[#84c342] p-4 text-white rounded-full shadow-md hover:bg-blue-500 transition duration-300"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  )}
</div>
  );
}
