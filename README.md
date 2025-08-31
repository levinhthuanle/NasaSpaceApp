BloomLens Demo (Vietnam) -- Generated sample project
Directory: /mnt/data/bloomlens_demo

Files created:
- data/blooms.csv        : sample CSV with 30 unique flower points across Vietnam
- app/utils.py           : helper functions (load_data, generate_color_map)
- app/streamlit_bloom.py : Streamlit app (run with `streamlit run app/streamlit_bloom.py`)

Quick run (from terminal in project folder):
1) python -m venv .venv
2) source .venv/bin/activate   # or `.venv\Scripts\activate` on Windows PowerShell
3) pip install pandas streamlit streamlit-folium folium matplotlib
4) streamlit run app/streamlit_bloom.py

The app centers on Vietnam and draws circles with radius (meters).
Each species is assigned a unique color.
ngrok http 8501

