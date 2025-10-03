from django.contrib import admin
from .models import Book, BookIssue, Fine


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """
    Admin interface for Book management
    """
    list_display = ('title', 'author', 'isbn', 'category', 'total_copies', 'available_copies', 'shelf_number', 'is_active')
    list_filter = ('category', 'is_active', 'publication_year')
    search_fields = ('title', 'author', 'isbn')
    readonly_fields = ('available_copies', 'created_at')


@admin.register(BookIssue)
class BookIssueAdmin(admin.ModelAdmin):
    """
    Admin interface for Book Issue management
    """
    list_display = ('book', 'borrower_name', 'borrower_id', 'issued_date', 'due_date', 'return_date', 'status', 'fine_amount')
    list_filter = ('status', 'issued_date', 'due_date', 'book__category')
    search_fields = ('book__title', 'student__student_id', 'teacher__employee_id')
    readonly_fields = ('created_at',)
    
    def borrower_name(self, obj):
        return obj.borrower_name
    borrower_name.short_description = 'Borrower Name'
    
    def borrower_id(self, obj):
        return obj.borrower_id
    borrower_id.short_description = 'Borrower ID'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'book', 'student__user', 'teacher__user', 'issued_by'
        )


@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    """
    Admin interface for Fine management
    """
    list_display = ('book_issue', 'amount', 'reason', 'due_date', 'payment_date', 'payment_status')
    list_filter = ('payment_status', 'due_date', 'payment_date')
    search_fields = ('book_issue__book__title', 'reason')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('book_issue__book')