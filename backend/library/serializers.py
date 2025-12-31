from rest_framework import serializers
from .models import Book, BookIssue, Fine, BookView


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'


class BookIssueSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    teacher_id = serializers.CharField(source='teacher.employee_id', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = BookIssue
        fields = '__all__'


class FineSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book_issue.book.title', read_only=True)

    class Meta:
        model = Fine
        fields = '__all__'


# ✅ NEW SERIALIZER
class BookViewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = BookView
        fields = ['id', 'book_title', 'student_name', 'student_id', 'viewed_at']
