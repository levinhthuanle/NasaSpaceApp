import streamlit as st
from streamlit_folium import st_folium
import folium
from folium.plugins import MarkerCluster
from utils import load_data, generate_color_map
from datetime import datetime
from gemini_chatbot import FlowerChatbot, initialize_chatbot_session, setup_api_key
from chatbot_config import EXAMPLE_QUESTIONS

st.set_page_config(page_title='BloomLens Demo (Vietnam)', layout='wide')
st.title('BloomLens — Demo (Vietnam only)')
st.markdown('Circle radius is in meters. Each species has a unique color.')

# Initialize chatbot session
initialize_chatbot_session()

VN_BOUNDS = {
    'min_lat': 8.0, 'max_lat': 23.5,
    'min_lon': 102.0, 'max_lon': 110.5
}
MAP_CENTER = [16.0, 106.0]
MAP_ZOOM = 6

df = load_data()

# Create tabs for different features
tab1, tab2 = st.tabs(["🗺️ Bloom Map", "🤖 Flower Chatbot"])

with tab1:
    # Sidebar controls
    with st.sidebar:
        st.header('Filters')
        min_date = df['date'].min().date()
        max_date = df['date'].max().date()
        date_range = st.date_input('Select date range', value=(min_date, max_date), min_value=min_date, max_value=max_date)
        if isinstance(date_range, tuple) and len(date_range) == 2:
            start_date, end_date = date_range
        else:
            start_date = date_range; end_date = date_range

        species_list = sorted(df['species'].dropna().unique().tolist())
        selected_species = st.multiselect('Species (none = all)', options=species_list, default=species_list)

        max_points = st.slider('Max points to show', min_value=10, max_value=1000, value=500, step=10)
        use_cluster = st.checkbox('Use marker clustering', value=True)

    # Filter data
    mask = (
        (df['date'].dt.date >= start_date) & (df['date'].dt.date <= end_date) &
        (df['lat'] >= VN_BOUNDS['min_lat']) & (df['lat'] <= VN_BOUNDS['max_lat']) &
        (df['lon'] >= VN_BOUNDS['min_lon']) & (df['lon'] <= VN_BOUNDS['max_lon'])
    )
    if selected_species:
        mask &= df['species'].isin(selected_species)

    filtered = df.loc[mask].sort_values('date').head(max_points).copy()

    st.sidebar.write(f'Total records after filter: {len(filtered)}')

    # Map creation
    m = folium.Map(location=MAP_CENTER, zoom_start=MAP_ZOOM, tiles='OpenStreetMap', control_scale=True)

    # marker cluster
    cluster = MarkerCluster().add_to(m) if use_cluster else None

    # assign colors
    species_colors = generate_color_map(filtered['species'].unique().tolist())

    for _, row in filtered.iterrows():
        lat, lon = float(row['lat']), float(row['lon'])
        radius_m = float(row.get('radius', 5000))
        species = row.get('species', 'Unknown')
        location = row.get('location', '')
        date_str = row['date'].date().isoformat()
        color = species_colors.get(species, '#FF7800')

        popup = folium.Popup(f"<b>{species}</b><br>{location}<br>{date_str}<br>Radius: {int(radius_m)} m", max_width=300)

        folium.Circle(location=[lat, lon], radius=radius_m, color=color, fill=True, fill_opacity=0.35, popup=popup).add_to(cluster or m)

    folium.Rectangle(bounds=[[VN_BOUNDS['min_lat'], VN_BOUNDS['min_lon']], [VN_BOUNDS['max_lat'], VN_BOUNDS['max_lon']]], color='#000000', weight=1, fill=False, dash_array='5').add_to(m)

    st.subheader('Map')
    st_data = st_folium(m, width=900, height=650)

    st.subheader('Filtered records')
    st.dataframe(filtered[['id','date','species','location','lat','lon','radius']].reset_index(drop=True))

