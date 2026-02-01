from rest_framework import generics, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from attendance.models import Subject
from .models import NoteCategory, Note, NoteRating, NoteBookmark, NoteComment
from .serializers import NoteCategorySerializer, NoteSerializer, NoteRatingSerializer, NoteBookmarkSerializer, NoteCommentSerializer


class NoteCategoryListCreateView(generics.ListCreateAPIView):
    queryset = NoteCategory.objects.all()
    serializer_class = NoteCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class NoteCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = NoteCategory.objects.all()
    serializer_class = NoteCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class NoteListCreateView(generics.ListCreateAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Handle multipart form data properly
        # Make a mutable copy of QueryDict
        data = request.data.copy()
        
        # Helper function to get single value from QueryDict (handles list values)
        def get_value(key, default=None):
            value = data.get(key, default)
            if isinstance(value, list) and len(value) > 0:
                return value[0]
            return value
        
        # Map 'file' field to 'attachment' (model field name) if present
        # Files can be in request.FILES or request.data for multipart
        if 'file' in request.FILES:
            data['attachment'] = request.FILES['file']
        elif 'file' in data:
            file_value = get_value('file')
            if file_value:
                data['attachment'] = file_value
            # Remove 'file' key to avoid confusion
            if 'file' in data:
                del data['file']
        
        # Handle subject - required field
        subject_value = get_value('subject')
        if subject_value:
            if not str(subject_value).isdigit():
                # Try to find subject by name (use first() to handle multiple matches)
                subject = Subject.objects.filter(name__icontains=subject_value).first()
                if subject:
                    data['subject'] = subject.id
                else:
                    # Subject not found by name, use first available subject
                    first_subject = Subject.objects.first()
                    if first_subject:
                        data['subject'] = first_subject.id
                    else:
                        return Response(
                            {'message': 'Subject is required. Please create a subject first.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
        else:
            # No subject provided, use first available
            first_subject = Subject.objects.first()
            if first_subject:
                data['subject'] = first_subject.id
            else:
                return Response(
                    {'message': 'Subject is required. Please create a subject first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Handle category - required field
        category_value = get_value('category')
        if category_value:
            if not str(category_value).isdigit():
                # Try to find category by name (use first() to handle multiple matches)
                category = NoteCategory.objects.filter(name__icontains=category_value).first()
                if not category:
                    # Create category if it doesn't exist
                    category = NoteCategory.objects.create(
                        name=category_value,
                        color='#28a745'
                    )
                data['category'] = category.id
        else:
            # No category provided, get or create default
            category, _ = NoteCategory.objects.get_or_create(
                name='General',
                defaults={'description': 'General notes category', 'color': '#28a745'}
            )
            data['category'] = category.id
        
        # Provide default content if not provided
        content_value = get_value('content')
        if not content_value:
            description_value = get_value('description', '')
            title_value = get_value('title', '')
            data['content'] = description_value or title_value or 'No content provided'
        else:
            data['content'] = content_value
        
        # Ensure subject and category are integers (IDs) - they should already be set above
        # But ensure they're integers, not strings
        if 'subject' in data and data['subject']:
            data['subject'] = int(data['subject'])
        if 'category' in data and data['category']:
            data['category'] = int(data['category'])
        
        # Set uploaded_by before validation (required field)
        data['uploaded_by'] = request.user.id
        
        # Create serializer with modified data
        # For multipart form data, files are automatically included in request.data
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            # Return detailed validation errors
            error_msg = 'Validation failed: ' + ', '.join([
                f"{field}: {', '.join(err) if isinstance(err, list) else str(err)}"
                for field, err in serializer.errors.items()
            ])
            return Response(
                {'message': error_msg, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        # Set uploaded_by automatically
        serializer.save(uploaded_by=self.request.user)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]


class NoteDownloadView(generics.RetrieveAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]


class NoteRatingView(generics.ListCreateAPIView):
    queryset = NoteRating.objects.all()
    serializer_class = NoteRatingSerializer
    permission_classes = [permissions.IsAuthenticated]


class NoteBookmarkView(generics.ListCreateAPIView):
    queryset = NoteBookmark.objects.all()
    serializer_class = NoteBookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]


class NoteCommentListCreateView(generics.ListCreateAPIView):
    queryset = NoteComment.objects.all()
    serializer_class = NoteCommentSerializer
    permission_classes = [permissions.IsAuthenticated]