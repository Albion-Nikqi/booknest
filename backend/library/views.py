from rest_framework import viewsets, generics, permissions 
from .models import Author, Genre, Book, Loan
from .serializers import AuthorSerializer, GenreSerializer, BookSerializer, LoanSerializer, RegisterSerializer
from rest_framework.response import Response
from django.contrib.auth.models import User
from .permissions import IsLibrarianOrReadOnly, IsLibrarian
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from django.db.models import Count


class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    permission_classes = [IsLibrarianOrReadOnly]

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsLibrarianOrReadOnly]

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsLibrarianOrReadOnly]

class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        loan = self.get_object()
        user = request.user

        if loan.returned_at is not None or loan.status == 'returned':
            return Response(
                {'error': 'Ky huazim eshte kryer tashme!'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.is_staff and loan.member != user:
            return Response(
                {'error': 'Nuk keni te drejt te ktheni huazimet e nje personi tjeter.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Perditeismi i huazimit
        loan.returned_at = timezone.now().date()
        loan.status = 'returned'
        loan.save()

        # kthimi i kpojes te inventari i librit
        book = loan.book
        book.available_copies += 1
        book.save()

        return Response({'message': 'Libri u kthye me sukses..'}, status=status.HTTP_200_OK)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role = 'librarian' if user.is_staff else 'member'
        return Response({
            'id':user.id,
            'username':user.username,
            'email':user.email,
            'role':role
        })

class StatsView(APIView):
    permission_classes = [IsLibrarian]

    def get(self, request):
        today = timezone.now().date()

        total_books = Book.objects.count()
        total_members = User.objects.filter(is_staff=False).count()
        active_loans = Loan.objects.filter(returned_at__isnull=True).count()

        # llogartija e huazimeve
        overdue_loans = Loan.objects.filter(returned_at__isnull=True, due_date__lt=today).count()

        # top 5 librat me te huazuar
        top_books = Book.objects.annotate(loan_count=Count('loans')).order_by('-loan_count')[:5]
        top_books_data = [
            {
                'id':book.id,
                'title':book.title,
                'isbn':book.isbn,
                'total_loans':book.loan_count
            }
            for book in top_books
        ] 

        return Response(
            {
                'total_books':total_books,
                'total_members':total_members,
                'active_loans':active_loans,
                'overdue_loans':overdue_loans,
                'top_books':top_books_data

            }, status=status.HTTP_200_OK)