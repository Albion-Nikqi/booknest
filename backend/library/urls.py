from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthorViewSet, GenreViewSet, BookViewSet, LoanViewSet, RegisterView, CurrentUserView, StatsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView 

router = DefaultRouter()
router.register(r'authors', AuthorViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'books', BookViewSet)
router.register(r'loans', LoanViewSet)

urlpatterns = [
    # rruget e curd per book, author etj ..
    path('', include(router.urls)),

    # rruget e autentifikimit
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('stats/', StatsView.as_view(), name='library_stats'),
]