import os
import streamlit as st
import google.generativeai as genai
from chatbot_config import (
    SYSTEM_PROMPT, 
    get_context_prompt, 
    RESPONSE_FORMAT, 
    ERROR_MESSAGES,
    SAFETY_GUIDELINES
)

class FlowerChatbot:
    """
    Gemini-powered chatbot for flower and botanical questions
    """
    
    def __init__(self):
        self.model = None
        self.chat_session = None
        self.is_initialized = False
        
    def initialize(self, api_key=None):
        """Initialize the Gemini API client"""
        try:
            # Get API key from parameter, environment, or Streamlit secrets
            if api_key:
                genai.configure(api_key=api_key)
            elif "GEMINI_API_KEY" in os.environ:
                genai.configure(api_key=os.environ["GEMINI_API_KEY"])
            elif hasattr(st, 'secrets') and "GEMINI_API_KEY" in st.secrets:
                genai.configure(api_key=st.secrets["GEMINI_API_KEY"])
            else:
                return False, "API key not found. Please set GEMINI_API_KEY in environment variables or Streamlit secrets."
            
            self.model = genai.GenerativeModel(
                model_name="gemini-2.0-flash-exp",  # Using Gemini 2.0 Flash
            )
            
            self.is_initialized = True
            return True, "Chatbot initialized successfully!"
            
        except Exception as e:
            return False, f"Failed to initialize chatbot: {str(e)}"
    
    def start_chat(self, flower_data=None):
        """Start a new chat session with context"""
        if not self.is_initialized:
            return False, "Chatbot not initialized. Please set up API key first."
        
        try:
            # Prepare the initial context
            full_prompt = SYSTEM_PROMPT + "\n\n"
            
            if flower_data is not None:
                full_prompt += get_context_prompt(flower_data) + "\n\n"
            
            full_prompt += RESPONSE_FORMAT + "\n\n"
            full_prompt += SAFETY_GUIDELINES
            
            # Start chat session
            self.chat_session = self.model.start_chat(history=[])
            
            # Send initial context (this won't be visible to user)
            self.chat_session.send_message(full_prompt)
            
            return True, "Chat session started!"
            
        except Exception as e:
            return False, f"Failed to start chat: {str(e)}"
    
    def send_message(self, message):
        """Send a message to the chatbot and get response"""
        if not self.chat_session:
            return ERROR_MESSAGES["general_error"]
        
        try:
            # Add some context to help keep responses flower-focused
            enhanced_message = f"""
            User question: {message}
            
            Please provide a helpful response about this flower/plant-related topic. 
            If the question is not about flowers or plants, politely redirect to botanical topics.
            """
            
            response = self.chat_session.send_message(enhanced_message)
            return response.text
            
        except Exception as e:
            st.error(f"Error getting response: {str(e)}")
            return ERROR_MESSAGES["api_error"]
    
    def get_chat_history(self):
        """Get the chat history (excluding system messages)"""
        if not self.chat_session:
            return []
        
        # Filter out the initial system message and return user-assistant pairs
        history = []
        chat_history = self.chat_session.history
        
        # Skip first message (system prompt) and process in pairs
        for i in range(1, len(chat_history), 2):
            if i + 1 < len(chat_history):
                user_msg = chat_history[i].parts[0].text
                assistant_msg = chat_history[i + 1].parts[0].text
                
                # Clean up the enhanced message format
                if "User question:" in user_msg:
                    user_msg = user_msg.split("User question:")[1].split("Please provide")[0].strip()
                
                history.append({
                    "user": user_msg,
                    "assistant": assistant_msg
                })
        
        return history
    
    def reset_chat(self, flower_data=None):
        """Reset the chat session"""
        self.chat_session = None
        return self.start_chat(flower_data)

# Utility functions for Streamlit integration
def initialize_chatbot_session():
    """Initialize chatbot in Streamlit session state"""
    if 'chatbot' not in st.session_state:
        st.session_state.chatbot = FlowerChatbot()
    
    if 'chatbot_initialized' not in st.session_state:
        st.session_state.chatbot_initialized = False
    
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []

def setup_api_key():
    """Setup API key through Streamlit interface"""
    st.subheader("🔑 Setup Gemini API Key")
    
    # Check if already configured
    if st.session_state.chatbot_initialized:
        st.success("✅ Chatbot is ready!")
        if st.button("Reset API Key"):
            st.session_state.chatbot_initialized = False
            st.session_state.chatbot = FlowerChatbot()
            st.rerun()
        return True
    
    # API key input methods
    st.write("Choose one of the following methods to provide your Gemini API key:")
    
    method = st.radio(
        "API Key Method:",
        ["Enter manually", "Environment variable", "Streamlit secrets"],
        help="Choose how you want to provide your Gemini API key"
    )
    
    if method == "Enter manually":
        api_key = st.text_input(
            "Enter your Gemini API Key:", 
            type="password",
            help="Get your API key from Google AI Studio: https://aistudio.google.com/apikey"
        )
        
        if api_key and st.button("Initialize Chatbot"):
            success, message = st.session_state.chatbot.initialize(api_key)
            if success:
                st.session_state.chatbot_initialized = True
                st.success(message)
                st.rerun()
            else:
                st.error(message)
    
    elif method == "Environment variable":
        st.code("export GEMINI_API_KEY=your_api_key_here")
        if st.button("Try Environment Variable"):
            success, message = st.session_state.chatbot.initialize()
            if success:
                st.session_state.chatbot_initialized = True
                st.success(message)
                st.rerun()
            else:
                st.error(message)
    
    elif method == "Streamlit secrets":
        st.code('# Add to .streamlit/secrets.toml\nGEMINI_API_KEY = "your_api_key_here"')
        if st.button("Try Streamlit Secrets"):
            success, message = st.session_state.chatbot.initialize()
            if success:
                st.session_state.chatbot_initialized = True
                st.success(message)
                st.rerun()
            else:
                st.error(message)
    
    return False
