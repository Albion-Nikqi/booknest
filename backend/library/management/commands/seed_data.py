from django.core.management.base import BaseCommand
from library.models import Author, Genre, Book, Loan


class Command(BaseCommand):
    help = 'Mbush databasen me te dhena testuese per BookNest'

    def handle(self, *args, **kwargs):
        self.stdout.write('Duke shtuar te dhena testuese...')

        # Fshijmë fillimisht huazimet dhe librat (për shkak të on_delete=models.PROTECT)
        Loan.objects.all().delete()
        Book.objects.all().delete()
        Genre.objects.all().delete()
        Author.objects.all().delete()

        # 1. Krijimi i Zhanreve
        fantasy = Genre.objects.create(name='Fantasy', slug='fantasy')
        mystery = Genre.objects.create(name='Mystery', slug='mystery')
        classic = Genre.objects.create(name='Classic', slug='classic')

        # 2. Krijimi i Autorëve (sipas fushave të sakta: first_name, last_name, bio, birth_year)
        tolkien = Author.objects.create(
            first_name='J.R.R.',
            last_name='Tolkien',
            birth_year=1892,
            bio='Autor i njohur i Lord of the Rings dhe The Hobbit.'
        )
        agatha = Author.objects.create(
            first_name='Agatha',
            last_name='Christie',
            birth_year=1890,
            bio='Mbreteresha e romaneve misterioze dhe detektive.'
        )
        orwell = Author.objects.create(
            first_name='George',
            last_name='Orwell',
            birth_year=1903,
            bio='Shkrimtar dhe gazetar anglez, i njohur per veprat distopike.'
        )

        # 3. Krijimi i Librave dhe lidhja me Zhanret
        book1 = Book.objects.create(
            title='The Hobbit',
            isbn='9780261102217',
            author=tolkien,
            description='Nje udhetim fantastik i Bilbo Baggins.',
            published_year=1937,
            total_copies=5,
            available_copies=5
        )
        book1.genres.set([fantasy])

        book2 = Book.objects.create(
            title='And Then There Were None',
            isbn='9780007136830',
            author=agatha,
            description='Dhjete te huaj ftohen ne nje ishull te izoluar ku vriten njeri pas tjetrit.',
            published_year=1939,
            total_copies=4,
            available_copies=4
        )
        book2.genres.set([mystery])

        book3 = Book.objects.create(
            title='1984',
            isbn='9780451524935',
            author=orwell,
            description='Nje roman distopik rreth mbikeqyrjes totale te shoqerise.',
            published_year=1949,
            total_copies=3,
            available_copies=3
        )
        book3.genres.set([classic])

        self.stdout.write(self.style.SUCCESS('Te dhenat testuese u shtuan me sukses ne databaze!'))