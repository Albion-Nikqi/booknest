from rest_framework import serializers
from .models import Author, Genre, Book, Loan
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import transaction


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
        read_only_fields = ['member', 'borrowed_at', 'due_date', 'returned_at', 'status']

    def validate(self, data):
        request = self.context.get('request')
        book = data.get('book')

        member = request.user if request and request.user.is_authenticated else None

        if not member:
            raise serializers.ValidationError('Duhet te jeni te kyqur per te bere nje huazim.')

        if book.available_copies <= 0:
            raise serializers.ValidationError({'book': 'Ky liber nuk ka kopje te lira per momentim.'})

        active_loan_count = Loan.objects.filter(member=member, returned_at__isnull=True).count()
        if active_loan_count >= 3:
            raise serializers.ValidationError({'non_field_errors': 'Ju mund te keni enkas maksimum 3 huazime aktive ne te njejten kohe.'})

        already_borrowed = Loan.objects.filter(member=member, book=book, returned_at__isnull=True).exists()
        if already_borrowed:
            raise serializers.ValidationError({'book': 'Ju tashme e keni te huazuar kete liber dhe nuk e keni kthyer.'})

        today = timezone.now().date()
        has_overdue = Loan.objects.filter(member=member, returned_at__isnull=True, due_date__lt=today).exists()
        if has_overdue:
            raise serializers.ValidationError({'non_field_errors': 'Nuk munde te huazoni libra te ri sepse keni huazime te vonuara (overdue) pa kthyer.'})

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        member = request.user
        book_data = validated_data['book']

        # Ketu zbatohet siguria e rrepte kunder Race Condition (Konkurrences)
        with transaction.atomic():
            # Bllokojme rreshtin e librit ne databaze per kete transaksion milisekondesh
            book = Book.objects.select_for_update().get(pk=book_data.pk)

            if book.available_copies <= 0:
                raise serializers.ValidationError({'book': 'Na vjen keq, kopja e fundit toc toc sapo u mor nga nje përdorues tjeter.'})

            borrowed_at = timezone.now().date()
            due_date = borrowed_at + timezone.timedelta(days=14)

            # Krijimi i huazimit
            loan = Loan.objects.create(
                book=book,
                member=member,
                borrowed_at=borrowed_at,
                due_date=due_date,
                status='borrowed'
            )

            # Zvogelimi i kopjeve te lira saktesisht
            book.available_copies -= 1
            book.save()

        return loan
        

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