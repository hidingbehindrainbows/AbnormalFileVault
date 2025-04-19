from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    storage_saved = serializers.SerializerMethodField()
    is_duplicate = serializers.BooleanField(read_only=True)
    original_file_id = serializers.UUIDField(read_only=True)
    reference_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = File
        fields = [
            'id', 'file', 'original_filename', 'file_type', 
            'size', 'uploaded_at', 'file_hash', 'is_duplicate',
            'original_file_id', 'reference_count', 'storage_saved'
        ]
        read_only_fields = [
            'id', 'file_hash', 'is_duplicate', 'original_file_id',
            'reference_count', 'storage_saved'
        ]

    def get_storage_saved(self, obj):
        if obj.is_duplicate:
            return obj.size
        return 0 