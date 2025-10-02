"""
Data Service
Xử lý các operations liên quan đến data (CSV, visualization, etc.)
"""

import pandas as pd
from matplotlib import colors as mcolors
from typing import Optional

DATA_PATH = "blooms.csv"

def load_data(path: Optional[str] = None) -> pd.DataFrame:
    """Load dữ liệu hoa từ CSV"""
    file_path = DATA_PATH if path is None else path
    df = pd.read_csv(file_path, parse_dates=['date'])
    if 'radius' not in df.columns:
        df['radius'] = 5000
    return df

def generate_color_map(species_list: list) -> dict:
    """Tạo color map cho các loài hoa"""
    # Generate visually distinct colors using matplotlib tab20 + CSS colors fallback
    base_colors = list(mcolors.TABLEAU_COLORS.values()) + list(mcolors.CSS4_COLORS.values())
    colors = {}
    for i, species in enumerate(species_list):
        colors[species] = base_colors[i % len(base_colors)]
    return colors

def get_species_statistics(df: pd.DataFrame) -> dict:
    """Lấy thống kê về các loài hoa"""
    if df.empty:
        return {}
    
    stats = {
        "total_records": len(df),
        "unique_species": df['species'].nunique() if 'species' in df.columns else 0,
        "species_list": sorted(df['species'].dropna().unique().tolist()) if 'species' in df.columns else [],
        "date_range": {
            "start": df['date'].min().strftime('%Y-%m-%d') if 'date' in df.columns else None,
            "end": df['date'].max().strftime('%Y-%m-%d') if 'date' in df.columns else None
        }
    }
    
    return stats