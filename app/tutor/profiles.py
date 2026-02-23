from pydantic import BaseModel
from typing import List
class Profile(BaseModel):
    id: str
    display_name: str
    level: str = "A1"
