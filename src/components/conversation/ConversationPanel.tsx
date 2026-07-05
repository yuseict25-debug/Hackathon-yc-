"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConversation } from "@/hooks/useConversation";

export function ConversationPanel() {
  const { messages, isTyping, isPanelOpen, togglePanel, send } =
    useConversation();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput("");
  };

  return (
    <>
      <motion.button
        onClick={togglePanel}
        className="absolute bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[#e8a87c]/20 bg-[#1a1714]/80 text-[#e8a87c] backdrop-blur-md transition-colors hover:bg-[#e8a87c]/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle conversation"
      >
        <MessageCircle className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className="absolute bottom-20 right-6 z-20 flex w-96 flex-col overflow-hidden rounded-2xl border border-[#e8a87c]/10 bg-[#1a1714]/90 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-[#e8a87c]/10 px-5 py-4">
              <div>
                <h2 className="text-sm font-medium text-[#f5ebe0]">
                  Conversation
                </h2>
                <p className="text-xs text-[#a89888]">Talk with Eula</p>
              </div>
              <button
                onClick={togglePanel}
                className="text-[#a89888] transition-colors hover:text-[#f5ebe0]"
                aria-label="Close conversation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto px-5 py-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-[#e8a87c]/15 text-[#f5ebe0]"
                        : "bg-[#2a2520] text-[#d4c8bc]"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex gap-1 rounded-2xl bg-[#2a2520] px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[#a89888]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex gap-2 border-t border-[#e8a87c]/10 px-4 py-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Share something..."
                className="border-[#e8a87c]/10 bg-[#2a2520] text-[#f5ebe0] placeholder:text-[#a89888]/50 focus-visible:border-[#e8a87c]/30"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="shrink-0 bg-[#e8a87c]/15 text-[#e8a87c] hover:bg-[#e8a87c]/25"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