with tab2:
    st.header("🌸 BloomBot - Your Flower Expert")
    st.markdown("Ask me anything about flowers, plants, and botanical topics!")
    
    # API Key setup
    if not setup_api_key():
        st.info("👆 Please set up your Gemini API key above to start chatting about flowers!")
        st.stop()
    
    # Initialize chat if needed
    if not hasattr(st.session_state, 'chat_started') or not st.session_state.chat_started:
        success, message = st.session_state.chatbot.start_chat(df)
        if success:
            st.session_state.chat_started = True
        else:
            st.error(message)
            st.stop()
    
    # Chat interface
    col1, col2 = st.columns([3, 1])
    
    with col1:
        # Display chat history
        if st.session_state.chat_history:
            st.subheader("Conversation")
            for i, chat in enumerate(st.session_state.chat_history):
                with st.container():
                    st.markdown(f"**You:** {chat['user']}")
                    st.markdown(f"**BloomBot:** {chat['assistant']}")
                    st.divider()
    
        # Chat input
        user_question = st.text_input(
            "Ask about flowers:",
            placeholder="e.g., What makes lotus flowers special in Vietnamese culture?",
            key="chat_input"
        )
        
        col_send, col_clear = st.columns([1, 1])
        
        with col_send:
            if st.button("Send", type="primary"):
                if user_question.strip():
                    # Get response from chatbot
                    with st.spinner("BloomBot is thinking..."):
                        response = st.session_state.chatbot.send_message(user_question)
                    
                    # Add to chat history
                    st.session_state.chat_history.append({
                        "user": user_question,
                        "assistant": response
                    })
                    
                    # Clear input and rerun to show new message
                    st.rerun()
        
        with col_clear:
            if st.button("Clear Chat"):
                st.session_state.chat_history = []
                st.session_state.chatbot.reset_chat(df)
                st.rerun()
    
    with col2:
        st.subheader("💡 Try asking:")
        for question in EXAMPLE_QUESTIONS[:6]:  # Show first 6 example questions
            if st.button(question, key=f"example_{question[:20]}"):
                # Set the question in session state to be processed
                st.session_state.pending_question = question
                st.rerun()
        
        # Process pending question if any
        if hasattr(st.session_state, 'pending_question'):
            question = st.session_state.pending_question
            del st.session_state.pending_question
            
            with st.spinner("BloomBot is thinking..."):
                response = st.session_state.chatbot.send_message(question)
            
            st.session_state.chat_history.append({
                "user": question,
                "assistant": response
            })
            st.rerun()
        
        # Show current data context
        st.subheader("📊 Current Data")
        st.metric("Species tracked", len(df['species'].unique()))
        st.metric("Total blooms", len(df))
        st.metric("Date range", f"{df['date'].min().strftime('%m/%d')} - {df['date'].max().strftime('%m/%d')}")
    
    # Show example conversation if no chat history
    if not st.session_state.chat_history:
        st.subheader("Example Conversation")
        with st.container():
            st.markdown("**You:** What makes lotus flowers special in Vietnamese culture?")
            st.markdown("**BloomBot:** Lotus flowers hold profound significance in Vietnamese culture! 🪷 They symbolize purity, enlightenment, and rebirth because they grow from muddy waters yet bloom beautifully above the surface. In Buddhism (widely practiced in Vietnam), the lotus represents the journey from ignorance to enlightenment. Vietnamese people often use lotus in traditional medicine, cuisine (lotus seeds and roots), and art. The flower also appears in Vietnamese poetry and literature as a symbol of resilience and grace.")
            st.divider()
            st.markdown("**You:** When do lotus flowers typically bloom in Vietnam?")
            st.markdown("**BloomBot:** Lotus flowers in Vietnam typically bloom from May to September, with peak blooming season being June through August. They prefer the warm, humid weather of summer and the rainy season. Early morning (around 6-8 AM) is the best time to see them at their most beautiful, as the petals are fully open and the fragrance is strongest. In your current data, I see lotus recorded in Ho Chi Minh City in March, which could be an early variety or greenhouse cultivation!")
