# streamlit_bloom.py
import pandas as pd
import streamlit as st
from streamlit_folium import st_folium
import folium
from folium.plugins import MarkerCluster
from datetime import datetime

st.set_page_config(page_title="BloomLens Demo", layout="wide")

st.title("BloomLens — Demo (Vietnam only)")
st.markdown("Filter by date / species. Circles drawn with `radius` (meters).")

# --------------- CONFIG: Vietnam bounds & map center ---------------
VN_BOUNDS = {
    "min_lat": 8.0,
    "max_lat": 23.5,
    "min_lon": 102.0,
    "max_lon": 110.5
}
MAP_CENTER = [16.0, 106.0]
MAP_ZOOM = 6

# --------------- Load data ---------------
@st.cache_data
def load_data(path="blooms.csv"):
    df = pd.read_csv(path, parse_dates=["date"])
    # ensure radius column exists (meters). default 5000 m
    if "radius" not in df.columns:
        df["radius"] = 5000
    # filter NaNs
    df = df.dropna(subset=["lat", "lon", "date"])
    return df

try:
    df = load_data("blooms.csv")
except FileNotFoundError:
    st.error("File blooms.csv not found in working directory. Create it and rerun.")
    st.stop()

# --------------- Sidebar filters ---------------
with st.sidebar:
    st.header("Filters")
    min_date = df["date"].min().date()
    max_date = df["date"].max().date()
    date_range = st.date_input("Select date range", value=(min_date, max_date), min_value=min_date, max_value=max_date)
    if isinstance(date_range, tuple) and len(date_range) == 2:
        start_date, end_date = date_range
    else:
        start_date = date_range
        end_date = date_range

    species_list = sorted(df["species"].dropna().unique().tolist())
    selected_species = st.multiselect("Species (choose none = all)", options=species_list, default=species_list)

    max_points = st.slider("Max points to show", min_value=50, max_value=2000, value=500, step=50)
    use_cluster = st.checkbox("Use marker clustering (for many points)", value=False)

# --------------- Filter dataset ---------------
mask = (
    (df["date"].dt.date >= start_date) &
    (df["date"].dt.date <= end_date) &
    (df["lat"] >= VN_BOUNDS["min_lat"]) & (df["lat"] <= VN_BOUNDS["max_lat"]) &
    (df["lon"] >= VN_BOUNDS["min_lon"]) & (df["lon"] <= VN_BOUNDS["max_lon"])
)
if selected_species:
    mask = mask & (df["species"].isin(selected_species))

filtered = df[mask].copy()
filtered = filtered.sort_values("date").head(max_points)

st.sidebar.write(f"Total records (after filter): {len(filtered)}")

# --------------- Map creation ---------------
m = folium.Map(location=MAP_CENTER, zoom_start=MAP_ZOOM, tiles="OpenStreetMap", control_scale=True)

# Optional cluster for point markers
if use_cluster:
    cluster = MarkerCluster().add_to(m)
else:
    cluster = None

# color palette for species
colors = ["#e6194b","#3cb44b","#ffe119","#4363d8","#f58231","#911eb4","#46f0f0","#f032e6"]
species_colors = {}
for i, s in enumerate(sorted(filtered["species"].unique())):
    species_colors[s] = colors[i % len(colors)]

# draw circles
for _, row in filtered.iterrows():
    lat = float(row["lat"])
    lon = float(row["lon"])
    radius_m = float(row.get("radius", 5000))  # meters
    species = row.get("species", "Unknown")
    location = row.get("location", "")
    date_str = row["date"].date().isoformat()
    popup_html = f"<b>{species}</b><br>{location}<br>{date_str}<br>Radius: {int(radius_m)} m"

    color = species_colors.get(species, "#ff7800")

    # Use Circle (meters) so visible when zoomed out
    folium.Circle(
        location=[lat, lon],
        radius=radius_m,
        color=color,
        fill=True,
        fill_opacity=0.35,
        popup=folium.Popup(popup_html, max_width=300)
    ).add_to(cluster or m)

# Add bounds rectangle (Vietnam) as visual hint
folium.Rectangle(bounds=[[VN_BOUNDS["min_lat"], VN_BOUNDS["min_lon"]], [VN_BOUNDS["max_lat"], VN_BOUNDS["max_lon"]]],
                 color="#000000", weight=1, fill=False, dash_array="5").add_to(m)

# --------------- Show map and table ---------------
st.subheader("Map")
st_data = st_folium(m, width=900, height=600)

st.subheader("Records (filtered)")
st.dataframe(filtered[["id","date","species","location","lat","lon","radius"]].reset_index(drop=True))
