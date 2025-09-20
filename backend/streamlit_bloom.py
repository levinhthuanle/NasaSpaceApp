import streamlit as st
from streamlit_folium import st_folium
import folium
from folium.plugins import MarkerCluster
from utils import load_data, generate_color_map
from datetime import datetime

st.set_page_config(page_title='BloomLens Demo (Vietnam)', layout='wide')
st.title('BloomLens — Demo (Vietnam only)')
st.markdown('Circle radius is in meters. Each species has a unique color.')

VN_BOUNDS = {
    'min_lat': 8.0, 'max_lat': 23.5,
    'min_lon': 102.0, 'max_lon': 110.5
}
MAP_CENTER = [16.0, 106.0]
MAP_ZOOM = 6

df = load_data()

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
