from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Author(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    birth_year = models.PositiveSmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'library_author'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name}  {self.last_name}"

class Genre(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)

    class Meta:
        db_table = 'library_genre'
        ordering = ['name']

    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=255)
    isbn = models.CharField(max_length=13, unique=True)
    author = models.ForeignKey(Author, on_delete=models.PROTECT, related_name='books')
    genres = models.ManyToManyField(Genre, db_table='library_book_genre', related_name='books', blank=True)
    description = models.TextField(blank=True, null=True)
    published_year = models.PositiveSmallIntegerField(blank=True, null=True)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.pk:
            # Merr librin e vjetër nga databaza për të krahasuar total_copies
            old_book = Book.objects.get(pk=self.pk)
            active_loans_count = self.loans.filter(returned_at__isnull=True).count()
            
            # Rregulla 10: total_copies nuk mund të bëhet më i vogël se huazimet aktive
            if self.total_copies < active_loans_count:
        
                raise ValidationError(f"Total copies s'mund të jetë më i vogël se huazimet aktive ({active_loans_count}).")
    
    def delete(self, *args, **kwargs):
        active_loans_count = self.loans.filter(returned_at__isnull=True).count()
        if active_loans_count > 0:
            raise ValidationError("Ky libër ka huazime aktive dhe nuk mund të fshihet.")
        super().delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        self.full_clean()  # Kjo detyron me thirrë clean() para çdo ruajtjeje
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'library_book'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title}  {self.isbn}"


class Loan(models.Model):
    STATUS_CHOICES = [
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue')
    ]

    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name='loans')
    member = models.ForeignKey(User, on_delete=models.PROTECT, related_name='loans')
    borrowed_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    returned_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='borrowed')

    class Meta:
        db_table = 'library_loan'
        ordering = ['-borrowed_at']

    def __str__(self):
        return f"{self.book.title} - {self.member.username} - ({self.status})"

    