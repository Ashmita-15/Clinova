import os
import sys

# Add the backend directory to Python path
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

sys.path.insert(0, BACKEND_DIR)

from main import app