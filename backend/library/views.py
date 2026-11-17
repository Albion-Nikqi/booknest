from rest_framework import viewsets, generics, permissions 
from .models import Author, Genre, Book, Loan
from .serializers import AuthorSerializer, GenreSerializer, BookSerializer, LoanSerializer, RegisterSerializer
from rest_framework.response import Response
from django.contrib.auth.models import User


class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer

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