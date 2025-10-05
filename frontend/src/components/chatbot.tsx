"use client"
import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, X } from "lucide-react"

export interface ChatMessage {
    id: number
    text: string
    sender: "user" | "bot"
    timestamp: Date
}

interface ChatbotProps {
    isOpen: boolean
    onToggle: () => void
}

export default function Chatbot({ isOpen, onToggle }: ChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            text: "Chào bạn! Tôi là Bloom Assistant 🌸 Tôi có thể giúp bạn tìm hiểu về thời gian nở hoa của các loài hoa ở Việt Nam. Hãy hỏi tôi bất cứ điều gì!",
            sender: "bot",
            timestamp: new Date()
        }
    ])
    const [currentMessage, setCurrentMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const generateBotResponse = (userMessage: string): string => {
        const message = userMessage.toLowerCase()

        // Responses about specific flowers
        if (message.includes("anh đào") || message.includes("cherry")) {
            return "🌸 Hoa anh đào thường nở từ giữa tháng 3 đến đầu tháng 4. Hiện tại xác suất nở ở Hà Nội là 85%. Bạn có thể tìm thấy chúng tại Công viên Thống Nhất!"
        }

        if (message.includes("ban")) {
            return "🤍 Hoa ban nở rộ từ đầu đến cuối tháng 3 ở cao nguyên Điện Biên với xác suất 95%. Đây là thời điểm đẹp nhất để ngắm hoa ban trắng tinh khôi!"
        }

        if (message.includes("đỗ quyên")) {
            return "🌺 Hoa đỗ quyên đang nở đẹp nhất ở Sa Pa từ cuối tháng 2 đến giữa tháng 3 với xác suất 98%. Màu đỏ rực rỡ trên núi cao rất đáng ngắm!"
        }

        if (message.includes("mai")) {
            return "🌼 Hoa mai vàng nở vào dịp Tết từ cuối tháng 1 đến cuối tháng 2. Hiện tại xác suất nở ở TP.HCM là 45%."
        }

        if (message.includes("phượng")) {
            return "🔥 Hoa phượng nở từ giữa tháng 4 đến cuối tháng 6. Hiện tại còn sớm nên xác suất nở ở Đà Nẵng chỉ 20%."
        }

        if (message.includes("sen")) {
            return "🪷 Hoa sen có mùa nở dài từ giữa tháng 5 đến cuối tháng 8. Đầm sen Tam Cốc, Ninh Bình là địa điểm lý tưởng!"
        }

        if (message.includes("súng")) {
            return "🌸 Hoa súng nở từ đầu tháng 4 đến giữa tháng 5 tại Đồng Tháp Mười với xác suất 70%. Cảnh hoa súng trắng nở trên đồng ruộng rất thơ mộng!"
        }

        if (message.includes("đào")) {
            return "🌺 Hoa đào hồng nở rộ dịp Tết từ cuối tháng 1 đến giữa tháng 2. Thung lũng Mai Châu, Hòa Bình hiện có xác suất nở 35%."
        }

        // General questions
        if (message.includes("khi nào") || message.includes("thời gian")) {
            return "⏰ Tôi có thể cho bạn biết thời gian nở của từng loài hoa cụ thể. Hãy hỏi về: hoa anh đào, hoa ban, đỗ quyên, mai, phượng, sen, súng, đào... Bạn muốn biết về loài nào?"
        }

        if (message.includes("ở đâu") || message.includes("địa điểm")) {
            return "📍 Tôi có thông tin về địa điểm ngắm hoa tại nhiều tỉnh thành. Bạn có thể xem các marker trên bản đồ hoặc hỏi tôi về địa điểm cụ thể cho từng loài hoa!"
        }

        if (message.includes("xác suất") || message.includes("tỷ lệ")) {
            return "📊 Tôi có thông tin xác suất nở hoa theo thời gian thực. Hiện tại: Đỗ quyên 98%, Ban 95%, Anh đào 85%, Súng 70%, Mai 45%, Đào 35%, Phượng 20%, Sen 15%"
        }

        if (
            message.includes("xin chào") ||
            message.includes("hello") ||
            message.includes("hi") ||
            message.includes("chào")
        ) {
            return "Xin chào! 👋 Tôi có thể giúp bạn tìm hiểu về thời gian và địa điểm ngắm hoa ở Việt Nam. Bạn muốn hỏi về loài hoa nào?"
        }

        if (message.includes("cảm ơn") || message.includes("thank")) {
            return "Rất vui được giúp bạn! 😊 Nếu bạn có thêm câu hỏi nào về hoa hay muốn biết thêm thông tin, đừng ngần ngại hỏi tôi nhé!"
        }

        // Default response
        return "🤔 Tôi hiểu bạn quan tâm về hoa! Tôi có thể giúp bạn tìm hiểu về:\n• Thời gian nở hoa 🕐\n• Địa điểm ngắm hoa 📍\n• Xác suất nở hiện tại 📊\n• Các loài: anh đào, ban, đỗ quyên, mai, phượng, sen...\n\nBạn muốn hỏi về điều gì cụ thể?"
    }

    const handleSendMessage = () => {
        if (!currentMessage.trim()) return

        const newUserMessage: ChatMessage = {
            id: Date.now(),
            text: currentMessage,
            sender: "user",
            timestamp: new Date()
        }

        setMessages((prev) => [...prev, newUserMessage])
        setCurrentMessage("")
        setIsTyping(true)

        // Simulate bot typing and response
        setTimeout(() => {
            setIsTyping(false)
            const botResponse = generateBotResponse(currentMessage)
            const newBotMessage: ChatMessage = {
                id: Date.now() + 1,
                text: botResponse,
                sender: "bot",
                timestamp: new Date()
            }
            setMessages((prev) => [...prev, newBotMessage])
        }, 1500)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center group relative"
                title="Mở Bloom Assistant"
            >
                <MessageCircle size={24} />
                {/* Online indicator */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                {/* Tooltip */}
                <div className="absolute bottom-16 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Bloom Assistant
                </div>
            </button>
        )
    }

    return (
        <div className="text-black w-80 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-lg">
                        🌸
                    </div>
                    <div>
                        <div className="font-semibold">Bloom Assistant</div>
                        <div className="text-xs opacity-90 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            Đang online
                        </div>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.sender === "user"
                                ? "justify-end"
                                : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                                message.sender === "user"
                                    ? "bg-blue-500 text-white rounded-br-md"
                                    : "bg-white text-gray-800 rounded-bl-md shadow-sm border"
                            }`}
                        >
                            <div className="whitespace-pre-wrap">
                                {message.text}
                            </div>
                            <div
                                className={`text-xs mt-1 ${
                                    message.sender === "user"
                                        ? "text-blue-100"
                                        : "text-gray-500"
                                }`}
                            >
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border px-4 py-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Hỏi về thời gian nở hoa..."
                        className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isTyping}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || isTyping}
                        className="px-4 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
