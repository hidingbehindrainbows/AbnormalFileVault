from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from .models import File, calculate_file_hash
from .serializers import FileSerializer
from datetime import datetime, timedelta

# Create your views here.

class FileFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        # Filter by file type
        file_type = request.query_params.get('file_type', None)
        if file_type:
            queryset = queryset.filter(file_type__icontains=file_type)
        
        # Filter by size range
        min_size = request.query_params.get('min_size', None)
        max_size = request.query_params.get('max_size', None)
        if min_size:
            queryset = queryset.filter(size__gte=min_size)
        if max_size:
            queryset = queryset.filter(size__lte=max_size)
        
        # Filter by upload date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(uploaded_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(uploaded_at__lte=end_date)
        
        return queryset

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, FileFilter]
    filterset_fields = ['file_type', 'size', 'uploaded_at']
    search_fields = ['original_filename']

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_files = File.objects.count()
        total_size = File.objects.aggregate(total=Sum('size'))['total'] or 0
        storage_saved = File.objects.filter(is_duplicate=True).aggregate(total=Sum('size'))['total'] or 0
        duplicate_count = File.objects.filter(is_duplicate=True).count()

        return Response({
            'total_files': total_files,
            'total_size': total_size,
            'storage_saved': storage_saved,
            'duplicate_count': duplicate_count
        })

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate file hash
        file_hash = calculate_file_hash(file_obj)
        
        # Check for duplicate
        existing_file = File.objects.filter(file_hash=file_hash).first()
        if existing_file:
            # Return a specific error for duplicates with more information
            return Response({
                'error': 'Duplicate file detected',
                'is_duplicate': True,
                'original_file_id': str(existing_file.id),
                'storage_saved': file_obj.size,
                'message': f'This file already exists. Upload skipped to save {file_obj.size} bytes of storage.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # New file upload
        data = {
            'file': file_obj,
            'original_filename': file_obj.name,
            'file_type': file_obj.content_type,
            'size': file_obj.size,
            'file_hash': file_hash
        }
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply search filters
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(original_filename__icontains=search_query) |
                Q(file_type__icontains=search_query)
            )
        
        return queryset
