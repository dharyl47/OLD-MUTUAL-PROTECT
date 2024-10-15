"use client";
import React from "react";
import { useChat } from "ai/react";
import { useState, useEffect, useRef } from "react";
import CustomInput from "@/app/components/CustomInput";
import CustomCheckBox from "@/app/components/CustomCheckBox"; // Import the CustomCheckBox component
import EmbeddedVideo from "@/app/components/EmbeddedVideo";
import Calendar from "@/app/components/Calendar";
import Image from "next/image"; // Import the Image component
import BusinessImportanceSlider from "./components/BusinessImportanceSlider";
import LifeInsuranceSlider from "./components/LifeInsuranceSlider";
import TaxesSlider from "./components/TaxesSlider";
import Navbar from "@/app/components/Navbar";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import connectMongoDB from "@/app/lib/mongo";
import "./globals.css";

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat();
  const [consent, setConsent] = useState<string>("");


  const [isThinking, setIsThinking] = useState(false);

  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [inputStr, setInputStr] = useState(input);

  const [submitOnNextUpdate, setSubmitOnNextUpdate] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  const chatboxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const connectToMongo = async () => {
      try {
        // Send a POST request to your test Mongo API route
        const response = await axios.post("/api/checkMongoConnection");
        console.log(response.data.message); // Log success message
      } catch (error: any) {
        console.error(
          "Failed to connect to MongoDB:",
          error.response?.data?.error || error.message
        );
      }
    };

    connectToMongo(); // Call the function when the component mounts
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // Stop "thinking" when an assistant message with content arrives
      if (lastMessage.role === "assistant" && lastMessage.content) {
        setIsThinking(false);
      }
    }
  }, [messages]); // Run this effect every time messages change

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  
  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "💡 Welcome to the AI Experiment! We're here to help with any questions you have about personal finance. Feel free to ask anything, and we'll provide the information you need to make great decisions. Let's get started! 💬",
        // "Hello 😊 and welcome to Moneyversity's Estate Planning Consultant 🤖. I'm here to help you navigate the estate planning process with ease. Together, we'll ensure your assets and wishes are well- documented and protected. Ready to get started on this important journey?",
      },
    ]);
  }, [setMessages]);

  useEffect(() => {
    if (submitOnNextUpdate) {
      const formEvent = { preventDefault: () => {} };
      handleSubmit(formEvent as React.FormEvent<HTMLFormElement>);
      setSubmitOnNextUpdate(false);
    }
  }, [submitOnNextUpdate, handleSubmit]);

  const handleSubmitWithRetry = async (
    event: React.FormEvent<HTMLFormElement>,
    retries = MAX_RETRIES
  ) => {
    event.preventDefault();
    let attempt = 0;

    while (attempt < retries) {
      try {
        handleSubmit(event); // Try submitting the message
        setRetryCount(0); // Reset retry count if successful
        setError(""); // Clear any previous errors
        break; // Exit the loop if submission is successful
      } catch (error: any) {
        attempt += 1;
        setRetryCount(attempt);
        setError(`Attempt ${attempt}/${MAX_RETRIES} failed. Retrying...`);

        if (attempt >= retries) {
          setError("Failed to submit after several attempts.");
          break;
        }

        // Wait for the retry delay before the next attempt
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  };

  // Automatically resubmit previous user input after error
  useEffect(() => {
    if (submitOnNextUpdate && inputStr.trim()) {
      const formEvent = { preventDefault: () => {} };
      handleSubmitWithRetry(formEvent as React.FormEvent<HTMLFormElement>);
      setSubmitOnNextUpdate(false);
    }
  }, [submitOnNextUpdate, inputStr]);

  useEffect(() => {
    handleInputChange({
      target: { value: inputStr },
    } as React.ChangeEvent<HTMLInputElement>);
  }, [inputStr]);



   const renderMessages = () => {
    return messages.map((message, index) => {
      const isLastMessage = index === messages.length - 1;

      const videoUrlMatch = message.content.match(
        /(https:\/\/www\.youtube\.com\/embed\/[^\s]+)/
      );
      const imageFilenameMatch = message.content.match(
        /([\w-]+\.(?:png|jpg|jpeg|gif))/
      );

      const filteredContent = message.content.split("<|prompter|>")[0];

      return (
        <div
          key={message.id}
          ref={isLastMessage ? lastMessageRef : null}
          className={message.role === "user" ? "text-white" : "text-white"}
        >
          {message.role === "assistant" && index === 0 ? (
            <>
              <div className="flex items-start mb-4 assistant-message">
                {/* SVG Icon */}

                {/* AI Message Bubble */}
                <p className="bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block">
                  {filteredContent.replace(/<\|endoftext\|>/g, "")}
                </p>
              </div>
              
            </>
          ) : (
            <div
              className={
                message.role === "user" ? "mb-2 text-right mt-4" : "mb-2"
              }
            >
              
                
                <div
                  className={
                    message.role === "user"
                      ? "bg-[#8dc63f] text-white rounded-lg py-2 px-4 inline-block"
                      : "flex items-start mb-2 assistant-message"
                  }
                >
                  <p
                    className={
                      message.role === "user"
                        ? ""
                        : "bg-[#2f2f2f] text-white rounded-lg inline-block"
                    }
                    dangerouslySetInnerHTML={{
                      __html: filteredContent.replace(/<\|endoftext\|>/g, ""),
                    }}
                  ></p>
                </div>
            
            </div>
          )}
        </div>
      );
    });
  };
  

  const handleAdvisorModalToggle = () => {
    setIsAdvisorModalOpen(!isAdvisorModalOpen);
  };
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="fixed inset-0 bg-[#212121] flex flex-col">
      <div className="fixed inset-0">
        <div className="fixed inset-0 flex items-end lg:w-3/4 mx-auto ">
          <div className="bg-[#212121] shadow-md rounded-lg w-full h-full">
            {/* Header Section */}
            <div className="p-4 text-white rounded-t-lg items-center mt-12">
              <div className="flex justify-center -mt-12 space-x-4">
                <div className="text-lg font-semibold text-center text-4xl">
                  <p className="text-center text-2xl font-bold">
                    Welcome to the AI Experiment
                  </p>
                </div>

                {/* SVG Icon */}
              </div>

              {/* Button Section */}
              <div className="flex justify-center mt-4 space-x-4">
                {/* <button
                  className="bg-[#009677] text-white px-4 py-2 rounded-md"
                  onClick={handleModalToggle}
                  style={{visibility: "hidden"}}
                >
                  FAQs
                </button>
                <button
                  className="bg-[#009677] text-white px-4 py-2 rounded-md"
                  onClick={handleAdvisorModalToggle}
                  style={{visibility: "hidden"}}
                >
                  Contact a Financial Adviser
                </button> */}
              </div>
              {/* Modal Popup */}
              {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-[#2f2f2f] text-white rounded-lg w-[90%] max-w-3xl p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-3xl font-bold leading-tight">
                        Estate Planning FAQs
                      </h2>
                      {/* H2 should be 36px according to Adobe XD */}
                      <button
                        className="text-white text-2xl hover:text-gray-300"
                        onClick={handleModalToggle}
                      >
                        ✖
                      </button>
                    </div>
                    <p className="mb-6 text-base leading-relaxed">
                      Here are some frequently asked questions about estate
                      planning in South Africa:
                    </p>

                    {/* Scrollable FAQ Content with custom scrollbar */}
                    <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#8DC63F] scrollbar-track-[#2f2f2f]">
                      {[
                        {
                          question: "What is estate planning? 🧾",
                          answer:
                            "Estate planning is the process of arranging for the management and disposal of a person’s estate during their life and after death. It involves creating documents like wills, trusts, and powers of attorney.",
                        },
                        {
                          question: "Why is having a will important? 📄",
                          answer:
                            "A will ensures your assets are distributed according to your wishes, names guardians for minor children, and can help reduce estate taxes and legal fees.",
                        },
                        {
                          question: "What happens if I die without a will? ⚖️",
                          answer:
                            "If you die intestate (without a will), your estate will be distributed according to South Africa’s Intestate Succession Act, which may not align with your wishes.",
                        },
                        {
                          question:
                            "Can I change my will after it’s been created? 💼",
                          answer:
                            "Yes, you can update your will as often as you like. It’s recommended to review and update it after major life events, such as marriage, divorce, or the birth of a child.",
                        },
                        {
                          question:
                            "What is a trust and why would I need one? 🔒",
                          answer:
                            "A trust is a legal arrangement where a trustee manages assets on behalf of beneficiaries. Trusts can help manage assets, reduce estate taxes, and provide for beneficiaries according to your wishes.",
                        },
                        {
                          question:
                            "When should I seek legal advice for estate planning? 🏛️",
                          answer:
                            "It’s advisable to seek legal advice if you have a large or complex estate, anticipate family disputes, own a business, or need to stay updated with changing laws.",
                        },
                      ].map((faq, index) => (
                        <div key={index}>
                          <p className="font-semibold text-lg">
                            {`${index + 1}. ${faq.question}`}
                          </p>
                          <p>{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Popup for Financial Advisor */}
              {/* Modal Popup for Financial Advisor */}
              {isAdvisorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-[#2f2f2f] text-white rounded-lg w-[90%] max-w-3xl p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-4xl font-bold">
                        Contact a Financial Adviser
                      </h2>
                      <button
                        className="text-white text-2xl hover:text-gray-300"
                        onClick={handleAdvisorModalToggle}
                      >
                        ✖
                      </button>
                    </div>
                    <p className="mb-6 text-xl">
                      Fantastic! Our financial advisers at Old Mutual are ready
                      to assist you in filling out these templates. Please reach
                      out to us directly to schedule a consultation and receive
                      personalised guidance. Here's how you can get in touch:
                    </p>

                    {/* Contact Information */}
                    <div className="flex justify-between items-start text-lg">
                      {/* Phone Section */}
                      <div className="flex flex-col items-start w-1/2">
                        {/* Same size Phone Icon */}
                        <Image
                          src="/images/phoneIcon.svg"
                          alt="Phone Icon"
                          width={22}
                          height={22}
                          className="mb-2"
                        />
                        <div className="text-left">
                          <p className="font-semibold">Phone</p>
                          <p>[insert phone number]</p>
                          <p>Call us to speak with an adviser.</p>
                        </div>
                      </div>

                      {/* Email Section */}
                      <div className="flex flex-col items-start w-1/2">
                        {/* Same size Email Icon */}
                        <Image
                          src="/images/emailIcon.svg"
                          alt="Email Icon"
                          width={40}
                          height={40}
                          className="mb-2"
                        />
                        <div className="text-left">
                          <p className="font-semibold">Email</p>
                          <p>[insert email address]</p>
                          <p>
                            Send us an email with your contact details, and
                            we'll get back to you promptly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
              
            <div
              id="chatbox"
              style={{marginBottom: "100px"}}
              className="p-4 h-[calc(100vh-250px)]  overflow-y-auto"
              ref={chatboxRef}
            >
              {renderMessages() || <div className="italic">typing...</div>}
            </div>
            <form
              className="w-full rounded-3xl"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsThinking(true);

                    handleSubmit(e);

                
                
                setInputStr("");
              }}
            >
              <div className="p-4 flex items-center justify-between rounded bg-[#303134]">
                {isThinking ? (
                  // Show the dots when the AI is "thinking"
                  <div className="dots-container w-full flex justify-center items-center">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                ) : (
                  // Show the input when AI is not thinking
                  <CustomInput
                    className="send-input bg-[#303134] text-white border-none focus:outline-none w-full"
                    id="user-input"
                    value={inputStr}
                    onChange={(e: any) => {
                      setInputStr(e.target.value);
                      handleInputChange(e);
                    }}
                    placeholder="Type a question"
                  />
                )}

                <button
                  id="send-button"
                  type="submit"
                  className="text-white rounded-md ml-2 flex items-center justify-center"
                >
                  <img
                    src="/images/sendButton.png"
                    alt="Send Icon"
                    className="h-[50px] w-[50px] object-contain"
                  />
                </button>
              </div>
            </form>
            {/* {loading && (
              <p className="text-white">
                Loading... Retrying {retryCount}/{MAX_RETRIES}
              </p>
            )} */}
          </div>
        </div>
      </div>

      {/* <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 bg-[#84c342] p-4 text-white rounded-full shadow-md hover:bg-blue-500 transition duration-300 block md:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button> */}
    </div>
  );
}
