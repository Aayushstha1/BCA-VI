from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
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