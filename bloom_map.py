import pandas as pd
import folium
from folium.plugins import TimestampedGeoJson
import json
from datetime import datetime

df = pd.read_csv("blooms.csv", parse_dates=["date"])


features = []
for _, row in df.iterrows():
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [float(row["lon"]), float(row["lat"])]
        },
        "properties": {
            "time": row["date"].strftime("%Y-%m-%dT00:00:00"),
            "popup": f"{row['species']} - {row['location']} ({row['date'].date()})",
            "icon": "circle",
            "iconstyle": {
                "fillColor": "#ff7800",
                "fillOpacity": 0.8,
                "stroke": "true",
                "radius": 6
            }
        }
    }
    features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

# 3. Create Folium map (centered)
m = folium.Map(location=[16.0, 106.0], zoom_start=6)

# 4. Add TimestampedGeoJson plugin
TimestampedGeoJson(
    data=geojson,
    transition_time=200,      # ms between steps
    period='P1D',             # step period (1 day)
    add_last_point=True,
    auto_play=False,
    loop=False,
    max_speed=1,
    loop_button=True,
    date_options='YYYY-MM-DD',
    time_slider_drag_update=True
).add_to(m)

# 5. Optional: add a layer control / tile
folium.TileLayer('OpenStreetMap').add_to(m)
folium.LayerControl().add_to(m)

m.save("bloom_map.html")
