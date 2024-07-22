'use client';
import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import CustomInput from "@/app/components/CustomInput";
import Slider from "@/app/components/Slider";
import CustomCheckBox from "@/app/components/CustomCheckBox";
import EmojiPicker from 'emoji-picker-react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat();
  const [inputStr, setInputStr] = useState(input);
  const [submitOnNextUpdate, setSubmitOnNextUpdate] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setMessages([{
      id: Date.now().toString(), // Adding a unique id
      role: 'assistant',
      content: "Hi there! 😊 Welcome to Moneyversity's Estate Planning Chatbot. 🤖 I'm here to secure your future and that of your loved ones. Ready to get started?"
    }]);
  }, [setMessages]);

  useEffect(() => {
    if (submitOnNextUpdate) {
      const formEvent = { preventDefault: () => {} };
      handleSubmit(formEvent as React.FormEvent<HTMLFormElement>);
      setSubmitOnNextUpdate(false); // Reset submit flag
    }
  }, [submitOnNextUpdate, handleSubmit]);

  const handleButtonClick = (message) => {
    setInputStr(message); // Update the input value immediately
    handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>);
    setSubmitOnNextUpdate(true); // Set flag to submit form on next update
  };

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const onEmojiClick = (event, emojiObject) => {
    setInputStr((prevInput) => prevInput + emojiObject.emoji);
    setShowPicker(false);
  };

  const renderMessages = () => {
    return messages.map((message, index) => (
      <div key={message.id} className={message.role === "user" ? "text-white" : "text-white"}>
        {message.role === "assistant" && index === 0 ? (
          <>
            <div>{`Moneyversity: ${message.content.replace(/<\|endoftext\|>/g, "")}`}</div>
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
            <div className="relative mb-6">
              <Slider />
            </div>
            <div className={`${isChecked ? 'bg-[#8DC63F]' : ''} flex items-center ps-4 border border-[#8DC63F] rounded mt-2 text-white`}>
              <CustomCheckBox
                id="bordered-checkbox-1"
                name="bordered-checkbox"
                className="w-4 h-4 rounded"
                value=""
                checked={isChecked}
                onChange={handleCheckboxChange}
              />
              <label
                htmlFor="bordered-checkbox-1"
                className="w-full py-4 ms-2 text-sm font-medium text-white"
              >
                Default radio
              </label>
            </div>
          </>
        ) : (
          <div className={message.role === "user" ? "mb-2 text-right mt-4" : "mb-2"}>
            <p className={message.role === "user" ? "bg-[#8dc63f] text-white rounded-lg py-2 px-4 inline-block" : "bg-[#2f2f2f] text-white rounded-lg py-2 px-4 inline-block"}>
              {` ${message.content.replace(/<\|endoftext\|>/g, "")}`}
            </p>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="fixed bottom-0 right-0 mb-5 mr-5">
      {isOpen && (
        <div id="chat-container" className="fixed bottom-16 right-10">
          <div className="bg-[#212121] shadow-md rounded-lg max-w-lg w-full">
            <div className="p-4 border-b text-white rounded-t-lg flex items-center bg-gradient-to-b from-[#84c342] to-[#149d6e]">
              <p
                id="estate-icon"
                className="bg-[#8dc63f] text-white px-4 py-4 mr-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
              </p>
              <p className="text-lg font-semibold">Estate Planning Bot</p>
              <div className="ml-auto flex items-center">
                <button className="text-gray-300 hover:text-gray-400 focus:outline-none focus:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" id="fullscreen" className="size-6">
                    <path fill="none" d="M0 0h24v24H0V0z"></path>
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-300 hover:text-gray-400 focus:outline-none focus:text-gray-400 ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            </div>
            <div id="chatbox" className="p-4 h-96 overflow-y-auto">
              {renderMessages()}
              {/* This is for the image */}
              {/* <img src="http://mirrors.ctan.org/macros/latex/contrib/incgraph/example.jpg" alt="Description of image" className="object-cover h-48 w-96 rounded-md shadow-md mt-5"></img> */}
            </div>
            <form className="w-full max-w-xl" onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
              <div className="p-4 border-t flex mt-10">
                <CustomInput
                  className="send-input bg-[#212121] text-white border-none focus:outline-none mb-5"
                  id="user-input"
                  value={inputStr}
                  onChange={(e) => {
                    setInputStr(e.target.value);
                    handleInputChange(e);
                  }}
                  placeholder="Type a message"
                />
                <button
                  id="send-button"
                  type="submit"
                  className="bg-[#8dc63f] text-white px-4 py-4 rounded-full hover:bg-blue-600 transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </form>
            <div className="flex ml-5 pb-3 absolute bottom-0 left-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6 mr-2 text-white"
                onClick={() => setShowPicker((val) => !val)}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
              {showPicker && (
                <EmojiPicker width="100%" onEmojiClick={onEmojiClick} />
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6 text-white"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          id="open-chat"
          onClick={() => setIsOpen(true)}
          className="bg-[#6ebc4b] text-white py-4 px-4 rounded-full hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
