import pandas as pd
from pathlib import Path
from matplotlib import colors as mcolors

DATA_PATH = "blooms.csv"

def load_data(path=None):
    p = DATA_PATH if path is None else path
    df = pd.read_csv(p, parse_dates=['date'])
    if 'radius' not in df.columns:
        df['radius'] = 5000
    return df

def generate_color_map(species_list):
    # Generate visually distinct colors using matplotlib tab20 + CSS colors fallback
    base_colors = list(mcolors.TABLEAU_COLORS.values()) + list(mcolors.CSS4_COLORS.values())
    colors = {}
    for i, s in enumerate(species_list):
        colors[s] = base_colors[i % len(base_colors)]
    return colors
