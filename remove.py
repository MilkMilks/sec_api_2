import os
from pathlib import Path
import pandas as pd
import shutil

firms = pd.read_csv('output.csv') 
firms = set(firms['Symbol'])

filings_dir = Path('filings')
for folder in filings_dir.iterdir():
    symbol = folder.name
    print(symbol)
    if symbol not in firms:
        print(f'Deleting {folder}')
        shutil.rmtree(folder)
    else:
        print(f'Keeping {folder}')
