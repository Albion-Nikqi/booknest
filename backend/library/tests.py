from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Author, Genre, Book, Loan


class BookNestBusinessRulesTests(APITestCase):
    def setUp(self):
        # Krijimi i përdoruesve: 1 Bibliotekar dhe 2 Anëtarë
        self.librarian = User.objects.create_user(
            username='librarian1', email='lib@booknest.com', password='Password123!', is_staff=True
        )
        self.member1 = User.objects.create_user(
            username='member1', email='m1@booknest.com', password='Password123!', is_staff=False
        )
        self.member2 = User.objects.create_user(
            username='member2', email='m2@booknest.com', password='Password123!', is_staff=False
        )

        # Krijimi i autorit, zhanrit dhe librave testues
        self.author = Author.objects.create(first_name='Ismail', last_name='Kadare', birth_year=1936)
        self.genre = Genre.objects.create(name='Roman', slug='roman')

        self.book1 = Book.objects.create(
            title='Gjenerali i Ushtrise se Vdekur', isbn='9789992710011',
            author=self.author, total_copies=2, available_copies=2
        )
        self.book1.genres.add(self.genre)

        self.book2 = Book.objects.create(
            title='Prilli i Thyer', isbn='9789992710022',
            author=self.author, total_copies=2, available_copies=2
        )
        self.book3 = Book.objects.create(
            title='Keshtjella', isbn='9789992710033',
            author=self.author, total_copies=2, available_copies=2
        )
        self.book4 = Book.objects.create(
            title='Pallati i Endrrave', isbn='9789992710044',
            author=self.author, total_copies=1, available_copies=0
        )

    def test_01_register_and_jwt_login(self):
        res_reg = self.client.post('/api/auth/register/', {
            'username': 'newmember', 'email': 'new@booknest.com', 'password': 'Password123!'
        })
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)

        res_login = self.client.post('/api/auth/login/', {
            'username': 'newmember', 'password': 'Password123!'
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_login.data)

    def test_02_catalog_permissions_rule_11(self):
        self.client.force_authenticate(user=self.member1)
        res_forbidden = self.client.post('/api/books/', {
            'title': 'Libër Test', 'isbn': '1111111111111', 'author': self.author.id
        })
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.librarian)
        res_ok = self.client.post('/api/books/', {
            'title': 'Liber i Ri', 'isbn': '2222222222222', 'author': self.author.id,
            'total_copies': 3, 'available_copies': 3
        })
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

    def test_03_borrow_success_and_due_date_rule_5(self):
        self.client.force_authenticate(user=self.member1)
        res = self.client.post('/api/loans/', {'book': self.book1.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.book1.refresh_from_db()
        self.assertEqual(self.book1.available_copies, 1)

        expected_due = timezone.now().date() + timezone.timedelta(days=14)
        self.assertEqual(str(res.data['due_date']), str(expected_due))

    def test_04_borrow_no_available_copies_rule_1(self):
        self.client.force_authenticate(user=self.member1)
        res = self.client.post('/api/loans/', {'book': self.book4.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_05_max_three_active_loans_rule_2(self):
        self.client.force_authenticate(user=self.member1)
        self.client.post('/api/loans/', {'book': self.book1.id})
        self.client.post('/api/loans/', {'book': self.book2.id})
        self.client.post('/api/loans/', {'book': self.book3.id})

        book5 = Book.objects.create(
            title='Kronike ne Gur', isbn='9789992710055',
            author=self.author, total_copies=2, available_copies=2
        )
        res_4th = self.client.post('/api/loans/', {'book': book5.id})
        self.assertEqual(res_4th.status_code, status.HTTP_400_BAD_REQUEST)

    def test_06_duplicate_active_loan_same_book_rule_3(self):
        self.client.force_authenticate(user=self.member1)
        self.client.post('/api/loans/', {'book': self.book1.id})
        res_dup = self.client.post('/api/loans/', {'book': self.book1.id})
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_07_block_borrow_when_overdue_rule_4(self):
        past_due = timezone.now().date() - timezone.timedelta(days=2)
        Loan.objects.create(book=self.book1, member=self.member1, due_date=past_due, status='borrowed')

        self.client.force_authenticate(user=self.member1)
        res = self.client.post('/api/loans/', {'book': self.book2.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_08_member_cannot_return_others_loan_rule_7(self):
        loan = Loan.objects.create(
            book=self.book1, member=self.member1,
            due_date=timezone.now().date() + timezone.timedelta(days=14)
        )
        self.client.force_authenticate(user=self.member2)
        res = self.client.post(f'/api/loans/{loan.id}/return_book/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_09_return_book_and_prevent_double_return_rule_8(self):
        self.client.force_authenticate(user=self.member1)
        res_borrow = self.client.post('/api/loans/', {'book': self.book1.id})
        loan_id = res_borrow.data['id']

        res_ret1 = self.client.post(f'/api/loans/{loan_id}/return_book/')
        self.assertEqual(res_ret1.status_code, status.HTTP_200_OK)

        self.book1.refresh_from_db()
        self.assertEqual(self.book1.available_copies, 2)

        res_ret2 = self.client.post(f'/api/loans/{loan_id}/return_book/')
        self.assertEqual(res_ret2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_10_prevent_delete_book_with_active_loans_rule_9(self):
        Loan.objects.create(
            book=self.book1, member=self.member1,
            due_date=timezone.now().date() + timezone.timedelta(days=14)
        )
        with self.assertRaises(ValidationError):
            self.book1.delete()

    def test_11_stats_endpoint_permissions_and_data(self):
        self.client.force_authenticate(user=self.member1)
        res_member = self.client.get('/api/stats/')
        self.assertEqual(res_member.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.librarian)
        res_lib = self.client.get('/api/stats/')
        self.assertEqual(res_lib.status_code, status.HTTP_200_OK)
        self.assertIn('total_books', res_lib.data)
        self.assertIn('top_books', res_lib.data)