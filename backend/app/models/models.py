from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    file_hash = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_duplicate = Column(Boolean, default=False)
    original_file_id = Column(String, ForeignKey('files.id'), nullable=True)
    storage_path = Column(String, nullable=False)
    
    # For duplicate files, reference to the original file
    original_file = relationship("File", remote_side=[id])
    duplicates = relationship("File", backref="duplicates_of") 