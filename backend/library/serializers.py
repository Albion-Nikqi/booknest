from rest_framework import serializers
from .models import Author, Genre, Book, Loan

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug']


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['id', 'first_name', 'last_name', 'bio', 'birth_year']

class BookSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.__str__', read_only=True)
    genre_names = serializers.StringRelatedField(source='genres', many=True, read_only=True)
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'isbn', 'author', 'author_name',
            'genres', 'genre_names', 'description', 'published_year',
            'total_copies', 'available_copies', 'created_at'
        ]

class LoanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    member_username = serializers.CharField(source='member.username', read_only=True)

    class Meta:
        model = Loan
        fields = [
            'id', 'book', 'book_title', 'member', 'member_username',
            'borrowed_at', 'due_date', 'returned_at', 'status'
        ]


from django.contrib.auth.models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password'] 

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_staff=False
        )
        return user